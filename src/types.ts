export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: string | Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  durationMs?: number;
}

export interface TaskStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  agentId: string;
  status: TaskStatus;
  priority: Priority;
  priorityWeight?: number; // 1 - 5: Priority Weight for visual glow emphasis on Kanban board
  tags: string[];
  createdAt: string;
  updatedAt: string;
  progress: number; // 0 - 100
  currentThought?: string;
  steps: TaskStep[];
  toolCalls: ToolCall[];
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
  humanReviewNote?: string;
  humanFeedback?: string;
  error?: string;
}

export type LogLevel = 'INFO' | 'THOUGHT' | 'TOOL_CALL' | 'TOOL_RESULT' | 'WARN' | 'ERROR' | 'HUMAN_PROMPT' | 'SUCCESS';

export interface AgentLog {
  id: string;
  taskId?: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  thoughtContent?: string;
  toolCall?: {
    tool: string;
    input: string;
    output?: string;
  };
  metadata?: {
    tokens?: number;
    latencyMs?: number;
    model?: string;
  };
}

export type AgentState = 'idle' | 'executing' | 'review_pending' | 'error' | 'paused';

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  avatarColor: string;
  iconName: string;
  state: AgentState;
  connectionStatus: 'online' | 'degraded' | 'offline';
  pingMs: number;
  currentTaskId?: string;
  completedTasksCount: number;
  totalTokensUsed: number;
  systemPrompt: string;
  tools: string[];
  temperature: number;
}

export interface AgentChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isHuman?: boolean;
}

export interface ToolStat {
  name: string;
  uses: number;
}

export interface SystemMetrics {
  activeAgentsCount: number;
  totalTasks: number;
  executingTasksCount: number;
  reviewPendingCount: number;
  completedTasksCount: number;
  totalTokens: number;
  tokensPerSec: number;
  avgLatencyMs: number;
  successRate: number;
  memoryUsageMb: number;
  toolUsage?: ToolStat[];
}
