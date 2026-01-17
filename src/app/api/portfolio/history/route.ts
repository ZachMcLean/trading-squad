import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PortfolioHistoryQuerySchema,
  PortfolioHistoryResponseSchema,
  type PortfolioHistoryResponse,
} from "@/lib/validations/portfolio";
import { parseQueryParams, zodErrorResponse } from "@/lib/api-helpers";

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

  const { period, accountId } = queryResult.data as { period: string; accountId?: string };

  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case "1D": startDate.setDate(now.getDate() - 1); break;
    case "1W": startDate.setDate(now.getDate() - 7); break;
    case "1M": startDate.setMonth(now.getMonth() - 1); break;
    case "3M": startDate.setMonth(now.getMonth() - 3); break;
    case "6M": startDate.setMonth(now.getMonth() - 6); break;
    case "1Y": startDate.setFullYear(now.getFullYear() - 1); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
  }

  const snaptradeUser = await prisma.snaptradeUser.findUnique({
    where: { userId: session.user.id },
  });

  if (!snaptradeUser) {
    return NextResponse.json({ history: [], period });
  }

  // Get the first connection date (when user first connected) to use as join date
  const firstConnection = await prisma.brokerageConnection.findFirst({
    where: {
      snaptradeUserId: snaptradeUser.id,
      ...(accountId ? {
        brokerageAccounts: {
          some: { id: accountId }
        }
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  // Get the first snapshot date as a fallback
  const firstSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: {
      account: {
        connection: {
          snaptradeUserId: snaptradeUser.id,
        },
        ...(accountId ? { id: accountId } : {}),
      },
    },
    orderBy: { snapshotDate: "asc" },
  });

  // Use the earlier of connection date or first snapshot date
  const joinDate = firstConnection?.createdAt && firstSnapshot?.snapshotDate
    ? (firstConnection.createdAt < firstSnapshot.snapshotDate ? firstConnection.createdAt : firstSnapshot.snapshotDate)
    : (firstConnection?.createdAt || firstSnapshot?.snapshotDate || new Date());
  
  // Normalize join date to start of day
  const joinDateStart = new Date(joinDate);
  joinDateStart.setHours(0, 0, 0, 0);
  
  const effectiveStartDate = startDate < joinDateStart ? joinDateStart : startDate;

  // Fetch snapshots
  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      snapshotDate: { gte: effectiveStartDate },
      account: {
        connection: {
          snaptradeUserId: snaptradeUser.id,
        },
        ...(accountId ? { id: accountId } : {}),
      },
    },
    orderBy: { snapshotDate: "asc" },
    include: { account: true },
  });

  // Group by date and aggregate if multiple accounts
  type GroupedData = Record<string, { date: string; totalValue: number; totalPL: number; count: number }>;
  
  const grouped = snapshots.reduce((acc: GroupedData, snap: typeof snapshots[0]) => {
    const dateKey = snap.snapshotDate.toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        totalValue: 0,
        totalPL: 0,
        count: 0,
      };
    }
    acc[dateKey].totalValue += snap.totalValue;
    acc[dateKey].totalPL += snap.totalPL;
    acc[dateKey].count += 1;
    return acc;
  }, {} as GroupedData);

  // Generate all dates in the period range
  const history: Array<{ date: string; value: number; pl: number; plPercent: number }> = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999); // End of today

  // Get the first actual snapshot value for forward filling
  const firstSnapshotValue = snapshots.length > 0 
    ? grouped[Object.keys(grouped).sort()[0]]?.totalValue || 0
    : 0;
  const firstSnapshotPL = snapshots.length > 0 
    ? grouped[Object.keys(grouped).sort()[0]]?.totalPL || 0
    : 0;

  // Iterate through each day in the period
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    const dateOnly = new Date(currentDate);
    dateOnly.setHours(0, 0, 0, 0);
    
    // If this date is before the user joined, use $0
    if (dateOnly < joinDateStart) {
      history.push({
        date: dateKey,
        value: 0,
        pl: 0,
        plPercent: 0,
      });
    } else if (grouped[dateKey]) {
      // Use actual snapshot data if available
      const item = grouped[dateKey];
      const initialInvestment = item.totalValue - item.totalPL;
      // Calculate plPercent, handling division by zero and NaN
      let plPercent = 0;
      if (Math.abs(initialInvestment) > 0.01) {
        const calculated = (item.totalPL / initialInvestment) * 100;
        plPercent = isFinite(calculated) ? calculated : 0;
      }
      history.push({
        date: dateKey,
        value: item.totalValue,
        pl: item.totalPL,
        plPercent,
      });
    } else {
      // Date is after join but no snapshot exists
      // Find the most recent snapshot before this date (backward fill)
      const snapshotDates = Object.keys(grouped).sort();
      let foundSnapshot = false;
      
      // Look backwards from current date to find most recent snapshot
      for (let i = snapshotDates.length - 1; i >= 0; i--) {
        if (snapshotDates[i] <= dateKey) {
          const item = grouped[snapshotDates[i]];
          const initialInvestment = item.totalValue - item.totalPL;
          // Calculate plPercent, handling division by zero and NaN
          let plPercent = 0;
          if (Math.abs(initialInvestment) > 0.01) {
            const calculated = (item.totalPL / initialInvestment) * 100;
            plPercent = isFinite(calculated) ? calculated : 0;
          }
          history.push({
            date: dateKey,
            value: item.totalValue,
            pl: item.totalPL,
            plPercent,
          });
          foundSnapshot = true;
          break;
        }
      }
      
      // If no snapshot found (date is before first snapshot), use $0
      if (!foundSnapshot) {
        history.push({
          date: dateKey,
          value: 0,
          pl: 0,
          plPercent: 0,
        });
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Validate response with Zod
  const response: PortfolioHistoryResponse = {
    history,
    period: period as "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD",
  };

  const validated = PortfolioHistoryResponseSchema.safeParse(response);
  if (!validated.success) {
    console.error("Response validation failed:", validated.error);
  }

  return NextResponse.json(response);
}