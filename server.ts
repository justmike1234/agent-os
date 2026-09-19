import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AgentTask, AgentInfo, AgentLog, TaskStatus, AgentChatMessage, SystemMetrics } from "./src/types";

/**
 * Agentic Kanban OS — LIVE backend.
 *
 * Replaces the in-memory mock stores with adapters over the real SovereignOS
 * fleet APIs on port 8504 (hr_ledger + sovereign bridge). Task creation goes
 * through the same approval-watcher pipe the dashboard uses, so the ledger's
 * audit-hash chain stays intact.
 */

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FLEET = process.env.FLEET_API || "http://127.0.0.1:8504";

app.use(express.json());

function getTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

async function fleetJSON<T = any>(route: string): Promise<T | null> {
  try {
    const r = await fetch(`${FLEET}${route}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) {
      console.warn(`fleet ${route}: HTTP ${r.status}`);
      return null;
    }
    return (await r.json()) as T;
  } catch (e: any) {
    console.warn(`fleet ${route}: FETCH FAILED: ${e?.message} ${e?.cause?.message || ''}`);
    return null;
  }
}

// ----------------- adapters: fleet roster -> AgentInfo -----------------

const DEPT_STYLE: Record<string, { color: string; icon: string }> = {
  executive: { color: 'from-violet-500 to-purple-600', icon: 'Brain' },
  revenue: { color: 'from-emerald-500 to-teal-600', icon: 'TrendingUp' },
  engineering: { color: 'from-amber-500 to-orange-600', icon: 'Code' },
  intelligence: { color: 'from-blue-600 to-indigo-600', icon: 'Search' },
  operations: { color: 'from-cyan-500 to-sky-600', icon: 'Cpu' },
  people_ops: { color: 'from-pink-500 to-rose-600', icon: 'Users' },
  external_systems: { color: 'from-slate-500 to-gray-600', icon: 'Server' },
  runtime: { color: 'from-slate-500 to-gray-600', icon: 'Server' },
};

function mapAgent(a: any): AgentInfo {
  const dept = (a.department || 'operations').toLowerCase();
  const style = DEPT_STYLE[dept] || DEPT_STYLE.operations;
  const state: AgentInfo['state'] =
    a.status === 'working' ? 'executing' :
    a.status === 'blocked' ? 'review_pending' :
    a.status === 'error' ? 'error' : 'idle';
  return {
    id: a.id,
    name: a.name || a.id,
    role: a.role || `${(a.tier || 'T2').toUpperCase()} agent`,
    model: `${(a.tier || 'T2').toUpperCase()} · ${a.source || 'ledger'}`,
    avatarColor: style.color,
    iconName: style.icon,
    state,
    connectionStatus: a.health === 'healthy' ? 'online' : a.health === 'degraded' ? 'degraded' : 'offline',
    pingMs: 0,
    currentTaskId: undefined,
    completedTasksCount: a.completed || 0,
    totalTokensUsed: 0,
    systemPrompt: `${a.role || 'Agent'} in ${a.department || 'operations'} — reports to ${a.reports_to || 'CEO'}.`,
    tools: [],
    temperature: 0.2,
  };
}

// ----------------- adapters: ledger tasks -> AgentTask -----------------

const LEDGER_STATUS: Record<string, TaskStatus> = {
  running: 'in-progress',
  pending_approval: 'review',
  completed: 'done',
  failed: 'failed',
};

const TIER_PRIORITY: Record<string, AgentTask['priority']> = {
  T0: 'low', T1: 'low', T2: 'medium', T3: 'high', T4: 'urgent',
};

function mapTask(t: any, agentIds: Set<string>): AgentTask | null {
  const status = LEDGER_STATUS[t.status];
  if (!status) return null;
  const agentId = agentIds.has(t.agent) ? t.agent : 'mnemosyne';
  let created = new Date();
  if (t.opened_at) {
    const parsed = new Date(String(t.opened_at).includes('T') ? t.opened_at : String(t.opened_at).replace(' ', 'T') + 'Z');
    if (!isNaN(parsed.getTime())) created = parsed;
  }
  return {
    id: `task-${t.id}`,
    title: t.title || `Task ${t.id}`,
    description: t.title || '',
    agentId,
    status,
    priority: TIER_PRIORITY[t.tier] || 'medium',
    priorityWeight: t.tier === 'T4' ? 5 : t.tier === 'T3' ? 4 : 3,
    tags: [t.tier || 'T2'],
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    progress: status === 'done' ? 100 : status === 'in-progress' ? 50 : 0,
    steps: [],
    toolCalls: [],
    tokenUsage: { prompt: 0, completion: 0, total: 0 },
    latencyMs: 0,
  };
}

// ----------------- API ROUTES (live) -----------------

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: getTimestamp(), backend: "sovereign-fleet", fleetApi: FLEET });
});

// GET /api/agents — live fleet roster
app.get("/api/agents", async (req, res) => {
  const d = await fleetJSON<any>("/api/fleet/roster");
  const list = d?.data?.agents || d?.agents;
  if (!list) return res.status(502).json({ error: "fleet roster unavailable" });
  res.json({ agents: list.filter((a: any) => a.source !== 'runtime').map(mapAgent) });
});

// GET /api/tasks — live ledger tasks
app.get("/api/tasks", async (req, res) => {
  const [roster, tasksData] = await Promise.all([
    fleetJSON<any>("/api/fleet/roster"),
    fleetJSON<any>("/api/sovereign/hr-tasks?limit=300"),
  ]);
  const rAgents = roster?.data?.agents || roster?.agents || [];
  const ledgerTasks = tasksData?.tasks || tasksData?.data?.tasks || [];
  if (!rAgents.length && !ledgerTasks.length) return res.status(502).json({ error: "fleet data unavailable" });
  const agentIds = new Set<string>(rAgents.map((a: any) => a.id));
  const tasks = ledgerTasks.map((t: any) => mapTask(t, agentIds)).filter(Boolean);
  res.json({ tasks, timestamp: getTimestamp() });
});

// GET /api/logs — live ledger audit trail (fallback: sovereign activity)
app.get("/api/logs", async (req, res) => {
  let logs: AgentLog[] = [];
  const ledger = await fleetJSON<any>("/api/sovereign/hr-ledger");
  const audit = ledger?.recent_audit || ledger?.data?.recent_audit || [];
  if (audit.length) {
    logs = audit.map((a: any, i: number): AgentLog => {
      let payload: any = {};
      try { payload = JSON.parse(a.payload_json || "{}"); } catch { /* keep empty */ }
      const level: AgentLog['level'] =
        a.event_type === 'task.failed' ? 'ERROR' :
        a.event_type?.includes('approved') ? 'SUCCESS' :
        a.event_type?.includes('denied') ? 'WARN' : 'INFO';
      return {
        id: `log-audit-${a.id ?? i}`,
        agentId: payload.agent || 'fleet',
        agentName: payload.agent || 'Fleet',
        timestamp: String(a.created_at || '').substring(11, 19),
        level,
        message: `${a.event_type || 'event'} · task #${payload.task_id ?? '?'} · ${payload.status || ''}`.trim(),
        metadata: payload.tier ? { model: String(payload.tier) } : undefined,
      };
    });
  } else {
    const d = await fleetJSON<any>("/api/sovereign/activity");
    const acts = d?.activities || d?.data?.activities || [];
    logs = acts.slice(0, 120).map((act: any, i: number) => ({
      id: `log-live-${i}-${act.id ?? i}`,
      agentId: act.agent_id || act.agent || 'fleet',
      agentName: act.agent_name || act.agent_id || act.agent || 'Fleet',
      timestamp: String(act.ts || '').substring(11, 19) || getTimestamp(),
      level: act.status === 'failed' ? 'ERROR' : act.status === 'completed' ? 'SUCCESS' : 'INFO',
      message: `${act.event_type || act.type || 'event'} · ${act.experiment_id || act.title || act.id || ''}`.trim(),
    }));
  }
  res.json({ logs, count: logs.length });
});

