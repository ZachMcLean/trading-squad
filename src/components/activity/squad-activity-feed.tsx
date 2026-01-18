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
  Filter,
  RefreshCw,
  Radio,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Trophy,
  Lightbulb,
  Eye,
  Sparkles,
  Activity as ActivityIcon,
} from "lucide-react";
import { ActivityItem } from "./activity-item";
import { useActivityFeed } from "@/hooks/use-activity";
import type { ActivityType } from "@/lib/validations/activity";
import { groupActivitiesByDate } from "@/lib/activity-utils";

interface SquadActivityFeedProps {
  workspaceId: string | null | undefined;
  currentUserId: string;
  maxHeight?: string;
  showHeader?: boolean;
  limit?: number;
}

export function SquadActivityFeed({
  workspaceId,
  currentUserId,
  maxHeight = "600px",
  showHeader = true,
  limit = 50,
}: SquadActivityFeedProps) {
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");

  const { data, isLoading, error, isFetching, refetch } = useActivityFeed(
    workspaceId,
    {
      limit,
      type: filterType === "all" ? undefined : filterType,
    },
    realTimeEnabled
  );

  // Auto-refresh indicator
  useEffect(() => {
    if (isFetching && realTimeEnabled) {
      console.log("Activity feed refreshing...");
    }
  }, [isFetching, realTimeEnabled]);

  if (!workspaceId) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
        <div className="text-center text-slate-400">
          <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p>Select a workspace to see activity</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">Failed to load activity feed</p>
          <p className="text-slate-500 text-xs">{error.message}</p>
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
        <div className="text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
          <p>Loading activity feed...</p>
        </div>
      </Card>
    );
  }

  const activities = data?.activities || [];
  const groupedActivities = groupActivitiesByDate(activities);

  // Filter options
  const filterOptions: Array<{
    value: ActivityType | "all";
    label: string;
    icon: any;
  }> = [
    { value: "all", label: "All Activity", icon: ActivityIcon },
    { value: "TRADE_BUY", label: "Buys", icon: TrendingUp },
    { value: "TRADE_SELL", label: "Sells", icon: TrendingDown },
    { value: "MILESTONE_ATH", label: "Milestones", icon: Trophy },
    { value: "IDEA_SHARED", label: "Ideas", icon: Lightbulb },
    { value: "WATCHLIST_ADD", label: "Watchlist", icon: Eye },
  ];

  const currentFilter = filterOptions.find((f) => f.value === filterType);

  return (
    <Card className="border-slate-700/50 bg-gradient-to-b from-slate-800/40 via-slate-900/40 to-slate-800/40 backdrop-blur-sm">
      <div className="flex flex-col" style={{ maxHeight }}>
        {/* Header */}
        {showHeader && (
          <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Live Activity Feed</h3>
                {realTimeEnabled && isFetching && (
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Real-time toggle */}
                <Button
                  size="sm"
                  variant={realTimeEnabled ? "default" : "outline"}
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={
                    realTimeEnabled
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  }
                >
                  {realTimeEnabled ? (
                    <>
                      <Radio className="w-4 h-4 mr-1.5 animate-pulse" />
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 mr-1.5" />
                      <span>Live</span>
                    </>
                  )}
                </Button>

                {/* Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Filter className="w-4 h-4 mr-1.5" />
                      {currentFilter?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-slate-900 border-slate-700"
                  >
                    {filterOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setFilterType(option.value)}
                          className={`${
                            filterType === option.value
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Manual refresh */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-slate-400">
                {data?.total || 0} activities
              </span>
              {filterType !== "all" && (
                <>
                  <span className="text-slate-600">•</span>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => setFilterType("all")}
                    className="h-auto p-0 text-cyan-400 text-sm"
                  >
                    Clear filter
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 mb-2">No activity yet</p>
              <p className="text-slate-500 text-sm">
                {filterType === "all"
                  ? "Be the first to make a move!"
                  : `No ${currentFilter?.label.toLowerCase()} activities found`}
              </p>
            </div>
          ) : (
            Array.from(groupedActivities.entries()).map(([dateGroup, groupActivities]) => (
              <div key={dateGroup}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-slate-700/50"></div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {dateGroup}
                  </span>
                  <div className="h-px flex-1 bg-slate-700/50"></div>
                </div>

                {/* Activities for this date */}
                <div className="space-y-3">
                  {groupActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      workspaceId={workspaceId}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Load more */}
          {data?.hasMore && (
            <div className="text-center pt-4">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
