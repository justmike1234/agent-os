import React from 'react';
import { 
  Clock, 
  Play, 
  Activity, 
  CheckCircle2, 
  Plus, 
  AlertCircle, 
  Sparkles,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentTask, AgentInfo, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnDef {
  id: TaskStatus;
  title: string;
  subtitle: string;
  headerTextColor: string;
  badgeClass: string;
  hasTopGlow?: boolean;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'todo',
    title: 'Backlog',
    subtitle: 'Scheduled by Orchestrator',
    headerTextColor: 'text-slate-500',
    badgeClass: 'bg-slate-800 text-[10px] px-2 py-0.5 rounded text-slate-400',
    hasTopGlow: false
  },
  {
    id: 'in-progress',
    title: 'Executing',
    subtitle: 'Active LLM & Tool Locks',
    headerTextColor: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-[10px] px-2 py-0.5 rounded text-blue-400 border border-blue-500/30',
    hasTopGlow: true
  },
  {
    id: 'review',
    title: 'Validation',
    subtitle: 'Operator Review Required',
    headerTextColor: 'text-amber-500',
    badgeClass: 'bg-amber-500/10 text-[10px] px-2 py-0.5 rounded text-amber-500 font-mono border border-amber-500/30',
    hasTopGlow: false
  },
  {
    id: 'done',
    title: 'Completed',
    subtitle: 'Artifacts Finalized',
    headerTextColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-[10px] px-2 py-0.5 rounded text-emerald-500 border border-emerald-500/30',
    hasTopGlow: false
  }
];

interface KanbanBoardProps {
  tasks: AgentTask[];
  agents: AgentInfo[];
  onSelectTask: (task: AgentTask) => void;
  onMoveStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAssignAgent?: (taskId: string, agentId: string) => void;
  onHumanReview: (taskId: string, approved: boolean, notes?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTask: () => void;
  filterAgent: string;
  filterPriority: string;
  searchQuery: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  agents,
  onSelectTask,
  onMoveStatus,
  onAssignAgent,
  onHumanReview,
  onDeleteTask,
  onOpenNewTask,
  filterAgent,
  filterPriority,
  searchQuery
}) => {
  // Apply filtering
  const filteredTasks = tasks.filter(t => {
    if (filterAgent !== 'all' && t.agentId !== filterAgent) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchThought = t.currentThought?.toLowerCase().includes(q);
      const matchTags = t.tags.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchThought && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="flex overflow-x-auto gap-4 p-4 lg:p-6 items-start h-full">
      {COLUMNS.map(col => {
        const columnTasks = filteredTasks.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col flex-shrink-0 w-[280px] xl:w-[320px] min-h-[580px] bg-slate-950/40 border border-slate-800/60 rounded-xl relative overflow-hidden backdrop-blur-md"
          >
            {/* Immersive top glow strip for Executing column */}
            {col.hasTopGlow && (
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10" />
            )}

            {/* Column Header */}
            <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-widest font-mono ${col.headerTextColor}`}>
                {col.title}
              </span>

              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold ${col.badgeClass}`}>
                  {col.id === 'review' && columnTasks.length > 0 ? 'WAITING' : columnTasks.length}
                </span>
                {col.id === 'todo' && (
                  <button
                    onClick={onOpenNewTask}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
                    title="Add new goal to backlog"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Task list */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto pr-2 max-h-[calc(100vh-280px)]">
              <AnimatePresence mode="popLayout">
                {columnTasks.length === 0 ? (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-800/60 rounded-xl bg-slate-950/20"
                  >
                    <Inbox className="w-7 h-7 text-slate-600 mb-2 stroke-1" />
                    <p className="text-xs text-slate-400 font-medium font-mono">No tasks in this stage</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {col.id === 'todo' ? 'Dispatch a goal to begin' : 'Agents will route tasks here automatically'}
                    </p>
                    {col.id === 'todo' && (
                      <button
                        onClick={onOpenNewTask}
                        className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold font-mono"
                      >
                        <Plus className="w-3 h-3" /> Add Task
                      </button>
                    )}
                  </motion.div>
                ) : (
                  columnTasks.map(task => {
                    const agent = agents.find(a => a.id === task.agentId);
                    return (
                      <motion.div
                        layout
                        key={task.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      >
                        <TaskCard
                          task={task}
                          agent={agent}
                          agents={agents}
                          onSelectTask={onSelectTask}
                          onMoveStatus={onMoveStatus}
                          onAssignAgent={onAssignAgent}
                          onHumanReview={onHumanReview}
                          onDeleteTask={onDeleteTask}
                        />
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
