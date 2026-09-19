import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentTask, AgentInfo, AgentLog, SystemMetrics, TaskStatus, Priority, ToolCall, AgentChatMessage } from '../types';
import { INITIAL_AGENTS, INITIAL_TASKS, INITIAL_LOGS, INITIAL_CHAT_MESSAGES } from '../data/initialData';
import { formatTime } from '../utils/helpers';

export function useAgentFleet() {
  const [tasks, setTasks] = useState<AgentTask[]>(() => {
    const saved = localStorage.getItem('agentic_kanban_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [agents, setAgents] = useState<AgentInfo[]>(() => {
    const saved = localStorage.getItem('agentic_kanban_agents');
    return saved ? JSON.parse(saved) : INITIAL_AGENTS;
  });

  const [logs, setLogs] = useState<AgentLog[]>(() => {
    const saved = localStorage.getItem('agentic_kanban_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [chatMessages, setChatMessages] = useState<AgentChatMessage[]>(() => {
    const saved = localStorage.getItem('agentic_kanban_chat');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [backendStats, setBackendStats] = useState<SystemMetrics | null>(null);

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [activeFilterAgent, setActiveFilterAgent] = useState<string>('all');
  const [activeFilterPriority, setActiveFilterPriority] = useState<string>('all');
  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist state
  useEffect(() => {
    localStorage.setItem('agentic_kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('agentic_kanban_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('agentic_kanban_logs', JSON.stringify(logs.slice(0, 200)));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('agentic_kanban_chat', JSON.stringify(chatMessages.slice(-50)));
  }, [chatMessages]);

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

  // Compute live metrics (fallback to local if backend fails)
  const metrics: SystemMetrics = backendStats || {
    activeAgentsCount: agents.filter(a => a.state === 'executing' || a.state === 'review_pending').length,
    totalTasks: tasks.length,
    executingTasksCount: tasks.filter(t => t.status === 'in-progress').length,
    reviewPendingCount: tasks.filter(t => t.status === 'review').length,
    completedTasksCount: tasks.filter(t => t.status === 'done').length,
    totalTokens: agents.reduce((acc, a) => acc + a.totalTokensUsed, 0),
    tokensPerSec: isSimulating ? Math.floor(240 * simulationSpeed + Math.random() * 80) : 0,
    avgLatencyMs: 980 + Math.floor(Math.random() * 240),
    successRate: 98.4,
    memoryUsageMb: 245 + Math.floor(Math.random() * 30),
    toolUsage: [
      { name: 'python_repl', uses: 142 },
      { name: 'serp_search', uses: 89 },
      { name: 'vector_store_query', uses: 45 },
      { name: 'synthesize_results', uses: 112 },
      { name: 'ask_human_review', uses: 23 },
      { name: 'bash_sandbox', uses: 67 }
    ].sort((a, b) => b.uses - a.uses)
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
  }, [agents, addLog]);

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

  // Reset to initial demo state
  const resetDemoState = useCallback(() => {
    setTasks(INITIAL_TASKS);
    setAgents(INITIAL_AGENTS);
    setLogs(INITIAL_LOGS);
    localStorage.removeItem('agentic_kanban_tasks');
    localStorage.removeItem('agentic_kanban_agents');
    localStorage.removeItem('agentic_kanban_logs');
    addLog({
      agentId: 'hermes-core',
      agentName: 'Hermes-3 Core',
      level: 'SUCCESS',
      message: 'Agentic Kanban OS demo state restored to baseline.'
    });
  }, [addLog]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('agentic_kanban_logs');
  }, []);

  // Autonomous simulation loop
  const simulationTickRef = useRef<number>(0);
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = Math.max(2500 / simulationSpeed, 1200);

    const timer = setInterval(() => {
      simulationTickRef.current += 1;
      const tick = simulationTickRef.current;

      setTasks(currentTasks => {
        const inProgress = currentTasks.filter(t => t.status === 'in-progress');
        const todoTasks = currentTasks.filter(t => t.status === 'todo');

        if (inProgress.length === 0 && todoTasks.length > 0 && Math.random() > 0.3) {
          // Move a todo task to in-progress
          const candidate = todoTasks[0];
          const agent = agents.find(a => a.id === candidate.agentId) || agents[0];

          addLog({
            taskId: candidate.id,
            agentId: agent.id,
            agentName: agent.name,
            level: 'INFO',
            message: `Agent @${agent.name} claimed backlog task "${candidate.title}".`,
            thoughtContent: `<thought>\nIngesting task specifications. Verifying tool availability for [${agent.tools.join(', ')}].\n</thought>`
          });

          return currentTasks.map(t => t.id === candidate.id ? {
            ...t,
            status: 'in-progress' as TaskStatus,
            progress: 15,
            currentThought: `<thought> Initializing execution context and running pre-flight tool checks. </thought>`,
            steps: t.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const } : s),
            updatedAt: formatTime()
          } : t);
        }

        if (inProgress.length > 0) {
          // Simulate occasional task failure
          if (Math.random() < 0.05) {
            import('react-hot-toast').then(({ toast }) => {
               toast.error('Critical task failure detected in fleet execution.');
            });
          }

          // Pick an active task to advance
          const targetTask = inProgress[Math.floor(Math.random() * inProgress.length)];
          const agent = agents.find(a => a.id === targetTask.agentId) || agents[0];
          const newProgress = Math.min(targetTask.progress + Math.floor(10 + Math.random() * 15), 100);

          // Update Agent tokens
          const addedTokens = Math.floor(250 + Math.random() * 600);
          setAgents(prev => {
            const nextAgents = prev.map(a => a.id === agent.id ? {
              ...a,
              totalTokensUsed: a.totalTokensUsed + addedTokens
            } : a);
            return nextAgents;
          });

          if (newProgress >= 95 && targetTask.status === 'in-progress') {
            // Check if needs review or can finish
            const needsReview = targetTask.tags.some(tag => tag.includes('hitl') || tag.includes('security') || tag.includes('review')) || targetTask.priority === 'urgent';
            const nextStatus: TaskStatus = needsReview ? 'review' : 'done';

            if (nextStatus === 'review') {
              addLog({
                taskId: targetTask.id,
                agentId: agent.id,
                agentName: agent.name,
                level: 'HUMAN_PROMPT',
                message: `⚠️ TASK REQUIRING VALIDATION: "${targetTask.title}". Pausing for operator signoff.`,
                thoughtContent: `<thought>\nExecution completed. Safety policy rule triggered for ${targetTask.tags.join(', ')}. Awaiting human review in Validation column.\n</thought>`
              });
            } else {
              addLog({
                taskId: targetTask.id,
                agentId: agent.id,
                agentName: agent.name,
                level: 'SUCCESS',
                message: `Task "${targetTask.title}" fully resolved by @${agent.name}. Output finalized.`,
                thoughtContent: `<thought>\nAll assertions passed with zero errors. Emitting completed result object.\n</thought>`
              });
            }

            return currentTasks.map(t => t.id === targetTask.id ? {
              ...t,
              status: nextStatus,
              progress: nextStatus === 'done' ? 100 : 95,
              currentThought: nextStatus === 'review' ? 'Waiting for operator confirmation in Kanban review column.' : 'Task complete.',
              updatedAt: formatTime()
            } : t);
          } else {
            // Emitting tool execution or reasoning trace
            const toolSample = agent.tools[Math.floor(Math.random() * agent.tools.length)] || 'python_repl';
            const sampleThoughts = [
              `<thought>\nEvaluating token efficiency across intermediate steps. Executing ${toolSample}.\n</thought>`,
              `<thought>\nDecomposing sub-query. Cross-checking output with verification invariants.\n</thought>`,
              `<thought>\nAgent reasoning: Step ${Math.ceil(newProgress / 25)} of 4 completed. Synthesizing intermediate outputs.\n</thought>`,
              `<thought>\nRefining plan based on tool results. Memory cache hit: 94%.\n</thought>`
            ];
            const chosenThought = sampleThoughts[tick % sampleThoughts.length];

            const newToolCall: ToolCall = {
              id: `tc-${Date.now()}`,
              name: toolSample,
              args: { step: Math.ceil(newProgress / 25), mode: 'autonomous_exec', query_hash: Math.random().toString(36).substring(7) },
              result: `Executed successfully in ${(0.3 + Math.random() * 1.2).toFixed(2)}s. Status: OK 200.`,
              status: 'completed',
              timestamp: formatTime(),
              durationMs: Math.floor(300 + Math.random() * 1200)
            };

            addLog({
              taskId: targetTask.id,
              agentId: agent.id,
              agentName: agent.name,
              level: tick % 2 === 0 ? 'THOUGHT' : 'TOOL_CALL',
              message: tick % 2 === 0 ? `Reasoning trace updated for "${targetTask.title}".` : `Invoked tool @${toolSample}.`,
              thoughtContent: chosenThought,
              toolCall: tick % 2 !== 0 ? { tool: toolSample, input: JSON.stringify(newToolCall.args), output: newToolCall.result as string } : undefined,
              metadata: { tokens: addedTokens, latencyMs: 650 + Math.floor(Math.random() * 400) }
            });

            return currentTasks.map(t => t.id === targetTask.id ? {
              ...t,
              progress: newProgress,
              currentThought: chosenThought,
              toolCalls: [newToolCall, ...t.toolCalls.slice(0, 10)],
              tokenUsage: {
                ...t.tokenUsage,
                completion: t.tokenUsage.completion + addedTokens,
                total: t.tokenUsage.total + addedTokens
              },
              updatedAt: formatTime()
            } : t);
          }
        }

        return currentTasks;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, agents, addLog]);

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
    setAgents
  };
}
