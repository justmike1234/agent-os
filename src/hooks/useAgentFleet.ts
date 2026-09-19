import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentTask, AgentInfo, AgentLog, SystemMetrics, TaskStatus, Priority, ToolCall, AgentChatMessage } from '../types';
import { INITIAL_AGENTS, INITIAL_TASKS, INITIAL_LOGS, INITIAL_CHAT_MESSAGES } from '../data/initialData';
import { formatTime } from '../utils/helpers';

export function useAgentFleet() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>([]);

  const [backendStats, setBackendStats] = useState<SystemMetrics | null>(null);
  const [liveConnected, setLiveConnected] = useState<boolean>(false);

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [activeFilterAgent, setActiveFilterAgent] = useState<string>('all');
  const [activeFilterPriority, setActiveFilterPriority] = useState<string>('all');
  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ---- LIVE fleet data (SovereignOS backend) ----
  const refreshFleet = useCallback(async () => {
    try {
      const [a, t, l, s] = await Promise.all([
        fetch('/api/agents').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/tasks').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/logs').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setLiveConnected(!!(a && t));
      if (a?.agents) setAgents(a.agents);
      if (t?.tasks) setTasks(t.tasks);
      if (l?.logs) setLogs(l.logs);
      if (s) setBackendStats(s);
    } catch (err) {
      console.warn('Live fleet fetch failed:', err);
      setLiveConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshFleet();
    const interval = setInterval(refreshFleet, 10000);
    return () => clearInterval(interval);
  }, [refreshFleet]);

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setBackendStats(data))
        .catch(err => console.warn('Failed to fetch stats:', err));
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute live metrics (real backend stats; flat fallback while offline)
  const metrics: SystemMetrics = backendStats || {
    activeAgentsCount: agents.filter(a => a.state === 'executing' || a.state === 'review_pending').length,
    totalTasks: tasks.length,
    executingTasksCount: tasks.filter(t => t.status === 'in-progress').length,
    reviewPendingCount: tasks.filter(t => t.status === 'review').length,
    completedTasksCount: tasks.filter(t => t.status === 'done').length,
    totalTokens: agents.reduce((acc, a) => acc + a.totalTokensUsed, 0),
    tokensPerSec: 0,
    avgLatencyMs: 0,
    successRate: tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0,
    memoryUsageMb: 0,
    toolUsage: []
  };

  const sendMessage = useCallback((senderId: string, senderName: string, message: string, isHuman = false) => {
    const newMessage: AgentChatMessage = {
      id: `chat-${Date.now()}`,
      senderId,
      senderName,
      message,
      timestamp: formatTime(),
      isHuman
    };
    setChatMessages(prev => [...prev, newMessage]);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage)
    }).catch(err => console.warn('Chat sync error:', err));
  }, []);


  // Add Log helper
  const addLog = useCallback((log: Omit<AgentLog, 'id' | 'timestamp'>) => {
    const newLog: AgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: formatTime(),
      ...log
    };
    setLogs(prev => [newLog, ...prev.slice(0, 250)]);
    return newLog;
  }, []);

  // Assign agent to task with immediate feedback, agent state reallocation, and backend sync
  const assignAgentToTask = useCallback((taskId: string, newAgentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.agentId === newAgentId) return; // already assigned

    const newAgent = agents.find(a => a.id === newAgentId);
    const oldAgent = agents.find(a => a.id === task.agentId);
    if (!newAgent) return;

    // 1. Update task in React state
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          agentId: newAgentId,
          updatedAt: formatTime(),
          currentThought: t.status === 'in-progress' 
            ? `<thought> Reassigned to @${newAgent.name}. Loading model weights (${newAgent.model}) and tool capabilities [${newAgent.tools.join(', ')}]. </thought>`
            : t.currentThought
        };
      }
      return t;
    }));

    // 2. Reallocate agent runtime states
    if (task.status === 'in-progress' || task.status === 'review') {
      setAgents(prev => prev.map(a => {
        if (a.id === task.agentId && a.currentTaskId === taskId) {
          return { ...a, state: 'idle', currentTaskId: undefined };
        }
        if (a.id === newAgentId) {
          return {
            ...a,
            state: task.status === 'in-progress' ? 'executing' : 'review_pending',
            currentTaskId: taskId
          };
        }
        return a;
      }));
    }

    // 3. Emit detailed log entry in Terminal
    addLog({
      taskId,
      agentId: newAgent.id,
      agentName: newAgent.name,
      level: 'INFO',
      message: `Task "${task.title}" reassigned: @${oldAgent ? oldAgent.name : 'Unassigned'} ➔ @${newAgent.name}.`,
      thoughtContent: `<thought>\nContext transfer verified. Agent @${newAgent.name} assigned as designated executor.\nModel: ${newAgent.model} | Role: ${newAgent.role} | Tools: [${newAgent.tools.join(', ')}]\n</thought>`,
      metadata: {
        model: newAgent.model
      }
    });

    // 4. Asynchronously persist to backend API
    fetch(`/api/tasks/${taskId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: newAgentId })
    }).catch(err => {
      console.warn('Backend API assign sync (running in local storage fallback mode):', err);
    });
  }, [tasks, agents, addLog]);

  // Update task helper
  const updateTask = useCallback((taskId: string, updates: Partial<AgentTask>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const wasAgentChanged = updates.agentId && updates.agentId !== t.agentId;
        const updated = {
          ...t,
          ...updates,
          updatedAt: formatTime()
        };

        if (wasAgentChanged) {
          const newAgent = agents.find(a => a.id === updates.agentId);
          const oldAgent = agents.find(a => a.id === t.agentId);
          if (newAgent) {
            addLog({
              taskId,
              agentId: newAgent.id,
              agentName: newAgent.name,
              level: 'INFO',
              message: `Task "${updated.title}" assigned to @${newAgent.name} (was @${oldAgent?.name || 'none'}).`,
              thoughtContent: `<thought>\nTask properties updated and executor reassigned to @${newAgent.name}.\n</thought>`
            });
          }
        }

        return updated;
      }
      return t;
    }));

    // Sync to backend API
    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => {
      console.warn('Backend API update sync fallback:', err);
    });
  }, [agents, addLog]);

  // Move task status
  const moveTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const agent = agents.find(a => a.id === task.agentId);
    const agentName = agent ? agent.name : 'Orchestrator';

    updateTask(taskId, {
      status: newStatus,
      progress: newStatus === 'done' ? 100 : newStatus === 'todo' ? 0 : task.progress
    });

    // Update Agent state
    if (newStatus === 'done') {
      setAgents(prev => prev.map(a => a.id === task.agentId ? {
        ...a,
        completedTasksCount: a.completedTasksCount + 1,
        state: 'idle',
        currentTaskId: undefined
      } : a));
    } else if (newStatus === 'in-progress') {
      setAgents(prev => prev.map(a => a.id === task.agentId ? {
        ...a,
        state: 'executing',
        currentTaskId: taskId
      } : a));
    }

    addLog({
      taskId,
      agentId: task.agentId,
      agentName,
      level: newStatus === 'done' ? 'SUCCESS' : newStatus === 'review' ? 'HUMAN_PROMPT' : 'INFO',
      message: `Task [${task.title}] status transitioned to "${newStatus.toUpperCase()}".`
    });
  }, [tasks, agents, updateTask, addLog]);

  // Human Review Decision
  const handleHumanReview = useCallback((taskId: string, approved: boolean, notes?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (approved) {
      updateTask(taskId, {
        status: 'done',
        progress: 100,
        humanFeedback: notes || 'Approved by operator',
        currentThought: 'Human review approved. Proceeding with finalized outputs.'
      });

      addLog({
        taskId,
        agentId: task.agentId,
        agentName: 'SecAuditor-Guard',
        level: 'SUCCESS',
        message: `Operator APPROVED task "${task.title}". Authorization signature verified.`,
        thoughtContent: `<thought>\nOperator signoff granted. Applying approved artifacts to production.\n</thought>`
      });

      // Free agent
      setAgents(prev => prev.map(a => a.id === task.agentId ? {
        ...a,
        completedTasksCount: a.completedTasksCount + 1,
        state: 'idle',
        currentTaskId: undefined
      } : a));
    } else {
      updateTask(taskId, {
        status: 'in-progress',
        progress: 50,
        humanFeedback: notes || 'Rejected by operator with revision requested',
        currentThought: `Operator requested adjustments: "${notes || 'Revise plan'}". Recalibrating...`
      });

      addLog({
        taskId,
        agentId: task.agentId,
        agentName: 'SecAuditor-Guard',
        level: 'WARN',
        message: `Operator REJECTED task "${task.title}". Reason: ${notes || 'Revision required'}.`,
        thoughtContent: `<thought>\nSafety review flagged revisions. Rollback simulated locks and re-evaluate parameters.\n</thought>`
      });
    }
  }, [tasks, updateTask, addLog]);

  // Create new task
  const createNewTask = useCallback((data: {
    title: string;
    description: string;
    agentId: string;
    priority: Priority;
    priorityWeight?: number;
    tags: string[];
    autoStart?: boolean;
  }) => {
    const newId = `task-${Date.now().toString().slice(-4)}`;
    const assignedAgent = agents.find(a => a.id === data.agentId) || agents[0];

    const newTask: AgentTask = {
      id: newId,
      title: data.title,
      description: data.description,
      agentId: assignedAgent.id,
      status: data.autoStart ? 'in-progress' : 'todo',
      priority: data.priority,
      priorityWeight: data.priorityWeight ?? 3,
      tags: data.tags.length > 0 ? data.tags : ['autonomous', 'agent-fleet'],
      createdAt: formatTime(),
      updatedAt: formatTime(),
      progress: data.autoStart ? 15 : 0,
      currentThought: data.autoStart ? `<thought> Goal ingested: "${data.title}". Analyzing necessary tools and decomposition steps. </thought>` : undefined,
      steps: [
        { id: 's1', title: 'Decompose goal & formulate execution graph', status: data.autoStart ? 'active' : 'pending' },
        { id: 's2', title: 'Execute tool calls and verify outputs', status: 'pending' },
        { id: 's3', title: 'Verify safety policies and compile final report', status: 'pending' }
      ],
      toolCalls: [],
      tokenUsage: { prompt: 1200, completion: 350, total: 1550 },
      latencyMs: 850
    };

    setTasks(prev => [newTask, ...prev]);

    // Persist to the real ledger through the fleet pipe
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: assignedAgent.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        tier: data.priorityWeight === 5 ? 4 : data.priorityWeight === 4 ? 3 : 2,
      })
    }).then(r => r.json()).then(d => {
      if (d?.success) {
        addLog({
          agentId: 'hermes-core',
          agentName: 'Hermes-3 Core',
          level: 'SUCCESS',
          message: `Task written to the HR ledger ✓ — it will appear on the board within 10s.`
        });
        refreshFleet();
      } else if (d?.error) {
        addLog({
          agentId: 'hermes-core',
          agentName: 'Hermes-3 Core',
          level: 'ERROR',
          message: `Ledger refused task "${data.title}": ${d.error}`
        });
      }
    }).catch(() => {});

    if (data.autoStart) {
      setAgents(prev => prev.map(a => a.id === assignedAgent.id ? {
        ...a,
        state: 'executing',
        currentTaskId: newId
      } : a));
    }

    addLog({
      taskId: newId,
      agentId: assignedAgent.id,
      agentName: assignedAgent.name,
      level: 'INFO',
      message: `New agent goal dispatched: "${data.title}". Assigned to @${assignedAgent.name}.`,
      thoughtContent: data.autoStart ? `<thought>\nReceived autonomous directive. Context tokens allocated: 8,192.\nCommencing step 1: Decompose goal.\n</thought>` : undefined
    });

    return newTask;
  }, [agents, addLog, refreshFleet]);

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addLog({
      taskId,
      agentId: 'hermes-core',
      agentName: 'Hermes-3 Core',
      level: 'INFO',
      message: `Task [${taskId}] removed from board.`
    });
  }, [addLog]);

  // Reset — live mode: refetch real fleet state
  const resetDemoState = useCallback(() => {
    refreshFleet();
    addLog({
      agentId: 'hermes-core',
      agentName: 'Hermes-3 Core',
      level: 'SUCCESS',
      message: 'Live fleet state re-synced from the SovereignOS ledger.'
    });
  }, [addLog, refreshFleet]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('agentic_kanban_logs');
  }, []);

  return {
    tasks,
    agents,
    logs,
    chatMessages,
    sendMessage,
    metrics,
    isSimulating,
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    activeFilterAgent,
    setActiveFilterAgent,
    activeFilterPriority,
    setActiveFilterPriority,
    activeFilterTag,
    setActiveFilterTag,
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
    liveConnected,
    refreshFleet
  };
}
