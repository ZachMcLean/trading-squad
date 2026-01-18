"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar, type PageId } from "@/components/app-sidebar";
import { WorkspaceContext, getDefaultSoloContext, isSoloMode } from "@/lib/workspace-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import { WorkspaceProvider } from "@/lib/use-workspace-context";
import { BottomNavigation } from "@/components/bottom-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Default to Solo Mode
  const [currentContext, setCurrentContext] = useState<WorkspaceContext>(
    getDefaultSoloContext()
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceContext[]>([]);

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, []);

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
      
      setWorkspaces(transformed);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  // Map pathname to PageId
  const getCurrentPage = (): PageId => {
    if (pathname === "/portfolio" || pathname === "/") return "portfolio";
    if (pathname.startsWith("/squad-dashboard")) return "squad-dashboard";
    if (pathname.startsWith("/news")) return "news";
    if (pathname.startsWith("/algorithm")) return "algorithm";
    if (pathname.startsWith("/challenges")) return "challenges";
    if (pathname.startsWith("/terminal")) return "terminal";
    if (pathname.startsWith("/chat")) return "chat";
    if (pathname.startsWith("/watchlist")) return "watchlist";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/workspaces")) return "workspaces";
    return "portfolio";
  };

  const currentPage = getCurrentPage();

  // Handle page navigation
  const handlePageChange = (page: PageId) => {
    switch (page) {
      case "portfolio":
        router.push("/portfolio");
        break;
      case "squad-dashboard":
        router.push("/squad-dashboard");
        break;
      case "news":
        router.push("/news");
        break;
      case "algorithm":
        router.push("/algorithm");
        break;
      case "challenges":
        router.push("/challenges");
        break;
      case "terminal":
        router.push("/terminal");
        break;
      case "watchlist":
        router.push("/watchlist");
        break;
      case "chat":
        router.push("/chat");
        break;
      case "settings":
        router.push("/settings");
        break;
      case "workspaces":
        router.push("/workspaces");
        break;
    }
  };

  // Handle workspace context changes
  const handleContextChange = (context: WorkspaceContext) => {
    setCurrentContext(context);
    // If switching to workspace and on portfolio, switch to squad dashboard
    if (context.type !== "solo" && currentPage === "portfolio") {
      router.push("/squad-dashboard");
    }
    // If switching to solo and on squad dashboard, switch to portfolio
    if (context.type === "solo" && currentPage === "squad-dashboard") {
      router.push("/portfolio");
    }
  };

  const handleBrowseWorkspaces = () => {
    router.push("/workspaces");
  };

  const handleCreateWorkspace = () => {
    // TODO: Open create workspace modal or navigate to create page
    console.log("Create workspace");
  };

  // Get page metadata
  const getPageMetadata = () => {
    const isSolo = isSoloMode(currentContext);
    switch (currentPage) {
      case "portfolio":
        return {
          title: "My Portfolio",
          description: "Your personal command center",
        };
      case "squad-dashboard":
        return {
          title: `${currentContext.name} Dashboard`,
          description: "Team performance and activity",
        };
      case "news":
        return {
          title: "News & Intel",
          description: "Market news and analysis",
        };
      case "algorithm":
        return {
          title: "Algorithm Lab",
          description: "Build & test trading algorithms",
        };
      case "challenges":
        return {
          title: isSolo ? "Challenges" : "Squad Challenges",
          description: isSolo
            ? "Solo quests and achievements"
            : "Team competitions and rankings",
        };
      case "terminal":
        return {
          title: "Trading Terminal",
          description: "Charts & technical analysis",
        };
      case "chat":
        return {
          title: "Squad Chat",
          description: "Team messaging",
        };
      case "watchlist":
        return {
          title: "Watchlist",
          description: "Track stocks you're interested in",
        };
      case "settings":
        return {
          title: "Settings",
          description: "Manage your privacy and preferences",
        };
      case "workspaces":
        return {
          title: "Workspaces",
          description: "Browse and manage your workspaces",
        };
      default:
        return {
          title: "Dashboard",
          description: "",
        };
    }
  };

  const pageMetadata = getPageMetadata();

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-slate-950">
        {/* Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          currentContext={currentContext}
          workspaces={workspaces}
          onContextChange={handleContextChange}
          onBrowseWorkspaces={handleBrowseWorkspaces}
          onCreateWorkspace={handleCreateWorkspace}
        />

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen">
          <WorkspaceHeader
            pageTitle={pageMetadata.title}
            pageDescription={pageMetadata.description}
          />
          <div className="pb-20 lg:pb-0">{children}</div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        <BottomNavigation />
      </div>
    </WorkspaceProvider>
  );
}

