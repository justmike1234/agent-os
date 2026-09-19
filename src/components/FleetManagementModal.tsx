import React, { useState } from 'react';
import { X, Users, Bot, Cpu, Zap, ShieldAlert, Sliders, PlayCircle, PauseCircle, Plus } from 'lucide-react';
import { AgentInfo } from '../types';
import { formatTokens } from '../utils/helpers';

interface FleetManagementModalProps {
  agents: AgentInfo[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateAgent: (agentId: string, updates: Partial<AgentInfo>) => void;
  onToggleAgentPause: (agentId: string) => void;
}

export const FleetManagementModal: React.FC<FleetManagementModalProps> = ({
  agents,
  isOpen,
  onClose,
  onUpdateAgent,
  onToggleAgentPause
}) => {
  if (!isOpen) return null;

  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Agent Fleet & Architecture</h2>
              <p className="text-xs text-slate-400">Inspect system prompts, tool assignments, and runtime hyperparameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fleet Grid / Split View */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Agent list */}
          <div className="border-r border-slate-800 p-4 space-y-2 overflow-y-auto bg-slate-950/40">
            <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
              Fleet Units ({agents.length})
            </div>
            {agents.map(agent => {
              const isSelected = agent.id === selectedAgent?.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500/60 ring-1 ring-blue-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${agent.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {agent.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 font-mono">@{agent.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{agent.role}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${
                    agent.state === 'executing' 
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' 
                      : agent.state === 'review_pending'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {agent.state.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Agent Inspector Details */}
          {selectedAgent && (
            <div className="col-span-2 p-6 overflow-y-auto space-y-5 text-xs">
              {/* Header card */}
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${selectedAgent.avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                    {selectedAgent.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">@{selectedAgent.name}</h3>
                    <p className="text-xs text-slate-400">{selectedAgent.role}</p>
                    <p className="text-[11px] text-cyan-400 font-mono mt-0.5">Model: {selectedAgent.model}</p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleAgentPause(selectedAgent.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    selectedAgent.state === 'paused'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {selectedAgent.state === 'paused' ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  <span>{selectedAgent.state === 'paused' ? 'Resume Unit' : 'Pause Unit'}</span>
                </button>
              </div>

              {/* System Prompt */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                  System Prompt & Invariants
                </label>
                <textarea
                  rows={4}
                  value={selectedAgent.systemPrompt}
                  onChange={(e) => onUpdateAgent(selectedAgent.id, { systemPrompt: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              {/* Toolkits */}
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                  Assigned Tools ({selectedAgent.tools.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools.map((t, idx) => (
                    <span key={idx} className="bg-slate-950 border border-cyan-800/60 text-cyan-300 px-2.5 py-1 rounded-lg font-mono text-xs shadow-sm">
                      ⚡ {t}()
                    </span>
                  ))}
                </div>
              </div>

              {/* Telemetry Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-mono">Completed Tasks</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{selectedAgent.completedTasksCount}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-mono">Tokens Ingested</p>
                  <p className="text-base font-bold text-cyan-400 font-mono">{formatTokens(selectedAgent.totalTokensUsed)}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-mono">Temperature</p>
                  <p className="text-base font-bold text-purple-400 font-mono">{selectedAgent.temperature}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Fleet Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
