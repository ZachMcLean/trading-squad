import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/workspace/:id/join
 * Join a workspace
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

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this workspace' },
        { status: 409 }
      );
    }

    // Add user as a member
    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: session.user.id,
        role: 'MEMBER',
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      membership: {
        workspaceId: membership.workspaceId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        workspace: {
          id: membership.workspace.id,
          name: membership.workspace.name,
          type: membership.workspace.type.toLowerCase(),
          description: membership.workspace.description,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining workspace:', error);
    return NextResponse.json(
      { error: 'Failed to join workspace' },
      { status: 500 }
    );
  }
}
