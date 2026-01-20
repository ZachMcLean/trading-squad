"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BalanceResponse = {
  broker: string;
  total: number;
  currency: string;
  accounts: any[];
};

export function AccountBalance({
  broker = "ROBINHOOD",
  linked = false,
}: {
  broker?: string;
  linked?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [syncing, setSyncing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchBalance(signal?: AbortSignal): Promise<BalanceResponse | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/snaptrade/balance?broker=${encodeURIComponent(broker)}`, { signal });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load balance");
      }
      setData(json as BalanceResponse);
      return json as BalanceResponse;
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message ?? "Failed to load balance");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let cancelled = false;
    const run = async () => {
      const first = await fetchBalance(ctrl.signal);
      if (linked && !cancelled) {
        const isStale =
          !first ||
          !Array.isArray(first.accounts) ||
          first.accounts.length === 0 ||
          (typeof first.total === "number" && first.total === 0);

        if (isStale) {
          setSyncing(true);
          try {
            for (let i = 0; i < 4 && !cancelled; i++) {
              await new Promise((r) => setTimeout(r, 1500));
              const next = await fetchBalance(ctrl.signal);
              if (
                next &&
                Array.isArray(next.accounts) &&
                (next.accounts.length > 0 || (typeof next.total === "number" && next.total > 0))
              ) {
                break;
              }
            }
          } finally {
            if (!cancelled) setSyncing(false);
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [broker, linked]);

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount == null || !currency) return null;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
    } catch {
      return amount.toLocaleString();
    }
  };

  const formattedTotal = useMemo(() => {
    if (data?.total != null && data?.currency) {
      return formatCurrency(data.total, data.currency);
    }
    return null;
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle>Account Balance {data?.broker ? `(${data.broker})` : ""}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => fetchBalance()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!error && (loading || syncing) ? (
          <p className="text-sm text-muted-foreground">
            {syncing ? "Syncing latest balance… this can take a few seconds after linking." : "Loading balance…"}
          </p>
        ) : null}

        {!error && !loading && formattedTotal ? (
          <div className="text-2xl font-semibold">{formattedTotal}</div>
        ) : null}

        {!error && !loading && Array.isArray(data?.accounts) && data!.accounts.length > 0 ? (
          <div className="space-y-3">
            {data!.accounts.map((a: any) => {
              const amt = a?.balance?.total?.amount;
              const cur = a?.balance?.total?.currency ?? data?.currency;
              const display = formatCurrency(amt, cur);
              const hasMarginData = a?.marginAvailable != null || a?.marginUsed != null || a?.marginMaintenance != null;
              
              return (
                <div key={a.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{a?.name ?? a?.account_number ?? a.id}</span>
                    <span className="font-medium">{display ?? "-"}</span>
                  </div>
                  
                  {hasMarginData && (
                    <div className="pl-4 space-y-0.5 text-xs border-l-2 border-slate-700/50">
                      {a?.marginAvailable != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Margin Available</span>
                          <span className="text-cyan-400 tabular-nums">{formatCurrency(a.marginAvailable, cur) ?? "-"}</span>
                        </div>
                      )}
                      {a?.marginUsed != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Margin Used</span>
                          <span className="text-slate-400 tabular-nums">{formatCurrency(a.marginUsed, cur) ?? "-"}</span>
                        </div>
                      )}
                      {a?.marginMaintenance != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Maintenance Req.</span>
                          <span className="text-slate-400 tabular-nums">{formatCurrency(a.marginMaintenance, cur) ?? "-"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {!error && !loading && !formattedTotal && (!data?.accounts || data.accounts.length === 0) ? (
          <p className="text-sm text-muted-foreground">No balance available. Make sure your brokerage is linked.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}