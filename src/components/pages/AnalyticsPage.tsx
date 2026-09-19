import React from 'react';
import { SystemMetrics, AgentLog, AgentTask } from '../../types';
import { BarChart3, TrendingUp, Zap, Target, Download, Clock, Activity, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { ActivityHeatmap } from '../ActivityHeatmap';

interface AnalyticsPageProps {
  metrics: SystemMetrics;
  logs: AgentLog[];
  tasks: AgentTask[];
}

const generatePerformanceData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    tokens: 15000 + Math.random() * 10000,
    latency: 800 + Math.random() * 400,
    success: 90 + Math.random() * 10
  }));
};

const generateProjectionData = () => {
  const data = [];
  let currentOccupancy = 65 + Math.random() * 15;
  for (let i = -12; i <= 12; i++) {
    const timeLabel = i === 0 ? 'Now' : i < 0 ? `T${i}h` : `T+${i}h`;
    if (i <= 0) {
      data.push({ 
        time: timeLabel, 
        historical: currentOccupancy, 
        projected: i === 0 ? currentOccupancy : null 
      });
      currentOccupancy += (Math.random() - 0.5) * 12;
      currentOccupancy = Math.max(10, Math.min(95, currentOccupancy));
    } else {
      const projectedOccupancy = currentOccupancy + (Math.random() - 0.4) * 15;
      data.push({ 
        time: timeLabel, 
        historical: null, 
        projected: Math.max(10, Math.min(100, projectedOccupancy)) 
      });
      currentOccupancy = projectedOccupancy;
    }
  }
  return data;
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ metrics, logs, tasks }) => {
  const perfData = React.useMemo(() => generatePerformanceData(), []);
  const projectionData = React.useMemo(() => generateProjectionData(), []);

  const handleExportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      tasks,
      logs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-analytics-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#05060b]">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-widest">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            System Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-2">Aggregated fleet performance and execution statistics.</p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border border-slate-700 hover:border-slate-600 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export Data
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> System Throughput</div>
          <div className="text-3xl font-bold text-white">{metrics.tokensPerSec}<span className="text-sm text-slate-500 ml-1">tokens/s</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-emerald-400" /> Success Rate</div>
          <div className="text-3xl font-bold text-white">{metrics.successRate}<span className="text-sm text-slate-500 ml-1">%</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Total Tokens</div>
          <div className="text-3xl font-bold text-white">{(metrics.totalTokens / 1000).toFixed(1)}<span className="text-sm text-slate-500 ml-1">k</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-rose-400" /> Avg Latency</div>
          <div className="text-3xl font-bold text-white">{metrics.avgLatencyMs}<span className="text-sm text-slate-500 ml-1">ms</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Volume Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 font-mono uppercase mb-4">Token Processing Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="tokens" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projected Agent Occupancy Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 font-mono uppercase mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><LineChartIcon className="w-4 h-4 text-emerald-400" /> Projected Agent Occupancy</span>
            <span className="text-[9px] text-slate-500 font-normal">Historical vs. Estimated Future</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }} 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                <Line 
                  type="monotone" 
                  dataKey="historical" 
                  name="Historical" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  name="Projected" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false} 
                  activeDot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
        {/* Tool Usage Bar Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 font-mono uppercase mb-4">Tool Invocation Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.toolUsage || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }} cursor={{ fill: '#0f172a' }} />
                <Bar dataKey="uses" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-Hour Activity Heatmap */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-300 font-mono uppercase mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            24-Hour Agent Workload Heatmap
          </h3>
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  );
};
