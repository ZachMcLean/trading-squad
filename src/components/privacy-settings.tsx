"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, EyeOff, Save, Info } from 'lucide-react';
import type { PrivacySettings as PrivacySettingsType } from '@/lib/privacy-resolver';

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/privacy');
      const data = await response.json();
      setSettings(data.privacyDefaults);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await fetch('/api/user/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyDefaults: settings }),
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card className="border-slate-700 bg-slate-900/50 p-6">
        <p className="text-slate-400">Loading privacy settings...</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-white text-lg mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Privacy Settings
          </h3>
          <p className="text-slate-400 text-sm">
            Control what squad members can see about your portfolio
          </p>
        </div>

        {/* Portfolio Value */}
        <div>
          <label className="text-slate-300 text-sm mb-3 block">
            Portfolio Value
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSettings({ ...settings, portfolioValue: 'exact' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.portfolioValue === 'exact'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Show exact value</p>
                  <p className="text-slate-400 text-xs">$99,269.87</p>
                </div>
                {settings.portfolioValue === 'exact' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, portfolioValue: 'approximate' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.portfolioValue === 'approximate'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Show approximate</p>
                  <p className="text-slate-400 text-xs">$90K-100K</p>
                </div>
                {settings.portfolioValue === 'approximate' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, portfolioValue: 'hidden' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.portfolioValue === 'hidden'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Hide completely</p>
                  <p className="text-slate-400 text-xs">Not visible</p>
                </div>
                {settings.portfolioValue === 'hidden' && (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Performance */}
        <div>
          <label className="text-slate-300 text-sm mb-3 block">
            Performance (% gains/losses)
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSettings({ ...settings, performance: 'visible' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.performance === 'visible'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Show performance</p>
                  <p className="text-slate-400 text-xs">+2.58%</p>
                </div>
                {settings.performance === 'visible' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, performance: 'hidden' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.performance === 'hidden'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Hide performance</p>
                  <p className="text-slate-400 text-xs">Not visible</p>
                </div>
                {settings.performance === 'hidden' && (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Positions */}
        <div>
          <label className="text-slate-300 text-sm mb-3 block">
            Your Positions
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSettings({ ...settings, positions: 'full' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.positions === 'full'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Show all details</p>
                  <p className="text-slate-400 text-xs">Ticker, quantity, value</p>
                </div>
                {settings.positions === 'full' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, positions: 'tickers_only' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.positions === 'tickers_only'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Tickers only</p>
                  <p className="text-slate-400 text-xs">NVDA, AAPL (no amounts)</p>
                </div>
                {settings.positions === 'tickers_only' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, positions: 'hidden' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.positions === 'hidden'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Hide all positions</p>
                  <p className="text-slate-400 text-xs">Not visible</p>
                </div>
                {settings.positions === 'hidden' && (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <label className="text-slate-300 text-sm mb-3 block">
            Trading Activity
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSettings({ ...settings, activity: 'full' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.activity === 'full'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Show all details</p>
                  <p className="text-slate-400 text-xs">Bought 10 NVDA @ $495.30</p>
                </div>
                {settings.activity === 'full' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, activity: 'without_amounts' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.activity === 'without_amounts'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Without amounts</p>
                  <p className="text-slate-400 text-xs">Bought NVDA (no quantity)</p>
                </div>
                {settings.activity === 'without_amounts' && (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
              </div>
            </button>

            <button
              onClick={() => setSettings({ ...settings, activity: 'hidden' })}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                settings.activity === 'hidden'
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Hide all activity</p>
                  <p className="text-slate-400 text-xs">Not visible</p>
                </div>
                {settings.activity === 'hidden' && (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cyan-400 text-sm mb-1">Default Privacy Settings</p>
              <p className="text-slate-400 text-xs">
                These are your default settings for all workspaces. You can override these per-workspace 
                in workspace settings. Some workspaces may require minimum sharing levels.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </Card>
  );
}
