"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Trash2, StickyNote } from 'lucide-react';

interface WatchlistItem {
  id: string;
  symbol: string;
  notes: string | null;
  addedAt: string;
}

export function WatchlistManager() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const data = await response.json();
      setWatchlist(data.watchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = async () => {
    if (!newSymbol.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          notes: newNotes.trim() || null,
        }),
      });

      if (response.ok) {
        setNewSymbol('');
        setNewNotes('');
        await fetchWatchlist();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add symbol');
      }
    } catch (error) {
      console.error('Error adding symbol:', error);
      alert('Failed to add symbol');
    } finally {
      setAdding(false);
    }
  };

  const removeSymbol = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchWatchlist();
      }
    } catch (error) {
      console.error('Error removing symbol:', error);
    }
  };

  if (loading) {
    return (
      <Card className="border-slate-700 bg-slate-900/50 p-6">
        <p className="text-slate-400">Loading watchlist...</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-white text-lg mb-2 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            My Watchlist
          </h3>
          <p className="text-slate-400 text-sm">
            Track stocks you're interested in
          </p>
        </div>

        {/* Add Symbol Form */}
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="space-y-3">
            <Input
              placeholder="Symbol (e.g. NVDA, AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Input
              placeholder="Notes (optional - why are you watching this?)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Button
              onClick={addSymbol}
              disabled={adding || !newSymbol.trim()}
              className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              {adding ? 'Adding...' : 'Add to Watchlist'}
            </Button>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-3">
          {watchlist.length === 0 ? (
            <div className="p-8 text-center">
              <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Your watchlist is empty. Add some symbols to track!
              </p>
            </div>
          ) : (
            watchlist.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                        {item.symbol}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.notes && (
                      <div className="flex items-start gap-2 mt-2">
                        <StickyNote className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-400 italic">{item.notes}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSymbol(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
