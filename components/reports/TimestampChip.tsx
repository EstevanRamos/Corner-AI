import React from 'react';
import { Timestamp } from '../video/TimestampMarker';

interface TimestampChipProps {
  timestamp: Timestamp;
  onClick: (timestamp: Timestamp) => void;
  isActive?: boolean;
  variant?: 'default' | 'compact' | 'success';
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  striking: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  grappling: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  defensive: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  pattern: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  mental: {
    bg: 'bg-pink-500/20',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
  },
  movement: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  cardio: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  other: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

const TimestampChip: React.FC<TimestampChipProps> = ({
  timestamp,
  onClick,
  isActive = false,
  variant = 'default',
}) => {
  const colors = CATEGORY_COLORS[timestamp.category] || CATEGORY_COLORS.other;

  // Active state overrides
  const activeClasses = isActive
    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
    : '';

  // Success variant (for strengths)
  const successClasses = variant === 'success'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
    : '';

  if (variant === 'compact') {
    return (
      <button
        onClick={() => onClick(timestamp)}
        className={`
          inline-flex items-center px-1.5 py-0.5 
          text-xs font-mono rounded 
          transition-all duration-150
          hover:scale-105 active:scale-95
          ${isActive ? activeClasses : `${colors.bg} ${colors.text} ${colors.border}`}
        `}
        title={timestamp.label}
      >
        [{timestamp.time}]
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(timestamp)}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        text-sm rounded-lg border
        transition-all duration-150
        hover:scale-[1.02] active:scale-[0.98]
        ${isActive 
          ? activeClasses 
          : variant === 'success'
            ? successClasses
            : `${colors.bg} ${colors.text} ${colors.border} hover:brightness-110`
        }
      `}
    >
      <span className="font-mono font-medium">[{timestamp.time}]</span>
      {timestamp.label && (
        <span className="truncate max-w-[200px] opacity-80">{timestamp.label}</span>
      )}
    </button>
  );
};

export default TimestampChip;