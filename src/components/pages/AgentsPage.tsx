import React from 'react';
import { AgentInfo } from '../../types';
import { Cpu, Wifi, WifiOff, Activity, ActivitySquare, TerminalSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface AgentsPageProps {
  agents: AgentInfo[];
}

export const AgentsPage: React.FC<AgentsPageProps> = ({ agents }) => {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-mono uppercase tracking-widest">
          <Cpu className="w-5 h-5 text-blue-400" />
          Agent Command Center
        </h1>
        <p className="text-sm text-slate-400 mt-2">Manage fleet connection status, capability profiles, and live execution metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent, i) => {
          const isOnline = agent.connectionStatus === 'online';
          const isDegraded = agent.connectionStatus === 'degraded';
          const isOffline = agent.connectionStatus === 'offline';

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={agent.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col backdrop-blur-md relative"
            >
              {/* Connection Status Banner */}
              <div className={`h-1.5 w-full ${isOnline ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.avatarColor} p-2 flex items-center justify-center shadow-lg shadow-black/50`}>
                      <span className="text-white font-bold">{agent.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{agent.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">{agent.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isDegraded ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isOnline ? <Wifi className="w-3 h-3" /> : isDegraded ? <ActivitySquare className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {agent.connectionStatus}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{agent.pingMs}ms ping</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">State</div>
                    <div className="text-xs text-slate-300 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50 inline-block">
                      {agent.state.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Model Engine</div>
                    <div className="text-xs text-blue-400 font-mono">{agent.model}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-1.5 flex items-center gap-1">
                      <TerminalSquare className="w-3 h-3" /> Tools Available
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools.map(tool => (
                        <span key={tool} className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-900/20 text-blue-300 border border-blue-800/30 rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase">Tasks Completed</div>
                    <div className="text-lg font-bold text-emerald-400">{agent.completedTasksCount}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase">Tokens Processed</div>
                    <div className="text-lg font-bold text-purple-400">{(agent.totalTokensUsed / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
