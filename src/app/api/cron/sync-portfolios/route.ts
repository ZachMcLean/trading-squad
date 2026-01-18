import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SnapTradeSyncService } from "@/lib/sync-service";

// Verify the request is from Vercel Cron
function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow requests without auth
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Vercel Cron sends the secret in the Authorization header
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

// Rate limit helper - waits between syncs to avoid overwhelming APIs
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  // Verify cron authentication
  if (!verifyCronAuth(req)) {
    console.error("[Cron Sync] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  console.log("[Cron Sync] Starting daily portfolio sync...");

  try {
    // Fetch all users with connected SnapTrade accounts
    const snaptradeUsers = await prisma.snaptradeUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        brokerageConnections: {
          where: {
            status: "active",
          },
          select: {
            id: true,
            broker: true,
          },
        },
      },
    });

    // Filter to users with active connections
    const usersWithConnections = snaptradeUsers.filter(
      (su) => su.brokerageConnections.length > 0
    );

    console.log(
      `[Cron Sync] Found ${usersWithConnections.length} users with active connections`
    );

    // Create a batch sync job record
    const batchJob = await prisma.syncJob.create({
      data: {
        userId: "system", // System-initiated sync
        type: "batch_daily",
        status: "running",
        metadata: {
          totalUsers: usersWithConnections.length,
          startedAt: new Date().toISOString(),
        },
      },
    });

    const results: {
      userId: string;
      success: boolean;
      error?: string;
      duration?: number;
    }[] = [];

    // Sync each user with rate limiting
    for (let i = 0; i < usersWithConnections.length; i++) {
      const snaptradeUser = usersWithConnections[i];
      const userStartTime = Date.now();

      console.log(
        `[Cron Sync] Syncing user ${i + 1}/${usersWithConnections.length}: ${
          snaptradeUser.user.email
        }`
      );

      try {
        const syncService = new SnapTradeSyncService(
          snaptradeUser.userId,
          snaptradeUser.snaptradeUserId,
          snaptradeUser.userSecret,
          snaptradeUser.id
        );

        // Use quickSync for daily syncs (accounts, positions, snapshots)
        await syncService.quickSync();

        const duration = Date.now() - userStartTime;
        results.push({
          userId: snaptradeUser.userId,
          success: true,
          duration,
        });

        console.log(
          `[Cron Sync] Successfully synced user ${snaptradeUser.user.email} in ${duration}ms`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          userId: snaptradeUser.userId,
          success: false,
          error: errorMessage,
        });

        console.error(
          `[Cron Sync] Failed to sync user ${snaptradeUser.user.email}:`,
          errorMessage
        );

        // Log individual sync errors but continue with other users
        await prisma.syncJob.create({
          data: {
            userId: snaptradeUser.userId,
            type: "cron_quick",
            status: "failed",
            error: errorMessage,
            completedAt: new Date(),
          },
        });
      }

      // Rate limiting: wait 500ms between users to avoid API throttling
      if (i < usersWithConnections.length - 1) {
        await sleep(500);
      }
    }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const totalDuration = Date.now() - startTime;

    // Update batch job record
    await prisma.syncJob.update({
      where: { id: batchJob.id },
      data: {
        status: failCount === 0 ? "completed" : "completed_with_errors",
        completedAt: new Date(),
        metadata: {
          totalUsers: usersWithConnections.length,
          successCount,
          failCount,
          totalDurationMs: totalDuration,
          results: results.map((r) => ({
            userId: r.userId,
            success: r.success,
            error: r.error,
          })),
        },
      },
    });

    console.log(
      `[Cron Sync] Completed. Success: ${successCount}, Failed: ${failCount}, Duration: ${totalDuration}ms`
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount}/${usersWithConnections.length} users`,
      summary: {
        totalUsers: usersWithConnections.length,
        successCount,
        failCount,
        durationMs: totalDuration,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Cron Sync] Fatal error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
