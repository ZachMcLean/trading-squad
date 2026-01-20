import { z } from "zod";

// ===== COMMON SCHEMAS =====

export const TimePeriodSchema = z.enum(["1D", "1W", "1M", "3M", "6M", "1Y", "YTD"]);

// ===== REQUEST SCHEMAS =====

export const PortfolioHistoryQuerySchema = z.object({
  period: TimePeriodSchema.optional().default("1M"),
  accountId: z.string().cuid().optional(),
});

export const SyncRequestSchema = z.object({
  type: z.enum(["full", "quick", "incremental", "positions", "transactions"]).optional().default("quick"),
});

// ===== RESPONSE SCHEMAS =====

export const PositionSchema = z.object({
  symbol: z.string(),
  securityName: z.string().nullable(),
  quantity: z.number(),
  averageCost: z.number().nullable(),
  currentPrice: z.number(),
  marketValue: z.number(),
  unrealizedPL: z.number().nullable(),
  unrealizedPLPercent: z.number().nullable(),
});

export const BrokerageAccountSchema = z.object({
  id: z.string(),
  broker: z.string(),
  brokerName: z.string().nullable(),
  accountName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  accountType: z.string().nullable(),
  totalValue: z.number(),
  totalCash: z.number(),
  buyingPower: z.number().nullable(),
  marginAvailable: z.number().nullable().optional(),
  marginUsed: z.number().nullable().optional(),
  marginMaintenance: z.number().nullable().optional(),
  totalPL: z.number(),
  totalPLPercent: z.number(),
  dailyPL: z.number().optional().default(0), // Daily gain/loss in dollars
  dailyPLPercent: z.number().optional().default(0), // Daily gain/loss as percentage
  positionCount: z.number(),
  status: z.string(),
  lastSyncedAt: z.date().nullable(),
  positions: z.array(PositionSchema),
});

export const PortfolioSummarySchema = z.object({
  totalValue: z.number(),
  totalCash: z.number(),
  totalInvested: z.number(),
  totalPL: z.number(),
  totalPLPercent: z.number(),
  accountCount: z.number(),
  connectionCount: z.number(),
  lastSyncedAt: z.string().nullable(),
});

export const PortfolioHistoryPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  pl: z.number(),
  plPercent: z.number(),
  isInterpolated: z.boolean().optional().default(false),
  label: z.string().optional(), // Pre-formatted label for charts
});

export const DataQualitySchema = z.object({
  actualPoints: z.number(),
  totalPoints: z.number(),
  coverage: z.number(), // Percentage (0-100)
});

export const PortfolioHistoryResponseSchema = z.object({
  history: z.array(PortfolioHistoryPointSchema),
  period: TimePeriodSchema,
  dataQuality: DataQualitySchema.optional(),
});

export const AccountsResponseSchema = z.object({
  accounts: z.array(BrokerageAccountSchema),
});

export const SyncResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  jobId: z.string().optional(),
});

// ===== SQUAD/WORKSPACE SCHEMAS =====

export const SquadMemberHistorySchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  privacyLevel: z.enum(["full", "partial", "hidden"]),
  history: z.array(z.object({
    date: z.string(),
    percentChange: z.number(),
  })),
});

export const SquadHistoryResponseSchema = z.object({
  squadAverage: z.array(z.object({
    date: z.string(),
    percentChange: z.number(),
  })),
  squadTotal: z.array(z.object({
    date: z.string(),
    value: z.number(),
  })),
  members: z.array(SquadMemberHistorySchema),
  yourHistory: z.array(z.object({
    date: z.string(),
    value: z.number(),
    percentChange: z.number(),
  })),
  metadata: z.object({
    totalMembers: z.number(),
    visibleMembers: z.number(),
    hiddenMembers: z.number(),
  }),
});

// ===== TYPE INFERENCE =====

export type TimePeriod = z.infer<typeof TimePeriodSchema>;
export type PortfolioHistoryQuery = z.infer<typeof PortfolioHistoryQuerySchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type BrokerageAccount = z.infer<typeof BrokerageAccountSchema>;
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;
export type PortfolioHistoryPoint = z.infer<typeof PortfolioHistoryPointSchema>;
export type DataQuality = z.infer<typeof DataQualitySchema>;
export type PortfolioHistoryResponse = z.infer<typeof PortfolioHistoryResponseSchema>;
export type AccountsResponse = z.infer<typeof AccountsResponseSchema>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
export type SquadMemberHistory = z.infer<typeof SquadMemberHistorySchema>;
export type SquadHistoryResponse = z.infer<typeof SquadHistoryResponseSchema>;

