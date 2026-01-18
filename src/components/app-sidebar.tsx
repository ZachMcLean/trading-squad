"use client";

/**
 * App Sidebar - Context-Aware Navigation with Workspace Switcher
 * Adapts based on whether user is in Solo Mode or Workspace Mode
 */

import {
  LayoutDashboard,
  Newspaper,
  BarChart3,
  Bot,
  Trophy,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Globe,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { OmegaLogo } from "@/components/illustrations/OmegaLogo";
import { WorkspaceContextSwitcher } from "./workspace-context-switcher";
import type { WorkspaceContext } from "@/lib/workspace-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export type PageId = "portfolio" | "squad-dashboard" | "news" | "algorithm" | "challenges" | "terminal" | "chat" | "workspaces" | "watchlist" | "settings";

interface AppSidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  currentContext: WorkspaceContext;
  workspaces: WorkspaceContext[];
  onContextChange: (context: WorkspaceContext) => void;
  onBrowseWorkspaces: () => void;
  onCreateWorkspace: () => void;
  onStartTour?: () => void;
}

export function AppSidebar({
  currentPage,
  onPageChange,
  currentContext,
  workspaces,
  onContextChange,
  onBrowseWorkspaces,
  onCreateWorkspace,
  onStartTour,
}: AppSidebarProps) {
  const isSoloMode = currentContext.type === "solo";

  // Navigation items with context-aware visibility
  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ElementType;
    color: string;
    soloOnly?: boolean;
    workspaceOnly?: boolean;
    badge?: string;
    description?: string;
  }> = [
    {
      id: "portfolio",
      label: "My Portfolio",
      icon: Briefcase,
      color: "emerald",
      description: "Your personal command center",
    },
    {
      id: "squad-dashboard",
      label: currentContext.name || "Squad Dashboard",
      icon: LayoutDashboard,
      color: "purple",
      workspaceOnly: true,
      description: "Team performance & activity",
    },
    {
      id: "news",
      label: "News & Intel",
      icon: Newspaper,
      color: "cyan",
      description: "Market news and analysis",
    },
    {
      id: "algorithm",
      label: "Algorithm Lab",
      icon: Bot,
      color: "violet",
      description: "Build & test trading algorithms",
    },
    {
      id: "challenges",
      label: "Challenges",
      icon: Trophy,
      color: "amber",
      description: isSoloMode ? "Solo quests & achievements" : "Squad competitions",
    },
    {
      id: "terminal",
      label: "Trading Terminal",
      icon: TrendingUp,
      color: "cyan",
      description: "Charts & technical analysis",
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: Sparkles,
      color: "cyan",
      description: "Track stocks you're watching",
    },
    {
      id: "chat",
      label: "Squad Chat",
      icon: MessageSquare,
      color: "cyan",
      workspaceOnly: true,
      description: "Team messaging",
    },
  ];

  // Filter items based on context
  const visibleNavItems = navItems.filter((item) => {
    if (item.soloOnly && !isSoloMode) return false;
    if (item.workspaceOnly && isSoloMode) return false;
    return true;
  });

  return (
    <div className="hidden lg:flex h-screen bg-slate-950/95 border-r border-slate-800 flex-col w-64 fixed left-0 top-0 z-40 backdrop-blur-sm" data-tour="sidebar">
      {/* Logo Header */}
      <div className="p-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <OmegaLogo className="w-10 h-10" />
          <div>
            <h1 className="text-slate-100">Omega Squadron</h1>
            <p className="text-xs text-slate-500">Trading Platform</p>
          </div>
        </div>

        {/* Context Switcher */}
        <WorkspaceContextSwitcher
          currentContext={currentContext}
          workspaces={workspaces}
          onContextChange={onContextChange}
          onBrowseWorkspaces={onBrowseWorkspaces}
          onCreateWorkspace={onCreateWorkspace}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            // Special styling for My Portfolio (emerald) vs others (cyan)
            const activeClass = item.id === "portfolio"
              ? 'bg-emerald-500/20 border-l-2 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : item.id === "squad-dashboard"
              ? 'bg-purple-500/20 border-l-2 border-purple-400 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              : 'bg-cyan-500/20 border-l-2 border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]';
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative
                  ${isActive 
                    ? activeClass
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                  }
                `}
                data-tour={item.id === "portfolio" ? "portfolio-link" : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
                {item.id === "portfolio" && (
                  <Sparkles className="w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        <Separator className="my-4 bg-slate-700/50" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => onPageChange("workspaces")}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${currentPage === "workspaces"
                ? 'bg-purple-500/20 border-l-2 border-purple-400 text-purple-400'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }
            `}
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm">Workspaces</span>
            {workspaces.filter(w => w.isActive).length > 0 && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onPageChange("settings")}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${currentPage === "settings"
                ? 'bg-cyan-500/20 border-l-2 border-cyan-400 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>

          {onStartTour && (
            <button
              onClick={onStartTour}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm">Take Tour</span>
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white text-xs font-mono">AC</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-slate-100 truncate">MoonShotKing</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-slate-500 truncate">Level 23</p>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <p className="text-xs text-slate-500">2,340 XP</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto hover:bg-slate-700"
            onClick={() => {/* TODO: Settings */}}
          >
            <Settings className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

