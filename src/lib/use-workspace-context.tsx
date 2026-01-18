"use client";

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
  const [currentContext, setCurrentContext] = useState<WorkspaceContextType>(
    getDefaultSoloContext()
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceContextType[]>([]);

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Auto-select first workspace if user has workspaces and is in solo mode
  useEffect(() => {
    if (workspaces.length > 0 && currentContext.type === "solo") {
      console.log("WorkspaceProvider - auto-selecting first workspace:", workspaces[0]);
      // Optionally auto-select the first workspace
      // Uncomment to enable auto-selection:
      // setCurrentContext(workspaces[0]);
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

