import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MoreVertical, 
  Terminal, 
  Wrench, 
  ShieldAlert, 
  Check, 
  X, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  ExternalLink,
  MessageSquareQuote,
  UserCheck,
  Bot,
  UserPlus,
  Zap
} from 'lucide-react';
import { AgentTask, AgentInfo, TaskStatus } from '../types';
import { getPriorityBadge, formatTokens, getPriorityWeightGlow } from '../utils/helpers';

interface TaskCardProps {
  task: AgentTask;
  agent?: AgentInfo;
  agents?: AgentInfo[];
  onSelectTask: (task: AgentTask) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAssignAgent?: (taskId: string, agentId: string) => void;
  onHumanReview: (taskId: string, approved: boolean, notes?: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  agent,
  agents = [],
  onSelectTask,
  onMoveStatus,
  onAssignAgent,
  onHumanReview,
  onDeleteTask
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [showThoughtSnippet, setShowThoughtSnippet] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const priorityStyle = getPriorityBadge(task.priority);
  const weightGlow = getPriorityWeightGlow(task.priorityWeight);
  const isExecuting = task.status === 'in-progress';
  const isReview = task.status === 'review';
  const isDone = task.status === 'done';

  const handleSelectAgent = (targetAgentId: string) => {
    if (onAssignAgent) {
      onAssignAgent(task.id, targetAgentId);
    }
    setShowAgentPicker(false);
    setShowMenu(false);
  };

  // Base card styling
  const cardBorderAndBg = weightGlow
    ? `${weightGlow.borderClass} ${isDone ? 'bg-slate-900/70' : 'bg-slate-900/90'}`
    : isExecuting
    ? 'bg-slate-900 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.08)]'
    : isReview
    ? 'bg-slate-900/90 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
    : isDone
    ? 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40'
    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700';

  return (
    <div
      onClick={() => onSelectTask(task)}
      style={weightGlow ? { boxShadow: weightGlow.glowBoxShadow } : undefined}
      className={`group relative rounded-lg p-3.5 border transition-all duration-300 cursor-pointer ${cardBorderAndBg}`}
    >
      {/* Visual top accent glow line for prioritized tasks */}
      {weightGlow && (
        <div 
          className={`absolute top-0 left-0 right-0 h-[2.5px] rounded-t-lg bg-gradient-to-r ${weightGlow.accentBar}`} 
        />
      )}

      {/* Top row: Priority & Status Indicator / Visualizer */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority pill */}
          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
            {task.priority}
          </span>

          {/* Priority Weight Glow Badge */}
          {weightGlow && (
            <span 
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${weightGlow.badgeClass}`}
              title={`Priority Weight: ${task.priorityWeight}/5 (${weightGlow.label}) - ${weightGlow.description}`}
            >
              <Zap className="w-2.5 h-2.5" />
              {weightGlow.shortLabel}
            </span>
          )}

          {task.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[9px] font-mono text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Active pulse bars for executing task */}
          {isExecuting && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] mr-1" />
              <span className="w-1 h-3 bg-blue-500/40 rounded-full animate-pulse" />
              <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {isDone && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] uppercase tracking-wider font-bold">DONE</span>
            </div>
          )}

          {/* Quick status stepper & actions dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowAgentPicker(false);
              }}
              className="text-slate-500 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Card actions & agent assignment"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 w-48 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl py-1 z-30 text-xs text-slate-300 font-mono"
              >
                {/* Agent Assignment quick action */}
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  Agent Assignment
                </div>
                <button
                  onClick={() => {
                    setShowAgentPicker(!showAgentPicker);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-cyan-300"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-3 h-3 text-cyan-400" /> Reassign Agent
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>

                <div className="border-t border-slate-800 my-1" />
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  Move Column
                </div>
                <button
                  onClick={() => { onMoveStatus(task.id, 'todo'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-slate-400" /> Backlog
                </button>
                <button
                  onClick={() => { onMoveStatus(task.id, 'in-progress'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-blue-400"
                >
                  <Cpu className="w-3 h-3" /> Executing
                </button>
                <button
                  onClick={() => { onMoveStatus(task.id, 'review'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-amber-400"
                >
                  <ShieldAlert className="w-3 h-3" /> Validation
                </button>
                <button
                  onClick={() => { onMoveStatus(task.id, 'done'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-emerald-400"
                >
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => { onDeleteTask(task.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className={`font-semibold text-xs text-slate-100 mb-1 group-hover:text-blue-300 transition-colors leading-snug ${
        isDone ? 'line-through text-slate-400' : ''
      }`}>
        {task.title}
      </h3>
      <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {/* Progress Bar (if in progress or completed) */}
      {(isExecuting || isReview || task.progress > 0) && (
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Execution Lock</span>
            <span className="font-semibold text-blue-300">{task.progress}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDone 
                  ? 'bg-emerald-500' 
                  : isReview
                  ? 'bg-amber-400'
                  : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Hermes Chain-of-Thought Preview Box */}
      {task.currentThought && (
        <div className="mb-2.5 bg-slate-950/90 border border-slate-800/80 rounded p-2 text-xs font-mono relative overflow-hidden">
          <div className="flex items-center justify-between text-[9px] text-blue-400 mb-1">
            <span className="font-bold flex items-center gap-1">
              <MessageSquareQuote className="w-2.5 h-2.5" />
              Reasoning Trace
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThoughtSnippet(!showThoughtSnippet);
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              {showThoughtSnippet ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            </button>
          </div>
          {showThoughtSnippet && (
            <p className="text-[10px] leading-relaxed text-slate-300 font-mono italic whitespace-pre-wrap line-clamp-3">
              {task.currentThought}
            </p>
          )}
        </div>
      )}

      {/* Recent Tool execution chip */}
      {task.toolCalls.length > 0 && (
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto text-[9px] text-slate-500 font-mono">
          <Wrench className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
          <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-blue-400 truncate max-w-[150px]">
            {task.toolCalls[0].name}
          </span>
          {task.toolCalls[0].durationMs ? (
            <span className="text-slate-600">{task.toolCalls[0].durationMs}ms</span>
          ) : null}
        </div>
      )}

      {/* Human In The Loop Review Action Banner */}
      {isReview && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 pt-2.5 border-t border-amber-500/20 bg-amber-950/20 -mx-3.5 -mb-3.5 p-3 rounded-b-lg space-y-2"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>HITL Authorization Required</span>
          </div>

          {task.humanReviewNote && (
            <p className="text-[10px] text-amber-200/90 font-mono bg-amber-950/60 p-1.5 rounded border border-amber-500/20">
              {task.humanReviewNote}
            </p>
          )}

          {showRejectInput ? (
            <div className="space-y-1.5 font-mono">
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reason for revision..."
                className="w-full bg-slate-950 border border-amber-600/50 rounded px-2 py-1 text-[10px] text-amber-100 placeholder-amber-500/50 focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    onHumanReview(task.id, false, reviewNote);
                    setShowRejectInput(false);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold py-1 rounded transition-colors"
                >
                  Reject & Re-plan
                </button>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={() => onHumanReview(task.id, true)}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-800 border border-slate-700 hover:border-slate-500 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Approve Output</span>
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                className="px-2.5 py-1.5 flex items-center gap-1 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-[10px] rounded transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Card Footer: Interactive Assigned Agent Selector & Telemetry */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono relative">
        {/* Interactive Agent Assignment Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAgentPicker(!showAgentPicker);
              setShowMenu(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-blue-500/50 text-slate-300 hover:text-white transition-all group/agent"
            title="Click to assign or switch agent"
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${agent?.avatarColor || 'from-blue-600 to-indigo-600'} flex items-center justify-center text-[9px] font-bold text-white shadow-sm flex-shrink-0`}>
              {agent ? agent.name[0] : 'H'}
            </div>
            <span className="font-semibold text-slate-200 group-hover/agent:text-cyan-300">
              @{agent?.name || 'Hermes'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500 group-hover/agent:text-cyan-400 transition-transform" />
          </button>

          {/* Floating Predefined Agent Selection Menu */}
          {showAgentPicker && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 bottom-8 w-60 bg-slate-950 border border-slate-700/90 rounded-xl shadow-2xl p-2 z-40 text-xs font-mono space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>Assign Predefined Agent</span>
                <button
                  onClick={() => setShowAgentPicker(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pt-1">
                {agents.map(a => {
                  const isCurrent = a.id === task.agentId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSelectAgent(a.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-blue-950/80 border border-blue-500/60 text-blue-200'
                          : 'hover:bg-slate-900 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${a.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0`}>
                          {a.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] text-white truncate">@{a.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{a.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isCurrent ? (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <span className={`text-[8px] uppercase px-1 py-0.2 rounded ${
                            a.state === 'executing' 
                              ? 'text-cyan-400 bg-cyan-950/60' 
                              : a.state === 'review_pending'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-slate-500 bg-slate-900'
                          }`}>
                            {a.state === 'executing' ? 'ACTIVE' : a.state === 'review_pending' ? 'REVIEW' : 'IDLE'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          {task.tokenUsage.total > 0 && (
            <span>{formatTokens(task.tokenUsage.total)} tok</span>
          )}
          {isExecuting && (
            <span className="text-blue-400 animate-pulse">LOCK</span>
          )}
          {isDone && (
            <span className="text-emerald-500">FINALIZED</span>
          )}
        </div>
      </div>
    </div>
  );
};

