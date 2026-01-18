import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/workspace/:id/watchlist
 * Get workspace shared watchlist
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
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Get workspace watchlist
    const watchlist = await prisma.workspaceWatchlist.findMany({
      where: { workspaceId },
      include: {
        addedByUser: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Error fetching workspace watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace/:id/watchlist
 * Add symbol to workspace shared watchlist
 */
export async function POST(
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
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { symbol, notes } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Normalize symbol to uppercase
    const normalizedSymbol = symbol.trim().toUpperCase();

    // Check if already in workspace watchlist
    const existing = await prisma.workspaceWatchlist.findUnique({
      where: {
        workspaceId_symbol: {
          workspaceId,
          symbol: normalizedSymbol,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Symbol already in workspace watchlist' },
        { status: 409 }
      );
    }

    // Add to workspace watchlist
    const watchlistItem = await prisma.workspaceWatchlist.create({
      data: {
        workspaceId,
        symbol: normalizedSymbol,
        addedBy: session.user.id,
        notes: notes || null,
      },
      include: {
        addedByUser: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ watchlistItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding to workspace watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to workspace watchlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/:id/watchlist
 * Remove symbol from workspace shared watchlist
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Watchlist item ID is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of this workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      );
    }

    // Get the item to verify it belongs to this workspace
    const item = await prisma.workspaceWatchlist.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    if (item.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Item does not belong to this workspace' },
        { status: 403 }
      );
    }

    // Only the person who added it or workspace admin/owner can delete
    const canDelete =
      item.addedBy === session.user.id ||
      member.role === 'ADMIN' ||
      member.role === 'OWNER';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Not authorized to delete this item' },
        { status: 403 }
      );
    }

    await prisma.workspaceWatchlist.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from workspace watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete from workspace watchlist' },
      { status: 500 }
    );
  }
}
