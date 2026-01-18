"use client";

import { PrivacySettings } from '@/components/privacy-settings';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <Settings className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-slate-100">Settings</h1>
          <p className="text-slate-400">Manage your privacy and preferences</p>
        </div>
      </div>

      {/* Privacy Settings */}
      <PrivacySettings />
    </div>
  );
}
