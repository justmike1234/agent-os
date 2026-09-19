import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  MessageSquareQuote, 
  Check, 
  Tag, 
  Layers, 
  Bot,
  Flame,
  ArrowRight,
  UserCheck,
  UserPlus,
  Edit3,
  Save,
  Sparkles,
  Zap
} from 'lucide-react';
import { AgentTask, AgentInfo, TaskStatus, Priority } from '../types';
import { getPriorityBadge, getStatusInfo, formatTokens, getPriorityWeightGlow } from '../utils/helpers';

interface TaskDetailModalProps {
  task: AgentTask | null;
  agents: AgentInfo[];
  onClose: () => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAssignAgent?: (taskId: string, agentId: string) => void;
  onHumanReview: (taskId: string, approved: boolean, notes?: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<AgentTask>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  agents,
  onClose,
  onMoveStatus,
  onAssignAgent,
  onHumanReview,
  onUpdateTask,
  onDeleteTask
}) => {
  if (!task) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'thoughts' | 'tools' | 'steps'>('overview');
  const [operatorNote, setOperatorNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editPriorityWeight, setEditPriorityWeight] = useState<number>(task.priorityWeight ?? 3);
  const [editAgentId, setEditAgentId] = useState<string>(task.agentId);
  const [editTags, setEditTags] = useState<string>(task.tags.join(', '));

  const agent = agents.find(a => a.id === task.agentId);
  const statusInfo = getStatusInfo(task.status);
  const priorityStyle = getPriorityBadge(task.priority);
  const weightGlow = getPriorityWeightGlow(isEditing ? editPriorityWeight : (task.priorityWeight ?? 3));

  const handleAgentChange = (newAgentId: string) => {
    if (onAssignAgent) {
      onAssignAgent(task.id, newAgentId);
    } else {
      onUpdateTask(task.id, { agentId: newAgentId });
    }
  };

  const handleSaveEdit = () => {
    const parsedTags = editTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onUpdateTask(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      priorityWeight: editPriorityWeight,
      agentId: editAgentId,
      tags: parsedTags.length > 0 ? parsedTags : task.tags
    });

    if (editAgentId !== task.agentId && onAssignAgent) {
      onAssignAgent(task.id, editAgentId);
    }

    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded">
                {task.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                {priorityStyle.label} Priority
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                {statusInfo.label}
              </span>
              {weightGlow && (
                <span 
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${weightGlow.badgeClass}`}
                  title={`Priority Weight: ${isEditing ? editPriorityWeight : (task.priorityWeight ?? 3)}/5 - ${weightGlow.description}`}
                >
                  <Zap className="w-3 h-3" />
                  {weightGlow.shortLabel} • {weightGlow.colorName}
                </span>
              )}
              {agent && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/70 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  @{agent.name}
                </span>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-base font-bold text-white bg-slate-950 border border-blue-500/60 rounded-lg p-2 focus:outline-none"
              />
            ) : (
              <h2 className="text-lg font-bold text-white leading-tight">
                {task.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditTitle(task.title);
                  setEditDescription(task.description);
                  setEditPriority(task.priority);
                  setEditPriorityWeight(task.priorityWeight ?? 3);
                  setEditAgentId(task.agentId);
                  setEditTags(task.tags.join(', '));
                }
                setIsEditing(!isEditing);
              }}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-mono font-semibold ${
                isEditing
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isEditing ? 'Cancel edit' : 'Edit task details'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Task'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-mono">
          {[
            { id: 'overview', label: 'Task Overview & Fleet Assignment' },
            { id: 'thoughts', label: '🧠 Hermes Thought Stream' },
            { id: 'tools', label: `⚙️ Tool Invocations (${task.toolCalls.length})` },
            { id: 'steps', label: `📋 Execution Steps (${task.steps.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* If Editing Mode is active */}
              {isEditing ? (
                <div className="bg-slate-950/90 p-5 rounded-xl border border-blue-500/50 space-y-4 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Edit Task Configuration
                    </span>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>

                  {/* Goal / Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Description / Goal</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
                    />
                  </div>

                  {/* Assign Agent Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Assigned Agent (Fleet)</label>
                    <select
                      value={editAgentId}
                      onChange={(e) => setEditAgentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>
                          @{a.name} — {a.role} ({a.model})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority & Tags */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as Priority)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="analysis, code, security"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Priority Weight Edit Setting */}
                  <div className="space-y-2 p-3 bg-slate-900/90 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Priority Weight (Kanban Glow Emphasis)
                      </label>
                      {weightGlow && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${weightGlow.badgeClass}`}>
                          {weightGlow.label} • {weightGlow.colorName} (W{editPriorityWeight})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((w) => {
                        const cfg = getPriorityWeightGlow(w)!;
                        const isSelected = editPriorityWeight === w;
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setEditPriorityWeight(w)}
                            style={isSelected ? { boxShadow: cfg.glowBoxShadow } : undefined}
                            className={`py-1.5 px-1 rounded-lg text-center font-mono text-[10px] font-bold border transition-all ${
                              isSelected
                                ? `${cfg.borderClass} ${cfg.badgeClass}`
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            W{w} - {cfg.colorName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Description View */
                <div className="space-y-3">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider font-mono">
                      Goal & Specification
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Priority Weight Visual Banner */}
                  {weightGlow && (
                    <div 
                      style={{ boxShadow: weightGlow.glowBoxShadow }}
                      className={`relative p-3 rounded-xl bg-slate-950/80 border flex items-center justify-between gap-3 overflow-hidden ${weightGlow.borderClass}`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${weightGlow.accentBar}`} />
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${weightGlow.badgeClass}`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200 font-mono">
                              Priority Weight {task.priorityWeight ?? 3}/5 ({weightGlow.label})
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${weightGlow.badgeClass}`}>
                              {weightGlow.colorName} Aura
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {weightGlow.description}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${weightGlow.textColor} shrink-0`}>
                        Emphasized in Kanban
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Agent Selector Card */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider font-mono">
                      Assigned Agent & Model Execution
                    </span>
                  </div>

                  {/* Quick Dropdown Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">Reassign Unit:</span>
                    <select
                      value={task.agentId}
                      onChange={(e) => handleAgentChange(e.target.value)}
                      className="bg-slate-900 border border-blue-500/40 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.id} className="bg-slate-950 text-slate-200">
                          @{a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Agent Detail Profile */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${agent?.avatarColor || 'from-blue-600 to-indigo-600'} flex items-center justify-center font-bold text-lg text-white shadow-lg`}>
                      {agent ? agent.name[0] : 'H'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-100 text-sm font-mono">@{agent?.name || 'Hermes-Core'}</p>
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                          agent?.state === 'executing' 
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' 
                            : agent?.state === 'review_pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {agent?.state || 'idle'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{agent?.role}</p>
                      <p className="text-blue-400 font-mono text-[11px] mt-0.5">Model: {agent?.model}</p>
                    </div>
                  </div>

                  {/* Active Tool badges */}
                  {agent && (
                    <div className="flex flex-col md:items-end gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Active Tools</span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.tools.slice(0, 3).map((toolName, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-cyan-300 rounded font-mono text-[10px]">
                            {toolName}()
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resource Consumption */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Telemetry & Resource Metrics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <p className="text-slate-500 text-[10px]">Prompt Tokens</p>
                    <p className="font-mono font-bold text-sm text-cyan-300">{formatTokens(task.tokenUsage.prompt)}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <p className="text-slate-500 text-[10px]">Completion Tokens</p>
                    <p className="font-mono font-bold text-sm text-purple-300">{formatTokens(task.tokenUsage.completion)}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <p className="text-slate-500 text-[10px]">Total Tokens</p>
                    <p className="font-mono font-bold text-sm text-emerald-300">{formatTokens(task.tokenUsage.total)}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <p className="text-slate-500 text-[10px]">Latency</p>
                    <p className="font-mono font-bold text-sm text-amber-300">{task.latencyMs}ms</p>
                  </div>
                </div>
              </div>

              {/* Human in the loop review decision (if in review or has notes) */}
              {task.status === 'review' && (
                <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span>Human Operator Validation Required</span>
                  </div>
                  <p className="text-amber-200/90 text-xs">
                    {task.humanReviewNote || 'This task requires explicit authorization before downstream execution.'}
                  </p>
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      value={operatorNote}
                      onChange={(e) => setOperatorNote(e.target.value)}
                      placeholder="Optional operator feedback or audit signature..."
                      className="w-full bg-slate-950 border border-amber-600/50 rounded-lg p-2 text-xs text-amber-100 placeholder-amber-500/50 focus:outline-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          onHumanReview(task.id, true, operatorNote);
                          onClose();
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-950"
                      >
                        <Check className="w-4 h-4" /> Approve & Complete Task
                      </button>
                      <button
                        onClick={() => {
                          onHumanReview(task.id, false, operatorNote);
                          onClose();
                        }}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-950"
                      >
                        <X className="w-4 h-4" /> Reject & Request Revision
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Move Row */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono">Manual Status Override:</span>
                <div className="flex items-center gap-1.5">
                  {(['todo', 'in-progress', 'review', 'done'] as TaskStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => onMoveStatus(task.id, st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-all ${
                        task.status === st 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thoughts' && (
            <div className="space-y-3 font-mono">
              <div className="p-4 bg-slate-950 border border-purple-900/50 rounded-xl text-purple-200 space-y-2">
                <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <MessageSquareQuote className="w-4 h-4" /> Current Thought Snapshot
                  </span>
                  <span className="text-[10px] text-slate-500">Hermes Chain of Thought</span>
                </div>
                <div className="bg-purple-950/30 p-3 rounded border border-purple-800/30 whitespace-pre-wrap leading-relaxed">
                  {task.currentThought || 'No active thought trace for this task.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3 font-mono">
              {task.toolCalls.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                  No tool calls executed yet.
                </div>
              ) : (
                task.toolCalls.map(tc => (
                  <div key={tc.id} className="p-3.5 bg-slate-950 rounded-xl border border-cyan-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" /> {tc.name}()
                      </span>
                      <span className="text-slate-500 text-[10px]">{tc.timestamp} • {tc.durationMs}ms</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-slate-300 text-xs">
                      <span className="text-slate-500 font-bold">Arguments: </span>
                      <pre className="text-amber-200 mt-1 whitespace-pre-wrap">{JSON.stringify(tc.args, null, 2)}</pre>
                    </div>
                    {tc.result && (
                      <div className="bg-slate-900 p-2 rounded text-slate-300 text-xs">
                        <span className="text-emerald-400 font-bold">Result: </span>
                        <pre className="text-emerald-200 mt-1 whitespace-pre-wrap">{typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-2 font-mono">
              {task.steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : step.status === 'active'
                      ? 'bg-cyan-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs flex-1 ${
                    step.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'
                  }`}>
                    {step.title}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    step.status === 'completed' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                      : step.status === 'active'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="text-rose-400 hover:text-rose-300 font-mono text-xs px-3 py-1.5 rounded hover:bg-rose-950/40 transition-colors"
          >
            Delete Task
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

