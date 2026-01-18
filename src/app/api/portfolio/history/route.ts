import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PortfolioHistoryQuerySchema,
  type TimePeriod,
} from "@/lib/validations/portfolio";
import { parseQueryParams, zodErrorResponse } from "@/lib/api-helpers";

// Define sampling intervals for each period
// This ensures consistent, evenly-spaced data points for charts
interface SamplingConfig {
  intervalDays: number;  // Days between samples
  maxPoints: number;     // Maximum data points to return
}

const SAMPLING_CONFIG: Record<TimePeriod, SamplingConfig> = {
  "1D": { intervalDays: 1, maxPoints: 1 },      // Single current point (future: hourly)
  "1W": { intervalDays: 1, maxPoints: 7 },      // Daily for a week
  "1M": { intervalDays: 7, maxPoints: 5 },      // Weekly for a month (~4-5 points)
  "3M": { intervalDays: 7, maxPoints: 13 },     // Weekly for 3 months
  "6M": { intervalDays: 7, maxPoints: 26 },     // Weekly for 6 months
  "1Y": { intervalDays: 30, maxPoints: 12 },    // Monthly for a year
  "YTD": { intervalDays: 30, maxPoints: 12 },   // Monthly for YTD
};

// Calculate the period start date
function getPeriodStartDate(period: TimePeriod, now: Date): Date {
  const startDate = new Date(now);
  
  switch (period) {
    case "1D": startDate.setDate(now.getDate() - 1); break;
    case "1W": startDate.setDate(now.getDate() - 7); break;
    case "1M": startDate.setMonth(now.getMonth() - 1); break;
    case "3M": startDate.setMonth(now.getMonth() - 3); break;
    case "6M": startDate.setMonth(now.getMonth() - 6); break;
    case "1Y": startDate.setFullYear(now.getFullYear() - 1); break;
    case "YTD": return new Date(now.getFullYear(), 0, 1);
  }
  
  return startDate;
}

// Generate evenly-spaced sample dates for a period
function generateSampleDates(
  periodStart: Date,
  periodEnd: Date,
  config: SamplingConfig
): Date[] {
  const dates: Date[] = [];
  const totalDays = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  
  // Calculate actual interval to get evenly spaced points
  const actualInterval = Math.max(1, Math.floor(totalDays / config.maxPoints));
  
  const currentDate = new Date(periodStart);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= periodEnd && dates.length < config.maxPoints) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + actualInterval);
  }
  
  // Always include the end date (today) if not already included
  const lastDate = dates[dates.length - 1];
  const endDateNormalized = new Date(periodEnd);
  endDateNormalized.setHours(0, 0, 0, 0);
  
  if (lastDate.getTime() !== endDateNormalized.getTime()) {
    dates.push(endDateNormalized);
  }
  
  return dates;
}

