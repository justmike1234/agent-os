import React, { useState } from 'react';
import { 
  Columns3, 
  Terminal, 
  LayoutDashboard, 
  Sparkles, 
  Activity, 
  ShieldAlert,
  Info,
  Maximize2
} from 'lucide-react';
import { useAgentFleet } from './hooks/useAgentFleet';
import { Header } from './components/Header';
import { AgentFleetBar } from './components/AgentFleetBar';
import { KanbanBoard } from './components/KanbanBoard';
import { LiveTerminal } from './components/LiveTerminal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NewTaskModal } from './components/NewTaskModal';
import { ApiWebhookModal } from './components/ApiWebhookModal';
import { FleetManagementModal } from './components/FleetManagementModal';
import { AgentTask, AgentInfo } from './types';
import { AgentChatBox } from './components/AgentChatBox';
import { CommandCenterStats } from './components/CommandCenterStats';
import { AgentsPage } from './components/pages/AgentsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { Users, BarChart3 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const {
    tasks,
    agents,
    logs,
    metrics,
    isSimulating,
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    activeFilterAgent,
    setActiveFilterAgent,
    activeFilterPriority,
    setActiveFilterPriority,
    searchQuery,
    setSearchQuery,
    moveTaskStatus,
    assignAgentToTask,
    updateTask,
    handleHumanReview,
    createNewTask,
    deleteTask,
    addLog,
    clearLogs,
    resetDemoState,
    setAgents,
    chatMessages,
    sendMessage
  } = useAgentFleet();

  // Modals & Active Task Selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);

  // Resolved current selected task from state
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  // Layout view options: 'dashboard' | 'kanban' | 'logs' | 'agents' | 'analytics'
  const [viewMode, setViewMode] = useState<'dashboard' | 'kanban' | 'logs' | 'agents' | 'analytics'>('dashboard');

  // Toggle agent pause status
  const handleToggleAgentPause = (agentId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const nextState = a.state === 'paused' ? 'idle' : 'paused';
        addLog({
          agentId: a.id,
          agentName: a.name,
          level: 'INFO',
          message: `Agent @${a.name} transitioned to ${nextState.toUpperCase()}.`
        });
        return { ...a, state: nextState };
      }
      return a;
    }));
  };

  // Update agent hyperparameters
  const handleUpdateAgent = (agentId: string, updates: Partial<AgentInfo>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
    addLog({
      agentId,
      agentName: agents.find(a => a.id === agentId)?.name || 'Agent',
      level: 'INFO',
      message: `System prompt or tool parameters updated.`
    });
  };

  const handleAgentAction = (agentId: string, action: 'restart' | 'clear_cache') => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    if (action === 'restart') {
      addLog({
        agentId,
        agentName: agent.name,
        level: 'WARNING',
        message: `Agent @${agent.name} was forcefully restarted by Operator.`
      });
      // Optionally reset some agent state here
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, state: 'idle', currentTaskId: undefined } : a));
    } else if (action === 'clear_cache') {
      addLog({
        agentId,
        agentName: agent.name,
        level: 'INFO',
        message: `Agent @${agent.name} cleared internal KV cache.`
      });
    }
  };

  const loadPercent = Math.round((metrics.executingTasksCount / (metrics.totalTasks || 1)) * 100) || 62;
  
  React.useEffect(() => {
    if (loadPercent > 90) {
      toast.error(`Warning: Fleet load exceeded 90% capacity (${loadPercent}%). Performance degradation possible.`, { id: 'high-load-toast' });
    }
  }, [loadPercent]);

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-300 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-x-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#020617',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            fontFamily: 'monospace',
            fontSize: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#020617',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#020617',
            },
          },
        }}
      />
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Telemetry & Control Bar */}
      <Header
        metrics={metrics}
        agents={agents}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        onResetDemo={resetDemoState}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilterAgent={activeFilterAgent}
        setActiveFilterAgent={setActiveFilterAgent}
        activeFilterPriority={activeFilterPriority}
        setActiveFilterPriority={setActiveFilterPriority}
      />

      {/* Fleet Overview Strip */}
      <AgentFleetBar
        agents={agents}
        tasks={tasks}
        selectedAgentId={activeFilterAgent}
        onSelectAgent={setActiveFilterAgent}
        onToggleAgentPause={handleToggleAgentPause}
        onAgentAction={handleAgentAction}
      />

      {/* Sub-bar: View Layout Switcher & HITL banner notice */}
      <div className="bg-[#05060b]/80 px-4 lg:px-6 py-2.5 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap text-xs relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-widest">
            Workspace:
          </span>
          <div className="flex items-center bg-slate-950 border border-slate-800/80 rounded-lg p-0.5 font-mono overflow-x-auto">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'dashboard' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'kanban' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('agents')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'agents' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agents</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'analytics' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all whitespace-nowrap ${
                viewMode === 'logs' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CLI Logs</span>
            </button>
          </div>
        </div>

        {/* HITL review alert reminder */}
        {metrics.reviewPendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg animate-pulse font-mono text-[10px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{metrics.reviewPendingCount} task(s) awaiting Human-in-the-Loop authorization</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {viewMode === 'dashboard' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
            {/* Command Center Sidebar (25%) */}
            <div className="lg:col-span-3 border-r border-slate-800/80 overflow-y-auto hidden lg:block">
              <CommandCenterStats metrics={metrics} agents={agents} />
            </div>

            {/* Kanban Columns (45%) */}
            <div className="lg:col-span-5 border-r border-slate-800/80 overflow-y-auto h-full">
              <KanbanBoard
                tasks={tasks}
                agents={agents}
                onSelectTask={(task) => setSelectedTaskId(task.id)}
                onMoveStatus={moveTaskStatus}
                onAssignAgent={assignAgentToTask}
                onHumanReview={handleHumanReview}
                onDeleteTask={deleteTask}
                onOpenNewTask={() => setIsNewTaskOpen(true)}
                filterAgent={activeFilterAgent}
                filterPriority={activeFilterPriority}
                searchQuery={searchQuery}
              />
            </div>

            {/* Live Terminal & Chat Sidebar (30%) */}
            <div className="lg:col-span-4 bg-[#05060b]/40 flex flex-col h-full border-l border-slate-800/80">
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 border-b border-slate-800/80">
                <LiveTerminal
                  logs={logs}
                  agents={agents}
                  onClearLogs={clearLogs}
                  onInjectLog={addLog}
                  isSimulating={isSimulating}
                />
              </div>
              <div className="h-[40%] min-h-[300px] flex-shrink-0">
                <AgentChatBox messages={chatMessages} onSendMessage={sendMessage} />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="flex-1 overflow-y-auto">
            <KanbanBoard
              tasks={tasks}
              agents={agents}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onMoveStatus={moveTaskStatus}
              onAssignAgent={assignAgentToTask}
              onHumanReview={handleHumanReview}
              onDeleteTask={deleteTask}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              filterAgent={activeFilterAgent}
              filterPriority={activeFilterPriority}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {viewMode === 'agents' && (
          <div className="flex-1 overflow-y-auto w-full">
            <AgentsPage agents={agents} />
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="flex-1 overflow-y-auto w-full">
            <AnalyticsPage metrics={metrics} logs={logs} tasks={tasks} />
          </div>
        )}

        {viewMode === 'logs' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <LiveTerminal
              logs={logs}
              agents={agents}
              onClearLogs={clearLogs}
              onInjectLog={addLog}
              isSimulating={isSimulating}
            />
          </div>
        )}
      </main>

      {/* Immersive System Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10 text-[10px] font-mono text-slate-500">
        <div>
          UPTIME: <span className="text-slate-400">14D 02H 12M</span> // REGION: <span className="text-slate-400">US-EAST-1</span> // ENCRYPTION: <span className="text-slate-400">AES-256</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span>ORCHESTRATOR POOL: ACTIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <span>LOAD:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${loadPercent}%` }} />
            </div>
            <span>{loadPercent}%</span>
          </div>
        </div>
      </footer>

      {/* Task Detail Inspector Modal */}
      <TaskDetailModal
        task={selectedTask}
        agents={agents}
        onClose={() => setSelectedTaskId(null)}
        onMoveStatus={moveTaskStatus}
        onAssignAgent={assignAgentToTask}
        onHumanReview={handleHumanReview}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
      />

      {/* New Task Creator Modal */}
      <NewTaskModal
        agents={agents}
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSubmit={createNewTask}
      />

      {/* Backend / API Webhooks Guide Modal */}
      <ApiWebhookModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      {/* Agent Fleet Architecture Modal */}
      <FleetManagementModal
        agents={agents}
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        onUpdateAgent={handleUpdateAgent}
        onToggleAgentPause={handleToggleAgentPause}
      />
    </div>
  );
}
