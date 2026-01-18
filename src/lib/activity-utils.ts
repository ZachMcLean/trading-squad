import type { ActivityType, TradeMetadata, MilestoneMetadata, PositionMetadata } from "./validations/activity";
import type { PrivacySettings } from "./privacy-utils";
import { canShowActivity, canShowActivityAmounts } from "./privacy-utils";

/**
 * Format activity message based on type and privacy settings
 */
export function formatActivityMessage(
  type: ActivityType,
  symbol: string | null,
  quantity: number | null,
  price: number | null,
  value: number | null,
  metadata: any,
  privacySettings: PrivacySettings,
  userName: string
): string {
  const showAmounts = canShowActivityAmounts(privacySettings);
  const qty = quantity ? Math.abs(quantity) : 0;
  const sym = symbol || "unknown";

  switch (type) {
    case "TRADE_BUY":
      if (!showAmounts) return `bought ${sym}`;
      return `bought ${qty} shares of ${sym}${price ? ` at $${price.toFixed(2)}` : ""}`;

    case "TRADE_SELL":
      if (!showAmounts) return `sold ${sym}`;
      return `sold ${qty} shares of ${sym}${price ? ` at $${price.toFixed(2)}` : ""}`;

    case "POSITION_OPENED":
      if (!showAmounts) return `opened a position in ${sym}`;
      return `opened position in ${sym} (${qty} shares)`;

    case "POSITION_CLOSED":
      if (!showAmounts) return `closed position in ${sym}`;
      const gain = metadata?.gainLoss;
      const gainPct = metadata?.gainLossPercent;
      if (gain && gainPct) {
        return `closed ${sym} position ${gain >= 0 ? "for a gain" : "at a loss"} of ${Math.abs(gainPct).toFixed(1)}%`;
      }
      return `closed position in ${sym}`;

    case "POSITION_INCREASED":
      if (!showAmounts) return `added to ${sym} position`;
      return `added ${qty} more shares to ${sym}`;

    case "POSITION_DECREASED":
      if (!showAmounts) return `reduced ${sym} position`;
      return `trimmed ${qty} shares from ${sym}`;

    case "MILESTONE_ATH":
      if (!showAmounts) return `hit a new portfolio all-time high!`;
      const athValue = metadata?.newValue || value;
      return `hit portfolio ATH: $${athValue?.toLocaleString()}`;

    case "MILESTONE_VALUE":
      if (!showAmounts) return `hit a portfolio milestone!`;
      const milestoneValue = value || metadata?.newValue;
      const milestoneLabel = getMilestoneLabel(milestoneValue);
      return `reached ${milestoneLabel}! 🎉`;

    case "MILESTONE_RETURN":
      const returnPct = metadata?.gainPercent || 0;
      return `portfolio up ${returnPct.toFixed(0)}% all time!`;

    case "IDEA_SHARED":
      return `shared a trade idea on ${sym}`;

    case "IDEA_OUTCOME":
      const outcome = metadata?.outcome || "closed";
      return `${sym} idea ${outcome}`;

    case "WATCHLIST_ADD":
      return `added ${sym} to squad watchlist`;

    case "ACHIEVEMENT":
      const achievementName = metadata?.achievement || "an achievement";
      return `unlocked ${achievementName}!`;

    default:
      return "updated their portfolio";
  }
}

/**
 * Get milestone label for value thresholds
 */
export function getMilestoneLabel(value: number | null | undefined): string {
  if (!value) return "milestone";
  
  if (value >= 1000000) return "$1M Club";
  if (value >= 500000) return "Half Million Club";
  if (value >= 250000) return "Quarter Mil Club";
  if (value >= 100000) return "$100K Club";
  if (value >= 50000) return "$50K Club";
  if (value >= 25000) return "$25K Club";
  if (value >= 10000) return "$10K Club";
  
  return `$${(value / 1000).toFixed(0)}K milestone`;
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case "TRADE_BUY":
    case "POSITION_OPENED":
    case "POSITION_INCREASED":
      return "🟢";
    
    case "TRADE_SELL":
    case "POSITION_CLOSED":
    case "POSITION_DECREASED":
      return "🔴";
    
    case "MILESTONE_ATH":
    case "MILESTONE_VALUE":
    case "MILESTONE_RETURN":
      return "🏆";
    
    case "IDEA_SHARED":
      return "💡";
    
    case "IDEA_OUTCOME":
      return "📊";
    
    case "WATCHLIST_ADD":
      return "👁️";
    
    case "ACHIEVEMENT":
      return "🎉";
    
    default:
      return "📈";
  }
}

/**
 * Get activity color class based on type
 */
export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case "TRADE_BUY":
    case "POSITION_OPENED":
    case "POSITION_INCREASED":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    
    case "TRADE_SELL":
    case "POSITION_CLOSED":
    case "POSITION_DECREASED":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    
    case "MILESTONE_ATH":
    case "MILESTONE_VALUE":
    case "MILESTONE_RETURN":
    case "ACHIEVEMENT":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    
    case "IDEA_SHARED":
      return "text-purple-400 bg-purple-500/10 border-purple-500/30";
    
    case "IDEA_OUTCOME":
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    
    case "WATCHLIST_ADD":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format full timestamp for tooltips
 */
export function formatFullTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Check if activity should be shown based on privacy settings
 */
export function shouldShowActivity(
  activityType: ActivityType,
  privacySettings: PrivacySettings
): boolean {
  // Always show milestones and achievements
  if (
    activityType === "MILESTONE_ATH" ||
    activityType === "MILESTONE_VALUE" ||
    activityType === "MILESTONE_RETURN" ||
    activityType === "ACHIEVEMENT"
  ) {
    return true;
  }

  // Check if user allows activity visibility
  return canShowActivity(privacySettings);
}

/**
 * Get reaction emoji options
 */
export const REACTION_EMOJIS = [
  { emoji: "👍", label: "Like" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "👏", label: "Applaud" },
  { emoji: "💯", label: "100" },
  { emoji: "🤔", label: "Thinking" },
] as const;

/**
 * Aggregate reaction counts
 */
export function aggregateReactionCounts(reactions: Array<{ emoji: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const reaction of reactions) {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  }
  
  return counts;
}

/**
 * Check if user has reacted with specific emojis
 */
export function getUserReactions(
  reactions: Array<{ emoji: string; userId: string }>,
  userId: string
): Record<string, boolean> {
  const userReactions: Record<string, boolean> = {};
  
  for (const reaction of reactions) {
    if (reaction.userId === userId) {
      userReactions[reaction.emoji] = true;
    }
  }
  
  return userReactions;
}

/**
 * Sort activities by recency
 */
export function sortActivitiesByRecency<T extends { createdAt: Date }>(activities: T[]): T[] {
  return [...activities].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Filter activities by type
 */
export function filterActivitiesByType<T extends { type: ActivityType }>(
  activities: T[],
  types: ActivityType[]
): T[] {
  if (types.length === 0) return activities;
  return activities.filter((activity) => types.includes(activity.type));
}

/**
 * Group activities by date
 */
export function groupActivitiesByDate<T extends { createdAt: Date }>(
  activities: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const activity of activities) {
    const dateKey = formatDateGroup(activity.createdAt);
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, activity]);
  }
  
  return groups;
}

/**
 * Format date for grouping (Today, Yesterday, Jan 15, etc.)
 */
function formatDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (activityDate.getTime() === today.getTime()) return "Today";
  if (activityDate.getTime() === yesterday.getTime()) return "Yesterday";
  
  // Within last week
  const diffDays = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  
  // Older
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
