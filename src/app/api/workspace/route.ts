import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/workspace
 * Get all workspaces the current user is a member of
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all workspace memberships for this user
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            createdAt: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Format the response
    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      type: membership.workspace.type.toLowerCase(),
      description: membership.workspace.description,
      memberCount: membership.workspace._count.members,
      role: membership.role,
      joinedAt: membership.joinedAt,
      createdAt: membership.workspace.createdAt,
      isActive: true, // TODO: Calculate based on recent activity
    }));

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace
 * Create a new workspace
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, type = 'PRIVATE' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['PRIVATE', 'PUBLIC', 'COMPETITIVE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid workspace type' },
        { status: 400 }
      );
    }

    // Create workspace with the creator as owner
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type.toLowerCase(),
        description: workspace.description,
        memberCount: workspace._count.members,
        createdAt: workspace.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
