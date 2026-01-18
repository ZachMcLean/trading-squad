import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  resolvePrivacy,
  formatPortfolioValue,
  formatPerformance,
  filterPositions,
  canViewUserData,
} from '@/lib/privacy-resolver';

/**
 * GET /api/workspace/:id/leaderboard
 * Get workspace leaderboard with privacy-filtered data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify user is a member of this workspace
    const canView = await canViewUserData(
      session.user.id,
      session.user.id,
      workspaceId
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Get all workspace members
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Get portfolio data for each member
    const leaderboardData = await Promise.all(
      members.map(async (member) => {
        // Get member's brokerage accounts and calculate total value
        const accounts = await prisma.brokerageAccount.findMany({
          where: {
            connection: {
              snaptradeUser: {
                userId: member.userId,
              },
            },
          },
          include: {
            positions: true,
          },
        });

        // Calculate total portfolio value
        const totalValue = accounts.reduce(
          (sum, account) => sum + account.totalValue,
          0
        );

        // Calculate today's change (simplified - would need historical data)
        const todayChange = accounts.reduce((sum, account) => {
          const positionsValue = account.positions.reduce(
            (pSum, pos) => pSum + (pos.unrealizedPL || 0),
            0
          );
          return sum + positionsValue;
        }, 0);

        const todayChangePercent = totalValue > 0 ? (todayChange / totalValue) * 100 : 0;

        // Get all positions for this user
        const allPositions = accounts.flatMap(account => account.positions);

        // Resolve privacy for this member
        const privacy = await resolvePrivacy(member.userId, workspaceId);

        // Format data based on privacy settings
        const portfolioValue = formatPortfolioValue(totalValue, privacy.portfolioValue);
        const performance = formatPerformance(
          todayChange,
          todayChangePercent,
          privacy.performance
        );
        const positions = filterPositions(allPositions, privacy.positions);

        return {
          userId: member.userId,
          username: member.user.username,
          name: member.user.name,
          image: member.user.image,
          role: member.role,
          joinedAt: member.joinedAt,
          portfolioValue,
          performance,
          positions: {
            count: allPositions.length,
            data: positions,
            privacyLevel: privacy.positions,
          },
          privacySettings: {
            portfolioValue: privacy.portfolioValue,
            performance: privacy.performance,
            positions: privacy.positions,
          },
        };
      })
    );

    // Sort by portfolio value (use midpoint of range for approximate)
    const sortedLeaderboard = leaderboardData
      .map((member) => ({
        ...member,
        sortValue:
          member.portfolioValue.exact !== null
            ? member.portfolioValue.exact
            : member.portfolioValue.range
            ? (member.portfolioValue.range[0] + member.portfolioValue.range[1]) / 2
            : 0,
      }))
      .sort((a, b) => b.sortValue - a.sortValue)
      .map((member, index) => ({
        ...member,
        rank: index + 1,
        sortValue: undefined, // Remove sort value from response
      }));

    // Calculate workspace aggregates
    const totalCombinedValue = sortedLeaderboard.reduce(
      (sum, member) => sum + (member.sortValue || 0),
      0
    );

    const avgReturn =
      sortedLeaderboard.reduce((sum, member) => {
        return sum + (member.performance.changePercent || 0);
      }, 0) / sortedLeaderboard.length;

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      stats: {
        totalMembers: members.length,
        combinedValue: totalCombinedValue,
        avgReturn,
      },
    });
  } catch (error) {
    console.error('Error fetching workspace leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
