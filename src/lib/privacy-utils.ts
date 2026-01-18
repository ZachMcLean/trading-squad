/**
 * Privacy utilities for handling user privacy settings in workspaces
 */

export type PrivacyLevel = "full" | "partial" | "hidden";

export interface PrivacySettings {
  portfolioValue: "exact" | "approximate" | "hidden";
  performance: "visible" | "hidden";
  positions: "full" | "tickers_only" | "hidden";
  activity: "full" | "without_amounts" | "hidden";
  watchlist?: "visible" | "hidden";
}

export interface WorkspacePrivacyPolicy {
  minimumSharing?: Partial<PrivacySettings>;
  enforcedTransparency?: boolean;
  allowAnonymousMode?: boolean;
}

/**
 * Resolve a user's effective privacy settings for a specific workspace
 * Takes into account:
 * 1. Workspace privacy policy (minimum requirements)
 * 2. User's workspace-specific privacy override
 * 3. User's global privacy defaults
 */
export function resolvePrivacySettings(
  userDefaults: PrivacySettings,
  workspacePolicy: WorkspacePrivacyPolicy | null,
  workspaceOverride: PrivacySettings | null
): PrivacySettings {
  // Start with user defaults
  let settings = { ...userDefaults };

  // Apply workspace-specific override if it exists
  if (workspaceOverride) {
    settings = { ...settings, ...workspaceOverride };
  }

  // Apply workspace minimum requirements if enforced
  if (workspacePolicy?.enforcedTransparency && workspacePolicy.minimumSharing) {
    const minimum = workspacePolicy.minimumSharing;

    // Enforce minimum portfolio value visibility
    if (minimum.portfolioValue) {
      const valueOrder = ["hidden", "approximate", "exact"];
      const currentLevel = valueOrder.indexOf(settings.portfolioValue);
      const minimumLevel = valueOrder.indexOf(minimum.portfolioValue);
      if (currentLevel < minimumLevel) {
        settings.portfolioValue = minimum.portfolioValue;
      }
    }

    // Enforce minimum performance visibility
    if (minimum.performance === "visible" && settings.performance === "hidden") {
      settings.performance = "visible";
    }

    // Enforce minimum positions visibility
    if (minimum.positions) {
      const posOrder = ["hidden", "tickers_only", "full"];
      const currentLevel = posOrder.indexOf(settings.positions);
      const minimumLevel = posOrder.indexOf(minimum.positions);
      if (currentLevel < minimumLevel) {
        settings.positions = minimum.positions;
      }
    }

    // Enforce minimum activity visibility
    if (minimum.activity) {
      const actOrder = ["hidden", "without_amounts", "full"];
      const currentLevel = actOrder.indexOf(settings.activity);
      const minimumLevel = actOrder.indexOf(minimum.activity);
      if (currentLevel < minimumLevel) {
        settings.activity = minimum.activity;
      }
    }
  }

  return settings;
}

/**
 * Determine the overall privacy level for performance data
 * Used to decide what to show in charts and leaderboards
 */
export function getPerformancePrivacyLevel(
  settings: PrivacySettings
): PrivacyLevel {
  // If performance is hidden, always return "hidden"
  if (settings.performance === "hidden") {
    return "hidden";
  }

  // If portfolio value is hidden, we can't show accurate performance
  if (settings.portfolioValue === "hidden") {
    return "hidden";
  }

  // If they show exact portfolio value and visible performance, that's full transparency
  if (settings.portfolioValue === "exact" && settings.performance === "visible") {
    return "full";
  }

  // Otherwise it's partial (approximate values)
  return "partial";
}

/**
 * Check if a user can be included in squad leaderboard rankings
 */
export function canRankInLeaderboard(settings: PrivacySettings): boolean {
  return (
    settings.performance === "visible" && 
    settings.portfolioValue === "exact"
  );
}

/**
 * Check if a user's trades can be shown in activity feed
 */
export function canShowActivity(settings: PrivacySettings): boolean {
  return settings.activity !== "hidden";
}

/**
 * Check if position amounts should be shown in activity
 */
export function canShowActivityAmounts(settings: PrivacySettings): boolean {
  return settings.activity === "full";
}

/**
 * Check if a user's positions can be shown
 */
export function canShowPositions(settings: PrivacySettings): boolean {
  return settings.positions !== "hidden";
}

/**
 * Check if position details (amounts) should be shown
 */
export function canShowPositionDetails(settings: PrivacySettings): boolean {
  return settings.positions === "full";
}

/**
 * Parse privacy settings from JSON (safe parsing with defaults)
 */
export function parsePrivacySettings(json: any): PrivacySettings {
  const defaults: PrivacySettings = {
    portfolioValue: "approximate",
    performance: "visible",
    positions: "tickers_only",
    activity: "without_amounts",
    watchlist: "visible",
  };

  if (!json || typeof json !== "object") {
    return defaults;
  }

  return {
    portfolioValue: json.portfolioValue || defaults.portfolioValue,
    performance: json.performance || defaults.performance,
    positions: json.positions || defaults.positions,
    activity: json.activity || defaults.activity,
    watchlist: json.watchlist || defaults.watchlist,
  };
}

/**
 * Parse workspace privacy policy from JSON (safe parsing with defaults)
 */
export function parseWorkspacePrivacyPolicy(json: any): WorkspacePrivacyPolicy {
  const defaults: WorkspacePrivacyPolicy = {
    minimumSharing: undefined,
    enforcedTransparency: false,
    allowAnonymousMode: false,
  };

  if (!json || typeof json !== "object") {
    return defaults;
  }

  return {
    minimumSharing: json.minimumSharing
      ? parsePrivacySettings(json.minimumSharing)
      : defaults.minimumSharing,
    enforcedTransparency: json.enforcedTransparency ?? defaults.enforcedTransparency,
    allowAnonymousMode: json.allowAnonymousMode ?? defaults.allowAnonymousMode,
  };
}

/**
 * Format portfolio value based on privacy settings
 */
export function formatPortfolioValue(
  value: number,
  settings: PrivacySettings
): string {
  switch (settings.portfolioValue) {
    case "exact":
      return `$${value.toLocaleString()}`;
    case "approximate":
      // Round to nearest 10k for approximation
      const rounded = Math.round(value / 10000) * 10000;
      return `~$${(rounded / 1000).toFixed(0)}K`;
    case "hidden":
      return "[Hidden]";
    default:
      return "[Hidden]";
  }
}

/**
 * Get a privacy-safe range for portfolio value
 */
export function getPortfolioValueRange(value: number): { min: number; max: number } {
  // Return a 10% range around the value
  const range = value * 0.1;
  return {
    min: value - range,
    max: value + range,
  };
}
