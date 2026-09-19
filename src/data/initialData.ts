import { AgentInfo, AgentTask, AgentLog, AgentChatMessage } from '../types';

export const INITIAL_CHAT_MESSAGES: AgentChatMessage[] = [
  {
    id: 'chat-1',
    senderId: 'hermes-core',
    senderName: 'Hermes-3 Core',
    message: 'DataScout, can you fetch the latest 2025 specs for concurrent tool calling on standard tier?',
    timestamp: '10:01:10 AM'
  },
  {
    id: 'chat-2',
    senderId: 'data-scout',
    senderName: 'DataScout-01',
    message: 'Acknowledged. Querying indexed API docs and extracting table parameters.',
    timestamp: '10:01:25 AM'
  },
  {
    id: 'chat-3',
    senderId: 'human',
    senderName: 'Operator',
    message: 'Remember to check SLA guarantees specifically.',
    timestamp: '10:02:12 AM',
    isHuman: true
  },
  {
    id: 'chat-4',
    senderId: 'data-scout',
    senderName: 'DataScout-01',
    message: 'Will do. I will pass the SLA metrics over to DocSynth for the matrix.',
    timestamp: '10:02:40 AM'
  }
];

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'hermes-core',
    name: 'Hermes-3 Core',
    role: 'Reasoning Orchestrator',
    model: 'Hermes-3-Llama-3.1-70B',
    avatarColor: 'from-blue-600 to-indigo-600',
    iconName: 'Brain',
    state: 'executing',
    connectionStatus: 'online',
    pingMs: 24,
    currentTaskId: 'task-102',
    completedTasksCount: 42,
    totalTokensUsed: 184500,
    systemPrompt: 'You are Hermes-3, an advanced autonomous reasoning orchestrator. Emit explicit <thought>...</thought> step-by-step reasoning chains before every action.',
    tools: ['decompose_plan', 'delegate_task', 'synthesize_results', 'ask_human_review'],
    temperature: 0.2
  },
  {
    id: 'data-scout',
    name: 'DataScout-01',
    role: 'Search & Retrieval Specialist',
    model: 'Gemini-2.5-Flash',
    avatarColor: 'from-emerald-500 to-teal-600',
    iconName: 'Search',
    state: 'executing',
    connectionStatus: 'online',
    pingMs: 18,
    currentTaskId: 'task-101',
    completedTasksCount: 68,
    totalTokensUsed: 92400,
    systemPrompt: 'Retrieve high-precision web documents, technical papers, and API schemas. Summarize key findings with citations.',
    tools: ['serp_search', 'arxiv_query', 'fetch_webpage', 'vector_store_query'],
    temperature: 0.1
  },
  {
    id: 'code-synth',
    name: 'CodeSynth-Py',
    role: 'Code Synthesis & Exec Engine',
    model: 'Hermes-3-Coder-70B',
    avatarColor: 'from-amber-500 to-orange-600',
    iconName: 'Code',
    state: 'review_pending',
    connectionStatus: 'degraded',
    pingMs: 145,
    currentTaskId: 'task-103',
    completedTasksCount: 31,
    totalTokensUsed: 245000,
    systemPrompt: 'Generate idempotent, secure Python and TypeScript code. Execute tests in isolated sandboxes and verify stdout/stderr.',
    tools: ['python_repl', 'bash_sandbox', 'ast_linter', 'git_diff_analyzer'],
    temperature: 0.0
  },
  {
    id: 'sec-auditor',
    name: 'SecAuditor-Guard',
    role: 'Safety & HITL Policy Validator',
    model: 'Hermes-3-Guard-8B',
    avatarColor: 'from-rose-500 to-red-600',
    iconName: 'ShieldAlert',
    state: 'idle',
    connectionStatus: 'online',
    pingMs: 32,
    completedTasksCount: 54,
    totalTokensUsed: 67200,
    systemPrompt: 'Inspect agent tool payloads for destructive operations, credentials leakage, and policy non-compliance. Flag for Human Review when risk score > 0.6.',
    tools: ['jwt_analyzer', 'leak_detector', 'human_escalation_request'],
    temperature: 0.0
  },
  {
    id: 'doc-writer',
    name: 'DocSynth-Writer',
    role: 'Technical Documentation & Report Agent',
    model: 'Gemini-2.5-Pro',
    avatarColor: 'from-purple-500 to-pink-600',
    iconName: 'FileText',
    state: 'idle',
    connectionStatus: 'offline',
    pingMs: 0,
    completedTasksCount: 19,
    totalTokensUsed: 112000,
    systemPrompt: 'Produce executive summaries, technical markdown specs, and API documentation from agent task outputs.',
    tools: ['markdown_generator', 'mermaid_renderer', 'export_pdf'],
    temperature: 0.4
  }
];

