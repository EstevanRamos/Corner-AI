import React, { useState } from 'react';
import { Finding } from '../../lib/report-parser';
import TimestampChip from './TimestampChip';
import { Timestamp } from '../video/TimestampMarker';

interface FindingCardProps {
  finding: Finding;
  onTimestampClick: (timestamp: Timestamp) => void;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding, onTimestampClick }) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'border-l-4 border-l-red-600 bg-red-900/10';
      case 'high': return 'border-l-4 border-l-orange-500 bg-orange-900/10';
      case 'medium': return 'border-l-4 border-l-yellow-500 bg-yellow-900/10';
      default: return 'border-l-4 border-l-slate-500 bg-slate-800';
    }
  };

  const getCategoryBadge = (c: string) => {
    const colors: Record<string, string> = {
      striking: 'bg-red-500/20 text-red-300',
      grappling: 'bg-blue-500/20 text-blue-300',
      movement: 'bg-emerald-500/20 text-emerald-300',
      cardio: 'bg-purple-500/20 text-purple-300',
      mental: 'bg-pink-500/20 text-pink-300'
    };
    return (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${colors[c] || 'bg-slate-700 text-slate-300'}`}>
        {c}
      </span>
    );
  };

  return (
    <div 
      className={`rounded-lg border border-slate-700/50 p-4 transition-all cursor-pointer hover:border-slate-600 ${getSeverityColor(finding.severity)}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getCategoryBadge(finding.category)}
            {finding.severity === 'critical' && (
              <span className="text-red-500 text-[10px] font-bold uppercase animate-pulse">Critical</span>
            )}
          </div>
          <h4 className="text-slate-200 font-semibold text-sm">{finding.title}</h4>
        </div>
        <div className="text-slate-500 text-xs">
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/30 text-slate-400 text-sm animate-in fade-in">
          <p className="mb-3 leading-relaxed">{finding.description}</p>
          {finding.timestamps.length > 0 && (
            <div className="flex flex-wrap gap-y-2">
              <span className="text-xs text-slate-500 mr-2 self-center">Evidence:</span>
              {finding.timestamps.map((ts, idx) => (
                <TimestampChip key={idx} timestamp={ts} onClick={() => onTimestampClick(ts)} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingCard;