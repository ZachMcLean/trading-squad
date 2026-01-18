"use client";

import { createContext, useContext, useState, ReactNode } from "react";
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
  // TODO: Fetch workspaces from API
  // const { data: workspaces } = useQuery(['workspaces'], () => fetch('/api/workspaces').then(r => r.json()));
  const [workspaces] = useState<WorkspaceContextType[]>([]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentContext,
        setCurrentContext,
        workspaces,
        setWorkspaces: () => {}, // TODO: Implement when needed
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

