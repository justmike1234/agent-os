import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_AGENTS, INITIAL_TASKS, INITIAL_LOGS, INITIAL_CHAT_MESSAGES } from "./src/data/initialData";
import { AgentTask, AgentInfo, AgentLog, TaskStatus, AgentChatMessage, SystemMetrics } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory backend data stores for agent assignments and tasks
let backendTasks: AgentTask[] = JSON.parse(JSON.stringify(INITIAL_TASKS));
let backendAgents: AgentInfo[] = JSON.parse(JSON.stringify(INITIAL_AGENTS));
let backendLogs: AgentLog[] = JSON.parse(JSON.stringify(INITIAL_LOGS));
let backendChat: AgentChatMessage[] = JSON.parse(JSON.stringify(INITIAL_CHAT_MESSAGES));

function getTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

// ----------------- API ROUTES ----------------- //

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: getTimestamp(), activeTasks: backendTasks.length, agents: backendAgents.length });
});

// GET /api/stats - Dashboard metrics
app.get("/api/stats", (req, res) => {
  const executingTasks = backendTasks.filter(t => t.status === 'in-progress');
  const reviewTasks = backendTasks.filter(t => t.status === 'review');
  const doneTasks = backendTasks.filter(t => t.status === 'done');
  const totalTasksCount = backendTasks.length;
  
  const totalTokens = backendTasks.reduce((acc, t) => acc + (t.tokenUsage?.total || 0), 0);
  const totalLatency = backendTasks.reduce((acc, t) => acc + (t.latencyMs || 0), 0);
  
  // Aggregate tool usage mock stats
  const toolUsage = [
    { name: 'python_repl', uses: 142 },
    { name: 'serp_search', uses: 89 },
    { name: 'vector_store_query', uses: 45 },
    { name: 'synthesize_results', uses: 112 },
    { name: 'ask_human_review', uses: 23 },
    { name: 'bash_sandbox', uses: 67 }
  ].sort((a, b) => b.uses - a.uses);

  const metrics: SystemMetrics = {
    activeAgentsCount: backendAgents.filter(a => a.state === 'executing').length,
    totalTasks: totalTasksCount,
    executingTasksCount: executingTasks.length,
    reviewPendingCount: reviewTasks.length,
    completedTasksCount: doneTasks.length,
    totalTokens,
    tokensPerSec: 320,
    avgLatencyMs: totalTasksCount > 0 ? Math.round(totalLatency / totalTasksCount) : 0,
    successRate: totalTasksCount > 0 ? Math.round((doneTasks.length / totalTasksCount) * 100) : 100,
    memoryUsageMb: 1420,
    toolUsage
  };
  
  res.json(metrics);
});

// GET /api/chat - Get all chat messages
app.get("/api/chat", (req, res) => {
  res.json({ messages: backendChat });
});

// POST /api/chat - Send a new chat message
app.post("/api/chat", (req, res) => {
  const { senderId, senderName, message, isHuman } = req.body;
  if (!senderId || !message) {
    return res.status(400).json({ error: "Missing required chat fields" });
  }
  
  const newMessage: AgentChatMessage = {
    id: `chat-${Date.now()}`,
    senderId,
    senderName,
    message,
    timestamp: getTimestamp(),
    isHuman: isHuman || false
  };
  
  backendChat.push(newMessage);
  res.status(201).json(newMessage);
});

// 1. GET /api/tasks - Retrieve all tasks and their assigned agents
app.get("/api/tasks", (req, res) => {
  res.json({
    tasks: backendTasks,
    timestamp: getTimestamp()
  });
});

// 2. GET /api/agents - Retrieve all predefined agents in the fleet
app.get("/api/agents", (req, res) => {
  res.json({
    agents: backendAgents,
    timestamp: getTimestamp()
  });
});

// 3. GET /api/tasks/:id - Retrieve a single task by ID
app.get("/api/tasks/:id", (req, res) => {
  const task = backendTasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  const assignedAgent = backendAgents.find(a => a.id === task.agentId);
  res.json({ task, assignedAgent });
});

