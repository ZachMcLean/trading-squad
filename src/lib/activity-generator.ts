/**
 * Activity Generator
 * Auto-generates workspace activities from transactions and portfolio changes
 */

import { prisma } from "./prisma";
import type { ActivityType } from "./validations/activity";

interface TransactionData {
  userId: string;
  symbol: string;
  type: "buy" | "sell" | "deposit" | "withdrawal" | "dividend";
  quantity?: number;
  price?: number;
  amount: number;
  transactionDate: Date;
}

interface PositionChange {
  userId: string;
  symbol: string;
  previousQuantity: number | null;
  newQuantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  portfolioPercentage?: number;
}

interface MilestoneData {
  userId: string;
  type: "ATH" | "VALUE" | "RETURN";
  previousValue?: number;
  newValue: number;
  gain?: number;
  gainPercent?: number;
}

/**
 * Generate activity from a transaction
 */
export async function generateActivityFromTransaction(
  transaction: TransactionData,
  workspaceIds: string[]
): Promise<void> {
  if (workspaceIds.length === 0) return;

  // Determine activity type
  let activityType: ActivityType | null = null;
  let quantity: number | null = null;
  let price: number | null = null;
  let value: number | null = null;

  if (transaction.type === "buy") {
    activityType = "TRADE_BUY";
    quantity = transaction.quantity || null;
    price = transaction.price || null;
    value = transaction.amount;
  } else if (transaction.type === "sell") {
    activityType = "TRADE_SELL";
    quantity = transaction.quantity || null;
    price = transaction.price || null;
    value = transaction.amount;
  }

  if (!activityType) return;

  // Get user's privacy settings
  const user = await prisma.user.findUnique({
    where: { id: transaction.userId },
    select: { privacyDefaults: true },
  });

  const privacySettings = user?.privacyDefaults as any || {};
  const privacyLevel =
    privacySettings.activity === "full"
      ? "full"
      : privacySettings.activity === "without_amounts"
      ? "partial"
      : "hidden";

  // Don't create activity if user has hidden activity
  if (privacyLevel === "hidden") return;

  // Create activity in each workspace
  for (const workspaceId of workspaceIds) {
    try {
      await prisma.workspaceActivity.create({
        data: {
          workspaceId,
          userId: transaction.userId,
          type: activityType,
          symbol: transaction.symbol,
          quantity,
          price,
          value,
          metadata: {
            privacyLevel,
            transactionDate: transaction.transactionDate.toISOString(),
          },
          visibility: "workspace",
        },
      });
    } catch (error) {
      console.error(
        `Failed to create activity for workspace ${workspaceId}:`,
        error
      );
    }
  }
}

/**
 * Generate activity from position changes
 */
export async function generateActivityFromPositionChange(
  change: PositionChange,
  workspaceIds: string[]
): Promise<void> {
  if (workspaceIds.length === 0) return;

  // Determine what changed
  const isNewPosition = change.previousQuantity === null || change.previousQuantity === 0;
  const isClosed = change.newQuantity === 0;
  const isIncrease = !isNewPosition && !isClosed && change.newQuantity > (change.previousQuantity || 0);
  const isDecrease = !isNewPosition && !isClosed && change.newQuantity < (change.previousQuantity || 0);

  let activityType: ActivityType | null = null;

  if (isNewPosition) {
    activityType = "POSITION_OPENED";
  } else if (isClosed) {
    activityType = "POSITION_CLOSED";
  } else if (isIncrease) {
    activityType = "POSITION_INCREASED";
  } else if (isDecrease) {
    activityType = "POSITION_DECREASED";
  }

  if (!activityType) return;

  // Get user's privacy settings
  const user = await prisma.user.findUnique({
    where: { id: change.userId },
    select: { privacyDefaults: true },
  });

  const privacySettings = user?.privacyDefaults as any || {};
  const privacyLevel =
    privacySettings.positions === "full"
      ? "full"
      : privacySettings.positions === "tickers_only"
      ? "partial"
      : "hidden";

  if (privacyLevel === "hidden") return;

  // Calculate metadata
  const metadata: any = {
    privacyLevel,
    isFirstTime: isNewPosition,
  };

  if (privacyLevel === "full") {
    metadata.previousQuantity = change.previousQuantity;
    metadata.newQuantity = change.newQuantity;
    metadata.averageCost = change.averageCost;
    metadata.portfolioPercentage = change.portfolioPercentage;

    if (isClosed && change.unrealizedPL !== undefined) {
      metadata.gainLoss = change.unrealizedPL;
      metadata.gainLossPercent = change.unrealizedPLPercent;
    }
  }

  // Create activity in each workspace
  for (const workspaceId of workspaceIds) {
    try {
      await prisma.workspaceActivity.create({
        data: {
          workspaceId,
          userId: change.userId,
          type: activityType,
          symbol: change.symbol,
          quantity: change.newQuantity,
          price: change.currentPrice,
          value: change.marketValue,
          metadata,
          visibility: "workspace",
        },
      });
    } catch (error) {
      console.error(
        `Failed to create position activity for workspace ${workspaceId}:`,
        error
      );
    }
  }
}

