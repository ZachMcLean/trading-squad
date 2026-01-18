import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ActivityFeedResponse,
  ActivityQuery,
  CreateActivityRequest,
  CreateActivityResponse,
  ReactToActivityRequest,
  ReactResponse,
  CommentOnActivityRequest,
  CommentResponse,
} from "@/lib/validations/activity";

// ===== ACTIVITY FEED =====

export function useActivityFeed(
  workspaceId: string | null | undefined,
  query: Partial<ActivityQuery> = {},
  realTime?: boolean
) {
  return useQuery<ActivityFeedResponse>({
    queryKey: ["activity", workspaceId, query],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error("No workspace ID provided");
      }

      const params = new URLSearchParams();
      if (query.limit) params.append("limit", query.limit.toString());
      if (query.offset) params.append("offset", query.offset.toString());
      if (query.type) params.append("type", query.type);
      if (query.userId) params.append("userId", query.userId);
      if (query.symbol) params.append("symbol", query.symbol);
      if (query.since) params.append("since", query.since);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/activity?${params}`
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to fetch activity feed" }));
        throw new Error(error.error || "Failed to fetch activity feed");
      }

      return res.json();
    },
    enabled: !!workspaceId,
    staleTime: realTime ? 0 : 30 * 1000, // No stale time for real-time
    refetchInterval: realTime ? 30 * 1000 : false, // Poll every 30 seconds for real-time
  });
}

// ===== CREATE ACTIVITY =====

export function useCreateActivity(workspaceId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation<CreateActivityResponse, Error, CreateActivityRequest>({
    mutationFn: async (data) => {
      if (!workspaceId) {
        throw new Error("No workspace ID provided");
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to create activity" }));
        throw new Error(error.error || "Failed to create activity");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate activity queries to refetch feed
      queryClient.invalidateQueries({ queryKey: ["activity", workspaceId] });
    },
  });
}

// ===== REACT TO ACTIVITY =====

export function useReactToActivity(
  workspaceId: string | null | undefined,
  activityId: string
) {
  const queryClient = useQueryClient();

  return useMutation<ReactResponse, Error, ReactToActivityRequest>({
    mutationFn: async (data) => {
      if (!workspaceId) {
        throw new Error("No workspace ID provided");
      }

      const res = await fetch(
        `/api/workspaces/${workspaceId}/activity/${activityId}/react`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to react to activity" }));
        throw new Error(error.error || "Failed to react to activity");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate activity queries to refresh reactions
      queryClient.invalidateQueries({ queryKey: ["activity", workspaceId] });
    },
  });
}

// ===== COMMENT ON ACTIVITY =====

export function useCommentOnActivity(
  workspaceId: string | null | undefined,
  activityId: string
) {
  const queryClient = useQueryClient();

  return useMutation<CommentResponse, Error, CommentOnActivityRequest>({
    mutationFn: async (data) => {
      if (!workspaceId) {
        throw new Error("No workspace ID provided");
      }

      const res = await fetch(
        `/api/workspaces/${workspaceId}/activity/${activityId}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to comment on activity" }));
        throw new Error(error.error || "Failed to comment on activity");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate activity queries to refresh comments
      queryClient.invalidateQueries({ queryKey: ["activity", workspaceId] });
    },
  });
}
