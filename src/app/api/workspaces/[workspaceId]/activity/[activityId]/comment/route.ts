import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  CommentOnActivitySchema,
  CommentResponseSchema,
} from "@/lib/validations/activity";

/**
 * POST /api/workspaces/[workspaceId]/activity/[activityId]/comment
 * Add a comment to an activity
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
    const bodyResult = CommentOnActivitySchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyResult.error },
        { status: 400 }
      );
    }

    const { content } = bodyResult.data;

    // Create comment
    const comment = await prisma.activityComment.create({
      data: {
        activityId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const response = CommentResponseSchema.parse({
      comment: {
        id: comment.id,
        activityId: comment.activityId,
        userId: comment.userId,
        userName: comment.user.name,
        userImage: comment.user.image,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error commenting on activity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to comment on activity",
      },
      { status: 500 }
    );
  }
}
