/*
  Warnings:

  - Added the required column `updatedAt` to the `Workspace` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('PRIVATE', 'PUBLIC', 'COMPETITIVE');

-- DropForeignKey
ALTER TABLE "public"."WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_workspaceId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privacyDefaults" JSONB DEFAULT '{"portfolioValue":"approximate","performance":"visible","positions":"tickers_only","activity":"without_amounts","watchlist":"visible"}';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "description" TEXT,
ADD COLUMN     "privacyPolicy" JSONB DEFAULT '{"minimumSharing":{"portfolioValue":"approximate","performance":"visible","positions":"tickers_only","activity":"without_amounts"},"enforcedTransparency":false,"allowAnonymousMode":false}',
ADD COLUMN     "type" "WorkspaceType" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set updatedAt to createdAt for existing workspaces (if any)
UPDATE "Workspace" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Workspace" ALTER COLUMN     "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "privacyOverride" JSONB;

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceWatchlist" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "WorkspaceWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE INDEX "Watchlist_symbol_idx" ON "Watchlist"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_symbol_key" ON "Watchlist"("userId", "symbol");

-- CreateIndex
CREATE INDEX "WorkspaceWatchlist_workspaceId_idx" ON "WorkspaceWatchlist"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceWatchlist_symbol_idx" ON "WorkspaceWatchlist"("symbol");

-- CreateIndex
CREATE INDEX "WorkspaceWatchlist_addedBy_idx" ON "WorkspaceWatchlist"("addedBy");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceWatchlist_workspaceId_symbol_key" ON "WorkspaceWatchlist"("workspaceId", "symbol");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceWatchlist" ADD CONSTRAINT "WorkspaceWatchlist_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceWatchlist" ADD CONSTRAINT "WorkspaceWatchlist_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
