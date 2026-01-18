"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Trophy, Crown, Target, BarChart3, TrendingUp, Flame, MessageSquare, Swords, Award, DollarSign, Activity, Zap, Shield, Brain, Grid3x3, List, UserPlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

interface TeamPortfoliosProps {
  selectedPeriod: TimePeriod;
  workspaceName?: string;
}

interface Position {
  symbol: string;
  shares: number;
  value: number;
  change: number;
  changePercent: number;
}

interface MemberDetails {
  buyingPower: number;
  cash: number;
  ytdPL: number;
  ytdPLPercent: number;
  dayTrades: string;
  winRate: number;
  totalTrades: number;
  currentStreak: number;
  bestStreak: number;
  wlRecord: { wins: number; losses: number };
  teamContribution: number;
  tradingStyle: string[];
  positions: Position[];
  marginAvailable: number;
  marginMaintenance: number;
  marginUsed: number;
  achievements: string[];
  strengthArea: string;
  improvementTrend: string;
}

interface Member {
  rank: number;
  name: string;
  username: string;
  quote: string;
  portfolioValue: number;
  change: number;
  changePercent: number;
  avatar: string;
  badges: string[];
  isOnline: boolean;
  isMVP?: boolean;
  details: MemberDetails;
}

export function TeamPortfolios({ selectedPeriod, workspaceName = "Team Omega" }: TeamPortfoliosProps) {
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("performance");

  const members: Member[] = [
    {
      rank: 1,
      name: "Mike",
      username: "MoonShotKing",
      quote: "To the moon or bust 🚀",
      portfolioValue: 92450.33,
      change: 3240.12,
      changePercent: 3.63,
      avatar: "from-orange-500 to-red-500",
      badges: ["👑 King", "🚀 Moonshot", "🎯 Sniper"],
      isOnline: true,
      isMVP: true,
      details: {
        buyingPower: 12500.00,
        cash: 3240.17,
        ytdPL: 28400.30,
        ytdPLPercent: 44.3,
        dayTrades: "2/3",
        winRate: 68.2,
        totalTrades: 156,
        currentStreak: 5,
        bestStreak: 9,
        wlRecord: { wins: 8, losses: 0 },
        teamContribution: 38,
        tradingStyle: ["Momentum", "Breakouts", "Tech"],
        positions: [
          { symbol: "NVDA", shares: 50, value: 22000, change: 450, changePercent: 2.09 },
          { symbol: "TSLA", shares: 40, value: 18450, change: 820, changePercent: 4.65 },
        ],
        marginAvailable: 50000,
        marginMaintenance: 20000,
        marginUsed: 30000,
        achievements: ["🔥 9-Day Win Streak", "💰 Biggest Gainer", "🎯 Highest Win Rate"],
        strengthArea: "Momentum Trading",
        improvementTrend: "+12.4% vs last month",
      },
    },
    {
      rank: 2,
      name: "Zach",
      username: "FlippinPsycho98",
      quote: "Learning and growing every day",
      portfolioValue: 75269.87,
      change: 1891.24,
      changePercent: 2.58,
      avatar: "from-emerald-500 to-green-500",
      badges: ["🔥 Hot Streak", "💎 Diamond Hands"],
      isOnline: true,
      details: {
        buyingPower: 8500.00,
        cash: 2100.00,
        ytdPL: 28400.30,
        ytdPLPercent: 60.5,
        dayTrades: "2/3",
        winRate: 58.4,
        totalTrades: 89,
        currentStreak: 3,
        bestStreak: 5,
        wlRecord: { wins: 5, losses: 3 },
        teamContribution: 31,
        tradingStyle: ["Growth", "Options", "Crypto"],
        positions: [
          { symbol: "AAPL", shares: 100, value: 18000, change: -450, changePercent: -2.44 },
          { symbol: "BTC", shares: 0.5, value: 22000, change: -440.25, changePercent: -1.96 },
        ],
        marginAvailable: 50000,
        marginMaintenance: 20000,
        marginUsed: 30000,
        achievements: ["📚 Fastest Learner", "💪 Most Improved", "🎓 Best Student"],
        strengthArea: "Fastest Learner",
        improvementTrend: "+45% win rate improvement",
      },
    },
    {
      rank: 3,
      name: "JAMB",
      username: "ChartMaster420",
      quote: "Slow and steady wins the race",
      portfolioValue: 43200.50,
      change: -890.25,
      changePercent: -2.02,
      avatar: "from-blue-500 to-cyan-500",
      badges: ["📊 Analyst", "🛡️ Shield"],
      isOnline: true,
      details: {
        buyingPower: 8500.00,
        cash: 2100.00,
        ytdPL: 28400.30,
        ytdPLPercent: 192.5,
        dayTrades: "2/3",
        winRate: 58.4,
        totalTrades: 89,
        currentStreak: 0,
        bestStreak: 5,
        wlRecord: { wins: 4, losses: 4 },
        teamContribution: 18,
        tradingStyle: ["Value", "Dividends", "Conservative"],
        positions: [
          { symbol: "AAPL", shares: 100, value: 18000, change: -450, changePercent: -2.44 },
          { symbol: "BTC", shares: 0.5, value: 22000, change: -440.25, changePercent: -1.96 },
        ],
        marginAvailable: 50000,
        marginMaintenance: 20000,
        marginUsed: 30000,
        achievements: ["🛡️ Best Risk Manager", "🧠 Top Researcher", "📈 Most Consistent"],
        strengthArea: "Risk Management",
        improvementTrend: "Lower volatility by 24%",
      },
    },
    {
      rank: 4,
      name: "Sarah",
      username: "TechQueenGG",
      quote: "Tech stocks are the future",
      portfolioValue: 38450.20,
      change: 542.80,
      changePercent: 1.43,
      avatar: "from-purple-500 to-pink-500",
      badges: ["💻 Tech Guru", "📱 Early Adopter"],
      isOnline: false,
      details: {
        buyingPower: 6200.00,
        cash: 1800.00,
        ytdPL: 15200.50,
        ytdPLPercent: 65.4,
        dayTrades: "1/3",
        winRate: 62.1,
        totalTrades: 124,
        currentStreak: 2,
        bestStreak: 7,
        wlRecord: { wins: 6, losses: 2 },
        teamContribution: 8,
        tradingStyle: ["Tech", "Growth", "FAANG"],
        positions: [
          { symbol: "GOOGL", shares: 20, value: 15000, change: 300, changePercent: 2.04 },
          { symbol: "META", shares: 25, value: 12200, change: 150, changePercent: 1.24 },
        ],
        marginAvailable: 35000,
        marginMaintenance: 15000,
        marginUsed: 20000,
        achievements: ["💻 Tech Specialist", "🎯 Target Hitter", "📊 Data Driven"],
        strengthArea: "Tech Analysis",
        improvementTrend: "+8% monthly average",
      },
    },
    {
      rank: 5,
      name: "Alex",
      username: "DayTradeDemon",
      quote: "Day trading is an art form",
      portfolioValue: 29800.75,
      change: -324.15,
      changePercent: -1.08,
      avatar: "from-red-500 to-orange-500",
      badges: ["⚡ Speed Trader", "🎯 Precision"],
      isOnline: true,
      details: {
        buyingPower: 4500.00,
        cash: 980.00,
        ytdPL: 9800.25,
        ytdPLPercent: 48.9,
        dayTrades: "3/3",
        winRate: 54.2,
        totalTrades: 287,
        currentStreak: 0,
        bestStreak: 4,
        wlRecord: { wins: 3, losses: 5 },
        teamContribution: 5,
        tradingStyle: ["Day Trading", "Scalping", "Momentum"],
        positions: [
          { symbol: "SPY", shares: 15, value: 8500, change: -120, changePercent: -1.39 },
          { symbol: "QQQ", shares: 30, value: 9800, change: -180, changePercent: -1.80 },
        ],
        marginAvailable: 25000,
        marginMaintenance: 12000,
        marginUsed: 13000,
        achievements: ["⚡ Fastest Execution", "🔄 Most Active", "💨 Quick Reflexes"],
        strengthArea: "Day Trading",
        improvementTrend: "Improving discipline",
      },
    },
    {
      rank: 6,
      name: "Jordan",
      username: "DiviKingdom",
      quote: "Patience pays dividends",
      portfolioValue: 24680.40,
      change: 189.60,
      changePercent: 0.77,
      avatar: "from-indigo-500 to-blue-500",
      badges: ["📈 Dividend King", "🏦 Value Hunter"],
      isOnline: false,
      details: {
        buyingPower: 3800.00,
        cash: 1240.00,
        ytdPL: 6240.80,
        ytdPLPercent: 33.8,
        dayTrades: "0/3",
        winRate: 71.5,
        totalTrades: 47,
        currentStreak: 4,
        bestStreak: 8,
        wlRecord: { wins: 7, losses: 1 },
        teamContribution: 4,
        tradingStyle: ["Dividends", "Value", "Long-term"],
        positions: [
          { symbol: "JNJ", shares: 50, value: 7800, change: 90, changePercent: 1.17 },
          { symbol: "PG", shares: 40, value: 6200, change: 75, changePercent: 1.22 },
        ],
        marginAvailable: 15000,
        marginMaintenance: 8000,
        marginUsed: 7000,
        achievements: ["🏆 Highest Consistency", "💰 Dividend Master", "🎯 Best Long-term"],
        strengthArea: "Value Investing",
        improvementTrend: "Steady 7% annual",
      },
    },
    {
      rank: 7,
      name: "Chris",
      username: "CryptoMoonBoi",
      quote: "Crypto to the moon! 🌙",
      portfolioValue: 18920.15,
      change: 1242.35,
      changePercent: 7.02,
      avatar: "from-yellow-500 to-amber-500",
      badges: ["₿ Crypto Bull", "🚀 HODL Gang"],
      isOnline: true,
      details: {
        buyingPower: 2100.00,
        cash: 450.00,
        ytdPL: 8920.15,
        ytdPLPercent: 89.2,
        dayTrades: "1/3",
        winRate: 45.8,
        totalTrades: 156,
        currentStreak: 6,
        bestStreak: 6,
        wlRecord: { wins: 5, losses: 3 },
        teamContribution: 2,
        tradingStyle: ["Crypto", "DeFi", "High Risk"],
        positions: [
          { symbol: "BTC", shares: 0.25, value: 11000, change: 800, changePercent: 7.84 },
          { symbol: "ETH", shares: 2, value: 5200, change: 350, changePercent: 7.23 },
        ],
        marginAvailable: 10000,
        marginMaintenance: 5000,
        marginUsed: 5000,
        achievements: ["🎢 Risk Taker", "💎 Diamond Hands", "🌙 Moon Shot"],
        strengthArea: "Crypto Trading",
        improvementTrend: "Volatile but strong YTD",
      },
    },
    {
      rank: 8,
      name: "Taylor",
      username: "ThetaGangPro",
      quote: "Options are my playground",
      portfolioValue: 15340.90,
      change: -89.40,
      changePercent: -0.58,
      avatar: "from-teal-500 to-cyan-500",
      badges: ["📊 Options Pro", "🎲 Theta Gang"],
      isOnline: false,
      details: {
        buyingPower: 1800.00,
        cash: 320.00,
        ytdPL: 4340.90,
        ytdPLPercent: 39.5,
        dayTrades: "2/3",
        winRate: 59.2,
        totalTrades: 201,
        currentStreak: 0,
        bestStreak: 3,
        wlRecord: { wins: 4, losses: 4 },
        teamContribution: 1,
        tradingStyle: ["Options", "Spreads", "Theta"],
        positions: [
          { symbol: "SPX", shares: 1, value: 8200, change: -45, changePercent: -0.55 },
          { symbol: "AAPL", shares: 20, value: 3600, change: -30, changePercent: -0.83 },
        ],
        marginAvailable: 8000,
        marginMaintenance: 4000,
        marginUsed: 4000,
        achievements: ["🎯 Best Options Trader", "📐 Strategy Master", "⚖️ Balanced Risk"],
        strengthArea: "Options Strategy",
        improvementTrend: "Refining theta plays",
      },
    },
  ];

  // Calculate period-specific data based on selectedPeriod
  const getPeriodLabel = (period: TimePeriod) => {
    const labels: { [key in TimePeriod]: string } = {
      "1D": "Today",
      "1W": "This Week",
      "1M": "This Month",
      "3M": "3 Months",
      "6M": "6 Months",
      "1Y": "This Year",
      "YTD": "Year to Date",
    };
    return labels[period];
  };

  const toggleExpand = (rank: number) => {
    setExpandedMember(expandedMember === rank ? null : rank);
  };

  return (
    <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden h-full">
        <div className="p-4 sm:p-6 border-b border-slate-700/50">
          {/* Top Row: Title and Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white">{workspaceName}</h3>
                <p className="text-slate-400 text-sm">Real-time performance tracking</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 border-slate-600">
                  8 Members
                </Badge>
                {/* Live Activity Indicator */}
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                  5 online
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/50 transition-all hidden sm:flex"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/15 hover:text-yellow-300 hover:border-yellow-500/50 transition-all hidden sm:flex"
              >
                <Target className="w-4 h-4 mr-2" />
                Set Challenge
              </Button>
            </div>
          </div>

          {/* Bottom Row: Search, Sort, and View Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="performance" className="text-slate-300 focus:text-white focus:bg-slate-800">
                    Performance
                  </SelectItem>
                  <SelectItem value="name" className="text-slate-300 focus:text-white focus:bg-slate-800">
                    Name
                  </SelectItem>
                  <SelectItem value="activity" className="text-slate-300 focus:text-white focus:bg-slate-800">
                    Activity
                  </SelectItem>
                  <SelectItem value="joinDate" className="text-slate-300 focus:text-white focus:bg-slate-800">
                    Join Date
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`px-3 ${
                  viewMode === "grid"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`px-3 ${
                  viewMode === "list"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {members.map((member) => {
            const isPositive = member.changePercent >= 0;
            const isYou = member.username === "FlippinPsycho98"; // Check by username instead
            const isExpanded = expandedMember === member.rank;
            const hasWinStreak = member.details.currentStreak > 0;

            // Get rank overlay for avatar - consolidated all ranks here
            const getRankOverlay = () => {
              if (member.rank === 1) {
                return (
                  <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-slate-900 shadow-lg shadow-yellow-500/30">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                );
              } else if (member.rank === 2) {
                return (
                  <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 rounded-full border-2 border-slate-900 shadow-lg">
                    <Trophy className="w-3 h-3 text-slate-700" />
                  </div>
                );
              } else if (member.rank === 3) {
                return (
                  <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-700 rounded-full border-2 border-slate-900 shadow-lg">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                );
              } else {
                // Ranks 4-8 get a simple number badge
                return (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-slate-700 rounded-full border-2 border-slate-900">
                    <span className="text-xs text-slate-300">#{member.rank}</span>
                  </div>
                );
              }
            };
            
            return (
              <div
                key={member.rank}
                className={`group relative hover:bg-slate-700/20 transition-all duration-300 ${
                  isYou ? "bg-gradient-to-r from-emerald-500/5 to-transparent" : ""
                } ${isExpanded ? "bg-slate-800/40" : ""}`}
              >
                {/* Accent Border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isYou ? "bg-gradient-to-b from-emerald-500 to-emerald-600" : `bg-gradient-to-br ${member.avatar}`} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                
                {/* Collapsed View */}
                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Avatar Section */}
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-br ${member.avatar} blur-md opacity-30 rounded-full group-hover:opacity-50 transition-opacity`}></div>
                      <Avatar className="relative w-14 h-14 sm:w-16 sm:h-16 border-2 border-slate-700 shadow-xl group-hover:scale-105 transition-transform">
                        <AvatarFallback className={`bg-gradient-to-br ${member.avatar} text-white text-lg sm:text-xl`}>
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {getRankOverlay()}
                    </div>

                    {/* Member Info - Enhanced */}
                    <div className="flex-1 min-w-0">
                      {/* Name and Badges Row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-white text-lg sm:text-xl group-hover:text-cyan-400 transition-colors">{member.username}</span>
                        {isYou && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0">
                            You
                          </Badge>
                        )}
                        <span className="text-slate-500 text-xs sm:text-sm">({member.name})</span>
                      </div>

                      {/* Quote */}
                      <div className="text-xs sm:text-sm text-slate-400 mb-2 italic">
                        "{member.quote}"
                      </div>

                      {/* Stats Row - Compact Quick Stats */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Win Rate */}
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                          <Trophy className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400">{member.details.winRate}%</span>
                        </div>

                        {/* Streak */}
                        {hasWinStreak && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded">
                            <Flame className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400">{member.details.currentStreak}🔥</span>
                          </div>
                        )}

                        {/* Total Trades */}
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-cyan-400">{member.details.totalTrades}</span>
                        </div>

                        {/* Strength Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded">
                          <Award className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-purple-400 hidden sm:inline">{member.details.strengthArea}</span>
                        </div>
                      </div>

                      {/* Achievement Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {member.badges.slice(0, 2).map((badge, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded border border-slate-600/50"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio Stats - Simplified & Compact */}
                    <div className="hidden md:flex flex-col items-end gap-1.5 min-w-[160px]">
                      <div className="text-xs text-slate-400">Portfolio</div>
                      <div className="text-white text-xl sm:text-2xl">
                        ${(member.portfolioValue / 1000).toFixed(1)}K
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                        isPositive 
                          ? "bg-emerald-500/15 text-emerald-400" 
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${!isPositive && "rotate-180"}`} />
                        <span className="text-xs">
                          {isPositive ? "+" : ""}{member.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      
                      {/* Team Share Bar */}
                      <div className="w-full mt-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 text-xs">Share</span>
                          <span className="text-cyan-400 text-xs">{member.details.teamContribution}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${member.details.teamContribution}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Portfolio Stats */}
                    <div className="flex md:hidden flex-col items-end gap-1">
                      <div className="text-xs text-slate-400">Portfolio</div>
                      <div className="text-white text-lg">
                        ${(member.portfolioValue / 1000).toFixed(1)}K
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                        isPositive 
                          ? "bg-emerald-500/15 text-emerald-400" 
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${!isPositive && "rotate-180"}`} />
                        <span className="text-xs">
                          {isPositive ? "+" : ""}{member.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(member.rank)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-700/30">
                    {/* Slim Achievement Banner */}
                    <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-cyan-400" />
                        <div>
                          <span className="text-white text-sm">{member.details.strengthArea}</span>
                          <span className="text-slate-400 text-xs ml-2">• {member.details.improvementTrend}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.details.achievements.slice(0, 2).map((achievement, i) => (
                          <Badge key={i} variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs hidden lg:inline-flex">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Two Column Layout: Account Info (Left) + Positions (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                      {/* Left Column: Account Overview */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Portfolio Summary */}
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="text-xs text-slate-400 mb-3">Account</div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Portfolio Value</span>
                              <span className="text-white">${(member.portfolioValue / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Today's Change</span>
                              <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
                                {isPositive ? "+" : ""}${Math.abs(member.change).toFixed(2)} ({isPositive ? "+" : ""}{member.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                            <div className="h-px bg-slate-700/50"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Buying Power</span>
                              <span className="text-white">${(member.details.buyingPower / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Cash</span>
                              <span className="text-emerald-400">${member.details.cash.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="text-xs text-slate-400 mb-3">Performance</div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">YTD P&L</span>
                              <div className="text-right">
                                <div className="text-emerald-400">${(member.details.ytdPL / 1000).toFixed(1)}K</div>
                                <div className="text-xs text-emerald-400/70">+{member.details.ytdPLPercent}%</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Win Rate</span>
                              <span className="text-emerald-400">{member.details.winRate}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">W/L Record</span>
                              <span className="text-white">
                                <span className="text-emerald-400">{member.details.wlRecord.wins}W</span>
                                <span className="text-slate-500"> / </span>
                                <span className="text-red-400">{member.details.wlRecord.losses}L</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Current Streak</span>
                              <span className={hasWinStreak ? "text-yellow-400" : "text-slate-500"}>
                                {hasWinStreak && <Flame className="w-3 h-3 inline mr-1" />}
                                {member.details.currentStreak} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Trading Info */}
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="text-xs text-slate-400 mb-3">Trading</div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Total Trades</span>
                              <span className="text-white">{member.details.totalTrades}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Day Trades</span>
                              <span className="text-white">{member.details.dayTrades}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-sm">Team Share</span>
                              <span className="text-cyan-400">{member.details.teamContribution}%</span>
                            </div>
                            <div className="h-px bg-slate-700/50"></div>
                            <div>
                              <div className="text-slate-400 text-sm mb-2">Style</div>
                              <div className="flex flex-wrap gap-1">
                                {member.details.tradingStyle.map((style, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-2 py-0"
                                  >
                                    {style}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Positions Table */}
                      <div className="lg:col-span-2">
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-slate-400">Positions ({member.details.positions.length})</div>
                            <input
                              type="text"
                              placeholder="Filter..."
                              className="px-3 py-1 text-xs bg-slate-800/50 border border-slate-700/50 rounded text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-32"
                            />
                          </div>
                          
                          {/* Positions Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-700/50">
                                  <th className="text-left text-slate-400 text-xs pb-2">Symbol</th>
                                  <th className="text-right text-slate-400 text-xs pb-2">Qty</th>
                                  <th className="text-right text-slate-400 text-xs pb-2">Value</th>
                                  <th className="text-right text-slate-400 text-xs pb-2">Today's Return</th>
                                  <th className="text-right text-slate-400 text-xs pb-2">Today's Return %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {member.details.positions.map((position, i) => {
                                  const positionIsPositive = position.changePercent >= 0;
                                  return (
                                    <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                      <td className="py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-xs text-white">{position.symbol.substring(0, 2)}</span>
                                          </div>
                                          <span className="text-white">{position.symbol}</span>
                                        </div>
                                      </td>
                                      <td className="text-right text-slate-300">{position.shares}</td>
                                      <td className="text-right text-white">${position.value.toLocaleString()}</td>
                                      <td className={`text-right ${positionIsPositive ? "text-emerald-400" : "text-red-400"}`}>
                                        {positionIsPositive ? "+" : ""}${Math.abs(position.change).toFixed(2)}
                                      </td>
                                      <td className={`text-right ${positionIsPositive ? "text-emerald-400" : "text-red-400"}`}>
                                        {positionIsPositive ? "+" : ""}{position.changePercent.toFixed(2)}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - More Compact */}
                    <div className="flex gap-2 pt-3 border-t border-slate-700/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                      >
                        <Swords className="w-4 h-4 mr-2" />
                        Challenge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Compare
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
  );
}