// Find the closest snapshot value for a given date
function findClosestValue(
  targetDate: Date,
  groupedData: Map<string, { totalValue: number; totalPL: number }>,
  sortedDates: string[]
): { value: number; pl: number; isInterpolated: boolean } {
  const targetKey = targetDate.toISOString().split("T")[0];
  
  // Exact match
  if (groupedData.has(targetKey)) {
    const data = groupedData.get(targetKey)!;
    return { value: data.totalValue, pl: data.totalPL, isInterpolated: false };
  }
  
  // Find nearest date before target (backward fill)
  let nearestBefore: string | null = null;
  for (const dateKey of sortedDates) {
    if (dateKey <= targetKey) {
      nearestBefore = dateKey;
    } else {
      break;
    }
  }
  
  if (nearestBefore) {
    const data = groupedData.get(nearestBefore)!;
    return { value: data.totalValue, pl: data.totalPL, isInterpolated: true };
  }
  
  // Find nearest date after target (forward fill for dates before first snapshot)
  const nearestAfter = sortedDates.find(d => d > targetKey);
  if (nearestAfter) {
    const data = groupedData.get(nearestAfter)!;
    return { value: data.totalValue, pl: data.totalPL, isInterpolated: true };
  }
  
  return { value: 0, pl: 0, isInterpolated: true };
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate query params
  const queryResult = parseQueryParams(req, PortfolioHistoryQuerySchema);
  if (!queryResult.success) {
    return NextResponse.json(zodErrorResponse(queryResult.error), { status: 400 });
  }

  const { period, accountId } = queryResult.data as { period: TimePeriod; accountId?: string };
  const config = SAMPLING_CONFIG[period];

  // Calculate date range
  const now = new Date();
  const periodStart = getPeriodStartDate(period, now);

  const snaptradeUser = await prisma.snaptradeUser.findUnique({
    where: { userId: session.user.id },
  });

  if (!snaptradeUser) {
    return NextResponse.json({ 
      history: [], 
      period,
      dataQuality: {
        actualPoints: 0,
        totalPoints: 0,
        coverage: 0,
      },
    });
  }

  // Get the first connection/snapshot date for join date
  const firstConnection = await prisma.brokerageConnection.findFirst({
    where: {
      snaptradeUserId: snaptradeUser.id,
      ...(accountId ? {
        brokerageAccounts: { some: { id: accountId } }
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const firstSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: {
      account: {
        connection: { snaptradeUserId: snaptradeUser.id },
        ...(accountId ? { id: accountId } : {}),
      },
    },
    orderBy: { snapshotDate: "asc" },
  });

  // Determine join date
  const joinDate = firstConnection?.createdAt && firstSnapshot?.snapshotDate
    ? (firstConnection.createdAt < firstSnapshot.snapshotDate 
        ? firstConnection.createdAt 
        : firstSnapshot.snapshotDate)
    : (firstConnection?.createdAt || firstSnapshot?.snapshotDate || new Date());

  const joinDateStart = new Date(joinDate);
  joinDateStart.setHours(0, 0, 0, 0);

  // Use the later of period start or join date
  const effectiveStart = periodStart < joinDateStart ? joinDateStart : periodStart;

  // Fetch all snapshots in the period
  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      snapshotDate: { gte: effectiveStart },
      account: {
        connection: { snaptradeUserId: snaptradeUser.id },
        ...(accountId ? { id: accountId } : {}),
      },
    },
    orderBy: { snapshotDate: "asc" },
  });

  // Group snapshots by date and aggregate across accounts
  const groupedData = new Map<string, { totalValue: number; totalPL: number }>();
  
  for (const snap of snapshots) {
    const dateKey = snap.snapshotDate.toISOString().split("T")[0];
    const existing = groupedData.get(dateKey) || { totalValue: 0, totalPL: 0 };
    groupedData.set(dateKey, {
      totalValue: existing.totalValue + snap.totalValue,
      totalPL: existing.totalPL + snap.totalPL,
    });
  }

  const sortedDates = Array.from(groupedData.keys()).sort();

  // Generate sample dates for this period
  const sampleDates = generateSampleDates(effectiveStart, now, config);

  // Build history with sampled data
  const history: Array<{
    date: string;
    value: number;
    pl: number;
    plPercent: number;
    isInterpolated: boolean;
    label: string;  // Pre-formatted label for the chart
  }> = [];

  let actualPointCount = 0;

  for (const sampleDate of sampleDates) {
    const dateKey = sampleDate.toISOString().split("T")[0];
    const { value, pl, isInterpolated } = findClosestValue(sampleDate, groupedData, sortedDates);
    
    if (!isInterpolated) {
      actualPointCount++;
    }

    // Calculate plPercent
    const initialInvestment = value - pl;
    let plPercent = 0;
    if (Math.abs(initialInvestment) > 0.01) {
      const calculated = (pl / initialInvestment) * 100;
      plPercent = isFinite(calculated) ? calculated : 0;
    }

    // Generate label based on period
    const label = formatDateLabel(sampleDate, period);

    history.push({
      date: dateKey,
      value,
      pl,
      plPercent,
      isInterpolated,
      label,
    });
  }

  // Calculate data quality metrics
  const totalPoints = history.length;
  const coverage = totalPoints > 0 ? (actualPointCount / totalPoints) * 100 : 0;

  return NextResponse.json({
    history,
    period,
    dataQuality: {
      actualPoints: actualPointCount,
      totalPoints,
      coverage: Math.round(coverage),
    },
  });
}

// Format date label based on period type
function formatDateLabel(date: Date, period: TimePeriod): string {
  switch (period) {
    case "1D":
      // For intraday (future), show time; for now show "Today"
      return "Today";
    
    case "1W":
      // Show weekday name
      return date.toLocaleDateString("en-US", { weekday: "short" });
    
    case "1M":
    case "3M":
    case "6M":
    case "YTD":
      // Show month and day
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    case "1Y":
      // Show month only
      return date.toLocaleDateString("en-US", { month: "short" });
    
    default:
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
