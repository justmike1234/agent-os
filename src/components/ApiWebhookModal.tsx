import React, { useState } from 'react';
import { X, Code2, Copy, Check, Terminal, ExternalLink, Cpu, Play } from 'lucide-react';

interface ApiWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiWebhookModal: React.FC<ApiWebhookModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'fastapi' | 'langgraph' | 'curl' | 'websocket'>('fastapi');
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const FASTAPI_SNIPPET = `# server.py - FastAPI Bridge for Hermes Agent & Agentic Kanban OS
import asyncio
import json
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Real-time WebSocket Broadcaster
class DashboardBridge:
    def __init__(self):
        self.connections = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    async def emit_thought(self, agent: str, thought: str, task_id: str = None):
        msg = {
            "type": "LOG",
            "agent": agent,
            "level": "THOUGHT",
            "message": f"Reasoning trace from @{agent}",
            "thoughtContent": f"<thought>\\n{thought}\\n</thought>",
            "taskId": task_id
        }
        for ws in self.connections:
            await ws.send_json(msg)

    async def update_task_status(self, task_id: str, status: str, progress: int = 100):
        msg = {
            "type": "TASK_UPDATED",
            "data": {"id": task_id, "status": status, "progress": progress}
        }
        for ws in self.connections:
            await ws.send_json(msg)

bridge = DashboardBridge()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await bridge.connect(websocket)
    while True:
        await asyncio.sleep(1)

# Usage in your Hermes Agent loop:
# await bridge.emit_thought("Hermes-3", "Analyzing SQL constraints...", "task-103")
# await bridge.update_task_status("task-103", "review", progress=95)`;

  const LANGGRAPH_SNIPPET = `# langgraph_kanban_hook.py
from langchain_core.callbacks import BaseCallbackHandler

class KanbanStreamCallback(BaseCallbackHandler):
    """Streams LangGraph node executions & tool calls to Agentic Kanban OS"""
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        print("[AgenticKanban] LLM Thought Stream Initiated")
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        tool_name = serialized.get("name")
        # Post to dashboard webhook
        # requests.post("http://localhost:3000/api/logs", json={
        #   "level": "TOOL_CALL",
        #   "agentName": "Hermes",
        #   "toolCall": {"tool": tool_name, "input": input_str}
        # })

    def on_tool_end(self, output, **kwargs):
        pass`;

  const CURL_SNIPPET = `# 1. Assign or Reassign an Agent to a Task
curl -X PUT http://localhost:3000/api/tasks/task-102/assign \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "data-scout"
  }'

# 2. Push a real-time Thought Trace to Kanban OS
curl -X POST http://localhost:3000/api/logs \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentName": "Hermes-3-Core",
    "level": "THOUGHT",
    "message": "Analyzing competitor pricing models",
    "thoughtContent": "<thought>\\nDecomposing token rate limits and concurrency SLAs...\\n</thought>",
    "taskId": "task-102"
  }'

# 3. Advance a task to "Validation (HITL)" stage
curl -X PUT http://localhost:3000/api/tasks/task-103 \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "review",
    "progress": 95,
    "humanReviewNote": "Requires operator authorization for database migration"
  }'`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Backend Integration & Webhooks</h2>
              <p className="text-xs text-slate-400">Connect your Python Hermes agent, FastAPI server, or LangGraph fleet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-mono">
          {[
            { id: 'fastapi', label: 'FastAPI + WebSockets' },
            { id: 'langgraph', label: 'LangGraph / CrewAI' },
            { id: 'curl', label: 'cURL / REST Webhooks' }
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

        <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
          {activeTab === 'fastapi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>FastAPI WebSocket Broadcaster Script:</span>
                <button
                  onClick={() => copyCode('fastapi', FASTAPI_SNIPPET)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-slate-800 px-2 py-1 rounded"
                >
                  {copied === 'fastapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'fastapi' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {FASTAPI_SNIPPET}
              </pre>
            </div>
          )}

          {activeTab === 'langgraph' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>LangChain / LangGraph Callback Handler:</span>
                <button
                  onClick={() => copyCode('langgraph', LANGGRAPH_SNIPPET)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-slate-800 px-2 py-1 rounded"
                >
                  {copied === 'langgraph' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'langgraph' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {LANGGRAPH_SNIPPET}
              </pre>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Direct REST Endpoint Examples:</span>
                <button
                  onClick={() => copyCode('curl', CURL_SNIPPET)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-slate-800 px-2 py-1 rounded"
                >
                  {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'curl' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                {CURL_SNIPPET}
              </pre>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