// 4. PUT /api/tasks/:id/assign - Assign or reassign an agent to a specific task
app.put("/api/tasks/:id/assign", (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "agentId is required in request body" });
  }

  const taskIndex = backendTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with id '${id}' not found` });
  }

  const targetAgent = backendAgents.find(a => a.id === agentId);
  if (!targetAgent) {
    return res.status(404).json({ error: `Agent with id '${agentId}' not found in predefined fleet` });
  }

  const previousTask = backendTasks[taskIndex];
  const oldAgentId = previousTask.agentId;
  const oldAgent = backendAgents.find(a => a.id === oldAgentId);

  // Update task assignment
  const updatedTask: AgentTask = {
    ...previousTask,
    agentId: targetAgent.id,
    updatedAt: getTimestamp()
  };
  backendTasks[taskIndex] = updatedTask;

  // Update agent runtime states if task is executing or in review
  if (updatedTask.status === 'in-progress' || updatedTask.status === 'review') {
    backendAgents = backendAgents.map(a => {
      if (a.id === oldAgentId && a.currentTaskId === id) {
        return { ...a, state: 'idle', currentTaskId: undefined };
      }
      if (a.id === targetAgent.id) {
        return { 
          ...a, 
          state: updatedTask.status === 'in-progress' ? 'executing' : 'review_pending', 
          currentTaskId: id 
        };
      }
      return a;
    });
  }

  // Create log audit entry
  const assignmentLog: AgentLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    taskId: id,
    agentId: targetAgent.id,
    agentName: targetAgent.name,
    timestamp: getTimestamp(),
    level: 'INFO',
    message: `Agent assignment updated for "${updatedTask.title}": @${oldAgent ? oldAgent.name : 'Unassigned'} ➔ @${targetAgent.name}.`,
    thoughtContent: `<thought>\nAgent assignment change acknowledged. Context switched to @${targetAgent.name} (Role: ${targetAgent.role}, Tools: [${targetAgent.tools.join(', ')}]).\n</thought>`,
    metadata: {
      model: targetAgent.model
    }
  };
  backendLogs = [assignmentLog, ...backendLogs.slice(0, 200)];

  res.json({
    success: true,
    task: updatedTask,
    assignedAgent: targetAgent,
    log: assignmentLog,
    message: `Task successfully assigned to @${targetAgent.name}`
  });
});

// 5. PUT /api/tasks/:id - Update general task properties (title, description, priority, tags, status, agentId)
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const taskIndex = backendTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const existingTask = backendTasks[taskIndex];
  const { agentId, title, description, priority, tags, status, progress, currentThought } = req.body;

  let agentChanged = false;
  let newAgent = backendAgents.find(a => a.id === existingTask.agentId);

  if (agentId && agentId !== existingTask.agentId) {
    const candidateAgent = backendAgents.find(a => a.id === agentId);
    if (candidateAgent) {
      newAgent = candidateAgent;
      agentChanged = true;
    }
  }

  const updatedTask: AgentTask = {
    ...existingTask,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(priority !== undefined && { priority }),
    ...(tags !== undefined && { tags }),
    ...(status !== undefined && { status }),
    ...(progress !== undefined && { progress }),
    ...(currentThought !== undefined && { currentThought }),
    ...(agentId !== undefined && { agentId: newAgent?.id || existingTask.agentId }),
    updatedAt: getTimestamp()
  };

  backendTasks[taskIndex] = updatedTask;

  if (agentChanged && newAgent) {
    const oldAgent = backendAgents.find(a => a.id === existingTask.agentId);
    const assignmentLog: AgentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      taskId: id,
      agentId: newAgent.id,
      agentName: newAgent.name,
      timestamp: getTimestamp(),
      level: 'INFO',
      message: `Task "${updatedTask.title}" updated and reassigned to @${newAgent.name}.`,
      thoughtContent: `<thought>\nTask modification persisted. Designated executor: @${newAgent.name}.\n</thought>`
    };
    backendLogs = [assignmentLog, ...backendLogs.slice(0, 200)];
  }

  res.json({
    success: true,
    task: updatedTask,
    assignedAgent: newAgent
  });
});

// 6. POST /api/tasks - Create a new task with agent assignment
app.post("/api/tasks", (req, res) => {
  const { title, description, agentId, priority, tags, autoStart } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const assignedAgent = backendAgents.find(a => a.id === agentId) || backendAgents[0];
  const newId = `task-${Date.now().toString().slice(-4)}`;

  const newTask: AgentTask = {
    id: newId,
    title: title.trim(),
    description: description?.trim() || "Autonomous goal decomposition & multi-agent execution.",
    agentId: assignedAgent.id,
    status: autoStart ? 'in-progress' : 'todo',
    priority: priority || 'high',
    tags: tags && tags.length > 0 ? tags : ['autonomous', 'agent-fleet'],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    progress: autoStart ? 15 : 0,
    currentThought: autoStart ? `<thought> Goal ingested: "${title}". Initializing reasoning context for @${assignedAgent.name}. </thought>` : undefined,
    steps: [
      { id: 's1', title: 'Decompose goal & formulate execution graph', status: autoStart ? 'active' : 'pending' },
      { id: 's2', title: 'Execute tool calls and verify outputs', status: 'pending' },
      { id: 's3', title: 'Verify safety policies and compile final report', status: 'pending' }
    ],
    toolCalls: [],
    tokenUsage: { prompt: 1200, completion: 350, total: 1550 },
    latencyMs: 850
  };

  backendTasks = [newTask, ...backendTasks];

  if (autoStart) {
    backendAgents = backendAgents.map(a => a.id === assignedAgent.id ? {
      ...a,
      state: 'executing',
      currentTaskId: newId
    } : a);
  }

  const creationLog: AgentLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    taskId: newId,
    agentId: assignedAgent.id,
    agentName: assignedAgent.name,
    timestamp: getTimestamp(),
    level: 'INFO',
    message: `New task dispatched: "${newTask.title}". Assigned to @${assignedAgent.name}.`,
    thoughtContent: autoStart ? `<thought>\nReceived assignment. Initializing tool bindings for @${assignedAgent.name}.\n</thought>` : undefined
  };
  backendLogs = [creationLog, ...backendLogs.slice(0, 200)];

  res.status(201).json({
    success: true,
    task: newTask,
    assignedAgent
  });
});

// 7. GET /api/logs - Retrieve system logs
app.get("/api/logs", (req, res) => {
  res.json({
    logs: backendLogs,
    count: backendLogs.length
  });
});

// 8. POST /api/reset - Restore initial baseline state
app.post("/api/reset", (req, res) => {
  backendTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
  backendAgents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
  backendLogs = JSON.parse(JSON.stringify(INITIAL_LOGS));
  res.json({ success: true, message: "Demo baseline reset" });
});

// ----------------- VITE MIDDLEWARE SETUP ----------------- //

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hermes Agentic Kanban OS Server running on http://localhost:${PORT}`);
  });
}

startServer();
