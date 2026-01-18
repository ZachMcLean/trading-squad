"use client";

/**
 * Squad Dashboard - Team performance overview when in workspace mode
 * Shows team stats, leaderboard, activity feed
 */

import { useState } from "react";
import { useWorkspaceContext } from "@/lib/use-workspace-context";
import type { TimePeriod } from "@/lib/workspace-context";
import { InfoPills } from "@/components/info-pills";
import { SquadPortfolioChart } from "@/components/squad-portfolio-chart";
import { TeamPortfolios } from "@/components/team-portfolios";
import { ActivityFeed } from "@/components/activity-feed";

export default function SquadDashboardPage() {
  const { currentContext } = useWorkspaceContext();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("6M");

  // Get workspace ID from context (if not in solo mode)
  const workspaceId = currentContext.type !== "solo" ? currentContext.id : null;

  return (
    <>
      <InfoPills />
      
      <div className="px-4 sm:px-6 py-4 space-y-6">
        {/* Squad Portfolio Chart with Privacy-Aware Features */}
        <SquadPortfolioChart 
          workspaceId={workspaceId}
          selectedPeriod={selectedPeriod} 
          onPeriodChange={setSelectedPeriod}
          userPrivacyLevel="full" // TODO: Get from user settings
        />
        
        {/* Two Column Layout: Team Portfolios (2/3) + Activity Feed (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Portfolios - 2/3 width */}
          <div className="lg:col-span-2">
            <TeamPortfolios selectedPeriod={selectedPeriod} />
          </div>
          
          {/* Activity Feed Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </>
  );
}
