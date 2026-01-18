"use client";

/**
 * My Portfolio - Multi-Account Portfolio Dashboard
 * 
 * This is the SOLO-FOCUSED personal dashboard - users can use the app
 * without joining any workspaces. Workspace/squad features are opt-in.
 * 
 * Comprehensive tracking across all brokerage accounts with advanced analytics.
 */

import { useState } from "react";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Target, Award, Sparkles, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioChart } from "@/components/portfolio-chart";
import { AccountPortfolios } from "@/components/account-portfolios";
import { PersonalActivityFeed } from "@/components/personal-activity-feed";
// TODO: These components need to be ported from v11.2
// import { SectorAllocation, PositionAnalysis, CorrelationMatrix, ConcentrationRisk, RiskMetrics } from "@/components/portfolio-analytics";
// import { InfoPills } from "@/components/InfoPills";

type TimePeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "YTD";

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("6M");

  // Combined portfolio summary across all accounts
  const totalValue = 99269.87;
  const totalCost = 72654.00;
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = (totalPnL / totalCost) * 100;
  const todayChange = -421.35;
  const todayChangePercent = -0.42;

  // All holdings across all accounts
  const holdings = [
    { symbol: "NVDA", name: "NVIDIA Corp.", shares: 25, avgCost: 425.80, currentPrice: 495.30, sector: "Technology", account: "Robinhood" },
    { symbol: "MSFT", name: "Microsoft Corp.", shares: 35, avgCost: 332.10, currentPrice: 378.25, sector: "Technology", account: "Fidelity" },
    { symbol: "AAPL", name: "Apple Inc.", shares: 50, avgCost: 175.20, currentPrice: 189.45, sector: "Technology", account: "Robinhood" },
    { symbol: "TSLA", name: "Tesla Inc.", shares: 40, avgCost: 242.50, currentPrice: 251.80, sector: "Automotive", account: "TD Ameritrade" },
    { symbol: "GOOGL", name: "Alphabet Inc.", shares: 30, avgCost: 138.90, currentPrice: 145.20, sector: "Technology", account: "Robinhood" },
    { symbol: "AMZN", name: "Amazon.com Inc.", shares: 45, avgCost: 142.30, currentPrice: 156.75, sector: "E-commerce", account: "Fidelity" },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 40, avgCost: 405.20, currentPrice: 421.00, sector: "Index Fund", account: "Fidelity" },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", shares: 20, avgCost: 418.00, currentPrice: 438.00, sector: "Index Fund", account: "TD Ameritrade" },
  ];

  const calculatePnL = (shares: number, avgCost: number, currentPrice: number) => {
    const totalCost = shares * avgCost;
    const currentValue = shares * currentPrice;
    const pnl = currentValue - totalCost;
    const pnlPercent = (pnl / totalCost) * 100;
    return { pnl, pnlPercent, currentValue };
  };

  return (
    <>
      {/* TODO: Add InfoPills component */}
      
      <div className="px-4 sm:px-6 py-4 space-y-6">
        {/* Portfolio Chart */}
        <div data-tour="portfolio-chart">
          <PortfolioChart selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} mode="solo" />
        </div>

        {/* Two Column Layout: Account Portfolios (2/3) + Activity Feed (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Portfolios - 2/3 width */}
          <div className="lg:col-span-2" data-tour="account-portfolios">
            <AccountPortfolios selectedPeriod={selectedPeriod} />
          </div>
          
          {/* Personal Activity Feed Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <PersonalActivityFeed />
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tour="analytics-tabs">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-slate-800/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-slate-700">
              Positions
            </TabsTrigger>
            <TabsTrigger value="sectors" className="data-[state=active]:bg-slate-700">
              Sectors
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-slate-700">
              Risk
            </TabsTrigger>
            <TabsTrigger value="correlation" className="data-[state=active]:bg-slate-700">
              Correlation
            </TabsTrigger>
            <TabsTrigger value="concentration" className="data-[state=active]:bg-slate-700">
              Concentration
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TODO: Add SectorAllocation and ConcentrationRisk components */}
              <Card className="border-slate-700/50 bg-slate-800/30 p-6">
                <p className="text-slate-400">Sector Allocation - Component needs to be ported</p>
              </Card>
              <Card className="border-slate-700/50 bg-slate-800/30 p-6">
                <p className="text-slate-400">Concentration Risk - Component needs to be ported</p>
              </Card>
            </div>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-6 mt-6">
            {/* Holdings Table */}
            <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-700/50">
                <h3 className="text-white">All Holdings</h3>
                <p className="text-slate-400 text-sm">Consolidated view across all accounts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="text-left p-4 text-slate-400 text-sm">Symbol</th>
                      <th className="text-left p-4 text-slate-400 text-sm hidden md:table-cell">Company</th>
                      <th className="text-left p-4 text-slate-400 text-sm hidden lg:table-cell">Account</th>
                      <th className="text-right p-4 text-slate-400 text-sm">Shares</th>
                      <th className="text-right p-4 text-slate-400 text-sm hidden sm:table-cell">Avg Cost</th>
                      <th className="text-right p-4 text-slate-400 text-sm">Price</th>
                      <th className="text-right p-4 text-slate-400 text-sm">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => {
                      const { pnl, pnlPercent, currentValue } = calculatePnL(holding.shares, holding.avgCost, holding.currentPrice);
                      const isPositive = pnl >= 0;
                      
                      return (
                        <tr key={`${holding.symbol}-${holding.account}`} className="border-b border-slate-800 hover:bg-slate-700/20 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-mono text-slate-100">{holding.symbol}</p>
                              <p className="text-xs text-slate-500 md:hidden">{holding.name}</p>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 hidden md:table-cell">{holding.name}</td>
                          <td className="p-4 hidden lg:table-cell">
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                              {holding.account}
                            </Badge>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-300">{holding.shares}</td>
                          <td className="p-4 text-right font-mono text-slate-400 text-sm hidden sm:table-cell">
                            ${holding.avgCost.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-100">
                            ${holding.currentPrice.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <div className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                              <p className="font-mono text-sm">
                                {isPositive ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                              </p>
                              <p className="font-mono text-xs">
                                {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="space-y-6 mt-6">
            {/* TODO: Add SectorAllocation component */}
            <Card className="border-slate-700/50 bg-slate-800/30 p-6">
              <p className="text-slate-400">Sector Allocation - Component needs to be ported</p>
            </Card>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6 mt-6">
            {/* TODO: Add RiskMetrics component */}
            <Card className="border-slate-700/50 bg-slate-800/30 p-6">
              <p className="text-slate-400">Risk Metrics - Component needs to be ported</p>
            </Card>
          </TabsContent>

          {/* Correlation Tab */}
          <TabsContent value="correlation" className="space-y-6 mt-6">
            {/* TODO: Add CorrelationMatrix component */}
            <Card className="border-slate-700/50 bg-slate-800/30 p-6">
              <p className="text-slate-400">Correlation Matrix - Component needs to be ported</p>
            </Card>
          </TabsContent>

          {/* Concentration Tab */}
          <TabsContent value="concentration" className="space-y-6 mt-6">
            {/* TODO: Add ConcentrationRisk component */}
            <Card className="border-slate-700/50 bg-slate-800/30 p-6">
              <p className="text-slate-400">Concentration Risk - Component needs to be ported</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
