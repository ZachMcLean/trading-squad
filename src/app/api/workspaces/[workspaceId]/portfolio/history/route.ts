import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  resolvePrivacySettings,
  parsePrivacySettings,
  parseWorkspacePrivacyPolicy,
  getPerformancePrivacyLevel,
} from "@/lib/privacy-utils";
import { TimePeriodSchema } from "@/lib/validations/portfolio";

/**
 * GET /api/workspaces/[workspaceId]/portfolio/history
 * Get squad portfolio history with privacy-aware filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId } = await params;

    // Get period from query params
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "1M";
    
    // Validate period
    const periodResult = TimePeriodSchema.safeParse(periodParam);
    if (!periodResult.success) {
      return NextResponse.json(
        { error: "Invalid period parameter" },
        { status: 400 }
      );
    }
    const period = periodResult.data;

    // Verify user is a member of this workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: true,
        user: true,
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Get all workspace members with their privacy settings
    const allMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          include: {
            snaptrade: {
              include: {
                brokerageConnections: {
                  where: { status: "active" },
                  include: {
                    brokerageAccounts: {
                      where: { status: "active" },
                      include: {
                        portfolioSnapshots: {
                          orderBy: { snapshotDate: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Parse workspace privacy policy
    const workspacePolicy = parseWorkspacePrivacyPolicy(
      workspaceMember.workspace.privacyPolicy
    );

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "1D":
        startDate.setDate(now.getDate() - 1);
        break;
      case "1W":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "YTD":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Process each member's data
    const membersData = allMembers.map((member) => {
      // Resolve this member's effective privacy settings
      const userDefaults = parsePrivacySettings(member.user.privacyDefaults);
      const workspaceOverride = member.privacyOverride
        ? parsePrivacySettings(member.privacyOverride)
        : null;
      const effectiveSettings = resolvePrivacySettings(
        userDefaults,
        workspacePolicy,
        workspaceOverride
      );

      const privacyLevel = getPerformancePrivacyLevel(effectiveSettings);

      // Get all portfolio snapshots for this member in the date range
      const snapshots: Array<{ date: Date; value: number }> = [];
      
      if (member.user.snaptrade) {
        member.user.snaptrade.brokerageConnections.forEach((connection) => {
          connection.brokerageAccounts.forEach((account) => {
            account.portfolioSnapshots
              .filter((snap) => snap.snapshotDate >= startDate)
              .forEach((snap) => {
                snapshots.push({
                  date: snap.snapshotDate,
                  value: snap.totalValue,
                });
              });
          });
        });
      }

      // Aggregate snapshots by date (sum values from multiple accounts)
      const snapshotsByDate = new Map<string, number>();
      snapshots.forEach((snap) => {
        const dateKey = snap.date.toISOString().split("T")[0];
        const current = snapshotsByDate.get(dateKey) || 0;
        snapshotsByDate.set(dateKey, current + snap.value);
      });

      // Convert to sorted array
      const aggregatedSnapshots = Array.from(snapshotsByDate.entries())
        .map(([date, value]) => ({
          date: new Date(date),
          value,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate percentage changes from baseline
      const history = aggregatedSnapshots.map((snap, i) => {
        const baseValue = aggregatedSnapshots[0]?.value || 0;
        const percentChange =
          baseValue > 0 ? ((snap.value - baseValue) / baseValue) * 100 : 0;

        return {
          date: snap.date.toISOString(),
          value: snap.value,
          percentChange,
        };
      });

      return {
        memberId: member.userId,
        memberName: member.user.name || member.user.email || "Unknown",
        privacyLevel,
        history,
        isCurrentUser: member.userId === userId,
      };
    });

    // Separate current user's data
    const currentUserData = membersData.find((m) => m.isCurrentUser);
    const yourHistory = currentUserData?.history || [];

    // Filter members based on privacy (exclude hidden members from aggregates)
    const visibleMembers = membersData.filter((m) => m.privacyLevel !== "hidden");

    // Calculate squad average (percentage returns averaged across visible members)
    const squadAverage = calculateSquadAverage(visibleMembers);

    // Calculate squad total (sum of all visible portfolio values)
    const squadTotal = calculateSquadTotal(visibleMembers);

    // Count privacy stats
    const metadata = {
      totalMembers: allMembers.length,
      visibleMembers: visibleMembers.length,
      hiddenMembers: allMembers.length - visibleMembers.length,
    };

    // Return formatted response
    return NextResponse.json({
      squadAverage,
      squadTotal,
      members: membersData.map((m) => ({
        memberId: m.memberId,
        memberName: m.memberName,
        privacyLevel: m.privacyLevel,
        history:
          m.privacyLevel === "hidden"
            ? []
            : m.history.map((h) => ({
                date: h.date,
                percentChange: h.percentChange,
              })),
      })),
      yourHistory: yourHistory.map((h) => ({
        date: h.date,
        value: h.value,
        percentChange: h.percentChange,
      })),
      metadata,
    });
  } catch (error) {
    console.error("Error fetching squad portfolio history:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch squad portfolio history",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate squad average percentage returns
 * Averages the percentage change across all visible members at each date point
 */
function calculateSquadAverage(
  members: Array<{
    history: Array<{ date: string; percentChange: number }>;
    privacyLevel: string;
  }>
) {
  if (members.length === 0) return [];

  // Get all unique dates across all members
  const allDates = new Set<string>();
  members.forEach((member) => {
    member.history.forEach((point) => {
      allDates.add(point.date);
    });
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate average for each date
  return sortedDates.map((date) => {
    let sum = 0;
    let count = 0;

    members.forEach((member) => {
      const point = member.history.find((h) => h.date === date);
      if (point) {
        sum += point.percentChange;
        count++;
      }
    });

    const average = count > 0 ? sum / count : 0;

    return {
      date,
      percentChange: average,
    };
  });
}

/**
 * Calculate squad total portfolio value
 * Sums the absolute portfolio values across all visible members at each date point
 */
function calculateSquadTotal(
  members: Array<{
    history: Array<{ date: string; value: number }>;
    privacyLevel: string;
  }>
) {
  if (members.length === 0) return [];

  // Get all unique dates
  const allDates = new Set<string>();
  members.forEach((member) => {
    member.history.forEach((point) => {
      allDates.add(point.date);
    });
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate total for each date
  return sortedDates.map((date) => {
    let total = 0;

    members.forEach((member) => {
      const point = member.history.find((h) => h.date === date);
      if (point) {
        total += point.value;
      }
    });

    return {
      date,
      value: total,
    };
  });
}
