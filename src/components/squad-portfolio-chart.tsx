"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  User,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  MoreVertical,
  Download,
  BarChart3,
  Radio,
  WifiOff,
  ArrowRight,
} from "lucide-react";
import { useSquadHistory, useSyncPortfolio } from "@/hooks/use-portfolio";

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";
type ChartView = "you-vs-squad" | "squad-total" | "all-members";

interface SquadPortfolioChartProps {
  workspaceId: string | null | undefined;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  userPrivacyLevel?: "full" | "partial" | "hidden";
}

export function SquadPortfolioChart({
  workspaceId,
  selectedPeriod,
  onPeriodChange,
  userPrivacyLevel = "full",
}: SquadPortfolioChartProps) {
  const [chartView, setChartView] = useState<ChartView>("you-vs-squad");
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(false);
  const periods: TimePeriod[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD"];

  const isRealTimeAvailable = selectedPeriod === "1D";

  // Debug logging
  useEffect(() => {
    console.log("SquadPortfolioChart - workspaceId:", workspaceId);
    console.log("SquadPortfolioChart - selectedPeriod:", selectedPeriod);
  }, [workspaceId, selectedPeriod]);

  // Auto-disable real-time when switching away from 1D
  useEffect(() => {
    if (selectedPeriod !== "1D" && realTimeEnabled) {
      setRealTimeEnabled(false);
    }
  }, [selectedPeriod, realTimeEnabled]);

  const { data, isLoading, error, isFetching } = useSquadHistory(
    workspaceId,
    selectedPeriod,
    realTimeEnabled && isRealTimeAvailable
  );
  
  const syncMutation = useSyncPortfolio();

  // If no workspaceId, show a helpful message
  if (!workspaceId && !isLoading) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4 max-w-md">
              <Users className="w-16 h-16 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Workspace Selected
                </h3>
                <p className="text-slate-400 text-sm">
                  You're currently in solo mode. Create or join a workspace to see squad performance.
                </p>
              </div>
              <div className="flex gap-3 justify-center mt-6">
                <Button 
                  onClick={() => window.location.href = '/workspaces'}
                  className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Create Workspace
                </Button>
                <Button 
                  onClick={() => window.location.href = '/portfolio'}
                  variant="outline"
                >
                  View Solo Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Transform data based on selected view
  // Uses shared chart-utils for consistent label formatting
  const formatChartData = () => {
    if (!data) return [];

    // Use shared utility for consistent date formatting
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      switch (selectedPeriod) {
        case "1D":
          return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        case "1W":
          return date.toLocaleDateString("en-US", { weekday: "short" });
        case "1Y":
          return date.toLocaleDateString("en-US", { month: "short" });
        default:
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    };

    switch (chartView) {
      case "you-vs-squad":
        // Merge your history with squad average
        return data.squadAverage.map((point, i) => ({
          date: formatDate(point.date),
          you: data.yourHistory[i]?.percentChange ?? null,
          squadAvg: point.percentChange,
          rawDate: point.date,
        }));

      case "squad-total":
        return data.squadTotal.map((point) => ({
          date: formatDate(point.date),
          value: point.value,
          rawDate: point.date,
        }));

      case "all-members":
        // Flatten all visible member histories
        const dates = data.squadAverage.map((p) => p.date);
        return dates.map((date, i) => {
          const point: Record<string, string | number | undefined> = { 
            date: formatDate(date),
            rawDate: date,
          };
          
          // Add visible members
          data.members
            .filter((m) => m.privacyLevel !== "hidden")
            .forEach((member) => {
              point[member.memberName] = member.history[i]?.percentChange;
            });
          
          // Always include "you" if visible
          if (userPrivacyLevel !== "hidden") {
            point["You"] = data.yourHistory[i]?.percentChange;
          }
          
          return point;
        });

      default:
        return [];
    }
  };

  const chartData = formatChartData();

  // Calculate key metrics
  const yourReturn = data?.yourHistory.at(-1)?.percentChange ?? 0;
  const squadReturn = data?.squadAverage.at(-1)?.percentChange ?? 0;
  const outperformance = yourReturn - squadReturn;
  const squadTotalValue = data?.squadTotal.at(-1)?.value ?? 0;

  // Determine if "All Members" view is available
  const canShowAllMembers =
    userPrivacyLevel !== "hidden" && (data?.metadata.visibleMembers ?? 0) >= 2;

  // Colors for members (consistent palette)
  const memberColors: { [key: string]: string } = {
    You: "#06b6d4", // cyan
  };
  
  // Assign colors to other members
  const otherColors = ["#f59e0b", "#8b5cf6", "#10b981", "#f43f5e", "#3b82f6", "#ec4899"];
  data?.members
    .filter((m) => m.privacyLevel !== "hidden")
    .forEach((member, i) => {
      if (member.memberName !== "You") {
        memberColors[member.memberName] = otherColors[i % otherColors.length];
      }
    });

  // Handle sync
  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("quick");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-400">Loading squad performance...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3 max-w-md">
              <div className="text-red-400 text-sm font-medium">
                Failed to load squad data
              </div>
              <div className="text-slate-400 text-xs">
                {error.message}
              </div>
              {!workspaceId && (
                <div className="text-slate-500 text-sm mt-2">
                  No workspace selected. Create or join a workspace first.
                </div>
              )}
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={handleSync} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync My Data
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show empty state if no data
  if (!data || chartData.length === 0) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">No squad history available yet</p>
              <p className="text-slate-500 text-sm">
                Squad members need to sync their accounts
              </p>
              <Button onClick={handleSync} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
      <div className="p-5 space-y-4">
        {/* Header: Performance Summary */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Main Performance Comparison */}
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <User className="w-4 h-4" />
                  <span>Your Return</span>
                </div>
                <div
                  className={`text-2xl sm:text-3xl tabular-nums font-semibold ${
                    yourReturn >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {yourReturn >= 0 ? "+" : ""}
                  {yourReturn.toFixed(2)}%
                </div>
              </div>

              <div className="w-px h-12 bg-slate-700 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>Squad Avg</span>
                </div>
                <div
                  className={`text-2xl sm:text-3xl tabular-nums font-semibold ${
                    squadReturn >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {squadReturn >= 0 ? "+" : ""}
                  {squadReturn.toFixed(2)}%
                </div>
              </div>

              <div className="w-px h-12 bg-slate-700 hidden lg:block" />

              {/* Outperformance Badge */}
              <div
                className={`px-3 py-2 rounded-lg border ${
                  outperformance >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="text-xs text-slate-400">vs Squad</div>
                <div
                  className={`flex items-center gap-1 text-lg tabular-nums font-semibold ${
                    outperformance >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {outperformance >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {outperformance >= 0 ? "+" : ""}
                  {outperformance.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Squad Stats */}
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="text-slate-400">
                Squad Total:{" "}
                <span className="text-white tabular-nums font-medium">
                  ${squadTotalValue.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {data?.metadata.visibleMembers}/{data?.metadata.totalMembers} members
                visible
              </span>
              {(data?.metadata.hiddenMembers ?? 0) > 0 && (
                <>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="w-3 h-3" />
                    {data?.metadata.hiddenMembers} private
                  </span>
                </>
              )}
            </div>
          </div>

          {/* View Toggle & Actions */}
          <div className="flex flex-col gap-2">
            {/* View Toggle */}
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChartView("you-vs-squad")}
                className={`h-8 px-2 sm:px-3 text-xs ${
                  chartView === "you-vs-squad"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">You vs Squad</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChartView("squad-total")}
                className={`h-8 px-2 sm:px-3 text-xs ${
                  chartView === "squad-total"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Squad Total</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChartView("all-members")}
                disabled={!canShowAllMembers}
                className={`h-8 px-2 sm:px-3 text-xs ${
                  chartView === "all-members"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : !canShowAllMembers
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {canShowAllMembers ? (
                  <Eye className="w-3.5 h-3.5 sm:mr-1.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">All Members</span>
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Real-Time Toggle (only for 1D period) */}
              {isRealTimeAvailable && (
                <Button
                  size="sm"
                  variant={realTimeEnabled ? "default" : "outline"}
                  className={
                    realTimeEnabled
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30"
                      : "border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  }
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                >
                  {realTimeEnabled ? (
                    <>
                      <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
                      <span className="flex items-center gap-1.5">
                        <span>LIVE</span>
                        {isFetching && (
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 mr-1.5" />
                      <span>Live</span>
                    </>
                  )}
                </Button>
              )}

              {/* Sync Button */}
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 hover:from-cyan-500/30 hover:to-blue-500/30"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1.5 ${
                    syncMutation.isPending ? "animate-spin" : ""
                  }`}
                />
                {syncMutation.isPending ? "Syncing..." : "Sync"}
              </Button>

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-slate-900 border-slate-700"
                >
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Export Squad Report
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <Lock className="w-4 h-4 mr-2" />
                    Privacy Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Full Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Privacy Notice (if applicable) */}
        {userPrivacyLevel === "hidden" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">
              Your performance is hidden from the squad.
            </span>
            <Button size="sm" variant="link" className="text-cyan-400 h-auto p-0 ml-auto">
              Change Privacy
            </Button>
          </div>
        )}

        {/* Chart Area */}
        <div className="relative rounded-xl overflow-hidden border border-slate-700/30 bg-slate-900/50">
          {/* Real-Time Indicator Overlay */}
          {realTimeEnabled && isRealTimeAvailable && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">LIVE</span>
              {isFetching && (
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              )}
            </div>
          )}

          {/* Chart */}
          <div className="px-4 pt-4 pb-4">
            <ResponsiveContainer width="100%" height={320}>
              {chartView === "you-vs-squad" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ComparisonTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-slate-300">{value}</span>
                    )}
                  />
                  {/* Your Line */}
                  <Line
                    type="monotone"
                    dataKey="you"
                    name="You"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#06b6d4",
                      stroke: "#0f172a",
                      strokeWidth: 2,
                    }}
                  />
                  {/* Squad Average Line */}
                  <Line
                    type="monotone"
                    dataKey="squadAvg"
                    name="Squad Average"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "#f59e0b",
                      stroke: "#0f172a",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              ) : chartView === "squad-total" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TotalTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Squad Total"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#colorTotal)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#8b5cf6",
                      stroke: "#0f172a",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                /* All Members View */
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<MembersTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-sm text-slate-300">{value}</span>
                    )}
                  />
                  {/* Dynamic lines for each visible member */}
                  {data?.members
                    .filter((m) => m.privacyLevel !== "hidden")
                    .map((member) => (
                      <Line
                        key={member.memberId}
                        type="monotone"
                        dataKey={member.memberName}
                        stroke={memberColors[member.memberName] || "#64748b"}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  {/* Your line (always on top if visible) */}
                  {userPrivacyLevel !== "hidden" && (
                    <Line
                      type="monotone"
                      dataKey="You"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "#06b6d4",
                        stroke: "#0f172a",
                        strokeWidth: 2,
                      }}
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Period Selector */}
          <div className="px-4 pb-3">
            <div className="inline-flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              {periods.map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  size="sm"
                  onClick={() => onPeriodChange(period)}
                  className={`h-7 px-3 text-xs ${
                    selectedPeriod === period
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  {period}
                  {period === "1D" && realTimeEnabled && (
                    <div className="ml-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Banner */}
        {outperformance >= 5 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 text-sm">
              You're crushing it! Outperforming the squad by{" "}
              <span className="font-semibold tabular-nums">
                +{outperformance.toFixed(1)}%
              </span>{" "}
              this{" "}
              {selectedPeriod === "1M"
                ? "month"
                : selectedPeriod === "1W"
                ? "week"
                : "period"}
              .
            </span>
          </div>
        )}

        {outperformance <= -5 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm">
                The squad is ahead by{" "}
                <span className="font-semibold tabular-nums text-amber-400">
                  {Math.abs(outperformance).toFixed(1)}%
                </span>
                . Check what they're trading!
              </span>
            </div>
            <Button
              size="sm"
              variant="link"
              className="text-cyan-400 h-auto p-0 flex-shrink-0"
            >
              View Squad Activity
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// Custom Tooltips
function ComparisonTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span
              className={`font-medium tabular-nums ${
                entry.value >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {entry.value >= 0 ? "+" : ""}
              {entry.value?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300 text-sm">Squad Total</span>
        <span className="text-white font-medium tabular-nums">
          ${payload[0].value?.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function MembersTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // Sort by performance descending
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {sorted.map((entry: any, i: number) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs w-4">{i + 1}.</span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className={
                  entry.name === "You" ? "text-cyan-400" : "text-slate-300"
                }
              >
                {entry.name}
              </span>
            </span>
            <span
              className={`font-medium tabular-nums text-sm ${
                entry.value >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {entry.value >= 0 ? "+" : ""}
              {entry.value?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