/**
 * Generate activity from milestone achievement
 */
export async function generateActivityFromMilestone(
  milestone: MilestoneData,
  workspaceIds: string[]
): Promise<void> {
  if (workspaceIds.length === 0) return;

  let activityType: ActivityType;

  if (milestone.type === "ATH") {
    activityType = "MILESTONE_ATH";
  } else if (milestone.type === "VALUE") {
    activityType = "MILESTONE_VALUE";
  } else {
    activityType = "MILESTONE_RETURN";
  }

  // Get user's privacy settings
  const user = await prisma.user.findUnique({
    where: { id: milestone.userId },
    select: { privacyDefaults: true },
  });

  const privacySettings = user?.privacyDefaults as any || {};
  const privacyLevel =
    privacySettings.performance === "visible" ? "full" : "hidden";

  // Milestones are generally public, but respect performance privacy
  if (privacyLevel === "hidden" && milestone.type !== "ATH") return;

  const metadata: any = {
    milestoneType: milestone.type,
  };

  if (milestone.previousValue !== undefined) {
    metadata.previousValue = milestone.previousValue;
  }

  if (milestone.gain !== undefined) {
    metadata.gain = milestone.gain;
  }

  if (milestone.gainPercent !== undefined) {
    metadata.gainPercent = milestone.gainPercent;
  }

  // Create activity in each workspace
  for (const workspaceId of workspaceIds) {
    try {
      await prisma.workspaceActivity.create({
        data: {
          workspaceId,
          userId: milestone.userId,
          type: activityType,
          value: milestone.newValue,
          metadata,
          visibility: "workspace",
        },
      });
    } catch (error) {
      console.error(
        `Failed to create milestone activity for workspace ${workspaceId}:`,
        error
      );
    }
  }
}

/**
 * Get all workspaces a user is a member of
 */
export async function getUserWorkspaces(userId: string): Promise<string[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });

  return memberships.map((m) => m.workspaceId);
}

/**
 * Check for portfolio milestones
 */
export async function checkForMilestones(
  userId: string,
  currentValue: number,
  previousValue: number
): Promise<MilestoneData[]> {
  const milestones: MilestoneData[] = [];

  // Check for ATH
  const previousHigh = await getPreviousPortfolioHigh(userId);
  if (currentValue > previousHigh) {
    milestones.push({
      userId,
      type: "ATH",
      previousValue: previousHigh,
      newValue: currentValue,
      gain: currentValue - previousHigh,
      gainPercent: previousHigh > 0 ? ((currentValue - previousHigh) / previousHigh) * 100 : 0,
    });
  }

  // Check for value milestones
  const valueMilestones = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  for (const milestone of valueMilestones) {
    if (previousValue < milestone && currentValue >= milestone) {
      milestones.push({
        userId,
        type: "VALUE",
        newValue: currentValue,
      });
    }
  }

  return milestones;
}

/**
 * Get previous portfolio high
 */
async function getPreviousPortfolioHigh(userId: string): Promise<number> {
  // Get the highest portfolio value from snapshots
  const highestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: {
      account: {
        connection: {
          snaptradeUser: {
            userId,
          },
        },
      },
    },
    orderBy: {
      totalValue: "desc",
    },
  });

  return highestSnapshot?.totalValue || 0;
}
