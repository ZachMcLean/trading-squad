import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ReactToActivitySchema, ReactResponseSchema } from "@/lib/validations/activity";
import { aggregateReactionCounts } from "@/lib/activity-utils";

/**
 * POST /api/workspaces/[workspaceId]/activity/[activityId]/react
 * React to an activity with an emoji
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; activityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId, activityId } = await params;

    // Verify user is a member of this workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Verify activity exists in this workspace
    const activity = await prisma.workspaceActivity.findFirst({
      where: {
        id: activityId,
        workspaceId,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const bodyResult = ReactToActivitySchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyResult.error },
        { status: 400 }
      );
    }

    const { emoji } = bodyResult.data;

    // Toggle reaction (remove if exists, add if doesn't)
    const existingReaction = await prisma.activityReaction.findUnique({
      where: {
        activityId_userId_emoji: {
          activityId,
          userId,
          emoji,
        },
      },
    });

    let reaction;
    if (existingReaction) {
      // Remove reaction (toggle off)
      await prisma.activityReaction.delete({
        where: { id: existingReaction.id },
      });
      reaction = null;
    } else {
      // Add reaction
      reaction = await prisma.activityReaction.create({
        data: {
          activityId,
          userId,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    // Get updated reaction counts
    const allReactions = await prisma.activityReaction.findMany({
      where: { activityId },
      select: { emoji: true },
    });

    const counts = aggregateReactionCounts(allReactions);

    if (reaction) {
      const response = ReactResponseSchema.parse({
        reaction: {
          id: reaction.id,
          activityId: reaction.activityId,
          userId: reaction.userId,
          userName: reaction.user.name,
          emoji: reaction.emoji,
          createdAt: reaction.createdAt,
        },
        counts,
      });
      return NextResponse.json(response);
    } else {
      // Reaction was removed
      return NextResponse.json({ counts }, { status: 200 });
    }
  } catch (error) {
    console.error("Error reacting to activity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to react to activity",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[workspaceId]/activity/[activityId]/react
 * Remove all reactions from user on this activity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; activityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId, activityId } = await params;

    // Verify user is a member
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Remove all user's reactions on this activity
    await prisma.activityReaction.deleteMany({
      where: {
        activityId,
        userId,
      },
    });

    // Get updated counts
    const allReactions = await prisma.activityReaction.findMany({
      where: { activityId },
      select: { emoji: true },
    });

    const counts = aggregateReactionCounts(allReactions);

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error removing reactions:", error);
    return NextResponse.json(
      { error: "Failed to remove reactions" },
      { status: 500 }
    );
  }
}
