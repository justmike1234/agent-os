import React, { useState } from 'react';
import { X, Plus, Sparkles, Bot, Tag, ShieldAlert, Cpu, Zap } from 'lucide-react';
import { AgentInfo, Priority } from '../types';
import { getPriorityWeightGlow } from '../utils/helpers';

interface NewTaskModalProps {
  agents: AgentInfo[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    agentId: string;
    priority: Priority;
    priorityWeight?: number;
    tags: string[];
    autoStart: boolean;
  }) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  agents,
  isOpen,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState(agents[0]?.id || 'hermes-core');
  const [priority, setPriority] = useState<Priority>('high');
  const [priorityWeight, setPriorityWeight] = useState<number>(4);
  const [tagsInput, setTagsInput] = useState('research, autonomous');
  const [autoStart, setAutoStart] = useState(true);

  const weightGlow = getPriorityWeightGlow(priorityWeight) || getPriorityWeightGlow(3)!;

  const handlePriorityChange = (newPriority: Priority) => {
    setPriority(newPriority);
    if (newPriority === 'urgent') setPriorityWeight(5);
    else if (newPriority === 'high') setPriorityWeight(4);
    else if (newPriority === 'medium') setPriorityWeight(2);
    else if (newPriority === 'low') setPriorityWeight(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      description: description.trim() || 'Autonomous goal decomposition & multi-agent execution.',
      agentId,
      priority,
      priorityWeight,
      tags,
      autoStart
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Dispatch Autonomous Goal</h2>
              <p className="text-xs text-slate-400">Assign a new task to Hermes or fleet specialists</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 font-mono">Task / Goal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit Kubernetes ingress TLS configuration"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 font-mono">Description & Constraints</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, required tools, desired outputs, or safety constraints..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Agent Selection & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 font-mono">Assigned Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    @{a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 font-mono">Priority Tier</label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
          </div>

          {/* Priority Weight Configuration Setting with Color-Coded Glow Effect */}
          <div className="space-y-2.5 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${weightGlow.badgeClass}`}>
                  <Zap className="w-3 h-3" />
                </div>
                <label className="font-semibold text-slate-200 font-mono text-xs">
                  Priority Weight (Kanban Glow Aura)
                </label>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${weightGlow.badgeClass}`}>
                {weightGlow.label} • {weightGlow.colorName}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans">
              Configures visual emphasis and generates a color-coded luminous glow aura on the Kanban board.
            </p>

            {/* Slider & Quick Selection */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={priorityWeight}
                  onChange={(e) => setPriorityWeight(Number(e.target.value))}
                  className="flex-1 accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-slate-200 w-9 text-right bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {priorityWeight}/5
                </span>
              </div>

              {/* 5 Quick Select Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((w) => {
                  const cfg = getPriorityWeightGlow(w)!;
                  const isSelected = priorityWeight === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPriorityWeight(w)}
                      style={isSelected ? { boxShadow: cfg.glowBoxShadow } : undefined}
                      className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold border transition-all duration-200 flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? `${cfg.borderClass} ${cfg.badgeClass}`
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> W{w}
                      </span>
                      <span className="text-[8px] opacity-80 uppercase tracking-tighter">
                        {cfg.colorName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Board Preview Box */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                <span>KANBAN BOARD PREVIEW</span>
                <span className={weightGlow.textColor}>{weightGlow.description}</span>
              </div>

              <div 
                style={{ boxShadow: weightGlow.glowBoxShadow }}
                className={`relative p-2.5 rounded-lg bg-slate-900 border transition-all duration-300 overflow-hidden ${weightGlow.borderClass}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${weightGlow.accentBar}`} />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono border bg-slate-800 text-slate-300 border-slate-700">
                      {priority}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${weightGlow.badgeClass}`}>
                      <Zap className="w-2.5 h-2.5" />
                      {weightGlow.shortLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      {title || 'Example Goal Title'}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono ${weightGlow.textColor} font-semibold flex items-center gap-1 shrink-0`}>
                    <Sparkles className="w-2.5 h-2.5" /> {weightGlow.colorName} Glow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 font-mono">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. security, hitl-review, python, postgres"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Auto start toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoStart"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <label htmlFor="autoStart" className="text-slate-300 text-xs cursor-pointer select-none">
              Auto-claim and start executing immediately (slide to "Executing")
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Dispatch Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
