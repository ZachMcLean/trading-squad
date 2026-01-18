"use client";

/**
 * Workspaces Page - Browse, join, and manage workspaces
 * Central hub for discovering communities and managing your squads
 */

import { useState, useEffect } from "react";
import { Search, Plus, Users, Lock, Globe, TrendingUp, Award, MessageSquare, Filter, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: "private" | "public" | "request";
  memberCount: number;
  maxMembers: number;
  avgReturn: number;
  activeChallenges: number;
  messagesToday: number;
  isActive: boolean;
  isMember: boolean;
  category: string;
  avatarColor: string;
}

export default function WorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [myWorkspaces, setMyWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspace');
      const data = await response.json();
      
      // Transform API response to match Workspace interface
      const transformed = data.workspaces?.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description || "No description",
        type: w.type,
        memberCount: w.memberCount || 0,
        maxMembers: 100, // Default max
        avgReturn: 0, // TODO: Calculate from member data
        activeChallenges: 0, // TODO: Fetch from challenges API
        messagesToday: 0, // TODO: Fetch from activity API
        isActive: w.isActive || false,
        isMember: true, // User is always a member of their workspaces
        category: "Trading Squad",
        avatarColor: "from-purple-500 to-pink-500",
      })) || [];
      
      setMyWorkspaces(transformed);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const recommendedWorkspaces: Workspace[] = []; // TODO: Implement recommended workspaces

  const WorkspaceCard = ({ workspace }: { workspace: Workspace }) => {
    const getTypeIcon = () => {
      switch (workspace.type) {
        case "private":
          return <Lock className="w-4 h-4" />;
        case "public":
          return <Globe className="w-4 h-4" />;
        case "request":
          return <Users className="w-4 h-4" />;
      }
    };

    const getTypeText = () => {
      switch (workspace.type) {
        case "private":
          return "Private";
        case "public":
          return "Public";
        case "request":
          return "Request to Join";
      }
    };

    return (
      <Card className="border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/50 hover:border-cyan-500/50 transition-all group">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workspace.avatarColor} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-white truncate">{workspace.name}</h3>
                {workspace.isActive && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 mt-1.5" />
                )}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{workspace.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className={`text-sm ${workspace.avgReturn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {workspace.avgReturn > 0 ? '+' : ''}{workspace.avgReturn}%
                </span>
              </div>
              <p className="text-xs text-slate-500">Avg Return</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <Award className="w-3 h-3 text-yellow-400" />
                <span className="text-sm text-slate-300">{workspace.activeChallenges}</span>
              </div>
              <p className="text-xs text-slate-500">Challenges</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare className="w-3 h-3 text-cyan-400" />
                <span className="text-sm text-slate-300">{workspace.messagesToday}</span>
              </div>
              <p className="text-xs text-slate-500">Today</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                {getTypeIcon()}
                <span className="ml-1">{getTypeText()}</span>
              </Badge>
              <span className="text-xs text-slate-500 truncate">
                {workspace.memberCount} / {workspace.maxMembers} members
              </span>
            </div>
            {workspace.isMember ? (
              <Button size="sm" className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
                Enter
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-slate-600 hover:border-cyan-500 hover:text-cyan-400">
                {workspace.type === "request" ? "Request" : "Join"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="px-4 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-slate-100 mb-1">Workspaces</h1>
          <p className="text-slate-400">Discover and join trading communities</p>
        </div>
        <CreateWorkspaceDialog onWorkspaceCreated={fetchWorkspaces} />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="friends">Friends</SelectItem>
            <SelectItem value="tech">Technology</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="daytrading">Day Trading</SelectItem>
            <SelectItem value="value">Value Investing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-workspaces" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="my-workspaces">
            My Workspaces ({myWorkspaces.length})
          </TabsTrigger>
          <TabsTrigger value="recommended">
            Recommended
          </TabsTrigger>
          <TabsTrigger value="browse">
            Browse All
          </TabsTrigger>
        </TabsList>

        {/* My Workspaces */}
        <TabsContent value="my-workspaces" className="space-y-6 mt-6">
          {loading ? (
            <Card className="border-slate-700 bg-slate-900/50 p-12 text-center">
              <p className="text-slate-400">Loading workspaces...</p>
            </Card>
          ) : myWorkspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myWorkspaces.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
            </div>
          ) : (
            <Card className="border-slate-700 bg-slate-900/50 p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 mb-2">No Workspaces Yet</h3>
              <p className="text-slate-500 mb-6">
                Create your first workspace or join an existing community
              </p>
              <CreateWorkspaceDialog onWorkspaceCreated={fetchWorkspaces} />
            </Card>
          )}
        </TabsContent>

        {/* Recommended */}
        <TabsContent value="recommended" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendedWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        </TabsContent>

        {/* Browse All */}
        <TabsContent value="browse" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...myWorkspaces, ...recommendedWorkspaces]
              .filter((w) => !w.isMember)
              .map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
