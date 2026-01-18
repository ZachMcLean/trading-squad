import type { TimePeriod } from "@/lib/validations/portfolio";

/**
 * Shared chart utilities for consistent formatting across portfolio and squad charts
 */

// Format a date for chart X-axis labels based on the time period
export function formatChartLabel(date: string | Date, period: TimePeriod): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  switch (period) {
    case "1D":
      // For intraday, show time (for future hourly support)
      return d.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      });
    
    case "1W":
      // Show weekday name
      return d.toLocaleDateString("en-US", { weekday: "short" });
    
    case "1M":
    case "3M":
    case "6M":
    case "YTD":
      // Show month and day
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    case "1Y":
      // Show month only
      return d.toLocaleDateString("en-US", { month: "short" });
    
    default:
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

// Format a value for the Y-axis (abbreviated with k/M suffix)
export function formatYAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
}

// Format a percentage for the Y-axis
export function formatYAxisPercent(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(0)}%`;
}

// Format currency value for tooltips/displays
export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Format percentage for tooltips/displays
export function formatPercent(value: number, showSign: boolean = true): string {
  const prefix = showSign && value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

// Get the appropriate color class for a value (positive/negative)
export function getValueColorClass(value: number): string {
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

// Get chart gradient colors based on performance
export function getChartGradientId(isPositive: boolean): string {
  return isPositive ? "colorPositive" : "colorNegative";
}

// Chart color constants
export const CHART_COLORS = {
  positive: {
    stroke: "#10b981", // emerald-500
    fill: "#10b981",
    gradient: {
      start: "rgba(16, 185, 129, 0.3)",
      end: "rgba(16, 185, 129, 0.05)",
    },
  },
  negative: {
    stroke: "#ef4444", // red-500
    fill: "#ef4444",
    gradient: {
      start: "rgba(239, 68, 68, 0.3)",
      end: "rgba(239, 68, 68, 0.05)",
    },
  },
  neutral: {
    stroke: "#06b6d4", // cyan-500
    fill: "#06b6d4",
    gradient: {
      start: "rgba(6, 182, 212, 0.3)",
      end: "rgba(6, 182, 212, 0.05)",
    },
  },
  squadAverage: {
    stroke: "#f59e0b", // amber-500
    strokeDasharray: "5 5",
  },
  squadTotal: {
    stroke: "#8b5cf6", // violet-500
    gradient: {
      start: "rgba(139, 92, 246, 0.3)",
      end: "rgba(139, 92, 246, 0.05)",
    },
  },
} as const;

// Member colors for multi-line charts (squad all members view)
export const MEMBER_COLORS = [
  "#06b6d4", // cyan (You)
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#ec4899", // pink
  "#84cc16", // lime
] as const;

// Data quality thresholds
export const DATA_QUALITY = {
  EXCELLENT: 80,  // 80%+ actual data points
  GOOD: 60,       // 60-80% actual data points
  FAIR: 40,       // 40-60% actual data points
  POOR: 0,        // Below 40%
} as const;

export function getDataQualityLevel(coverage: number): "excellent" | "good" | "fair" | "poor" {
  if (coverage >= DATA_QUALITY.EXCELLENT) return "excellent";
  if (coverage >= DATA_QUALITY.GOOD) return "good";
  if (coverage >= DATA_QUALITY.FAIR) return "fair";
  return "poor";
}

export function getDataQualityInfo(coverage: number): {
  level: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const level = getDataQualityLevel(coverage);
  
  switch (level) {
    case "excellent":
      return {
        level,
        label: "Excellent",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        borderColor: "border-emerald-500/30",
      };
    case "good":
      return {
        level,
        label: "Good",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
        borderColor: "border-cyan-500/30",
      };
    case "fair":
      return {
        level,
        label: "Fair",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
      };
    case "poor":
    default:
      return {
        level,
        label: "Limited",
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
        borderColor: "border-orange-500/30",
      };
  }
}
