import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountsResponseSchema, type AccountsResponse } from "@/lib/validations/portfolio";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snaptradeUser = await prisma.snaptradeUser.findUnique({
    where: { userId: session.user.id },
  });

  if (!snaptradeUser) {
    return NextResponse.json({ accounts: [] });
  }

  const accounts = await prisma.brokerageAccount.findMany({
    where: {
      connection: {
        snaptradeUserId: snaptradeUser.id,
      },
    },
    include: {
      connection: true,
      positions: {
        orderBy: { marketValue: "desc" },
      },
      _count: {
        select: { positions: true },
      },
    },
    orderBy: { totalValue: "desc" },
  }) as Array<{
    id: string;
    totalValue: number;
    totalCash: number;
    buyingPower: number | null;
    marginAvailable: number | null;
    marginUsed: number | null;
    marginMaintenance: number | null;
    accountName: string | null;
    accountNumber: string | null;
    accountType: string | null;
    status: string;
    lastSyncedAt: Date | null;
    connection: {
      broker: string;
      brokerName: string | null;
    };
    positions: Array<{
      symbol: string;
      securityName: string | null;
      quantity: number;
      averageCost: number;
      currentPrice: number;
      marketValue: number;
      unrealizedPL: number | null;
      unrealizedPLPercent: number | null;
    }>;
    _count: {
      positions: number;
    };
  }>;

  // Calculate daily performance for each account
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatted = await Promise.all(accounts.map(async (acc: typeof accounts[0]) => {
    const totalInvested = acc.positions.reduce(
      (sum: number, pos: typeof acc.positions[0]) => sum + (pos.averageCost || 0) * pos.quantity,
      0
    );
    const totalPL = acc.totalValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    // Get yesterday's snapshot to calculate daily change
    const yesterdaySnapshot = await prisma.portfolioSnapshot.findFirst({
      where: {
        accountId: acc.id,
        snapshotDate: { gte: yesterday, lt: today },
      },
      orderBy: { snapshotDate: "desc" },
    });

    // Also check for today's snapshot (in case we already created one today)
    const todaySnapshot = await prisma.portfolioSnapshot.findFirst({
      where: {
        accountId: acc.id,
        snapshotDate: { gte: today },
      },
      orderBy: { snapshotDate: "desc" },
    });

    // Calculate daily performance
    let dailyPL = 0;
    let dailyPLPercent = 0;
    
    // Use yesterday's snapshot if available, otherwise use today's snapshot as baseline
    const baselineSnapshot = yesterdaySnapshot || todaySnapshot;
    const baselineValue = baselineSnapshot?.totalValue;
    
    if (baselineValue !== undefined && baselineValue !== null) {
      dailyPL = acc.totalValue - baselineValue;
      dailyPLPercent = baselineValue > 0 
        ? (dailyPL / baselineValue) * 100 
        : 0;
    } else {
      // If no snapshots exist yet, we can't calculate daily change
      // This happens for brand new accounts
      dailyPL = 0;
      dailyPLPercent = 0;
    }

    return {
      id: acc.id,
      broker: acc.connection.broker,
      brokerName: acc.connection.brokerName,
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      totalValue: acc.totalValue,
      totalCash: acc.totalCash,
      buyingPower: acc.buyingPower,
      marginAvailable: acc.marginAvailable,
      marginUsed: acc.marginUsed,
      marginMaintenance: acc.marginMaintenance,
      totalPL,
      totalPLPercent,
      dailyPL, // ✨ NEW: Today's gain/loss in dollars
      dailyPLPercent, // ✨ NEW: Today's gain/loss as percentage
      positionCount: acc._count.positions,
      status: acc.status,
      lastSyncedAt: acc.lastSyncedAt,
      positions: acc.positions.map((pos: typeof acc.positions[0]) => ({
        symbol: pos.symbol,
        securityName: pos.securityName,
        quantity: pos.quantity,
        averageCost: pos.averageCost,
        currentPrice: pos.currentPrice,
        marketValue: pos.marketValue,
        unrealizedPL: pos.unrealizedPL,
        unrealizedPLPercent: pos.unrealizedPLPercent,
      })),
    };
  }));

  // Validate response with Zod
  const response: AccountsResponse = { accounts: formatted };
  const validated = AccountsResponseSchema.safeParse(response);
  
  if (!validated.success) {
    console.error("Response validation failed:", validated.error);
    // Still return response, but log error
  }

  return NextResponse.json(response);
}