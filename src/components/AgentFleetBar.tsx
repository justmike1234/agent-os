import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Brain, 
  Search, 
  Code, 
  ShieldAlert, 
  FileText, 
  Cpu, 
  Zap, 
  PauseCircle, 
  PlayCircle,
  Clock,
  RefreshCw,
  Database
} from 'lucide-react';
import { AgentInfo, AgentTask } from '../types';
import { formatTokens } from '../utils/helpers';

interface AgentFleetBarProps {
  agents: AgentInfo[];
  tasks: AgentTask[];
  onSelectAgent: (agentId: string) => void;
  selectedAgentId: string;
  onToggleAgentPause: (agentId: string) => void;
  onAgentAction?: (agentId: string, action: 'restart' | 'clear_cache') => void;
}

export const AgentFleetBar: React.FC<AgentFleetBarProps> = ({
  agents,
  tasks,
  onSelectAgent,
  selectedAgentId,
  onToggleAgentPause,
  onAgentAction
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; agentId: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, agentId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      agentId
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-4 h-4 text-white" />;
      case 'Search': return <Search className="w-4 h-4 text-white" />;
      case 'Code': return <Code className="w-4 h-4 text-white" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-white" />;
      case 'FileText': return <FileText className="w-4 h-4 text-white" />;
      default: return <Bot className="w-4 h-4 text-white" />;
    }
  };

  const getStatusDot = (state: string) => {
    switch (state) {
      case 'executing':
        return <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />;
      case 'review_pending':
        return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />;
      case 'paused':
        return <span className="w-2 h-2 rounded-full bg-slate-500" />;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-rose-400" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
    }
  };

  return (
    <div className="bg-[#05060b]/70 border-b border-slate-800/80 backdrop-blur-md px-4 lg:px-6 py-2.5 overflow-x-auto relative z-10">
      <div className="flex items-center gap-3 min-w-max">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5 pr-3 border-r border-slate-800/80">
          <Bot className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Fleet</span>
        </div>

        {/* Fleet cards */}
        {agents.map(agent => {
          const isSelected = selectedAgentId === agent.id;
          const currentTask = tasks.find(t => t.id === agent.currentTaskId);
          const isExecuting = agent.state === 'executing';

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id === selectedAgentId ? 'all' : agent.id)}
              onContextMenu={(e) => handleContextMenu(e, agent.id)}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-950/60 border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Avatar with gradient */}
              <div className="relative">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${agent.avatarColor} flex items-center justify-center shadow-md`}>
                  {getIcon(agent.iconName)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-950 flex items-center justify-center">
                  {getStatusDot(agent.state)}
                </div>
              </div>

              {/* Agent info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 font-mono">@{agent.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({agent.model.split('-')[0]})</span>
                  {isExecuting && (
                    <Cpu className="w-3 h-3 text-blue-400 animate-spin-slow ml-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="truncate max-w-[120px]">{agent.role}</span>
                  <span className="text-slate-700">•</span>
                  <span className="text-emerald-400/90">{formatTokens(agent.totalTokensUsed)} tok</span>
                </div>
              </div>

              {/* Quick toggle pause/active */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAgentPause(agent.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-1 transition-opacity ml-1"
                title={agent.state === 'paused' ? "Resume agent" : "Pause agent"}
              >
                {agent.state === 'paused' ? (
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Menu Render */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl shadow-black overflow-hidden py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onAgentAction?.(contextMenu.agentId, 'restart');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-xs font-mono text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            Force Restart
          </button>
          <button
            onClick={() => {
              onAgentAction?.(contextMenu.agentId, 'clear_cache');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 text-xs font-mono text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
};
