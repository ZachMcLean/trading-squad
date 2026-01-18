/**
 * Privacy Resolver - Determines what data is visible based on privacy settings
 * 
 * Privacy Resolution Order:
 * 1. Workspace enforced transparency (overrides everything)
 * 2. Member workspace override (can share MORE than user default)
 * 3. User default privacy settings
 * 4. Workspace minimum requirements (users can't share LESS than this)
 */

import { prisma } from './prisma';

// Privacy level types
export type PortfolioValuePrivacy = 'exact' | 'approximate' | 'hidden';
export type PerformancePrivacy = 'visible' | 'hidden';
export type PositionsPrivacy = 'full' | 'tickers_only' | 'hidden';
export type ActivityPrivacy = 'full' | 'without_amounts' | 'hidden';
export type WatchlistPrivacy = 'visible' | 'hidden';

export interface PrivacySettings {
  portfolioValue: PortfolioValuePrivacy;
  performance: PerformancePrivacy;
  positions: PositionsPrivacy;
  activity: ActivityPrivacy;
  watchlist: WatchlistPrivacy;
}

export interface ResolvedPrivacy extends PrivacySettings {
  source: 'enforced' | 'workspace_override' | 'user_default' | 'workspace_minimum';
}

// Default privacy settings (safe defaults)
export const DEFAULT_PRIVACY: PrivacySettings = {
  portfolioValue: 'approximate',
  performance: 'visible',
  positions: 'tickers_only',
  activity: 'without_amounts',
  watchlist: 'visible',
};

/**
 * Resolve privacy settings for a user in a workspace
 */
export async function resolvePrivacy(
  userId: string,
  workspaceId: string
): Promise<ResolvedPrivacy> {
  // 1. Get workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const workspacePolicy = workspace.privacyPolicy as any;

  // 2. If workspace enforces transparency, return full visibility
  if (workspacePolicy?.enforcedTransparency) {
    return {
      portfolioValue: 'exact',
      performance: 'visible',
      positions: 'full',
      activity: 'full',
      watchlist: 'visible',
      source: 'enforced',
    };
  }

  // 3. Get member's workspace override
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  const workspaceOverride = member.privacyOverride as PrivacySettings | null;

  // 4. Get user's default privacy
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userDefaults = (user.privacyDefaults as PrivacySettings) || DEFAULT_PRIVACY;

  // 5. Get workspace minimums
  const minimums = workspacePolicy?.minimumSharing || DEFAULT_PRIVACY;

  // 6. Resolve each field
  const resolved: ResolvedPrivacy = {
    portfolioValue: resolveField(
      'portfolioValue',
      workspaceOverride?.portfolioValue,
      userDefaults.portfolioValue,
      minimums.portfolioValue
    ),
    performance: resolveField(
      'performance',
      workspaceOverride?.performance,
      userDefaults.performance,
      minimums.performance
    ),
    positions: resolveField(
      'positions',
      workspaceOverride?.positions,
      userDefaults.positions,
      minimums.positions
    ),
    activity: resolveField(
      'activity',
      workspaceOverride?.activity,
      userDefaults.activity,
      minimums.activity
    ),
    watchlist: resolveField(
      'watchlist',
      workspaceOverride?.watchlist,
      userDefaults.watchlist,
      minimums.watchlist
    ),
    source: workspaceOverride ? 'workspace_override' : 'user_default',
  };

  return resolved;
}

/**
 * Resolve a single privacy field
 * Priority: override > user default, but never less than workspace minimum
 */
function resolveField<T>(
  field: keyof PrivacySettings,
  override: T | undefined,
  userDefault: T,
  minimum: T
): T {
  const value = override !== undefined ? override : userDefault;
  
  // Use the more permissive setting between value and minimum
  // (users can share MORE than minimum, never LESS)
  return maxPrivacy(field, value, minimum);
}

/**
 * Get the more permissive privacy setting between two options
 */
