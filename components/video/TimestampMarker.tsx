import React from 'react';

export interface Timestamp {
  time: string; // "MM:SS"
  seconds: number;
  label: string;
  category: 'striking' | 'grappling' | 'defensive' | 'pattern' | 'mental' | 'movement' | 'cardio' | 'other';
  color?: string;
}

interface TimestampMarkerProps {
  timestamp: Timestamp;
  duration: number;
  onClick: (timestamp: Timestamp) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  striking: 'bg-red-500',
  grappling: 'bg-blue-500',
  defensive: 'bg-green-500',
  pattern: 'bg-yellow-500',
  mental: 'bg-pink-500',
  movement: 'bg-cyan-500',
  cardio: 'bg-orange-500',
  other: 'bg-slate-400',
};

const TimestampMarker: React.FC<TimestampMarkerProps> = ({ timestamp, duration, onClick }) => {
  const leftPercent = Math.min(100, Math.max(0, (timestamp.seconds / duration) * 100));
  const colorClass = timestamp.color || CATEGORY_COLORS[timestamp.category] || CATEGORY_COLORS.other;

  return (
    <div
      className={`absolute top-0 w-3 h-3 -ml-1.5 rounded-full cursor-pointer hover:scale-150 transition-transform group z-10 ${colorClass}`}
      style={{ left: `${leftPercent}%`, marginTop: '-4px' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(timestamp);
      }}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center whitespace-nowrap z-50">
        <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-slate-700">
          <span className="font-bold mr-1">{timestamp.time}</span>
          <span>{timestamp.label}</span>
        </div>
        <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800"></div>
      </div>
    </div>
  );
};

export default TimestampMarker;