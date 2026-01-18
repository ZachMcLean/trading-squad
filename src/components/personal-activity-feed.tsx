"use client";

/**
 * Personal Activity Feed - Consolidated view of all activity
 * Shows user's personal activity + all squad activities in one feed
 * Personal activities are highlighted with special styling
 */

import { 
  Trophy, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Clock, 
  Settings,
  Activity,
  Award,
  Flame,
  Users,
  User,
  Sparkles,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useWorkspaceContext } from "@/lib/use-workspace-context";

interface ActivityItem {
  id: string;
  type: "achievement" | "trade" | "comment" | "challenge" | "milestone";
  username: string;
  action: string;
  details?: string;
  amount?: number;
  xp?: number;
  timestamp: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  emoji?: string;
  squadName?: string; // Which squad this activity is from
  isPersonal?: boolean; // Is this the logged-in user's activity?
}

export function PersonalActivityFeed() {
  // Mock current user
  const currentUsername = "FlippinPsycho98";
  
  // Get workspace context to filter squad activities
  const { currentContext, workspaces } = useWorkspaceContext();
  const isSoloMode = currentContext.type === "solo";
  const hasWorkspaces = workspaces.length > 0;

  // Consolidated feed: personal activities + all squad activities
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "achievement",
      username: "FlippinPsycho98",
      action: 'unlocked "10-Day Streak" badge',
      timestamp: "15 minutes ago",
      icon: <Trophy className="w-4 h-4" />,
      bgColor: "bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border-yellow-500/30",
      iconColor: "bg-gradient-to-br from-yellow-500 to-amber-500",
      emoji: "🔥",
      isPersonal: true,
    },
    {
      id: "2",
      type: "trade",
      username: "FlippinPsycho98",
      action: "sold 10 shares of TSLA",
      amount: -420,
      timestamp: "1 hour ago",
      icon: <TrendingDown className="w-4 h-4" />,
      bgColor: "bg-slate-800/40 border-slate-700/50",
      iconColor: "bg-emerald-500",
      isPersonal: true,
    },
    {
      id: "3",
      type: "comment",
      username: "ChartMaster420",
      action: "commented on TSLA news",
      details: "This is a great opportunity to average down",
      timestamp: "2 hours ago",
      icon: <MessageSquare className="w-4 h-4" />,
      bgColor: "bg-purple-500/10 border-purple-500/30",
      iconColor: "bg-purple-500",
      squadName: "Squad Alpha",
    },
    {
      id: "4",
      type: "challenge",
      username: "FlippinPsycho98",
      action: 'completed "First to 10%" challenge',
      xp: 500,
      timestamp: "3 hours ago",
      icon: <Target className="w-4 h-4" />,
      bgColor: "bg-cyan-500/10 border-cyan-500/30",
      iconColor: "bg-cyan-500",
      isPersonal: true,
    },
    {
      id: "5",
      type: "trade",
      username: "TechQueenGG",
      action: "bought 25 shares of NVDA",
      amount: 11006,
      timestamp: "4 hours ago",
      icon: <TrendingUp className="w-4 h-4" />,
      bgColor: "bg-slate-800/40 border-slate-700/50",
      iconColor: "bg-emerald-500",
      squadName: "Squad Alpha",
    },
    {
      id: "6",
      type: "trade",
      username: "FlippinPsycho98",
      action: "bought 15 shares of MSFT",
      amount: 5674,
      timestamp: "5 hours ago",
      icon: <TrendingUp className="w-4 h-4" />,
      bgColor: "bg-slate-800/40 border-slate-700/50",
      iconColor: "bg-emerald-500",
      isPersonal: true,
    },
    {
      id: "7",
      type: "achievement",
      username: "DiviKingdom",
      action: 'unlocked "Dividend Master" badge',
      timestamp: "6 hours ago",
      icon: <Award className="w-4 h-4" />,
      bgColor: "bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border-yellow-500/30",
      iconColor: "bg-gradient-to-br from-yellow-500 to-amber-500",
      emoji: "👑",
      squadName: "Squad Alpha",
    },
    {
      id: "8",
      type: "trade",
      username: "CryptoMoonBoi",
      action: "bought 0.5 BTC",
      amount: 22125,
      timestamp: "7 hours ago",
      icon: <TrendingUp className="w-4 h-4" />,
      bgColor: "bg-slate-800/40 border-slate-700/50",
      iconColor: "bg-emerald-500",
      squadName: "Squad Alpha",
    },
    {
      id: "9",
      type: "milestone",
      username: "FlippinPsycho98",
      action: "reached $75K portfolio milestone",
      xp: 1000,
      timestamp: "8 hours ago",
      icon: <Zap className="w-4 h-4" />,
      bgColor: "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border-cyan-500/30",
      iconColor: "bg-gradient-to-br from-cyan-500 to-blue-500",
      emoji: "🎯",
      isPersonal: true,
    },
    {
      id: "10",
      type: "comment",
      username: "DayTradeDemon",
      action: "commented on SPY analysis",
      details: "I'm seeing a potential breakout pattern here",
      timestamp: "9 hours ago",
      icon: <MessageSquare className="w-4 h-4" />,
      bgColor: "bg-purple-500/10 border-purple-500/30",
      iconColor: "bg-purple-500",
      squadName: "Squad Alpha",
    },
    {
      id: "11",
      type: "milestone",
      username: "MoonShotKing",
      action: "reached $100K portfolio milestone",
      xp: 1000,
      timestamp: "10 hours ago",
      icon: <Zap className="w-4 h-4" />,
      bgColor: "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border-cyan-500/30",
      iconColor: "bg-gradient-to-br from-cyan-500 to-blue-500",
      emoji: "🎯",
      squadName: "Squad Alpha",
    },
    {
      id: "12",
      type: "trade",
      username: "ThetaGangPro",
      action: "sold SPX call spreads",
      amount: -890,
      timestamp: "11 hours ago",
      icon: <TrendingDown className="w-4 h-4" />,
      bgColor: "bg-slate-800/40 border-slate-700/50",
      iconColor: "bg-emerald-500",
      squadName: "Squad Alpha",
    },
  ];

  // Filter activities based on mode - only show squad activities if in workspace mode or has workspaces
  const visibleActivities = activities.filter(activity => {
    // Always show personal activities
    if (activity.isPersonal) return true;
    // Only show squad activities if user has workspaces
    if (activity.squadName) return hasWorkspaces;
    return true;
  });
  
  // Count stats
  const personalActivityCount = visibleActivities.filter(a => a.isPersonal).length;
  const squadActivityCount = visibleActivities.filter(a => a.squadName).length;

  // Helper function to get avatar initials
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Helper function to get avatar gradient based on username
  const getAvatarGradient = (username: string) => {
    const colors = [
      "from-cyan-500 to-blue-500",
      "from-emerald-500 to-green-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-amber-500",
      "from-indigo-500 to-purple-500",
    ];
    const index = username.length % colors.length;
    return colors[index];
  };

  return (
    <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-white">Your Activity</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                Live
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-300"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <User className="w-3.5 h-3.5" />
            <span>{personalActivityCount} Your Actions</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          <div className="flex items-center gap-1.5 text-purple-400">
            <Users className="w-3.5 h-3.5" />
            <span>{squadActivityCount} Squad Activity</span>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        {visibleActivities.length === 0 ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center">
              <Activity className="w-8 h-8 text-slate-600" />
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">No activity yet</p>
              <p className="text-slate-500 text-xs">
                Your portfolio activity will appear here as you make trades
              </p>
            </div>
            {!hasWorkspaces && (
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 mt-4"
                onClick={() => window.location.href = '/workspaces'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Join a Squad
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            {visibleActivities.map((activity) => {
            const isPersonal = activity.isPersonal || activity.username === currentUsername;
            
            return (
              <div
                key={activity.id}
                className={`p-3 sm:p-4 rounded-lg border transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer relative ${
                  isPersonal
                    ? "bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20"
                    : activity.bgColor
                }`}
              >
                {/* Personal Activity Highlight Badge */}
                {isPersonal && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-medium">You</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <Avatar
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 ${
                        isPersonal ? "border-emerald-500 shadow-lg shadow-emerald-500/30" : "border-slate-700"
                      }`}
                    >
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(activity.username)} text-white text-xs font-mono`}>
                        {getInitials(activity.username)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Squad Badge on Avatar */}
                    {activity.squadName && !isPersonal && (
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-0.5 border-2 border-slate-900">
                        <Users className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className={`font-medium ${isPersonal ? "text-emerald-400" : ""}`}>
                            {activity.username}
                          </span>{" "}
                          <span className="text-slate-300">{activity.action}</span>
                          {activity.emoji && (
                            <span className="ml-2 text-base">{activity.emoji}</span>
                          )}
                        </p>
                        
                        {/* Squad Name Tag */}
                        {activity.squadName && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs px-1.5 py-0">
                              <Users className="w-2.5 h-2.5 mr-1" />
                              {activity.squadName}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Amount/XP Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {activity.amount !== undefined && (
                          <Badge
                            className={`flex-shrink-0 ${
                              activity.amount < 0
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {activity.amount < 0 ? "" : "+"}${Math.abs(activity.amount).toLocaleString()}
                          </Badge>
                        )}
                        {activity.xp !== undefined && (
                          <Badge className="flex-shrink-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            +{activity.xp} XP
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Details/Quote */}
                    {activity.details && (
                      <p className="text-slate-400 text-xs sm:text-sm mb-2 italic">
                        "{activity.details}"
                      </p>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </ScrollArea>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
        <p className="text-xs text-slate-400 text-center">
          {squadActivityCount > 0 ? (
            <>
              Showing activity from <span className="text-emerald-400 font-medium">your portfolio</span> and{" "}
              <span className="text-purple-400 font-medium">
                {squadActivityCount === 1 ? "1 squad" : `${Math.floor(squadActivityCount / 2)} squads`}
              </span>
            </>
          ) : (
            <>
              Showing <span className="text-emerald-400 font-medium">your portfolio</span> activity
            </>
          )}
        </p>
      </div>
    </Card>
  );
}

