"use client";

/**
 * Account Portfolios - Multi-brokerage account tracking and management
 * Like TeamPortfolios but for individual brokerage accounts (Robinhood, Fidelity, etc.)
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Building2, Crown, Target, BarChart3, TrendingUp, TrendingDown, DollarSign, Activity, Zap, Shield, AlertTriangle, Grid3x3, List, Plus, Search, Link2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { TimePeriod } from "@/lib/workspace-context";
import { usePortfolioAccounts, useSyncPortfolio } from "@/hooks/use-portfolio";

interface AccountPortfoliosProps {
  selectedPeriod: TimePeriod;
}

interface Position {
  symbol: string;
  shares: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
}

interface AccountDetails {
  buyingPower: number;
  cash: number;
  ytdPL: number;
  ytdPLPercent: number;
  dayTrades: string;
  accountType: string;
  marginAvailable: number;
  marginMaintenance: number;
  marginUsed: number;
  accountHealth: number;
  positions: Position[];
  lastSync: string;
  topHolding: string;
  diversificationScore: number;
  riskLevel: string;
}

interface BrokerageAccount {
  rank: number;
  broker: string;
  accountName: string;
  accountNumber: string;
  portfolioValue: number;
  change: number;
  changePercent: number;
  color: string;
  icon: string;
  isConnected: boolean;
  isPrimary?: boolean;
  details: AccountDetails;
}

export function AccountPortfolios({ selectedPeriod }: AccountPortfoliosProps) {
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("value");

  // ✅ Fetch real data with TanStack Query
  const { data, isLoading, error, refetch } = usePortfolioAccounts();
  const syncMutation = useSyncPortfolio();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("quick");
      // Data automatically refetches after sync!
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/40 p-6">
        <p className="text-slate-400">Loading accounts...</p>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/40 p-6">
        <div className="space-y-4">
          <p className="text-red-400">Error loading accounts: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Transform API data to match component's expected format
  const apiAccounts = data?.accounts || [];
  
  if (apiAccounts.length === 0) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/40 p-6">
        <p className="text-slate-400 mb-4">No accounts connected yet.</p>
        <Button onClick={() => window.location.href = "/start"}>
          Connect Your First Account
        </Button>
      </Card>
    );
  }

  // Helper function to mask account number for privacy
  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber === "****") return "****";
    // Show only last 4 digits: "****1234"
    const last4 = accountNumber.slice(-4);
    return `****${last4}`;
  };

  // Map API accounts to component format (keeping existing UI structure)
  const accounts: (BrokerageAccount & { id?: string })[] = apiAccounts.map((acc: typeof apiAccounts[0], index: number) => {
    // Calculate diversification score based on position distribution
    const positionValues = acc.positions.map((p: typeof acc.positions[0]) => p.marketValue);
    const totalPositionValue = positionValues.reduce((sum: number, val: number) => sum + val, 0);
    const concentrations = positionValues.map((val: number) => totalPositionValue > 0 ? val / totalPositionValue : 0);
    const maxConcentration = Math.max(...concentrations, 0);
    const diversificationScore = totalPositionValue > 0 ? Math.round((1 - maxConcentration) * 100) : 0;
    
    // Calculate account health (based on diversification and cash ratio)
    const cashRatio = acc.totalValue > 0 ? acc.totalCash / acc.totalValue : 0;
    const accountHealth = Math.round((diversificationScore * 0.6) + (Math.min(cashRatio, 0.3) * 100 * 0.4));
    
    // Determine risk level based on portfolio concentration
    let riskLevel = "Moderate";
    if (maxConcentration > 0.5) riskLevel = "Aggressive";
    else if (maxConcentration < 0.25 && diversificationScore > 70) riskLevel = "Conservative";
    
    return {
      id: acc.id, // Store API ID for expansion tracking
      rank: index + 1,
      broker: acc.broker,
      accountName: acc.accountName || acc.accountType || "Account",
      accountNumber: maskAccountNumber(acc.accountNumber || ""),
      portfolioValue: acc.totalValue,
      change: acc.dailyPL || 0, // ✨ Use daily P&L instead of total
      changePercent: acc.dailyPLPercent || 0, // ✨ Use daily P&L % instead of total
      color: acc.broker === "ROBINHOOD" ? "#00c805" : acc.broker === "FIDELITY" ? "#00754a" : "#00a651",
      icon: acc.broker === "ROBINHOOD" ? "🎯" : acc.broker === "FIDELITY" ? "🏦" : "⚡",
      isConnected: acc.status === "active",
      isPrimary: index === 0,
      details: {
        buyingPower: acc.buyingPower || 0,
        cash: acc.totalCash,
        ytdPL: acc.totalPL, // Keep total P&L for detailed view
        ytdPLPercent: acc.totalPLPercent, // Keep total P&L % for detailed view
        dayTrades: "0/3", // TODO: Add this to API
        accountType: acc.accountType || "Cash",
        marginAvailable: acc.marginAvailable || 0,
        marginMaintenance: acc.marginMaintenance || 0,
        marginUsed: acc.marginUsed || 0,
        accountHealth: accountHealth,
        lastSync: acc.lastSyncedAt ? `${Math.floor((Date.now() - new Date(acc.lastSyncedAt).getTime()) / 60000)}m ago` : "Never",
        topHolding: acc.positions[0]?.symbol || "N/A",
        diversificationScore: diversificationScore,
        riskLevel: riskLevel,
        positions: acc.positions.map((pos: typeof acc.positions[0]) => ({
          symbol: pos.symbol,
          shares: pos.quantity,
          currentPrice: pos.currentPrice,
          value: pos.marketValue,
          change: pos.unrealizedPL || 0,
          changePercent: pos.unrealizedPLPercent || 0,
        })),
      },
    };
  });

  // Old mock data removed - now using real data from API
  /*
  const accounts: BrokerageAccount[] = [
    {
      rank: 1,
      broker: "Robinhood",
      accountName: "Growth Portfolio",
      accountNumber: "****6789",
      portfolioValue: 52340.18,
      change: 1842.50,
      changePercent: 3.65,
      color: "#00c805",
      icon: "🎯",
      isConnected: true,
      isPrimary: true,
      details: {
        buyingPower: 8420.00,
        cash: 1842.17,
        ytdPL: 18240.18,
        ytdPLPercent: 53.5,
        dayTrades: "1/3",
        accountType: "Cash",
        marginAvailable: 0,
        marginMaintenance: 0,
        marginUsed: 0,
        accountHealth: 95,
        lastSync: "2m ago",
        topHolding: "NVDA",
        diversificationScore: 78,
        riskLevel: "Moderate",
        positions: [
          { symbol: "NVDA", shares: 15, value: 7429.50, change: 245.30, changePercent: 3.42 },
          { symbol: "MSFT", shares: 20, value: 7565.00, change: 145.20, changePercent: 1.96 },
          { symbol: "AAPL", shares: 30, value: 5683.50, change: -89.40, changePercent: -1.55 },
          { symbol: "TSLA", shares: 25, value: 6295.00, change: 372.10, changePercent: 6.29 },
        ],
      },
    },
    {
      rank: 2,
      broker: "Fidelity",
      accountName: "Retirement Account",
      accountNumber: "****3421",
      portfolioValue: 28650.75,
      change: -142.30,
      changePercent: -0.49,
      color: "#00754a",
      icon: "🏦",
      isConnected: true,
      details: {
        buyingPower: 3200.00,
        cash: 987.45,
        ytdPL: 8450.75,
        ytdPLPercent: 41.8,
        dayTrades: "0/3",
        accountType: "IRA",
        marginAvailable: 0,
        marginMaintenance: 0,
        marginUsed: 0,
        accountHealth: 88,
        lastSync: "5m ago",
        topHolding: "VOO",
        diversificationScore: 92,
        riskLevel: "Conservative",
        positions: [
          { symbol: "VOO", shares: 40, value: 16840.00, change: 215.60, changePercent: 1.30 },
          { symbol: "VTI", shares: 25, value: 5875.00, change: -45.20, changePercent: -0.76 },
          { symbol: "QQQ", shares: 15, value: 5935.75, change: 78.30, changePercent: 1.34 },
        ],
      },
    },
    {
      rank: 3,
      broker: "TD Ameritrade",
      accountName: "Active Trading",
      accountNumber: "****8892",
      portfolioValue: 18279.94,
      change: 924.12,
      changePercent: 5.33,
      color: "#00a651",
      icon: "⚡",
      isConnected: true,
      details: {
        buyingPower: 12450.00,
        cash: 2340.88,
        ytdPL: 5879.94,
        ytdPLPercent: 47.4,
        dayTrades: "2/3",
        accountType: "Margin",
        marginAvailable: 8250.00,
        marginMaintenance: 4200.00,
        marginUsed: 4200.00,
        accountHealth: 82,
        lastSync: "1m ago",
        topHolding: "SPY",
        diversificationScore: 65,
        riskLevel: "Aggressive",
        positions: [
          { symbol: "SPY", shares: 20, value: 8760.00, change: 420.00, changePercent: 5.03 },
          { symbol: "AMD", shares: 35, value: 4935.00, change: 245.70, changePercent: 5.24 },
          { symbol: "COIN", shares: 18, value: 4584.94, change: 258.42, changePercent: 5.97 },
        ],
      },
    },
  ];
  */

  const totalValue = accounts.reduce((sum: number, acc) => sum + acc.portfolioValue, 0);
  const totalChange = accounts.reduce((sum: number, acc) => sum + acc.change, 0);
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100;

  // Check if any accounts have no positions but have been synced (potential sync issue)
  const accountsWithErrors = accounts.filter(acc => 
    acc.details.positions.length === 0 && acc.details.lastSync !== "Never"
  );

  const filteredAccounts = accounts
    .filter((acc) => 
      acc.broker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "value") return b.portfolioValue - a.portfolioValue;
      if (sortBy === "performance") return b.changePercent - a.changePercent;
      if (sortBy === "broker") return a.broker.localeCompare(b.broker);
      return 0;
    });

  const getRiskColor = (level: string) => {
    if (level === "Conservative") return "text-green-400 bg-green-500/20 border-green-500/30";
    if (level === "Moderate") return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    return "text-orange-400 bg-orange-500/20 border-orange-500/30";
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" };
    if (score >= 75) return { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" };
    if (score >= 60) return { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" };
    return { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" };
  };

  return (
    <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white">Brokerage Accounts</h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                {accounts.filter(a => a.isConnected).length} Connected
              </Badge>
              {accountsWithErrors.length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  {accountsWithErrors.length} Need Attention
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <div>
                <span className="text-slate-400">Combined: </span>
                <span className="text-white font-mono font-semibold">${totalValue.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${totalChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalChangePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span className="font-semibold font-mono">
                  {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                </span>
                <span className="text-slate-500 font-normal">
                  ({totalChange >= 0 ? '+' : ''}${Math.abs(totalChange).toLocaleString('en-US', { maximumFractionDigits: 2 })})
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Connect Account</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-slate-700" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-slate-700" : ""}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {filteredAccounts.map((account) => {
            const accountId = (account as BrokerageAccount & { id?: string }).id || account.rank.toString();
            const isExpanded = expandedAccount === accountId;
            const healthColors = getHealthColor(account.details.accountHealth);

            return (
              <div
                key={account.rank}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden transition-all hover:border-slate-600"
              >
                {/* Account Summary Row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAccount(isExpanded ? null : accountId)}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Broker Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl shadow-lg"
                        style={{ backgroundColor: `${account.color}20`, border: `1px solid ${account.color}40` }}
                      >
                        {account.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white font-medium">{account.broker}</span>
                          {account.isPrimary && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-1.5 py-0">
                              Primary
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs px-1.5 py-0">
                            {account.accountNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 truncate">{account.accountName}</p>
                      </div>
                    </div>

                    {/* Center: Value & Performance */}
                    <div className="hidden sm:flex flex-col items-end justify-center">
                      <span className="text-white font-mono tabular-nums text-lg">
                        ${account.portfolioValue.toLocaleString()}
                      </span>
                      <div className={`flex items-center gap-1.5 ${account.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {account.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span className="font-semibold font-mono tabular-nums text-sm">
                          {account.changePercent >= 0 ? '+' : ''}{account.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Right: Quick Stats */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${healthColors.bg} ${healthColors.border} ${healthColors.text}`}>
                        <Activity className="w-3 h-3" />
                        <span>{account.details.accountHealth}</span>
                      </div>
                      <Badge className={getRiskColor(account.details.riskLevel)}>
                        {account.details.riskLevel}
                      </Badge>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Mobile: Expand Icon */}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform md:hidden ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Mobile: Value & Performance */}
                  <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-white font-mono text-base">
                      ${account.portfolioValue.toLocaleString()}
                    </span>
                    <div className={`flex items-center gap-1.5 ${account.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {account.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-semibold font-mono text-base">
                        {account.changePercent >= 0 ? '+' : ''}{account.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 bg-slate-900/50 p-4 space-y-6">
                    {/* Performance Summary Banner */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Total Value</p>
                          <p className="text-lg font-mono text-white">${account.portfolioValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Today's Change</p>
                          <div className={account.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            <p className="text-lg font-mono font-semibold">
                              {account.changePercent >= 0 ? '+' : ''}{account.changePercent.toFixed(2)}%
                            </p>
                            <p className="text-xs opacity-75">
                              {account.change >= 0 ? '+' : ''}${Math.abs(account.change).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Total P&L</p>
                          <div className={account.details.ytdPL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            <p className="text-lg font-mono font-semibold">
                              {account.details.ytdPLPercent >= 0 ? '+' : ''}{account.details.ytdPLPercent.toFixed(2)}%
                            </p>
                            <p className="text-xs opacity-75">
                              {account.details.ytdPL >= 0 ? '+' : ''}${Math.abs(account.details.ytdPL).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Positions</p>
                          <p className="text-lg font-mono text-white">{account.details.positions.length}</p>
                          <p className="text-xs text-cyan-400">{account.details.topHolding} leading</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Buying Power</p>
                        <p className="text-white font-mono">${account.details.buyingPower.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Cash</p>
                        <p className="text-white font-mono">${account.details.cash.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Account Type</p>
                        <p className="text-white">{account.details.accountType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Last Updated</p>
                        <p className="text-white">{account.details.lastSync}</p>
                      </div>
                    </div>

                    {/* Margin Information */}
                    {(account.details.marginAvailable > 0 || account.details.marginUsed > 0 || account.details.marginMaintenance > 0) && (
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <h4 className="text-sm font-semibold text-slate-300">Margin Account Details</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {account.details.marginAvailable > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Available</p>
                              <p className="text-cyan-400 font-mono font-semibold tabular-nums">
                                ${account.details.marginAvailable.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {account.details.marginUsed > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Used</p>
                              <p className="text-slate-300 font-mono tabular-nums">
                                ${account.details.marginUsed.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {account.details.marginMaintenance > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Maintenance Req.</p>
                              <p className="text-slate-300 font-mono tabular-nums">
                                ${account.details.marginMaintenance.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sync Error Warning */}
                    {account.details.positions.length === 0 && account.details.lastSync !== "Never" && (
                      <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-400 mb-1">No Positions Found</p>
                            <p className="text-xs text-slate-400 mb-2">
                              This account has a balance but no positions were synced. This could mean:
                            </p>
                            <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 mb-2">
                              <li>Positions are all cash (no stocks held)</li>
                              <li>Sync encountered an error fetching positions</li>
                              <li>SnapTrade API returned positions in an unexpected format</li>
                            </ul>
                            <p className="text-xs text-slate-500 mt-2">
                              Automatic sync runs daily. If this persists, try manually syncing from the main chart.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Health & Diversification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Account Health</span>
                          <span className={healthColors.text}>{account.details.accountHealth}/100</span>
                        </div>
                        <Progress value={account.details.accountHealth} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Diversification</span>
                          <span className="text-cyan-400">{account.details.diversificationScore}/100</span>
                        </div>
                        <Progress value={account.details.diversificationScore} className="h-2" />
                      </div>
                    </div>

                    {/* Sector Breakdown (Mini Chart) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm text-slate-300">Sector Allocation</h4>
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          {account.broker}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {account.broker === "Robinhood" && (
                          <>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Technology</span>
                                <span className="text-white font-mono">72%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '72%' }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Automotive</span>
                                <span className="text-white font-mono">18%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" style={{ width: '18%' }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Other</span>
                                <span className="text-white font-mono">10%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '10%' }} />
                              </div>
                            </div>
                          </>
                        )}
                        {account.broker === "Fidelity" && (
                          <>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Index Funds</span>
                                <span className="text-white font-mono">85%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '85%' }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">E-commerce</span>
                                <span className="text-white font-mono">15%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: '15%' }} />
                              </div>
                            </div>
                          </>
                        )}
                        {account.broker === "TD Ameritrade" && (
                          <>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Index Funds</span>
                                <span className="text-white font-mono">55%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '55%' }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Technology</span>
                                <span className="text-white font-mono">30%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '30%' }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Crypto</span>
                                <span className="text-white font-mono">15%</span>
                              </div>
                              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '15%' }} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Position Analysis */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-semibold text-slate-300">Holdings ({account.details.positions.length})</h4>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                          Updated {account.details.lastSync}
                        </Badge>
                      </div>
                      
                      {account.details.positions.length > 0 ? (
                        /* Positions Table */
                        <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-slate-800/50">
                              <tr>
                                <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Position</th>
                                <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Qty</th>
                                <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Price</th>
                                <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Value</th>
                                <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">P&L</th>
                                <th className="text-right p-3 text-xs font-semibold text-slate-400 uppercase">Return</th>
                              </tr>
                            </thead>
                            <tbody>
                              {account.details.positions.map((position, idx) => (
                                <tr 
                                  key={position.symbol} 
                                  className={`border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors ${idx === 0 ? 'bg-cyan-500/5' : ''}`}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                                        <span className="text-xs font-bold text-cyan-400">{position.symbol.substring(0, 2)}</span>
                                      </div>
                                      <div>
                                        <p className="font-mono font-semibold text-slate-200 text-sm">{position.symbol}</p>
                                        {idx === 0 && <p className="text-xs text-cyan-400">Top holding</p>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="font-mono text-slate-300 text-sm">{position.shares.toLocaleString()}</span>
                                  </td>
                                  <td className="p-3 text-right hidden lg:table-cell">
                                    <span className="font-mono text-cyan-400 text-sm tabular-nums">
                                      ${position.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right hidden sm:table-cell">
                                    <span className="font-mono text-white font-semibold text-sm">${position.value.toLocaleString()}</span>
                                  </td>
                                  <td className="p-3 text-right hidden md:table-cell">
                                    <span className={`font-mono text-sm ${position.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {position.change >= 0 ? '+' : ''}${Math.abs(position.change).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${position.changePercent >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                      {position.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      <span className="font-mono text-xs font-semibold">
                                        {position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(2)}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border border-slate-700/50 rounded-lg p-6 text-center">
                          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">No positions in this account</p>
                        </div>
                      )}
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-3.5 h-3.5 text-cyan-400" />
                          <p className="text-xs text-slate-400">Best Performer</p>
                        </div>
                        <p className="font-mono text-white">{account.details.topHolding}</p>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-3.5 h-3.5 text-purple-400" />
                          <p className="text-xs text-slate-400">Risk Level</p>
                        </div>
                        <p className={`text-sm ${
                          account.details.riskLevel === 'Conservative' ? 'text-green-400' :
                          account.details.riskLevel === 'Moderate' ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>{account.details.riskLevel}</p>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <p className="text-xs text-slate-400">Account Type</p>
                        </div>
                        <p className="text-sm text-white">{account.details.accountType}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                      <Button size="sm" variant="outline" className="flex-1 border-slate-600 hover:bg-slate-700">
                        <Link2 className="w-3 h-3 mr-1.5" />
                        Reconnect
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-slate-600 hover:bg-slate-700">
                        <BarChart3 className="w-3 h-3 mr-1.5" />
                        View Details
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

