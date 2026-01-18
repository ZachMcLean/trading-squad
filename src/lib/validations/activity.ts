import { z } from "zod";

// ===== ACTIVITY TYPE ENUM =====

export const ActivityTypeSchema = z.enum([
  "TRADE_BUY",
  "TRADE_SELL",
  "POSITION_OPENED",
  "POSITION_CLOSED",
  "POSITION_INCREASED",
  "POSITION_DECREASED",
  "MILESTONE_ATH",
  "MILESTONE_VALUE",
  "MILESTONE_RETURN",
  "IDEA_SHARED",
  "IDEA_OUTCOME",
  "WATCHLIST_ADD",
  "ACHIEVEMENT",
]);

// ===== ACTIVITY METADATA SCHEMAS =====

export const TradeMetadataSchema = z.object({
  portfolioPercentage: z.number().optional(),
  totalPosition: z.number().optional(),
  averageCost: z.number().optional(),
  gainLoss: z.number().optional(),
  gainLossPercent: z.number().optional(),
  privacyLevel: z.enum(["full", "partial", "hidden"]).optional(),
});

export const MilestoneMetadataSchema = z.object({
  previousValue: z.number().optional(),
  newValue: z.number().optional(),
  gain: z.number().optional(),
  gainPercent: z.number().optional(),
  milestoneType: z.string().optional(),
});

export const PositionMetadataSchema = z.object({
  isFirstTime: z.boolean().optional(),
  portfolioPercentage: z.number().optional(),
  conviction: z.enum(["low", "medium", "high"]).optional(),
  privacyLevel: z.enum(["full", "partial", "hidden"]).optional(),
  previousQuantity: z.number().optional(),
  newQuantity: z.number().optional(),
});

// ===== REQUEST SCHEMAS =====

export const CreateActivitySchema = z.object({
  type: ActivityTypeSchema,
  symbol: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  value: z.number().optional(),
  message: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
  visibility: z.enum(["workspace", "private"]).default("workspace"),
});

export const ActivityQuerySchema = z.object({
  limit: z
    .union([z.string(), z.null()])
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .union([z.string(), z.null()])
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().min(0)),
  type: z.union([ActivityTypeSchema, z.null()]).optional(),
  userId: z.union([z.string().cuid(), z.null()]).optional(),
  symbol: z.union([z.string(), z.null()]).optional(),
  since: z.union([z.string().datetime(), z.null()]).optional(),
});

export const ReactToActivitySchema = z.object({
  emoji: z.enum(["👍", "🔥", "🎉", "👏", "💯", "🤔"]),
});

export const CommentOnActivitySchema = z.object({
  content: z.string().min(1).max(1000),
});

// ===== RESPONSE SCHEMAS =====

export const ActivityReactionSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  emoji: z.string(),
  createdAt: z.date(),
});

export const ActivityCommentSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  userImage: z.string().nullable().optional(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WorkspaceActivitySchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  userImage: z.string().nullable().optional(),
  type: ActivityTypeSchema,
  symbol: z.string().nullable(),
  quantity: z.number().nullable(),
  price: z.number().nullable(),
  value: z.number().nullable(),
  message: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  visibility: z.string(),
  reactions: z.array(ActivityReactionSchema),
  comments: z.array(ActivityCommentSchema),
  reactionCounts: z.record(z.number()),
  hasUserReacted: z.record(z.boolean()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ActivityFeedResponseSchema = z.object({
  activities: z.array(WorkspaceActivitySchema),
  total: z.number(),
  hasMore: z.boolean(),
  nextOffset: z.number().optional(),
});

export const CreateActivityResponseSchema = z.object({
  activity: WorkspaceActivitySchema,
});

export const ReactResponseSchema = z.object({
  reaction: ActivityReactionSchema,
  counts: z.record(z.number()),
});

export const CommentResponseSchema = z.object({
  comment: ActivityCommentSchema,
});

// ===== TYPE INFERENCE =====

export type ActivityType = z.infer<typeof ActivityTypeSchema>;
export type TradeMetadata = z.infer<typeof TradeMetadataSchema>;
export type MilestoneMetadata = z.infer<typeof MilestoneMetadataSchema>;
export type PositionMetadata = z.infer<typeof PositionMetadataSchema>;
export type CreateActivityRequest = z.infer<typeof CreateActivitySchema>;
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>;
export type ReactToActivityRequest = z.infer<typeof ReactToActivitySchema>;
export type CommentOnActivityRequest = z.infer<typeof CommentOnActivitySchema>;
export type ActivityReaction = z.infer<typeof ActivityReactionSchema>;
export type ActivityComment = z.infer<typeof ActivityCommentSchema>;
export type WorkspaceActivity = z.infer<typeof WorkspaceActivitySchema>;
export type ActivityFeedResponse = z.infer<typeof ActivityFeedResponseSchema>;
export type CreateActivityResponse = z.infer<typeof CreateActivityResponseSchema>;
export type ReactResponse = z.infer<typeof ReactResponseSchema>;
export type CommentResponse = z.infer<typeof CommentResponseSchema>;
