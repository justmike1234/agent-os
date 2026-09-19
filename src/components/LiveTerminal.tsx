import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Flame, 
  Cpu, 
  Code, 
  ShieldAlert, 
  MessageSquareQuote, 
  ArrowDownCircle,
  Play,
  Send
} from 'lucide-react';
import { AgentLog, LogLevel, AgentInfo } from '../types';
import { getLogLevelBadge } from '../utils/helpers';

interface LiveTerminalProps {
  logs: AgentLog[];
  agents: AgentInfo[];
  onClearLogs: () => void;
  onInjectLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  isSimulating: boolean;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({
  logs,
  agents,
  onClearLogs,
  onInjectLog,
  isSimulating
}) => {
  const [activeLevelFilter, setActiveLevelFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [customAgent, setCustomAgent] = useState<string>('hermes-core');
  const [customLevel, setCustomLevel] = useState<LogLevel>('THOUGHT');
  const [showInjectPanel, setShowInjectPanel] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (activeLevelFilter !== 'ALL') {
      if (activeLevelFilter === 'THOUGHT' && log.level !== 'THOUGHT') return false;
      if (activeLevelFilter === 'TOOL' && log.level !== 'TOOL_CALL' && log.level !== 'TOOL_RESULT') return false;
      if (activeLevelFilter === 'HUMAN' && log.level !== 'HUMAN_PROMPT') return false;
      if (activeLevelFilter === 'ERROR' && log.level !== 'ERROR' && log.level !== 'WARN') return false;
      if (activeLevelFilter === 'INFO' && log.level !== 'INFO' && log.level !== 'SUCCESS') return false;
    }

    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchAgent = log.agentName.toLowerCase().includes(q);
      const matchThought = log.thoughtContent?.toLowerCase().includes(q);
      const matchTool = log.toolCall?.tool.toLowerCase().includes(q) || log.toolCall?.input.toLowerCase().includes(q);
      if (!matchMsg && !matchAgent && !matchThought && !matchTool) return false;
    }

    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.level}] @${l.agentName}: ${l.message} ${l.thoughtContent ? '\n' + l.thoughtContent : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-activity-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInjectCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    const agentObj = agents.find(a => a.id === customAgent) || agents[0];
    onInjectLog({
      agentId: agentObj.id,
      agentName: agentObj.name,
      level: customLevel,
      message: customMsg,
      thoughtContent: customLevel === 'THOUGHT' ? `<thought>\n${customMsg}\n</thought>` : undefined,
      toolCall: customLevel === 'TOOL_CALL' ? { tool: 'custom_hook', input: customMsg } : undefined
    });

    setCustomMsg('');
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl flex flex-col shadow-2xl transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 bg-slate-950/98 shadow-cyan-950/80 border-cyan-500/40' : 'h-full min-h-[580px]'
    }`}>
      {/* Terminal Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 rounded-t-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Activity & Chain-of-Thought Stream</span>
            {isSimulating ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAMING
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                PAUSED
              </span>
            )}
          </div>
        </div>

        {/* Top Right Action buttons */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 border transition-colors ${
              autoScroll 
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Auto-Scroll to bottom on new logs"
          >
            <ArrowDownCircle className={`w-3 h-3 ${autoScroll ? 'text-cyan-400 animate-bounce' : ''}`} />
            <span>AutoScroll</span>
          </button>

          <button
            onClick={() => setShowInjectPanel(!showInjectPanel)}
            className={`p-1.5 rounded border transition-colors ${
              showInjectPanel 
                ? 'bg-indigo-950 border-indigo-500 text-indigo-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Inject test event / thought trace"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Download JSON logs"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
            title="Clear terminal buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title={isExpanded ? "Collapse terminal" : "Full screen terminal"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
        {/* Level filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'THOUGHT', label: '🧠 Thoughts' },
            { id: 'TOOL', label: '⚙️ Tool Calls' },
            { id: 'HUMAN', label: '🛡️ Human HITL' },
            { id: 'ERROR', label: '⚠️ Warn/Error' },
            { id: 'INFO', label: 'ℹ️ System' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLevelFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                activeLevelFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search inside logs */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search terminal logs..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded px-2.5 pl-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
          />
        </div>
      </div>

      {/* Optional Log Injector Panel */}
      {showInjectPanel && (
        <form onSubmit={handleInjectCustomLog} className="p-3 bg-slate-900/90 border-b border-indigo-900/40 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-indigo-400 font-mono flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> Inject Event:
          </span>
          <select
            value={customAgent}
            onChange={(e) => setCustomAgent(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>@{a.name}</option>
            ))}
          </select>
          <select
            value={customLevel}
            onChange={(e) => setCustomLevel(e.target.value as LogLevel)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono"
          >
            <option value="THOUGHT">THOUGHT (&lt;thought&gt;)</option>
            <option value="TOOL_CALL">TOOL_CALL</option>
            <option value="TOOL_RESULT">TOOL_RESULT</option>
            <option value="HUMAN_PROMPT">HUMAN_PROMPT (HITL)</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Message or reasoning trace..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold font-mono flex items-center gap-1"
          >
            <Send className="w-3 h-3" /> Emit
          </button>
        </form>
      )}

      {/* Main Terminal Feed */}
      <div 
        ref={terminalContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs select-text max-h-[calc(100vh-340px)]"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 font-mono">
            <Terminal className="w-8 h-8 mb-2 opacity-50 text-slate-600" />
            <p className="text-slate-500">No log events matching active filters.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const badge = getLogLevelBadge(log.level);
            const isThought = log.level === 'THOUGHT' || Boolean(log.thoughtContent);
            const isTool = log.level === 'TOOL_CALL' || log.level === 'TOOL_RESULT' || Boolean(log.toolCall);
            const isHuman = log.level === 'HUMAN_PROMPT';

            const borderLeftClass = isThought
              ? 'border-l-2 border-blue-500'
              : isHuman
              ? 'border-l-2 border-amber-500'
              : isTool
              ? 'border-l-2 border-emerald-500'
              : log.level === 'ERROR'
              ? 'border-l-2 border-rose-500'
              : 'border-l-2 border-slate-700';

            return (
              <div 
                key={log.id}
                className={`${borderLeftClass} pl-3 py-1 bg-slate-900/30 rounded-r transition-all hover:bg-slate-900/60`}
              >
                {/* Meta line */}
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    
                    <span className={`uppercase font-bold px-1.5 py-0.2 rounded ${badge.bg} ${badge.text}`}>
                      {log.level}
                    </span>

                    <span className="text-blue-400 font-semibold font-mono">@{log.agentName}</span>

                    {log.taskId && (
                      <span className="text-slate-500 bg-slate-950 px-1 rounded border border-slate-800">
                        {log.taskId}
                      </span>
                    )}
                  </div>

                  {log.metadata && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      {log.metadata.tokens && <span>{log.metadata.tokens} tok</span>}
                      {log.metadata.latencyMs && <span>{log.metadata.latencyMs}ms</span>}
                    </div>
                  )}
                </div>

                {/* Primary Message */}
                <p className={`text-slate-300 leading-relaxed break-words font-mono ${isThought ? 'italic opacity-90' : ''}`}>
                  {log.message}
                </p>

                {/* Special Hermes Thought Box */}
                {log.thoughtContent && (
                  <div className="mt-1.5 p-2 rounded bg-slate-950/80 border border-blue-500/20 text-slate-300 whitespace-pre-wrap leading-relaxed">
                    <div className="text-[9px] text-blue-400 font-bold flex items-center gap-1 mb-0.5">
                      <MessageSquareQuote className="w-2.5 h-2.5 text-blue-400" />
                      Chain-of-Thought
                    </div>
                    <span className="italic opacity-85">{log.thoughtContent}</span>
                  </div>
                )}

                {/* Tool Call details */}
                {log.toolCall && (
                  <div className="mt-1.5 p-2 rounded bg-slate-950/90 border border-emerald-500/20 text-slate-300 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[10px]">
                      <span>TOOL: {log.toolCall.tool}()</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500 font-bold">Input: </span>
                      <span className="text-amber-300 font-mono">{log.toolCall.input}</span>
                    </div>
                    {log.toolCall.output && (
                      <div className="text-slate-300 pt-1 border-t border-slate-800/80">
                        <span className="text-emerald-400 font-bold">Output: </span>
                        <span className="text-emerald-200 font-mono">{log.toolCall.output}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Real-time Telemetry Visualizer Widget at Bottom */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 rounded-b-xl flex flex-col gap-2 font-mono">
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] animate-pulse" />
            <span className="text-slate-400 font-bold">NODE AFFINITY</span>
          </div>
          <span className="text-blue-400 font-bold">98.4% STABLE</span>
        </div>

        {/* Mini animated activity bars */}
        <div className="h-4 flex items-end gap-1 px-1">
          <div className="w-full bg-blue-500/20 h-[30%] rounded-t-sm" />
          <div className="w-full bg-blue-500/40 h-[60%] rounded-t-sm" />
          <div className="w-full bg-blue-500/60 h-[45%] rounded-t-sm" />
          <div className="w-full bg-blue-500/30 h-[75%] rounded-t-sm" />
          <div className="w-full bg-blue-500/80 h-[90%] rounded-t-sm shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <div className="w-full bg-blue-500/50 h-[65%] rounded-t-sm" />
          <div className="w-full bg-blue-500/70 h-[85%] rounded-t-sm shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <div className="w-full bg-blue-500/40 h-[50%] rounded-t-sm" />
        </div>
      </div>
    </div>
  );
};
