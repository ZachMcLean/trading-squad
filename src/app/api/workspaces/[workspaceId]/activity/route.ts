import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ActivityQuerySchema,
  CreateActivitySchema,
  ActivityFeedResponseSchema,
  CreateActivityResponseSchema,
} from "@/lib/validations/activity";
import {
  aggregateReactionCounts,
  getUserReactions,
} from "@/lib/activity-utils";

/**
 * GET /api/workspaces/[workspaceId]/activity
 * Fetch activity feed for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = {
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      type: searchParams.get("type"),
      userId: searchParams.get("userId"),
      symbol: searchParams.get("symbol"),
      since: searchParams.get("since"),
    };
    
    const queryResult = ActivityQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      console.error("Activity query validation failed:", {
        rawParams,
        errors: queryResult.error.errors,
      });
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: queryResult.error.errors,
          received: rawParams 
        },
        { status: 400 }
      );
    }

    const query = queryResult.data;

    // Verify user is a member of this workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      workspaceId,
      visibility: "workspace", // Only show workspace-visible activities
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.symbol) {
      where.symbol = query.symbol;
    }

    if (query.since) {
      where.createdAt = {
        gte: new Date(query.since),
      };
    }

    // Fetch activities with pagination
    const [activities, total] = await Promise.all([
      prisma.workspaceActivity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: query.limit + 1, // Fetch one extra to check if there's more
        skip: query.offset,
      }),
      prisma.workspaceActivity.count({ where }),
    ]);

    const hasMore = activities.length > query.limit;
    const returnedActivities = hasMore ? activities.slice(0, query.limit) : activities;

    // Format response
    const formattedActivities = returnedActivities.map((activity) => {
      const reactionCounts = aggregateReactionCounts(activity.reactions);
      const hasUserReacted = getUserReactions(activity.reactions, userId);

      return {
        id: activity.id,
        workspaceId: activity.workspaceId,
        userId: activity.userId,
        userName: activity.user.name,
        userImage: activity.user.image,
        type: activity.type,
        symbol: activity.symbol,
        quantity: activity.quantity,
        price: activity.price,
        value: activity.value,
        message: activity.message,
        metadata: activity.metadata as any,
        visibility: activity.visibility,
        reactions: activity.reactions.map((r) => ({
          id: r.id,
          activityId: r.activityId,
          userId: r.userId,
          userName: r.user.name,
          emoji: r.emoji,
          createdAt: r.createdAt,
        })),
        comments: activity.comments.map((c) => ({
          id: c.id,
          activityId: c.activityId,
          userId: c.userId,
          userName: c.user.name,
          userImage: c.user.image,
          content: c.content,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        reactionCounts,
        hasUserReacted,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      };
    });

    const response = ActivityFeedResponseSchema.parse({
      activities: formattedActivities,
      total,
      hasMore,
      nextOffset: hasMore ? query.offset + query.limit : undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch activity feed",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[workspaceId]/activity
 * Create a new activity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workspaceId } = await params;

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

    // Parse and validate request body
    const body = await request.json();
    const bodyResult = CreateActivitySchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyResult.error },
        { status: 400 }
      );
    }

    const data = bodyResult.data;

    // Create activity
    const activity = await prisma.workspaceActivity.create({
      data: {
        workspaceId,
        userId,
        type: data.type,
        symbol: data.symbol,
        quantity: data.quantity,
        price: data.price,
        value: data.value,
        message: data.message,
        metadata: data.metadata as any,
        visibility: data.visibility,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Format response
    const formattedActivity = {
      id: activity.id,
      workspaceId: activity.workspaceId,
      userId: activity.userId,
      userName: activity.user.name,
      userImage: activity.user.image,
      type: activity.type,
      symbol: activity.symbol,
      quantity: activity.quantity,
      price: activity.price,
      value: activity.value,
      message: activity.message,
      metadata: activity.metadata as any,
      visibility: activity.visibility,
      reactions: [],
      comments: [],
      reactionCounts: {},
      hasUserReacted: {},
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };

    const response = CreateActivityResponseSchema.parse({
      activity: formattedActivity,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create activity",
      },
      { status: 500 }
    );
  }
}