export const INITIAL_TASKS: AgentTask[] = [
  {
    id: 'task-101',
    title: 'Distributed Vector Index Optimization',
    description: 'Benchmark HNSW vs IVF-PQ indexing latencies over 10M synthetic embeddings with qps/recall trade-off.',
    agentId: 'data-scout',
    status: 'in-progress',
    priority: 'high',
    priorityWeight: 3,
    tags: ['retrieval', 'vector-db', 'benchmark'],
    createdAt: '10:14:02 AM',
    updatedAt: '10:18:45 AM',
    progress: 65,
    currentThought: 'Analyzing cosine similarity degradation under 8-bit scalar quantization. Running batch evaluation.',
    steps: [
      { id: 's1', title: 'Generate 10M 1536-dim synthetic vectors', status: 'completed' },
      { id: 's2', title: 'Compile benchmark harness with FAISS/Milvus', status: 'completed' },
      { id: 's3', title: 'Execute sweep across M=16,32,64 and efSearch=128', status: 'active' },
      { id: 's4', title: 'Synthesize recall vs latency Pareto curve', status: 'pending' }
    ],
    toolCalls: [
      {
        id: 'tc-1',
        name: 'python_repl',
        args: { script: 'import faiss; index = faiss.IndexHNSWFlat(1536, 32); index.add(vectors)' },
        result: 'Successfully indexed 10,000,000 vectors in 14.2s. Memory footprint: 61.4 GB.',
        status: 'completed',
        timestamp: '10:16:10 AM',
        durationMs: 1420
      },
      {
        id: 'tc-2',
        name: 'vector_store_query',
        args: { top_k: 100, efSearch: 128, test_queries: 1000 },
        result: 'Running 1000 test probes... mean latency: 1.42ms, recall@10: 98.6%',
        status: 'completed',
        timestamp: '10:17:50 AM',
        durationMs: 890
      }
    ],
    tokenUsage: { prompt: 14200, completion: 3850, total: 18050 },
    latencyMs: 1240
  },
  {
    id: 'task-102',
    title: 'Autonomous Multi-Hop Competitor Intelligence',
    description: 'Decompose enterprise AI agent platforms pricing, rate limits, tool calling architectures, and SLA tiers.',
    agentId: 'hermes-core',
    status: 'in-progress',
    priority: 'urgent',
    priorityWeight: 5,
    tags: ['market-intel', 'hermes-reasoning', 'pricing'],
    createdAt: '10:10:15 AM',
    updatedAt: '10:19:02 AM',
    progress: 80,
    currentThought: '<thought> We have gathered 4 major competitors. Need to cross-verify token tier overage costs and concurrency thresholds before human signoff. </thought>',
    steps: [
      { id: 's1', title: 'Formulate search queries for 8 top agent platforms', status: 'completed' },
      { id: 's2', title: 'Extract pricing tables and SLA documents', status: 'completed' },
      { id: 's3', title: 'Compute normalized cost per 1M tool-calling tokens', status: 'active' },
      { id: 's4', title: 'Compile comparison matrix for orchestrator review', status: 'pending' }
    ],
    toolCalls: [
      {
        id: 'tc-3',
        name: 'serp_search',
        args: { query: 'enterprise LLM agent pricing concurrency SLA 2025' },
        result: 'Found 18 indexed pricing disclosures. Extracted structured tier specs.',
        status: 'completed',
        timestamp: '10:12:30 AM',
        durationMs: 640
      },
      {
        id: 'tc-4',
        name: 'synthesize_results',
        args: { format: 'markdown_table', metrics: ['p95_latency', 'cost_per_m_tokens', 'tool_rate_limits'] },
        result: 'Matrix generated with 6 providers and normalized pricing tiers.',
        status: 'completed',
        timestamp: '10:15:44 AM',
        durationMs: 1120
      }
    ],
    tokenUsage: { prompt: 28400, completion: 6100, total: 34500 },
    latencyMs: 980
  },
  {
    id: 'task-103',
    title: 'Production Database Migration Script & Dry Run',
    description: 'Generate zero-downtime PostgreSQL schema migration adding compound index on agent_session_events table.',
    agentId: 'code-synth',
    status: 'review',
    priority: 'urgent',
    priorityWeight: 4,
    tags: ['database', 'hitl-review', 'sql-ddl', 'security'],
    createdAt: '09:55:00 AM',
    updatedAt: '10:18:10 AM',
    progress: 95,
    currentThought: 'Migration script generated. CONCURRENTLY keyword included. Waiting for Human-in-the-loop validation before applying to staging replica.',
    humanReviewNote: '⚠️ Sensitive DDL Operation: Requires manual engineer authorization to proceed with table locking verification.',
    steps: [
      { id: 's1', title: 'Analyze table statistics and query traffic patterns', status: 'completed' },
      { id: 's2', title: 'Generate CREATE INDEX CONCURRENTLY SQL script', status: 'completed' },
      { id: 's3', title: 'Simulate migration lock timeout in test sandbox', status: 'completed' },
      { id: 's4', title: 'Request Human-in-the-Loop Operator Authorization', status: 'active' }
    ],
    toolCalls: [
      {
        id: 'tc-5',
        name: 'python_repl',
        args: { script: 'import psycopg2; # dry run on mock 10M table' },
        result: 'Execution simulated successfully in 3.1s with zero exclusive locks.',
        status: 'completed',
        timestamp: '10:11:05 AM',
        durationMs: 3100
      },
      {
        id: 'tc-6',
        name: 'ask_human_review',
        args: { action: 'EXECUTE_STAGING_MIGRATION', risk_level: 'MEDIUM', timeout_sec: 3600 },
        result: 'Human approval token requested. Awaiting operator confirmation in Kanban review column.',
        status: 'running',
        timestamp: '10:18:10 AM',
        durationMs: 0
      }
    ],
    tokenUsage: { prompt: 16500, completion: 4200, total: 20700 },
    latencyMs: 1450
  },
  {
    id: 'task-104',
    title: 'Automated OpenAPI 3.1 Contract Generation',
    description: 'Inspect Express and FastAPI endpoints, extract Pydantic schemas, and compile OpenAPI 3.1 JSON spec with Swagger UI.',
    agentId: 'doc-writer',
    status: 'todo',
    priority: 'medium',
    priorityWeight: 2,
    tags: ['api-docs', 'swagger', 'schema-validation'],
    createdAt: '10:05:00 AM',
    updatedAt: '10:05:00 AM',
    progress: 0,
    steps: [
      { id: 's1', title: 'Parse route controllers using TypeScript AST', status: 'pending' },
      { id: 's2', title: 'Infer request/response JSON schemas', status: 'pending' },
      { id: 's3', title: 'Validate spec against OpenAPI 3.1 validator', status: 'pending' }
    ],
    toolCalls: [],
    tokenUsage: { prompt: 0, completion: 0, total: 0 },
    latencyMs: 0
  },
  {
    id: 'task-105',
    title: 'Self-Healing Unit Test Suite for Auth Service',
    description: 'Analyze flaky JWT refresh token race condition tests, generate fix patch, and run 50 stress iterations.',
    agentId: 'code-synth',
    status: 'done',
    priority: 'high',
    priorityWeight: 1,
    tags: ['testing', 'self-healing', 'ci-cd'],
    createdAt: '09:20:00 AM',
    updatedAt: '10:02:15 AM',
    progress: 100,
    currentThought: 'Refactored token mutex lock in redis_session_store.ts. 50/50 concurrent iterations passed with zero race conditions.',
    steps: [
      { id: 's1', title: 'Capture test failure stack traces', status: 'completed' },
      { id: 's2', title: 'Diagnose atomic lock release timing', status: 'completed' },
      { id: 's3', title: 'Inject Redlock distributed mutex', status: 'completed' },
      { id: 's4', title: 'Run 50 parallel verification runs', status: 'completed' }
    ],
    toolCalls: [
      {
        id: 'tc-7',
        name: 'bash_sandbox',
        args: { command: 'npm test -- auth.test.ts --repeat=50' },
        result: 'PASS: 50 runs, 0 failures. Execution time: 18.4s.',
        status: 'completed',
        timestamp: '10:01:40 AM',
        durationMs: 18400
      }
    ],
    tokenUsage: { prompt: 32000, completion: 8400, total: 40400 },
    latencyMs: 820
  },
  {
    id: 'task-106',
    title: 'Autonomous Cloud Security & IAM Privilege Audit',
    description: 'Scan GCP service account roles for over-privileged permissions (Editor/Owner) and generate least-privilege Terraform patch.',
    agentId: 'sec-auditor',
    status: 'done',
    priority: 'urgent',
    priorityWeight: 4,
    tags: ['iam', 'security-audit', 'terraform'],
    createdAt: '08:45:00 AM',
    updatedAt: '09:30:10 AM',
    progress: 100,
    steps: [
      { id: 's1', title: 'Query Cloud Asset Inventory for active bindings', status: 'completed' },
      { id: 's2', title: 'Correlate with 90-day Cloud Audit Logs usage', status: 'completed' },
      { id: 's3', title: 'Generate Terraform least-privilege module', status: 'completed' }
    ],
    toolCalls: [
      {
        id: 'tc-8',
        name: 'leak_detector',
        args: { scan_target: 'terraform_state', rules: ['IAM_OVERPRIVILEGED', 'KEY_ROTATION_EXPIRED'] },
        result: 'Audit complete. Found 2 over-privileged bindings. Generated remediation HCL patch.',
        status: 'completed',
        timestamp: '09:28:15 AM',
        durationMs: 2400
      }
    ],
    tokenUsage: { prompt: 19800, completion: 5100, total: 24900 },
    latencyMs: 760
  }
];

