import { Priority, TaskStatus, LogLevel } from '../types';

export function getPriorityBadge(priority: Priority): { label: string; bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return { label: 'URGENT', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'high':
      return { label: 'HIGH', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'medium':
      return { label: 'MEDIUM', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'low':
      return { label: 'LOW', bg: 'bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-600/30' };
    default:
      return { label: 'MEDIUM', bg: 'bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-600/30' };
  }
}

export function getStatusInfo(status: TaskStatus): { label: string; color: string; bg: string; border: string } {
  switch (status) {
    case 'todo':
      return { label: 'Backlog', color: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700' };
    case 'in-progress':
      return { label: 'Executing', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/50' };
    case 'review':
      return { label: 'Validation (HITL)', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/50' };
    case 'done':
      return { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40' };
    case 'failed':
      return { label: 'Failed', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/40' };
    default:
      return { label: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' };
  }
}

export function getLogLevelBadge(level: LogLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'THOUGHT':
      return { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'TOOL_CALL':
      return { bg: 'bg-cyan-950/70', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    case 'TOOL_RESULT':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'HUMAN_PROMPT':
      return { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-500/40' };
    case 'ERROR':
      return { bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-500/40' };
    case 'WARN':
      return { bg: 'bg-yellow-950/70', text: 'text-yellow-300', border: 'border-yellow-500/40' };
    case 'SUCCESS':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'INFO':
    default:
      return { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700' };
  }
}

export function formatTokens(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export interface PriorityWeightGlowConfig {
  weight: number;
  label: string;
  shortLabel: string;
  description: string;
  colorName: string;
  glowBoxShadow: string;
  borderClass: string;
  textColor: string;
  badgeClass: string;
  accentBar: string;
  pulseGlow?: boolean;
}

export function getPriorityWeightGlow(weight?: number): PriorityWeightGlowConfig | null {
  if (weight === undefined || weight === null || weight <= 0) return null;

  const clamped = Math.max(1, Math.min(5, Math.round(weight)));

  switch (clamped) {
    case 1:
      return {
        weight: 1,
        label: 'Level 1: Minimal',
        shortLabel: 'W1',
        description: 'Subtle cyan radiance for low-overhead tasks',
        colorName: 'Cyan',
        glowBoxShadow: '0 0 14px rgba(6, 182, 212, 0.28), inset 0 0 8px rgba(6, 182, 212, 0.08)',
        borderClass: 'border-cyan-500/50 hover:border-cyan-400/80',
        textColor: 'text-cyan-400',
        badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.35)]',
        accentBar: 'from-cyan-500/80 via-teal-500/40 to-transparent shadow-[0_0_8px_rgba(6,182,212,0.5)]'
      };
    case 2:
      return {
        weight: 2,
        label: 'Level 2: Standard',
        shortLabel: 'W2',
        description: 'Balanced blue aura for steady operational focus',
        colorName: 'Blue',
        glowBoxShadow: '0 0 18px rgba(59, 130, 246, 0.35), inset 0 0 10px rgba(59, 130, 246, 0.1)',
        borderClass: 'border-blue-500/60 hover:border-blue-400/90',
        textColor: 'text-blue-400',
        badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.4)]',
        accentBar: 'from-blue-500 via-indigo-500/60 to-transparent shadow-[0_0_10px_rgba(59,130,246,0.6)]'
      };
    case 3:
      return {
        weight: 3,
        label: 'Level 3: Elevated',
        shortLabel: 'W3',
        description: 'Luminous amber glow for expedited priority queues',
        colorName: 'Amber',
        glowBoxShadow: '0 0 22px rgba(245, 158, 11, 0.42), inset 0 0 12px rgba(245, 158, 11, 0.14)',
        borderClass: 'border-amber-500/70 hover:border-amber-400',
        textColor: 'text-amber-400',
        badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
        accentBar: 'from-amber-400 via-yellow-500/70 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.7)]'
      };
    case 4:
      return {
        weight: 4,
        label: 'Level 4: High Impact',
        shortLabel: 'W4',
        description: 'High-intensity coral/orange beacon for urgent fleet goals',
        colorName: 'Orange',
        glowBoxShadow: '0 0 26px rgba(249, 115, 22, 0.52), inset 0 0 14px rgba(249, 115, 22, 0.18)',
        borderClass: 'border-orange-500/80 hover:border-orange-400',
        textColor: 'text-orange-400',
        badgeClass: 'bg-orange-950/90 text-orange-200 border-orange-500/70 shadow-[0_0_14px_rgba(249,115,22,0.6)]',
        accentBar: 'from-orange-500 via-rose-500/70 to-transparent shadow-[0_0_14px_rgba(249,115,22,0.8)]'
      };
    case 5:
    default:
      return {
        weight: 5,
        label: 'Level 5: Singularity (Max)',
        shortLabel: 'W5 MAX',
        description: 'Maximum crimson singularity pulse for mission-critical directives',
        colorName: 'Red/Crimson',
        glowBoxShadow: '0 0 32px rgba(239, 68, 68, 0.65), 0 0 12px rgba(244, 63, 94, 0.4), inset 0 0 16px rgba(239, 68, 68, 0.22)',
        borderClass: 'border-rose-500/90 hover:border-rose-400 ring-1 ring-rose-500/40',
        textColor: 'text-rose-400',
        badgeClass: 'bg-rose-950/95 text-rose-200 border-rose-500/80 shadow-[0_0_16px_rgba(244,63,94,0.7)] animate-pulse',
        accentBar: 'from-rose-500 via-red-600 to-transparent shadow-[0_0_16px_rgba(244,63,94,0.9)]',
        pulseGlow: true
      };
  }
}
