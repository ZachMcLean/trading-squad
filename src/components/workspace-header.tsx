"use client";

/**
 * Workspace Header - Page header with title, description, and user actions
 * Displays notifications, settings, and profile dropdown
 */

import { Settings, Bell, LogOut, User, CreditCard, Shield, HelpCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OmegaLogo } from "@/components/illustrations/OmegaLogo";
// TODO: Avatar components need to be ported from v11.2
// import { OmegaPilotAvatar } from "@/components/avatar/OmegaPilotAvatar";
// import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
// import { useAvatarConfig } from "@/components/avatar/useAvatarConfig";

interface WorkspaceHeaderProps {
  // Props kept for backward compatibility but not currently used
  pageTitle?: string;
  pageDescription?: string;
}

export function WorkspaceHeader({}: WorkspaceHeaderProps) {
  // TODO: Re-enable when avatar components are ported
  // const avatarConfig = useAvatarConfig();

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/30 to-transparent sticky top-0 z-30 backdrop-blur-sm">
      {/* Left: Brand Logo + Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 rounded-full" />
          <OmegaLogo className="relative w-9 h-9 sm:w-10 sm:h-10" />
        </div>
        <div>
          <h1 className="text-slate-100 text-lg sm:text-xl font-semibold leading-tight">TradingSquad</h1>
          <p className="text-xs text-slate-500 leading-tight hidden sm:block">Cooperative Trading Platform</p>
        </div>
      </div>

      {/* Right: User Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
            <div className="p-3 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white">Notifications</h3>
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                  3 new
                </Badge>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer flex-col items-start p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span className="text-sm">TechQueenGG added TSLA position</span>
                </div>
                <span className="text-xs text-slate-500 ml-4">2 minutes ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer flex-col items-start p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm">Squad portfolio hit $1M milestone!</span>
                </div>
                <span className="text-xs text-slate-500 ml-4">1 hour ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer flex-col items-start p-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">New challenge: Beat the S&P500</span>
                </div>
                <span className="text-xs text-slate-500 ml-4">3 hours ago</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
            <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              App Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
              <Bell className="w-4 h-4 mr-2" />
              Notification Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Widget */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700/50 pl-2 pr-3"
            >
              <Avatar className="w-8 h-8 border-2 border-cyan-500/30">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-500 text-white text-xs font-mono">
                  FP
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm text-white">FlippinPsycho98</span>
                <span className="text-xs text-slate-400">Zach</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-slate-900 border-slate-700">
            {/* Profile Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 border-2 border-cyan-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-500 text-white text-sm font-mono">
                    FP
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-white font-medium">FlippinPsycho98</div>
                  <div className="text-xs text-slate-400">Zach</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-400">Portfolio Value</div>
                  <div className="text-sm text-white font-mono">$75,269</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Today's P&L</div>
                  <div className="text-sm text-emerald-400 font-mono">+$1,891</div>
                </div>
              </div>
            </div>

            {/* Profile & Account */}
            <div className="py-1">
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              {/* TODO: Re-enable when AvatarCustomizer is ported */}
              {/* <AvatarCustomizer
                currentConfig={avatarConfig.config}
                onSave={avatarConfig.saveConfig}
                trigger={
                  <div className="flex items-center w-full px-2 py-1.5 hover:bg-slate-800 rounded-sm cursor-pointer text-slate-300 hover:text-white">
                    <User className="w-4 h-4 mr-2" />
                    <span>Customize Pilot Avatar</span>
                  </div>
                }
              /> */}
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing & Subscription
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Security & Support */}
            <div className="py-1">
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <Shield className="w-4 h-4 mr-2" />
                Security & Privacy
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Documentation
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-slate-700" />

            {/* Logout */}
            <div className="py-1">
              <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
