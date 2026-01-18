-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TRADE_BUY', 'TRADE_SELL', 'POSITION_OPENED', 'POSITION_CLOSED', 'POSITION_INCREASED', 'POSITION_DECREASED', 'MILESTONE_ATH', 'MILESTONE_VALUE', 'MILESTONE_RETURN', 'IDEA_SHARED', 'IDEA_OUTCOME', 'WATCHLIST_ADD', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "WorkspaceActivity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "symbol" TEXT,
    "quantity" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "message" TEXT,
    "metadata" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'workspace',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReaction" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityComment" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceActivity_workspaceId_createdAt_idx" ON "WorkspaceActivity"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkspaceActivity_userId_createdAt_idx" ON "WorkspaceActivity"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkspaceActivity_workspaceId_type_createdAt_idx" ON "WorkspaceActivity"("workspaceId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkspaceActivity_symbol_createdAt_idx" ON "WorkspaceActivity"("symbol", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityReaction_activityId_idx" ON "ActivityReaction"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReaction_userId_idx" ON "ActivityReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReaction_activityId_userId_emoji_key" ON "ActivityReaction"("activityId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "ActivityComment_activityId_createdAt_idx" ON "ActivityComment"("activityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityComment_userId_idx" ON "ActivityComment"("userId");

-- AddForeignKey
ALTER TABLE "WorkspaceActivity" ADD CONSTRAINT "WorkspaceActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceActivity" ADD CONSTRAINT "WorkspaceActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "WorkspaceActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReaction" ADD CONSTRAINT "ActivityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "WorkspaceActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityComment" ADD CONSTRAINT "ActivityComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
