import React, { useMemo } from 'react';
import { SystemMetrics, AgentInfo } from '../types';
import { Activity, Zap, ShieldAlert, Cpu, CheckCircle2, TerminalSquare, TrendingUp } from 'lucide-react';
import { formatTokens } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const generateTrendData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}m`,
    efficiency: 60 + Math.floor(Math.random() * 40),
    throughput: 150 + Math.floor(Math.random() * 200)
  }));
};

interface CommandCenterStatsProps {
  metrics: SystemMetrics;
  agents: AgentInfo[];
}

export const CommandCenterStats: React.FC<CommandCenterStatsProps> = ({ metrics, agents }) => {
  const trendData = useMemo(() => generateTrendData(), []);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-950/80 border-r border-slate-800/80 p-4 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-emerald-400" />
          Command Center
        </h2>
        <p className="text-[10px] text-slate-400 font-mono">System Telemetry & Analytics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Active Agents
          </div>
          <span className="text-2xl font-bold text-white">{metrics.activeAgentsCount}<span className="text-sm text-slate-500 font-normal"> / {agents.length}</span></span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Tasks Executing
          </div>
          <span className="text-2xl font-bold text-white">{metrics.executingTasksCount}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Review Pending
          </div>
          <span className="text-2xl font-bold text-white">{metrics.reviewPendingCount}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Success Rate
          </div>
          <span className="text-2xl font-bold text-white">{metrics.successRate}%</span>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-2">
          Resource Utilization
        </h3>
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">Total Tokens:</span>
            <span className="text-cyan-400 font-bold">{formatTokens(metrics.totalTokens)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">Throughput (TPS):</span>
            <span className="text-emerald-400 font-bold">{metrics.tokensPerSec} t/s</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">Avg Latency:</span>
            <span className="text-amber-400 font-bold">{metrics.avgLatencyMs}ms</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">Memory Usage:</span>
            <span className="text-purple-400 font-bold">{metrics.memoryUsageMb} MB</span>
          </div>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          Efficiency Trend
        </h3>
        <div className="h-32 w-full mt-2 bg-slate-900/40 rounded-xl border border-slate-800/60 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '10px', borderRadius: '8px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Line type="monotone" dataKey="efficiency" stroke="#38bdf8" strokeWidth={2} dot={false} name="Efficiency %" />
              <Line type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={2} dot={false} name="Tokens/s" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tool / Skill Usage */}
      <div className="space-y-3 flex-1">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-2">
          Top Skills & Tools Invocations
        </h3>
        <div className="space-y-2">
          {metrics.toolUsage?.slice(0, 6).map((tool, idx) => {
            const maxUses = metrics.toolUsage ? metrics.toolUsage[0].uses : 1;
            const pct = Math.max(5, Math.round((tool.uses / maxUses) * 100));
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <TerminalSquare className="w-3 h-3 text-blue-500" />
                    {tool.name}
                  </span>
                  <span className="text-slate-500">{tool.uses}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500/80 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
