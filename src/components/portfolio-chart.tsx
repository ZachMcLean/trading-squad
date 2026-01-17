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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
} from "recharts";
import { 
  TrendingDown, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  MoreVertical, 
  Download, 
  Link2, 
  Flag, 
  BarChart3, 
  Activity,
  Radio,
  Wifi,
  WifiOff
} from "lucide-react";
import { useWorkspaceContext } from "@/lib/use-workspace-context";
import { usePortfolioHistory, usePortfolioSummary, useSyncPortfolio } from "@/hooks/use-portfolio";

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

interface PortfolioChartProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  mode?: "solo" | "squad"; // Optional prop to override context detection
}

export function PortfolioChart({ selectedPeriod, onPeriodChange, mode }: PortfolioChartProps) {
  const { currentContext } = useWorkspaceContext();
  const isSoloMode = mode === "solo" || (mode === undefined && currentContext.type === "solo");
  
  const periods: TimePeriod[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD"];
  
  // Real-time mode state (only available for 1D period)
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(false);
  const isRealTimeAvailable = selectedPeriod === "1D";
  
  // Auto-disable real-time when switching away from 1D
  useEffect(() => {
    if (selectedPeriod !== "1D" && realTimeEnabled) {
      setRealTimeEnabled(false);
    }
  }, [selectedPeriod, realTimeEnabled]);
  
  // Fetch real data from API
  const { data: historyData, isLoading: historyLoading, error: historyError, isFetching: historyFetching } = usePortfolioHistory(selectedPeriod, undefined, realTimeEnabled && isRealTimeAvailable);
  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching } = usePortfolioSummary(realTimeEnabled && isRealTimeAvailable);
  const syncMutation = useSyncPortfolio();
  
  // Calculate last sync time from summary data
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  useEffect(() => {
    if (summaryData?.lastSyncedAt) {
      const syncDate = new Date(summaryData.lastSyncedAt);
      const minutesAgo = Math.floor((Date.now() - syncDate.getTime()) / 60000);
      setLastSyncTime(minutesAgo);
    }
  }, [summaryData]);
  
  // Handle sync
  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("quick");
      setLastSyncTime(0);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };
  
  // Transform API data to chart format
  const formatChartData = () => {
    if (!historyData?.history || historyData.history.length === 0) {
      return [];
    }

    const history = historyData.history;
    const chartData = [];
    
    // Get the account connection date or use a reasonable starting point
    const firstSnapshotDate = new Date(history[0]?.date);
    const currentDate = new Date();
    
    // Calculate the start date based on selected period
    let periodStartDate = new Date();
    switch (selectedPeriod) {
      case "1D": periodStartDate.setDate(currentDate.getDate() - 1); break;
      case "1W": periodStartDate.setDate(currentDate.getDate() - 7); break;
      case "1M": periodStartDate.setMonth(currentDate.getMonth() - 1); break;
      case "3M": periodStartDate.setMonth(currentDate.getMonth() - 3); break;
      case "6M": periodStartDate.setMonth(currentDate.getMonth() - 6); break;
      case "1Y": periodStartDate.setFullYear(currentDate.getFullYear() - 1); break;
      case "YTD": periodStartDate = new Date(currentDate.getFullYear(), 0, 1); break;
    }
    
    // If we only have one snapshot, add a baseline starting point
    if (history.length === 1) {
      const startDate = firstSnapshotDate > periodStartDate ? periodStartDate : new Date(firstSnapshotDate.getTime() - 24 * 60 * 60 * 1000);
      const startLabel = selectedPeriod === "1D" 
        ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      // Add baseline starting point at $0
      chartData.push({
        date: startLabel,
        combined: 0,
        combinedPercent: 0,
        rawDate: startDate.toISOString(),
      });
    }
    
    // Add all actual snapshots
    const baseValue = history[0]?.value || 0;
    
    history.forEach((point, index) => {
      const date = new Date(point.date);
      let label = "";
      
      // Format label based on period
      if (selectedPeriod === "1D") {
        label = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      } else if (selectedPeriod === "1W") {
        label = date.toLocaleDateString("en-US", { weekday: "short" });
      } else if (selectedPeriod === "1M" || selectedPeriod === "3M" || selectedPeriod === "6M" || selectedPeriod === "YTD") {
        // Show fewer labels for longer periods
        const totalPoints = history.length;
        const showLabel = index % Math.max(1, Math.floor(totalPoints / 6)) === 0 || index === totalPoints - 1;
        label = showLabel ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      } else {
        // 1Y
        const totalPoints = history.length;
        const showLabel = index % Math.max(1, Math.floor(totalPoints / 12)) === 0 || index === totalPoints - 1;
        label = showLabel ? date.toLocaleDateString("en-US", { month: "short" }) : "";
      }
      
      const percentChange = baseValue > 0 ? ((point.value - baseValue) / baseValue) * 100 : 0;
      
      chartData.push({
        date: label,
        combined: Math.round(point.value),
        combinedPercent: parseFloat(percentChange.toFixed(2)),
        rawDate: point.date,
      });
    });
    
    return chartData;
  };

  const data = formatChartData();
  
  // Calculate current value and metrics from real data
  const currentValue = summaryData?.totalValue || (data.length > 0 ? data[data.length - 1].combined : 0);
  const goal = isSoloMode ? 200000 : 500000;
  const goalProgress = currentValue > 0 ? (currentValue / goal) * 100 : 0;
  
  // Calculate portfolio return for selected period from real data
  const portfolioReturn = data.length > 0 ? data[data.length - 1].combinedPercent : 0;
  
  // S&P500 returns by period (mock data - would need external API for real data)
  const sp500Returns: { [key in TimePeriod]: number } = {
    "1D": 0.15,
    "1W": 1.2,
    "1M": 2.8,
    "3M": 6.4,
    "6M": 12.4,
    "1Y": 18.9,
    "YTD": 10.2,
  };
  
  const sp500Return = sp500Returns[selectedPeriod];
  const vsSP500 = portfolioReturn - sp500Return;
  const healthScore = 92; // TODO: Calculate from real risk metrics
  
  // Calculate today's change from summary data
  const todayChangePercent = summaryData?.totalPLPercent || 0;
  const nextMilestone = 250000;
  const toMilestone = Math.max(0, nextMilestone - currentValue);
  
  // Calculate health score color and label
  const getHealthInfo = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" };
    if (score >= 75) return { label: "Good", color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" };
    if (score >= 60) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" };
    return { label: "Needs Attention", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" };
  };
  
  const healthInfo = getHealthInfo(healthScore);
  
  const formatSyncTime = (minutes: number) => {
    if (minutes === 0) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentChange = payload[0].payload.combinedPercent;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-xs mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 text-sm">Value</span>
              <span className="text-white font-medium tabular-nums">
                ${value.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300 text-sm">Change</span>
              <span className={`font-medium tabular-nums text-sm ${percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (historyLoading || summaryLoading) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-400">Loading portfolio data...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show error state
  if (historyError) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <div className="text-red-400 text-sm">
                Error loading chart data: {historyError.message}
              </div>
              <Button onClick={handleSync} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400">No portfolio history available yet</p>
              <p className="text-slate-500 text-sm">Sync your accounts to start tracking performance</p>
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
        {/* Enhanced Header with Portfolio Value, Stats, and Actions */}
        <div className="flex flex-col gap-4">
          {/* Top Row: Portfolio Value + Actions */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-white text-2xl sm:text-3xl tabular-nums">
                  ${currentValue.toLocaleString("en-US")}
                </span>
                <span className="text-slate-400 text-xs sm:text-sm">/ ${(goal / 1000).toFixed(0)}K Goal</span>
              </div>
              
              {/* Stats Row 1: Performance Metrics */}
              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                {/* Period Return - Most Important Metric */}
                <div className={`flex items-center gap-1.5 ${portfolioReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {portfolioReturn >= 0 ? (
                    <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="font-semibold tabular-nums">
                    {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                  </span>
                  <span className="text-slate-400 font-normal">({selectedPeriod})</span>
                </div>
                
                <span className="text-slate-600">•</span>
                
                {/* Today's Change */}
                <div className={`flex items-center gap-1.5 ${todayChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="text-slate-400">Today:</span>
                  <span className="tabular-nums">
                    {todayChangePercent >= 0 ? '+' : ''}{todayChangePercent.toFixed(2)}%
                  </span>
                </div>
                
                <span className="text-slate-600 hidden md:inline">•</span>
                
                {/* vs S&P500 */}
                <div className={`hidden md:flex items-center gap-1.5 ${vsSP500 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-slate-400">vs S&P:</span>
                  <span className="tabular-nums">
                    {vsSP500 >= 0 ? '+' : ''}{vsSP500.toFixed(1)}%
                  </span>
                </div>
                
                <span className="text-slate-600 hidden md:inline">•</span>
                
                {/* Status */}
                <span className="hidden md:inline text-slate-400">
                  {summaryData?.accountCount || 0} {summaryData?.accountCount === 1 ? 'account' : 'accounts'}
                </span>
              </div>
              
              {/* Stats Row 2: Milestone Progress */}
              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    <span className="text-purple-400 tabular-nums">${(toMilestone / 1000).toFixed(1)}K</span>
                    <span className="text-slate-400"> to </span>
                    <span className="text-white tabular-nums">${(nextMilestone / 1000).toFixed(0)}K</span>
                  </span>
                </div>
                
                <span className="text-slate-600 hidden sm:inline">•</span>
                
                <span className="text-xs text-purple-400 hidden sm:inline">Unlock "Quarter Mil Club" 💎</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Health Score Badge */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${healthInfo.bg} ${healthInfo.border}`}>
                <Activity className={`w-3.5 h-3.5 ${healthInfo.color}`} />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Health:</span>
                  <span className={`text-xs font-medium ${healthInfo.color}`}>{healthScore}/100</span>
                  <span className={`text-xs ${healthInfo.color}`}>({healthInfo.label})</span>
                </div>
              </div>
              
              {/* Real-Time Toggle (only for 1D period) */}
              {isRealTimeAvailable && (
                <Button
                  size="sm"
                  variant={realTimeEnabled ? "default" : "outline"}
                  className={realTimeEnabled 
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
                        {(historyFetching || summaryFetching) && (
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
              
              {/* Last Sync Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className={`w-1.5 h-1.5 rounded-full ${lastSyncTime < 5 ? 'bg-emerald-500' : lastSyncTime < 15 ? 'bg-yellow-500' : 'bg-slate-500'} ${lastSyncTime < 5 ? 'animate-pulse' : ''}`}></div>
                <span className="text-xs text-slate-400">Last updated:</span>
                <span className="text-xs text-slate-300">{formatSyncTime(lastSyncTime)}</span>
              </div>
              
              {/* Sync Button */}
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 hover:from-cyan-500/30 hover:to-blue-500/30 shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Syncing...' : 'Sync'}
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
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect Broker
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <Flag className="w-4 h-4 mr-2" />
                    Set New Milestone
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Compare Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Chart Info - Period Performance Summary */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Period Return:</span>
              <span className={`font-semibold tabular-nums ${portfolioReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-400">S&P 500:</span>
              <span className={`tabular-nums ${sp500Return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sp500Return >= 0 ? '+' : ''}{sp500Return.toFixed(2)}%
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-slate-400">Outperformance:</span>
              <span className={`font-medium tabular-nums ${vsSP500 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {vsSP500 >= 0 ? '+' : ''}{vsSP500.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart with enhanced features */}
        <div className="relative rounded-xl overflow-hidden border border-slate-700/30 bg-slate-900/50">
          {/* Real-Time Indicator Overlay */}
          {realTimeEnabled && isRealTimeAvailable && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">LIVE</span>
              {(historyFetching || summaryFetching) && (
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
          
          {/* Chart */}
          <div className="px-4 pt-4 pb-4">
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCombined" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="combined"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#colorCombined)"
                  dot={false}
                  activeDot={{ r: 6, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Period Selector - Bottom Left */}
          <div className="px-4 pb-3">
            <div className="inline-flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              {periods.map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  size="sm"
                  onClick={() => onPeriodChange(period)}
                  className={`h-7 px-3 text-xs transition-all ${
                    selectedPeriod === period
                      ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
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
      </div>
    </Card>
  );
}