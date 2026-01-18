"use client";

/**
 * Workspace Context Provider
 * 
 * SOLO-FIRST APPROACH:
 * - App defaults to solo mode (personal portfolio)
 * - Users can use all features without joining a workspace
 * - Workspaces/squads are opt-in - user must manually switch
 * - Never auto-select workspaces, even if user has them
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { WorkspaceContext as WorkspaceContextType, getDefaultSoloContext } from "./workspace-context";

interface WorkspaceContextValue {
  currentContext: WorkspaceContextType;
  setCurrentContext: (context: WorkspaceContextType) => void;
  workspaces: WorkspaceContextType[];
  setWorkspaces: (workspaces: WorkspaceContextType[]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // Always start in solo mode - never auto-select workspaces
  const [currentContext, setCurrentContext] = useState<WorkspaceContextType>(
    getDefaultSoloContext()
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceContextType[]>([]);

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Keep user in solo mode by default - they can manually switch to workspaces
  // This ensures the app is solo-first
  useEffect(() => {
    if (workspaces.length > 0 && currentContext.type === "solo") {
      console.log("WorkspaceProvider - user has workspaces but staying in solo mode (solo-first approach)");
      // Never auto-select workspaces - user must manually switch
    }
  }, [workspaces, currentContext.type]);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspace');
      const data = await response.json();
      
      const transformed = data.workspaces?.map((w: any) => ({
        id: w.id,
        name: w.name,
        type: w.type.toLowerCase(),
        memberCount: w.memberCount || 0,
        isActive: w.isActive || false,
      })) || [];
      
      console.log("WorkspaceProvider - fetched workspaces:", transformed);
      setWorkspaces(transformed);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentContext,
        setCurrentContext,
        workspaces,
        setWorkspaces: (newWorkspaces) => setWorkspaces(newWorkspaces),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider"
    );
  }
  return context;
}

