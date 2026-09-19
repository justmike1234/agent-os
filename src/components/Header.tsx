import React from 'react';
import { 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Code2, 
  Cpu, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Users,
  Search,
  Filter
} from 'lucide-react';
import { SystemMetrics, AgentInfo } from '../types';
import { formatTokens } from '../utils/helpers';

interface HeaderProps {
  metrics: SystemMetrics;
  agents: AgentInfo[];
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (val: number) => void;
  onOpenNewTask: () => void;
  onOpenApiModal: () => void;
  onOpenFleetModal: () => void;
  onResetDemo: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilterAgent: string;
  setActiveFilterAgent: (agentId: string) => void;
  activeFilterPriority: string;
  setActiveFilterPriority: (priority: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  agents,
  isSimulating,
  setIsSimulating,
  simulationSpeed,
  setSimulationSpeed,
  onOpenNewTask,
  onOpenApiModal,
  onOpenFleetModal,
  onResetDemo,
  searchQuery,
  setSearchQuery,
  activeFilterAgent,
  setActiveFilterAgent,
  activeFilterPriority,
  setActiveFilterPriority
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#05060b]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 py-4 shadow-2xl relative">
      {/* Top row: Brand & Telemetry Display */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
        {/* Brand & System Status */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white font-sans flex items-center gap-2">
              Hermes Agentic OS
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold tracking-wider">
                v4.2-STABLE
              </span>
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-500 tracking-wide">
            SYSTEM STATUS: NOMINAL // REASONING TELEMETRY & HUMAN-IN-THE-LOOP OVERSIGHT
          </p>
        </div>

        {/* Global Live Telemetry Stat Columns */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">
              Active Agents
            </p>
            <p className="text-xl font-mono text-blue-400 font-bold">
              {metrics.activeAgentsCount.toString().padStart(2, '0')}
              <span className="text-xs text-slate-600 font-normal ml-1">/{agents.length.toString().padStart(2, '0')}</span>
            </p>
          </div>

          <div className="text-right border-l border-slate-800/90 pl-4 sm:pl-6">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">
              Throughput
            </p>
            <p className="text-xl font-mono text-amber-400 font-bold">
              {metrics.tokensPerSec} <span className="text-xs text-slate-500 font-normal">tok/s</span>
            </p>
          </div>

          <div className="text-right border-l border-slate-800/90 pl-4 sm:pl-6">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">
              Daily Tokens
            </p>
            <p className="text-xl font-mono text-emerald-400 font-bold">
              {formatTokens(metrics.totalTokens)}
            </p>
          </div>

          <div className="text-right border-l border-slate-800/90 pl-4 sm:pl-6">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">
              Success Rate
            </p>
            <p className="text-xl font-mono text-purple-400 font-bold">
              {metrics.successRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
        {/* Left: Search & Filter options */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals, thoughts, tags..."
              className="w-full bg-slate-950/90 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 font-mono transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2">
            <select
              value={activeFilterAgent}
              onChange={(e) => setActiveFilterAgent(e.target.value)}
              className="bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/60 font-mono"
            >
              <option value="all">Fleet: All Units</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>@{a.name}</option>
              ))}
            </select>

            <select
              value={activeFilterPriority}
              onChange={(e) => setActiveFilterPriority(e.target.value)}
              className="bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/60 font-mono"
            >
              <option value="all">Priority: All</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>
        </div>

        {/* Right: Actions and Simulator controls */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          {/* Simulation Toggle & Speed */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800/80 rounded-lg p-1">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                isSimulating 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isSimulating ? "Pause autonomous simulation" : "Resume autonomous simulation"}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span>SIM: AUTO</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>SIM: PAUSED</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <div className="flex items-center gap-0.5 px-1">
              {[1, 2, 4].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    simulationSpeed === spd
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={`Set simulation speed to ${spd}x`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-lg transition-colors"
            title="Reset to default demo tasks and logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fleet Inspector Button */}
          <button
            onClick={onOpenFleetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-lg transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fleet Architecture</span>
          </button>

          {/* Python / Webhook Integration Guide */}
          <button
            onClick={onOpenApiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-lg transition-colors shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Connect Webhooks</span>
          </button>

          {/* New Autonomous Task Button */}
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)] rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch Goal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