export const INITIAL_LOGS: AgentLog[] = [
  {
    id: 'log-1',
    taskId: 'task-102',
    agentId: 'hermes-core',
    agentName: 'Hermes-3 Core',
    timestamp: '10:10:15 AM',
    level: 'INFO',
    message: 'Orchestrator received autonomous research objective: Multi-Hop Competitor Intelligence.',
    metadata: { tokens: 120, latencyMs: 310 }
  },
  {
    id: 'log-2',
    taskId: 'task-102',
    agentId: 'hermes-core',
    agentName: 'Hermes-3 Core',
    timestamp: '10:10:22 AM',
    level: 'THOUGHT',
    message: 'Decomposing objective into parallel sub-tasks.',
    thoughtContent: '<thought>\n1. Identify current market leaders in multi-agent orchestration frameworks.\n2. Fetch official pricing models and tool-calling execution limits.\n3. Compute cost-per-million tokens under high-frequency reasoning loops.\n4. Delegate retrieval to DataScout-01 and schema extraction.\n</thought>',
    metadata: { tokens: 420, latencyMs: 540 }
  },
  {
    id: 'log-3',
    taskId: 'task-101',
    agentId: 'data-scout',
    agentName: 'DataScout-01',
    timestamp: '10:14:02 AM',
    level: 'INFO',
    message: 'Task dispatched: Distributed Vector Index Optimization.',
    metadata: { tokens: 280, latencyMs: 410 }
  },
  {
    id: 'log-4',
    taskId: 'task-101',
    agentId: 'data-scout',
    agentName: 'DataScout-01',
    timestamp: '10:16:10 AM',
    level: 'TOOL_CALL',
    message: 'Invoking tool: python_repl for FAISS index build.',
    toolCall: {
      tool: 'python_repl',
      input: 'import faiss; index = faiss.IndexHNSWFlat(1536, 32); index.add(vectors)'
    },
    metadata: { tokens: 840, latencyMs: 1420 }
  },
  {
    id: 'log-5',
    taskId: 'task-101',
    agentId: 'data-scout',
    agentName: 'DataScout-01',
    timestamp: '10:16:25 AM',
    level: 'TOOL_RESULT',
    message: 'Tool output received from python_repl.',
    toolCall: {
      tool: 'python_repl',
      input: 'import faiss; index = faiss.IndexHNSWFlat(1536, 32); index.add(vectors)',
      output: 'Successfully indexed 10,000,000 vectors in 14.2s. Memory footprint: 61.4 GB.'
    },
    metadata: { tokens: 310, latencyMs: 250 }
  },
  {
    id: 'log-6',
    taskId: 'task-103',
    agentId: 'code-synth',
    agentName: 'CodeSynth-Py',
    timestamp: '10:18:10 AM',
    level: 'HUMAN_PROMPT',
    message: '⚠️ HUMAN IN THE LOOP REQUIRED: Staging PostgreSQL migration requires manual operator sign-off.',
    thoughtContent: '<thought>\nTable size is 12.4M rows. CONCURRENTLY avoids table-level write locks, but we must verify transaction timeout thresholds with the DevOps team.\n</thought>',
    metadata: { tokens: 620, latencyMs: 780 }
  },
  {
    id: 'log-7',
    taskId: 'task-102',
    agentId: 'hermes-core',
    agentName: 'Hermes-3 Core',
    timestamp: '10:19:02 AM',
    level: 'THOUGHT',
    message: 'Synthesizing competitor pricing matrices.',
    thoughtContent: '<thought>\nWe have parsed 4 pricing docs. Comparing Claude 3.7 Sonnet hybrid reasoning tokens ($3/$15 per M) with DeepSeek R1 and Hermes 3 70B open-weights self-hosted ($0.40/M). Formulating recommendations.\n</thought>',
    metadata: { tokens: 910, latencyMs: 620 }
  }
];