function maxPrivacy<T>(field: keyof PrivacySettings, a: T, b: T): T {
  const hierarchies: Record<keyof PrivacySettings, string[]> = {
    portfolioValue: ['hidden', 'approximate', 'exact'],
    performance: ['hidden', 'visible'],
    positions: ['hidden', 'tickers_only', 'full'],
    activity: ['hidden', 'without_amounts', 'full'],
    watchlist: ['hidden', 'visible'],
  };

  const hierarchy = hierarchies[field];
  const aIndex = hierarchy.indexOf(a as string);
  const bIndex = hierarchy.indexOf(b as string);

  // Return the one with higher index (more permissive)
  return (aIndex > bIndex ? a : b);
}

/**
 * Format portfolio value based on privacy setting
 */
export function formatPortfolioValue(
  value: number,
  privacy: PortfolioValuePrivacy
): {
  display: string;
  exact: number | null;
  range: [number, number] | null;
} {
  switch (privacy) {
    case 'exact':
      return {
        display: `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        exact: value,
        range: null,
      };
    
    case 'approximate': {
      // Round to nearest 10K range
      const lower = Math.floor(value / 10000) * 10000;
      const upper = lower + 10000;
      const lowerDisplay = lower >= 1000 ? `$${(lower / 1000).toFixed(0)}K` : `$${lower.toLocaleString()}`;
      const upperDisplay = upper >= 1000 ? `$${(upper / 1000).toFixed(0)}K` : `$${upper.toLocaleString()}`;
      
      return {
        display: `${lowerDisplay}-${upperDisplay}`,
        exact: null,
        range: [lower, upper],
      };
    }
    
    case 'hidden':
      return {
        display: 'Hidden',
        exact: null,
        range: null,
      };
  }
}

/**
 * Filter positions based on privacy setting
 */
export function filterPositions(
  positions: any[],
  privacy: PositionsPrivacy
): any[] {
  switch (privacy) {
    case 'full':
      return positions; // Return all data
    
    case 'tickers_only':
      // Return only symbol, hide quantities and values
      return positions.map(p => ({
        symbol: p.symbol,
        securityName: p.securityName,
        securityType: p.securityType,
      }));
    
    case 'hidden':
      return []; // Return empty array
  }
}

/**
 * Format performance based on privacy setting
 */
export function formatPerformance(
  change: number,
  changePercent: number,
  privacy: PerformancePrivacy
): {
  changePercent: number | null;
  changeAmount: number | null;
} {
  if (privacy === 'visible') {
    return {
      changePercent,
      changeAmount: change,
    };
  }
  
  return {
    changePercent: null,
    changeAmount: null,
  };
}

/**
 * Check if user has permission to view another user's data
 */
export async function canViewUserData(
  viewerId: string,
  targetUserId: string,
  workspaceId: string
): Promise<boolean> {
  // Users can always view their own data
  if (viewerId === targetUserId) {
    return true;
  }

  // Check if both users are members of the workspace
  const [viewerMember, targetMember] = await Promise.all([
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: viewerId } },
    }),
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    }),
  ]);

  return !!(viewerMember && targetMember);
}

/**
 * Get privacy display text
 */
export function getPrivacyDisplayText(privacy: PrivacySettings): Record<keyof PrivacySettings, string> {
  return {
    portfolioValue: 
      privacy.portfolioValue === 'exact' ? '🔓 Exact' :
      privacy.portfolioValue === 'approximate' ? '🔓 Approximate' :
      '🔒 Hidden',
    performance:
      privacy.performance === 'visible' ? '✓ Visible' : '🔒 Hidden',
    positions:
      privacy.positions === 'full' ? '🔓 Full Details' :
      privacy.positions === 'tickers_only' ? '🔒 Tickers Only' :
      '🔒 Hidden',
    activity:
      privacy.activity === 'full' ? '🔓 Full Details' :
      privacy.activity === 'without_amounts' ? '🔒 Without Amounts' :
      '🔒 Hidden',
    watchlist:
      privacy.watchlist === 'visible' ? '✓ Visible' : '🔒 Hidden',
  };
}
