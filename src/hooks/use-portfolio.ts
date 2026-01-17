import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PortfolioSummary,
  BrokerageAccount,
  PortfolioHistoryResponse,
  AccountsResponse,
  SyncRequest,
  SyncResponse,
} from "@/lib/validations/portfolio";

// ===== PORTFOLIO SUMMARY =====

export function usePortfolioSummary(realTime?: boolean) {
  return useQuery<PortfolioSummary>({
    queryKey: ["portfolio", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/summary");
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to fetch summary" }));
        throw new Error(error.error || "Failed to fetch summary");
      }
      return res.json();
    },
    staleTime: realTime ? 0 : 30 * 1000, // No stale time for real-time, 30 seconds otherwise
    refetchInterval: realTime ? 30 * 1000 : false, // Poll every 30 seconds for real-time
    refetchIntervalInBackground: realTime, // Continue polling in background
  });
}

// ===== PORTFOLIO ACCOUNTS =====

export function usePortfolioAccounts() {
  return useQuery<AccountsResponse>({
    queryKey: ["portfolio", "accounts"],
    queryFn: async () => {
      const res = await fetch("/api/portfolio/accounts");
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to fetch accounts" }));
        throw new Error(error.error || "Failed to fetch accounts");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ===== PORTFOLIO HISTORY =====

export function usePortfolioHistory(period: string, accountId?: string, realTime?: boolean) {
  return useQuery<PortfolioHistoryResponse>({
    queryKey: ["portfolio", "history", period, accountId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (accountId) params.append("accountId", accountId);
      
      const res = await fetch(`/api/portfolio/history?${params}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to fetch history" }));
        throw new Error(error.error || "Failed to fetch history");
      }
      return res.json();
    },
    staleTime: realTime ? 0 : 5 * 60 * 1000, // No stale time for real-time, 5 min for historical
    refetchInterval: realTime && period === "1D" ? 30 * 1000 : false, // Poll every 30 seconds for 1D real-time
    refetchIntervalInBackground: realTime && period === "1D", // Continue polling in background
  });
}

// ===== SYNC MUTATION =====

export function useSyncPortfolio() {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error, SyncRequest["type"]>({
    mutationFn: async (type: SyncRequest["type"] = "quick") => {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Sync failed" }));
        throw new Error(error.error || "Sync failed");
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all portfolio queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

