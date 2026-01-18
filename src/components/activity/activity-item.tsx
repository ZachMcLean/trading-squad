"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from "lucide-react";
import type { WorkspaceActivity } from "@/lib/validations/activity";
import {
  formatActivityMessage,
  getActivityIcon,
  getActivityColor,
  formatRelativeTime,
  formatFullTimestamp,
  REACTION_EMOJIS,
} from "@/lib/activity-utils";
import { parsePrivacySettings } from "@/lib/privacy-utils";
import { useReactToActivity, useCommentOnActivity } from "@/hooks/use-activity";

interface ActivityItemProps {
  activity: WorkspaceActivity;
  workspaceId: string;
  currentUserId: string;
  showComments?: boolean;
}

export function ActivityItem({
  activity,
  workspaceId,
  currentUserId,
  showComments = true,
}: ActivityItemProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const reactMutation = useReactToActivity(workspaceId, activity.id);
  const commentMutation = useCommentOnActivity(workspaceId, activity.id);

  // Parse privacy settings from metadata
  const privacyLevel = (activity.metadata as any)?.privacyLevel || "full";
  const privacySettings = parsePrivacySettings({
    portfolioValue: privacyLevel === "full" ? "exact" : privacyLevel === "partial" ? "approximate" : "hidden",
    performance: "visible",
    positions: privacyLevel === "full" ? "full" : privacyLevel === "partial" ? "tickers_only" : "hidden",
    activity: privacyLevel === "full" ? "full" : privacyLevel === "partial" ? "without_amounts" : "hidden",
  });

  const message = formatActivityMessage(
    activity.type,
    activity.symbol,
    activity.quantity,
    activity.price,
    activity.value,
    activity.metadata,
    privacySettings,
    activity.userName || "Unknown"
  );

  const icon = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);
  const isOwnActivity = activity.userId === currentUserId;

  const handleReact = async (emoji: string) => {
    try {
      await reactMutation.mutateAsync({ emoji: emoji as any });
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      await commentMutation.mutateAsync({ content: commentText.trim() });
      setCommentText("");
      setShowCommentInput(false);
    } catch (error) {
      console.error("Failed to comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4 hover:bg-slate-800/50 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}
        >
          <span className="text-xl">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white font-medium">
              {isOwnActivity ? "You" : activity.userName}
            </span>
            <span className="text-slate-300 text-sm">{message}</span>
          </div>

          {/* User message/note */}
          {activity.message && (
            <p className="mt-2 text-slate-400 text-sm italic">
              "{activity.message}"
            </p>
          )}

          {/* Metadata badges */}
          {activity.metadata && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {(activity.metadata as any).portfolioPercentage && (
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {((activity.metadata as any).portfolioPercentage as number).toFixed(1)}% of portfolio
                </Badge>
              )}
              {(activity.metadata as any).gainLossPercent !== undefined && (
                <Badge
                  variant="outline"
                  className={`text-xs border-slate-600 ${
                    (activity.metadata as any).gainLossPercent >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {(activity.metadata as any).gainLossPercent >= 0 ? "+" : ""}
                  {((activity.metadata as any).gainLossPercent as number).toFixed(1)}% gain/loss
                </Badge>
              )}
              {privacyLevel !== "full" && (
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                  🔒 {privacyLevel === "partial" ? "Partial" : "Private"}
                </Badge>
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-3 mt-3">
            {/* Reaction buttons */}
            <div className="flex items-center gap-1">
              {REACTION_EMOJIS.map(({ emoji, label }) => {
                const count = activity.reactionCounts?.[emoji] || 0;
                const hasReacted = activity.hasUserReacted?.[emoji] || false;

                return (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReact(emoji)}
                    disabled={reactMutation.isPending}
                    className={`h-8 px-2 text-sm ${
                      hasReacted
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                    title={label}
                  >
                    {emoji}
                    {count > 0 && <span className="ml-1 text-xs">{count}</span>}
                  </Button>
                );
              })}
            </div>

            {/* Comment button */}
            {showComments && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCommentInput(!showCommentInput)}
                className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {activity.comments.length > 0 && (
                  <span className="text-xs">{activity.comments.length}</span>
                )}
              </Button>
            )}

            {/* Timestamp */}
            <div className="ml-auto">
              <span
                className="text-xs text-slate-500"
                title={formatFullTimestamp(activity.createdAt)}
              >
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
          </div>

          {/* Comments section */}
          {showComments && (activity.comments.length > 0 || showCommentInput) && (
            <div className="mt-3 space-y-2 pt-3 border-t border-slate-700/50">
              {/* Existing comments */}
              {activity.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <span className="font-medium text-white">
                    {comment.userId === currentUserId ? "You" : comment.userName}:
                  </span>
                  <span className="text-slate-300">{comment.content}</span>
                </div>
              ))}

              {/* Comment input */}
              {showCommentInput && (
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                    disabled={isCommenting}
                  />
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!commentText.trim() || isCommenting}
                    className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
