import React, { useState, useRef, useEffect } from 'react';
import { AgentChatMessage } from '../types';
import { Send, User, Bot, MessageSquare } from 'lucide-react';

interface AgentChatBoxProps {
  messages: AgentChatMessage[];
  onSendMessage: (senderId: string, senderName: string, message: string, isHuman: boolean) => void;
}

export const AgentChatBox: React.FC<AgentChatBoxProps> = ({ messages, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage('human', 'Operator', inputValue.trim(), true);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05060b]/40 border-t border-slate-800/80">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-800/80 bg-slate-950/60 sticky top-0 z-10">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Agent Comm Channel
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[90%] ${
              msg.isHuman ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
              {msg.isHuman ? (
                <>
                  <span className="text-slate-500">{msg.timestamp}</span>
                  <span className="text-emerald-400 font-bold">@{msg.senderName}</span>
                  <User className="w-3 h-3 text-emerald-500" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-400 font-bold">@{msg.senderName}</span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </>
              )}
            </div>
            
            <div
              className={`p-2.5 rounded-xl text-sm ${
                msg.isHuman
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 rounded-tl-none'
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message agents..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
