import { prisma } from "./prisma";
import { snaptrade } from "./snaptrade";

export class SnapTradeSyncService {
  constructor(
    private userId: string,
    private snaptradeUserId: string,
    private userSecret: string,
    private snaptradeUserDbId: string // Database ID for foreign key
  ) {}

  /**
   * Full sync: connections -> accounts -> positions -> snapshots
   */
  async fullSync() {
    const job = await prisma.syncJob.create({
      data: {
        userId: this.userId,
        type: "full",
        status: "running",
      },
    });

    try {
      await this.syncConnections();
      await this.syncAccounts();
      await this.syncPositions();
      await this.createSnapshots();

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Sync brokerage connections
   */
  async syncConnections() {
    const res = await snaptrade.connections.listBrokerageAuthorizations({
      userId: this.snaptradeUserId,
      userSecret: this.userSecret,
    });

    const connections = res.data || [];

    for (const conn of connections) {
      const connId = conn.id as string;
      if (!connId) continue;
      
      await prisma.brokerageConnection.upsert({
        where: { authorizationId: connId },
        create: {
          authorizationId: connId,
          snaptradeUserId: this.snaptradeUserDbId, // Use database ID, not API ID
          broker: (conn.brokerage?.slug as string)?.toUpperCase() || "UNKNOWN",
          brokerName: (conn.brokerage?.name || conn.brokerage?.slug) as string,
          status: conn.disabled ? "disconnected" : "active",
          lastSyncedAt: new Date(),
          metadata: conn as any,
        },
        update: {
          brokerName: (conn.brokerage?.name || conn.brokerage?.slug) as string,
          status: conn.disabled ? "disconnected" : "active",
          lastSyncedAt: new Date(),
          metadata: conn as any,
        },
      });
    }
  }

  /**
   * Sync brokerage accounts
   */
  async syncAccounts() {
    const accountsRes = await snaptrade.accountInformation.listUserAccounts({
      userId: this.snaptradeUserId,
      userSecret: this.userSecret,
    });

    const accounts = accountsRes.data || [];

    for (const acc of accounts) {
      // Find the corresponding connection
      const connection = await prisma.brokerageConnection.findUnique({
        where: { authorizationId: acc.brokerage_authorization },
      });

      if (!connection) {
        console.warn(`No connection found for account ${acc.id}`);
        continue;
      }

      const balance = acc.balance?.total;
      const cash = (acc.balance as any)?.cash || acc.balance?.total;

      await prisma.brokerageAccount.upsert({
        where: { snaptradeAccountId: acc.id },
        create: {
          snaptradeAccountId: acc.id,
          connectionId: connection.id,
          accountName: acc.name || acc.number,
          accountNumber: acc.number,
          accountType: acc.meta?.type || "Unknown",
          totalValue: balance?.amount || 0,
          totalCash: cash?.amount || 0,
          currency: balance?.currency || "USD",
          status: "active",
          lastSyncedAt: new Date(),
          metadata: acc as any,
        },
        update: {
          accountName: acc.name || acc.number,
          accountNumber: acc.number,
          accountType: acc.meta?.type || "Unknown",
          totalValue: balance?.amount || 0,
          totalCash: cash?.amount || 0,
          currency: balance?.currency || "USD",
          lastSyncedAt: new Date(),
          metadata: acc as any,
        },
      });
    }
  }

  /**
   * Sync positions for all accounts
   */
  async syncPositions() {
    const accounts = await prisma.brokerageAccount.findMany({
      where: {
        connection: {
          snaptradeUserId: this.snaptradeUserDbId,
        },
      },
      include: {
        connection: {
          select: { broker: true },
        },
      },
    });

    console.log(`[Sync] Syncing positions for ${accounts.length} account(s)`);

    for (const account of accounts) {
      try {
        console.log(`[Sync] Fetching positions for account ${account.snaptradeAccountId} (${account.accountName || account.accountNumber})`);
        console.log(`[Sync] Account balance: $${account.totalValue}, Cash: $${account.totalCash}`);
        
        // Check if account has any value (might be cash-only)
        if (account.totalValue === 0) {
          console.warn(`[Sync] ⚠️ Account ${account.snaptradeAccountId} has $0 total value - skipping position sync`);
          continue;
        }
        
        const positionsRes = await snaptrade.accountInformation.getUserAccountPositions({
          userId: this.snaptradeUserId,
          userSecret: this.userSecret,
          accountId: account.snaptradeAccountId,
        });

        const positions = positionsRes.data || [];
        console.log(`[Sync] Received ${positions.length} position(s) from SnapTrade for account ${account.snaptradeAccountId}`);
        console.log(`[Sync] SnapTrade response status: ${positionsRes.status || 'unknown'}`);
        console.log(`[Sync] Response data type: ${Array.isArray(positionsRes.data) ? 'array' : typeof positionsRes.data}`);

        // Log raw position data for debugging
        if (positions.length > 0) {
          console.log(`[Sync] Sample position structure:`, JSON.stringify(positions[0], null, 2));
        } else {
          // If no positions, log the full response to see what we got
          console.warn(`[Sync] ⚠️ NO POSITIONS RETURNED from SnapTrade for account ${account.snaptradeAccountId}`);
          console.warn(`[Sync] Full response:`, JSON.stringify(positionsRes, null, 2));
          console.warn(`[Sync] Account details:`, {
            snaptradeAccountId: account.snaptradeAccountId,
            accountName: account.accountName,
            totalValue: account.totalValue,
            totalCash: account.totalCash,
            broker: account.connection.broker,
          });
        }

        // Extract symbols more robustly
        const validPositions: Array<{ symbol: string; position: any }> = [];
        const invalidPositions: any[] = [];

        for (const pos of positions) {
          // Try multiple ways to extract symbol
          let symbol: string | null = null;
          
          // Method 1: Nested symbol structure (pos.symbol.symbol.symbol) - MOST COMMON
          if (pos.symbol?.symbol?.symbol && typeof pos.symbol.symbol.symbol === 'string') {
            symbol = pos.symbol.symbol.symbol;
          }
          // Method 2: Direct symbol.symbol (fallback)
          else if (pos.symbol?.symbol && typeof pos.symbol.symbol === 'string') {
            symbol = pos.symbol.symbol;
          }
          // Method 3: Symbol as object with symbol property
          else if (pos.symbol && typeof pos.symbol === 'object' && 'symbol' in pos.symbol) {
            const symbolObj = (pos.symbol as any).symbol;
            if (typeof symbolObj === 'string') {
              symbol = symbolObj;
            } else if (symbolObj?.symbol && typeof symbolObj.symbol === 'string') {
              symbol = symbolObj.symbol;
            }
          }
          // Method 4: Direct symbol string
          else if (typeof pos.symbol === 'string') {
            symbol = pos.symbol;
          }
          // Method 5: Check raw_symbol field
          else if (pos.symbol?.symbol?.raw_symbol && typeof pos.symbol.symbol.raw_symbol === 'string') {
            symbol = pos.symbol.symbol.raw_symbol;
          }
          // Method 6: Check metadata or other fields
          else if (pos.ticker) {
            symbol = String(pos.ticker);
          }
          else if (pos.security?.symbol) {
            symbol = String(pos.security.symbol);
          }

          if (!symbol || symbol === 'null' || symbol === 'undefined') {
            console.warn(`[Sync] Could not extract symbol from position:`, JSON.stringify(pos, null, 2));
            invalidPositions.push(pos);
            continue;
          }

          // Filter out zero-quantity positions (sold positions)
          const quantity = pos.units || pos.quantity || 0;
          if (quantity <= 0) {
            console.log(`[Sync] Skipping position ${symbol} with zero quantity`);
            continue;
          }

          validPositions.push({ symbol, position: pos });
        }

        console.log(`[Sync] Valid positions: ${validPositions.length}, Invalid: ${invalidPositions.length}`);

        // Delete old positions not in the new list (only if we have valid positions)
        if (validPositions.length > 0) {
          const currentSymbols = validPositions.map(p => p.symbol);
          await prisma.position.deleteMany({
            where: {
              accountId: account.id,
              symbol: { notIn: currentSymbols },
            },
          });
        }

        // Upsert current positions
        let syncedCount = 0;
        for (const { symbol, position: pos } of validPositions) {
          try {
            const quantity = pos.units || pos.quantity || 0;
            const currentPrice = pos.price || pos.currentPrice || 0;
            const marketValue = currentPrice * quantity;
            const avgCost = pos.average_purchase_price || pos.averageCost || pos.cost_basis || currentPrice;
            const unrealizedPL = pos.open_pnl || (currentPrice - avgCost) * quantity; // Use open_pnl if available
            const unrealizedPLPercent = avgCost > 0 ? (unrealizedPL / (avgCost * quantity)) * 100 : 0;
            
            // Extract security name from nested structure
            const securityName = 
              pos.symbol?.symbol?.description || 
              pos.symbol?.description || 
              pos.security?.name || 
              pos.name || 
              symbol;
            
            // Extract security type from nested structure
            const securityType = 
              pos.symbol?.symbol?.type?.description || 
              pos.symbol?.type?.description || 
              pos.security?.type || 
              pos.type || 
              "EQUITY";
            
            // Extract currency from nested structure
            const currency = 
              pos.symbol?.symbol?.currency?.code || 
              pos.symbol?.currency?.code || 
              pos.currency?.code || 
              pos.currency || 
              "USD";

            await prisma.position.upsert({
              where: {
                accountId_symbol: {
                  accountId: account.id,
                  symbol: symbol,
                },
              },
              create: {
                accountId: account.id,
                symbol: symbol,
                securityName,
                securityType,
                quantity,
                averageCost: avgCost,
                currentPrice,
                marketValue,
                unrealizedPL,
                unrealizedPLPercent,
                currency,
                lastSyncedAt: new Date(),
                metadata: pos as any,
              },
              update: {
                securityName,
                quantity,
                averageCost: avgCost,
                currentPrice,
                marketValue,
                unrealizedPL,
                unrealizedPLPercent,
                lastSyncedAt: new Date(),
                metadata: pos as any,
              },
            });
            syncedCount++;
          } catch (posError) {
            console.error(`[Sync] Error upserting position ${symbol} for account ${account.id}:`, posError);
          }
        }

        console.log(`[Sync] Successfully synced ${syncedCount} position(s) for account ${account.id}`);
        
        // Update account sync timestamp
        await prisma.brokerageAccount.update({
          where: { id: account.id },
          data: { lastSyncedAt: new Date() },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Sync] Error syncing positions for account ${account.id} (${account.snaptradeAccountId}):`, errorMessage);
        console.error(`[Sync] Full error:`, error);
        
        // Store error in account
        await prisma.brokerageAccount.update({
          where: { id: account.id },
          data: { 
            syncError: errorMessage,
            lastSyncedAt: new Date(), // Still update timestamp to show we tried
          },
        });
      }
    }
  }

  /**
   * Create portfolio snapshots for historical tracking
   * Only creates one snapshot per account per day to avoid duplicates
   */
  async createSnapshots() {
    const accounts = await prisma.brokerageAccount.findMany({
      where: {
        connection: {
          snaptradeUserId: this.snaptradeUserDbId,
        },
      },
      include: {
        positions: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const account of accounts) {
      // Check if snapshot already exists for today
      const existingSnapshot = await prisma.portfolioSnapshot.findFirst({
        where: {
          accountId: account.id,
          snapshotDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Skip if snapshot already exists for today
      if (existingSnapshot) {
        console.log(`Snapshot already exists for account ${account.id} today, skipping...`);
        continue;
      }

      const totalInvestments = account.positions.reduce(
        (sum, pos) => sum + (pos.averageCost || 0) * pos.quantity,
        0
      );
      const totalValue = account.totalValue;
      const totalCash = account.totalCash;
      const totalPL = totalValue - totalInvestments;
      const totalPLPercent = totalInvestments > 0 ? (totalPL / totalInvestments) * 100 : 0;

      await prisma.portfolioSnapshot.create({
        data: {
          accountId: account.id,
          totalValue,
          totalCash,
          totalInvestments,
          totalPL,
          totalPLPercent,
          snapshotDate: new Date(),
        },
      });
    }
  }

  /**
   * Quick sync - update positions, balances, and create snapshots
   */
  async quickSync() {
    await this.syncAccounts();
    await this.syncPositions();
    await this.createSnapshots();
  }
}

/**
 * Helper to get or create sync service for a user
 */
export async function createSyncService(userId: string) {
  const snaptradeUser = await prisma.snaptradeUser.findUnique({
    where: { userId },
  });

  if (!snaptradeUser) {
    throw new Error("User not registered with SnapTrade");
  }

  return new SnapTradeSyncService(
    userId,
    snaptradeUser.snaptradeUserId,
    snaptradeUser.userSecret,
    snaptradeUser.id // Pass the database ID for foreign key
  );
}

// ===== BATCH SYNC UTILITIES =====

export interface BatchSyncResult {
  userId: string;
  email: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

export interface BatchSyncSummary {
  totalUsers: number;
  successCount: number;
  failCount: number;
  totalDurationMs: number;
  results: BatchSyncResult[];
}

/**
 * Rate limit helper - waits between operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch sync all users with active SnapTrade connections
 * @param delayBetweenUsersMs - Delay between user syncs to avoid API throttling (default: 500ms)
 * @param onProgress - Optional callback for progress updates
 */
export async function batchSyncAllUsers(
  delayBetweenUsersMs: number = 500,
  onProgress?: (current: number, total: number, result: BatchSyncResult) => void
): Promise<BatchSyncSummary> {
  const startTime = Date.now();

  // Fetch all users with active connections
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
        },
      },
    },
  });

  // Filter to users with active connections
  const usersWithConnections = snaptradeUsers.filter(
    (su) => su.brokerageConnections.length > 0
  );

  const results: BatchSyncResult[] = [];

  for (let i = 0; i < usersWithConnections.length; i++) {
    const snaptradeUser = usersWithConnections[i];
    const userStartTime = Date.now();

    try {
      const syncService = new SnapTradeSyncService(
        snaptradeUser.userId,
        snaptradeUser.snaptradeUserId,
        snaptradeUser.userSecret,
        snaptradeUser.id
      );

      await syncService.quickSync();

      const result: BatchSyncResult = {
        userId: snaptradeUser.userId,
        email: snaptradeUser.user.email,
        success: true,
        durationMs: Date.now() - userStartTime,
      };

      results.push(result);
      onProgress?.(i + 1, usersWithConnections.length, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: BatchSyncResult = {
        userId: snaptradeUser.userId,
        email: snaptradeUser.user.email,
        success: false,
        error: errorMessage,
        durationMs: Date.now() - userStartTime,
      };

      results.push(result);
      onProgress?.(i + 1, usersWithConnections.length, result);
    }

    // Rate limiting between users
    if (i < usersWithConnections.length - 1) {
      await sleep(delayBetweenUsersMs);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return {
    totalUsers: usersWithConnections.length,
    successCount,
    failCount,
    totalDurationMs: Date.now() - startTime,
    results,
  };
}