"use client";

import { WatchlistManager } from '@/components/watchlist-manager';
import { Eye } from 'lucide-react';

export default function WatchlistPage() {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <Eye className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-slate-100">My Watchlist</h1>
          <p className="text-slate-400">Track stocks you're interested in</p>
        </div>
      </div>

      {/* Watchlist Manager */}
      <WatchlistManager />
    </div>
  );
}