// GET /api/stats - real dashboard metrics
app.get("/api/stats", async (req, res) => {
  const [roster, tasksData] = await Promise.all([
    fleetJSON<any>("/api/fleet/roster"),
    fleetJSON<any>("/api/sovereign/hr-tasks?limit=500"),
  ]);
  const agents = roster?.data?.agents || roster?.agents || [];
  const tasks = tasksData?.tasks || tasksData?.data?.tasks || [];
  const ledger = await fleetJSON<any>("/api/sovereign/hr-ledger");
  const approvals = ledger?.pending_approvals || ledger?.data?.pending_approvals || [];
  const completed = tasks.filter((t: any) => t.status === 'completed').length;
  const metrics: SystemMetrics = {
    activeAgentsCount: agents.filter((a: any) => a.status === 'working').length,
    totalTasks: tasks.length,
    executingTasksCount: tasks.filter((t: any) => t.status === 'running').length,
    reviewPendingCount: approvals.length,
    completedTasksCount: completed,
    totalTokens: 0,
    tokensPerSec: 0,
    avgLatencyMs: 0,
    successRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    memoryUsageMb: 0,
    toolUsage: [],
  };
  res.json(metrics);
});

// POST /api/tasks — create a REAL task through the ledger pipe
app.post("/api/tasks", async (req, res) => {
  const { title, agentId, priority, tier } = req.body || {};
  if (!title) return res.status(400).json({ error: "Title is required" });
  if (!agentId) return res.status(400).json({ error: "agentId is required" });
  const tierNum = typeof tier === 'number' ? tier : priority === 'urgent' ? 4 : priority === 'high' ? 3 : 2;
  try {
    const r = await fetch(`${FLEET}/api/fleet/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agentId, task: String(title).trim(), tier: tierNum }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) return res.status(502).json({ error: d.error || 'fleet refused task' });
    res.status(201).json({ success: true, ledgerResult: d });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || 'fleet unreachable' });
  }
});

// PUT /api/tasks/:id/assign — ledger owns assignment; read-only
app.put("/api/tasks/:id/assign", (req, res) => {
  res.json({ success: false, message: "Ledger tasks are assigned at creation; reassignment not supported." });
});

// PUT /api/tasks/:id — ledger owns task state; read-only
app.put("/api/tasks/:id", (req, res) => {
  res.json({ success: false, message: "Ledger task state is owned by the HR ledger." });
});

// GET /api/tasks/:id
app.get("/api/tasks/:id", async (req, res) => {
  const [roster, ledger] = await Promise.all([
    fleetJSON<any>("/api/fleet/roster"),
    fleetJSON<any>("/api/sovereign/hr-ledger"),
  ]);
  if (!roster || !ledger) return res.status(502).json({ error: "fleet data unavailable" });
  const rAgents = roster?.data?.agents || roster?.agents || [];
  const ledgerTasks = ledger?.tasks || ledger?.data?.tasks || [];
  const agentIds = new Set<string>(rAgents.map((a: any) => a.id));
  const t = ledgerTasks.find((x: any) => `task-${x.id}` === req.params.id);
  if (!t) return res.status(404).json({ error: "Task not found" });
  const mappedAgents = rAgents.map(mapAgent);
  const mapped = mapTask(t, agentIds);
  res.json({ task: mapped, assignedAgent: mapped ? mappedAgents.find((a: AgentInfo) => a.id === mapped.agentId) : null });
});

// ----------------- chat (in-memory relay) -----------------

let backendChat: AgentChatMessage[] = [];

app.get("/api/chat", (req, res) => {
  res.json({ messages: backendChat });
});

app.post("/api/chat", (req, res) => {
  const { senderId, senderName, message, isHuman } = req.body || {};
  if (!senderId || !message) return res.status(400).json({ error: "Missing required chat fields" });
  const newMessage: AgentChatMessage = {
    id: `chat-${Date.now()}`,
    senderId,
    senderName: senderName || senderId,
    message,
    timestamp: getTimestamp(),
    isHuman: isHuman || false,
  };
  backendChat = [...backendChat, newMessage].slice(-100);
  res.status(201).json(newMessage);
});

// POST /api/reset — live mode: nothing to reset server-side
app.post("/api/reset", (req, res) => {
  res.json({ success: true, message: "Live mode — state refreshes from the fleet" });
});

// ----------------- VITE MIDDLEWARE SETUP -----------------

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
    console.log(`Agentic Kanban OS (LIVE · fleet ${FLEET}) on http://localhost:${PORT}`);
  });
}

startServer();
