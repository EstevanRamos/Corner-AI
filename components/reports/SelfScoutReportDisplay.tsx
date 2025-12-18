// /src/components/reports/SelfScoutReportDisplay.tsx

import React, { useState, useCallback, useMemo } from 'react';
import VideoPlayer from '../video/VideoPlayer';
import { Timestamp } from '../video/TimestampMarker';
import TimestampChip from './TimestampChip';
import { UploadedVideo } from '../../hooks/useVideoUpload';
import { 
  SelfScoutReport, 
  Finding, 
  OverallAssessment, 
  ReportMetadata 
} from '../../lib/report-parser';

// ============================================================================
// TYPES
// ============================================================================

interface SelfScoutReportDisplayProps {
  report: SelfScoutReport;
  video: UploadedVideo;
  onTimestampClick?: (timestamp: Timestamp) => void;
}

type TabId = 'findings' | 'strengths' | 'improvements' | 'full-report' | 'opponent-view';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type CategoryFilter = 'all' | Finding['category'];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_METADATA: ReportMetadata = {
  totalFindings: 0,
  criticalCount: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
  validationWarnings: [],
};

const DEFAULT_ASSESSMENT: OverallAssessment = {
  level: 'Unknown',
  archetype: 'Unknown',
  summary: 'No assessment available.',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Safely get metadata with defaults
const getMetadata = (report: SelfScoutReport): ReportMetadata => {
  if (report.metadata) {
    return {
      ...DEFAULT_METADATA,
      ...report.metadata,
    };
  }

  // Calculate metadata from findings if not provided
  const findings = report.findings || [];
  return {
    totalFindings: findings.length,
    criticalCount: findings.filter((f) => f.severity === 'critical').length,
    highCount: findings.filter((f) => f.severity === 'high').length,
    mediumCount: findings.filter((f) => f.severity === 'medium').length,
    lowCount: findings.filter((f) => f.severity === 'low').length,
    validationWarnings: [],
  };
};

// Safely get overall assessment with defaults
const getOverallAssessment = (report: SelfScoutReport): OverallAssessment => {
  if (report.overallAssessment) {
    return {
      ...DEFAULT_ASSESSMENT,
      ...report.overallAssessment,
    };
  }
  return DEFAULT_ASSESSMENT;
};

// Safely parse date
const parseDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  try {
    return new Date(date);
  } catch {
    return new Date();
  }
};

// Convert finding timestamps to base Timestamp format
const toBaseTimestamp = (
  ts: Timestamp,
  category: Finding['category']
): Timestamp => ({
  time: ts.time || '0:00',
  seconds: ts.seconds || 0,
  label: ts.label || '',
  category: category || 'other',
  color: ts.color,
});

// Clean up titles that have truncated timestamp fragments like "[0" or "(1"
const cleanTitle = (title: string | undefined): string => {
  if (!title) return 'Untitled Finding';
  // Remove trailing incomplete timestamp patterns like " [0", " (1", " [", " ("
  return title.replace(/\s*[\[\(]\d*$/, '').trim() || 'Untitled Finding';
};

// Get the earliest timestamp seconds from a finding for sorting
const getEarliestTimestamp = (finding: Finding): number => {
  const timestamps = finding.timestamps || [];
  if (timestamps.length === 0) return Infinity;
  return Math.min(...timestamps.map(ts => ts.seconds || Infinity));
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SeverityBadge: React.FC<{ severity: Finding['severity'] }> = ({ severity }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[severity] || styles.low}`}>
      {(severity || 'low').toUpperCase()}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: Finding['category'] }> = ({ category }) => {
  const styles: Record<string, string> = {
    striking: 'bg-red-500/20 text-red-400',
    grappling: 'bg-blue-500/20 text-blue-400',
    defensive: 'bg-green-500/20 text-green-400',
    pattern: 'bg-yellow-500/20 text-yellow-400',
    mental: 'bg-pink-500/20 text-pink-400',
    movement: 'bg-cyan-500/20 text-cyan-400',
    cardio: 'bg-orange-500/20 text-orange-400',
    other: 'bg-slate-500/20 text-slate-400',
  };

  const icons: Record<string, string> = {
    striking: '👊',
    grappling: '🤼',
    defensive: '🛡️',
    pattern: '🔄',
    mental: '🧠',
    movement: '🦶',
    cardio: '🫀',
    other: '📋',
  };

  const cat = category || 'other';

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${styles[cat] || styles.other}`}>
      {icons[cat] || icons.other} {cat}
    </span>
  );
};

const ConfidenceBadge: React.FC<{ confidence: Finding['confidence'] }> = ({ confidence }) => {
  const indicators: Record<string, string> = {
    high: '●●●',
    medium: '●●○',
    low: '●○○',
    inconclusive: '○○○',
  };

  const colors: Record<string, string> = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-orange-400',
    inconclusive: 'text-slate-500',
  };

  const conf = confidence || 'inconclusive';

  return (
    <span className={`text-xs ${colors[conf] || colors.inconclusive}`}>
      {indicators[conf] || indicators.inconclusive}
      <span className="ml-1 text-slate-500">{conf}</span>
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon?: string;
}> = ({ label, value, color, icon }) => (
  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
  </div>
);

const TabButton: React.FC<{
  id: TabId;
  label: string;
  isActive: boolean;
  onClick: (id: TabId) => void;
  count?: number;
}> = ({ id, label, isActive, onClick, count }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`}
  >
    {label}
    {count !== undefined && count >= 0 && (
      <span
        className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
          isActive ? 'bg-emerald-500' : 'bg-slate-600'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const EmptyState: React.FC<{ message: string; submessage?: string }> = ({
  message,
  submessage,
}) => (
  <div className="text-center py-12 text-slate-500">
    <p>{message}</p>
    {submessage && <p className="text-sm mt-2">{submessage}</p>}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SelfScoutReportDisplay: React.FC<SelfScoutReportDisplayProps> = ({
  report,
  video,
  onTimestampClick: externalTimestampClick,
}) => {
  // ---- Safely extract data with defaults ----
  const metadata = useMemo(() => getMetadata(report), [report]);
  const overallAssessment = useMemo(() => getOverallAssessment(report), [report]);
  const findings = useMemo(() => report.findings || [], [report.findings]);
  const strengths = useMemo(() => report.strengths || [], [report.strengths]);
  const priorityImprovements = useMemo(
    () => report.priorityImprovements || [],
    [report.priorityImprovements]
  );
  const sections = useMemo(() => report.sections || [], [report.sections]);
  const timestamps = useMemo(() => report.timestamps || [], [report.timestamps]);
  const generatedAt = useMemo(() => parseDate(report.generatedAt), [report.generatedAt]);

  // ---- State ----
  const [activeTab, setActiveTab] = useState<TabId>('findings');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [currentTimestamp, setCurrentTimestamp] = useState<Timestamp | null>(null);

  // ---- Callbacks ----
  const handleTimestampClick = useCallback(
    (timestamp: Timestamp) => {
      if (!timestamp) return;
      // Force new object reference to trigger useEffect in VideoPlayer even if same timestamp clicked
      setCurrentTimestamp({ ...timestamp });
      externalTimestampClick?.(timestamp);
    },
    [externalTimestampClick]
  );

  const toggleFindingExpanded = useCallback((findingId: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  }, []);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const clearFilters = useCallback(() => {
    setSeverityFilter('all');
    setCategoryFilter('all');
  }, []);

  // ---- Filtered & Sorted Data ----
  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      if (!finding) return false;
      if (severityFilter !== 'all' && finding.severity !== severityFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && finding.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [findings, severityFilter, categoryFilter]);

  // Sort findings by earliest timestamp (chronologically)
  const sortedFindings = useMemo(() => {
    return [...filteredFindings].sort(
      (a, b) => getEarliestTimestamp(a) - getEarliestTimestamp(b)
    );
  }, [filteredFindings]);

  // Sort timestamps chronologically for the sidebar
  const sortedTimestamps = useMemo(() => {
    return [...timestamps]
      .filter((ts) => ts && typeof ts.seconds === 'number')
      .sort((a, b) => (a.seconds || 0) - (b.seconds || 0));
  }, [timestamps]);

  // All timestamps for video player markers
  const allVideoTimestamps = useMemo((): Timestamp[] => {
    return timestamps
      .filter((ts) => ts && typeof ts.seconds === 'number')
      .map((ts) => ({
        time: ts.time || '0:00',
        seconds: ts.seconds,
        label: ts.label || '',
        category: ts.category || 'other',
      }));
  }, [timestamps]);

  // ---- Render Helpers ----

  // Helper to parse timestamps from a string segment (plain text)
  const renderTimestampsOnly = useCallback((text: string) => {
    // Match timestamps in various formats:
    // 1. [MM:SS] or (MM:SS) - standard bracketed
    // 2. [MM:SS-MM:SS] or (MM:SS-MM:SS) - ranges
    const timestampRegex = /([\[\(]?\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[\]\)]?)/g;
    const parts = text.split(timestampRegex);
    
    return parts.map((part, idx) => {
      // Check if this part contains a timestamp pattern
      const tsMatch = part.match(/[\[\(]?(\d{1,2}:\d{2})(?:-\d{1,2}:\d{2})?[\]\)]?/);
      if (tsMatch) {
        const startTimeStr = tsMatch[1];
        const timeParts = startTimeStr.split(':').map(Number);
        if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
          const seconds = timeParts[0] * 60 + timeParts[1];
          
          return (
            <TimestampChip 
              key={`ts-${idx}`}
              timestamp={{ time: startTimeStr, seconds, label: 'Jump', category: 'other' }} 
              onClick={handleTimestampClick}
              isActive={currentTimestamp?.seconds === seconds}
              variant="compact"
            />
          );
        }
      }
      // Clean up any residual timestamp artifacts
      const cleanedPart = part.replace(/^[\]\)]:?\*{0,2}\s*/, '').replace(/\*{0,2}[\[\(]?$/, '');
      return cleanedPart;
    });
  }, [handleTimestampClick, currentTimestamp]);

  // Main renderer: Handles Bold first, then Timestamps within both bold and plain text
  const renderContentWithTimestamps = useCallback(
    (content: string | undefined | null): React.ReactNode => {
      if (!content) return null;

      // Split by bold (**...**)
      const boldParts = content.split(/(\*\*[^\*]+\*\*)/g);

      return boldParts.map((part, index) => {
        // If it starts and ends with **, it's bold
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
             const innerText = part.slice(2, -2);
             return (
                 <strong key={`bold-${index}`} className="text-white font-bold">
                     {renderTimestampsOnly(innerText)}
                 </strong>
             );
        }
        // Otherwise regular text
        return <span key={`plain-${index}`}>{renderTimestampsOnly(part)}</span>;
      });
    },
    [renderTimestampsOnly]
  );

  const renderOverallAssessment = () => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Overall Assessment</h3>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
              {overallAssessment.level}
            </span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
              {overallAssessment.archetype}
            </span>
          </div>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        {renderContentWithTimestamps(overallAssessment.summary)}
      </p>
    </div>
  );

  const renderStatsGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Critical"
        value={metadata.criticalCount}
        color="text-red-400"
        icon="🚨"
      />
      <StatCard
        label="High"
        value={metadata.highCount}
        color="text-orange-400"
        icon="⚠️"
      />
      <StatCard
        label="Medium"
        value={metadata.mediumCount}
        color="text-yellow-400"
        icon="📋"
      />
      <StatCard
        label="Strengths"
        value={strengths.length}
        color="text-emerald-400"
        icon="💪"
      />
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-wrap gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase">Severity:</span>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase">Category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All</option>
          <option value="striking">Striking</option>
          <option value="grappling">Grappling</option>
          <option value="defensive">Defensive</option>
          <option value="pattern">Pattern</option>
          <option value="mental">Mental</option>
          <option value="movement">Movement</option>
          <option value="cardio">Cardio</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="ml-auto text-xs text-slate-500">
        Showing {filteredFindings.length} of {findings.length} findings
      </div>
    </div>
  );

  const renderFindingsList = () => (
    <div className="space-y-4">
      {renderFilters()}

      {sortedFindings.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No findings match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedFindings.map((finding, index) => {
            if (!finding) return null;

            const findingTimestamps = finding.timestamps || [];

            return (
              <div
                key={finding.id || `finding-${index}`}
                className={`bg-slate-900/50 rounded-lg border transition-all ${
                  finding.severity === 'critical'
                    ? 'border-red-500/30 hover:border-red-500/50'
                    : finding.severity === 'high'
                    ? 'border-orange-500/30 hover:border-orange-500/50'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Finding Header */}
                <button
                  onClick={() => toggleFindingExpanded(finding.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-slate-500 font-mono text-xs">
                          #{index + 1}
                        </span>
                        <SeverityBadge severity={finding.severity} />
                        <CategoryBadge category={finding.category} />
                      </div>
                      <h4 className="text-white font-medium">
                        {cleanTitle(finding.title)}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ConfidenceBadge confidence={finding.confidence} />
                      <span className="text-slate-500 text-xs">
                        {finding.instanceCount ?? 0} instance
                        {(finding.instanceCount ?? 0) !== 1 ? 's' : ''}
                      </span>
                      <svg
                        className={`w-5 h-5 text-slate-500 transition-transform ${
                          expandedFindings.has(finding.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedFindings.has(finding.id) && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                    <p className="text-slate-300 text-sm">
                      {renderContentWithTimestamps(finding.description)}
                    </p>

                    {/* Timestamps */}
                    {findingTimestamps.length > 0 && (
                      <div>
                        <h5 className="text-xs text-slate-500 uppercase mb-2">
                          Evidence
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {findingTimestamps.map((ts, i) => (
                            <TimestampChip
                              key={`${finding.id}-ts-${i}`}
                              timestamp={toBaseTimestamp(ts, finding.category)}
                              onClick={handleTimestampClick}
                              isActive={currentTimestamp?.seconds === ts.seconds}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Counter Evidence */}
                    {finding.counterEvidence && (
                      <div className="bg-slate-800/50 rounded p-3">
                        <h5 className="text-xs text-slate-500 uppercase mb-1">
                          Counter-Evidence
                        </h5>
                        <p className="text-slate-400 text-sm">
                          {renderContentWithTimestamps(finding.counterEvidence)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStrengthsList = () => (
    <div className="space-y-4">
      {strengths.length === 0 ? (
        <EmptyState message="No strengths identified in this analysis." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.map((strength, index) => {
            if (!strength) return null;

            const strengthTimestamps = strength.timestamps || [];

            return (
              <div
                key={strength.id || `strength-${index}`}
                className="bg-gradient-to-br from-emerald-900/20 to-slate-900 rounded-lg border border-emerald-500/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium mb-1">
                      {cleanTitle(strength.title)}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      {renderContentWithTimestamps(strength.description)}
                    </p>

                    {strengthTimestamps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {strengthTimestamps.map((ts, i) => (
                          <TimestampChip
                            key={`${strength.id}-ts-${i}`}
                            timestamp={toBaseTimestamp(ts, strength.category)}
                            onClick={handleTimestampClick}
                            isActive={currentTimestamp?.seconds === ts.seconds}
                            variant="success"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderImprovements = () => (
    <div className="space-y-4">
      {priorityImprovements.length === 0 ? (
        <EmptyState message="No priority improvements identified." />
      ) : (
        priorityImprovements.map((improvement, index) => {
          if (!improvement) return null;

          return (
            <div
              key={`improvement-${index}`}
              className="bg-slate-900/50 rounded-lg border border-slate-700 p-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    index === 0
                      ? 'bg-red-500/20 text-red-400'
                      : index === 1
                      ? 'bg-orange-500/20 text-orange-400'
                      : index === 2
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-white font-medium">
                      {improvement.area || 'General'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      Priority #{improvement.priority ?? index + 1}
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm mb-3">
                    {renderContentWithTimestamps(improvement.issue)}
                  </p>

                  {improvement.fix && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      <h5 className="text-emerald-400 text-xs uppercase mb-1">
                        How to Fix
                      </h5>
                      <p className="text-slate-300 text-sm">{improvement.fix}</p>
                    </div>
                  )}

                  {improvement.drillRecommendation && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <h5 className="text-blue-400 text-xs uppercase mb-1">
                        Recommended Drill
                      </h5>
                      <p className="text-slate-300 text-sm">
                        {improvement.drillRecommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderOpponentView = () => (
    <div className="space-y-6">
      {report.opponentGamePlan ? (
        <>
          <div className="bg-gradient-to-br from-red-900/20 to-slate-900 rounded-xl border border-red-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  If I Were Your Opponent
                </h3>
                <p className="text-red-400 text-sm">
                  This is how someone would game plan against you
                </p>
              </div>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-slate-300 leading-relaxed italic">
                "{renderContentWithTimestamps(report.opponentGamePlan)}"
              </p>
            </div>
          </div>

          {/* Quick Reference: Your Biggest Vulnerabilities */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
            <h4 className="text-white font-medium mb-3">
              Your Biggest Vulnerabilities
            </h4>
            <div className="space-y-2">
              {findings
                .filter(
                  (f) => f && (f.severity === 'critical' || f.severity === 'high')
                )
                .slice(0, 5)
                .map((finding) => {
                  const findingTimestamps = finding.timestamps || [];
                  return (
                    <div
                      key={finding.id}
                      className="flex items-center gap-2 text-sm flex-wrap"
                    >
                      <span className="text-red-400">•</span>
                      <span className="text-slate-300 flex-1">
                        {cleanTitle(finding.title)}
                      </span>
                      <div className="flex gap-1">
                        {findingTimestamps.slice(0, 2).map((ts, j) => (
                          <TimestampChip
                            key={`vuln-${finding.id}-${j}`}
                            timestamp={toBaseTimestamp(ts, finding.category)}
                            onClick={handleTimestampClick}
                            isActive={currentTimestamp?.seconds === ts.seconds}
                            variant="compact"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          message="Opponent perspective not available for this analysis."
          submessage="Run a full analysis to see how opponents would game plan against you."
        />
      )}
    </div>
  );

  const renderFullReport = () => (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <EmptyState message="No report sections available." />
      ) : (
        sections.map((section) => {
          if (!section) return null;

          const sectionTimestamps = section.timestamps || [];

          return (
            <div
              key={section.id}
              className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden"
            >
              <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                <h3 className="text-emerald-400 font-bold uppercase text-sm tracking-wide">
                  {section.title || 'Section'}
                </h3>
              </div>

              <div className="p-4">
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  {(section.content || '').split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    // FILTER: Skip empty lines or lines that are just dashes
                    if (!trimmed || trimmed.replace(/^[-*]\s*/, '') === '---') return null;

                    // Handle bullet points
                    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                      const content = trimmed.replace(/^[-*]\s/, '');
                      return (
                        <div key={i} className="flex gap-2 mb-2 ml-2">
                          <span className="text-emerald-400 flex-shrink-0">•</span>
                          <span>{renderContentWithTimestamps(content)}</span>
                        </div>
                      );
                    }

                    // Handle numbered items
                    const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)/);
                    if (numberedMatch) {
                      return (
                        <div key={i} className="flex gap-2 mb-2 ml-2">
                          <span className="text-emerald-400 font-mono flex-shrink-0">
                            {numberedMatch[1]}.
                          </span>
                          <span>
                            {renderContentWithTimestamps(numberedMatch[2])}
                          </span>
                        </div>
                      );
                    }

                    // Handle bold headers that might appear on their own lines
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                      return (
                        <h4 key={i} className="text-white font-medium mt-4 mb-2">
                          {trimmed.replace(/\*\*/g, '')}
                        </h4>
                      );
                    }

                    // Regular paragraph
                    return (
                      <p key={i} className="mb-2">
                        {renderContentWithTimestamps(trimmed)}
                      </p>
                    );
                  })}
                </div>

                {/* Section timestamps */}
                {sectionTimestamps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h5 className="text-xs text-slate-500 uppercase mb-2">
                      Related Moments
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {sectionTimestamps.map((ts, i) => (
                        <TimestampChip
                          key={`${section.id}-ts-${i}`}
                          timestamp={ts}
                          onClick={handleTimestampClick}
                          isActive={currentTimestamp?.seconds === ts.seconds}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'findings':
        return renderFindingsList();
      case 'strengths':
        return renderStrengthsList();
      case 'improvements':
        return renderImprovements();
      case 'opponent-view':
        return renderOpponentView();
      case 'full-report':
        return renderFullReport();
      default:
        return null;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Safety check for required props
  if (!report) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <p>No report data available.</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <p>No video data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-140px)]">
      {/* Top: Video Player (Full Width) */}
      <div className="w-full bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
        <div className="container mx-auto max-w-7xl">
           <VideoPlayer
              src={video.url || ''}
              timestamps={allVideoTimestamps}
              onTimestampClick={handleTimestampClick}
              activeTimestamp={currentTimestamp}
              showTimestampMarkers
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Session Info & Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-4">
            {/* Session Info Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700">
                <h3 className="text-white font-medium">Session Info</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Analysis Type</span>
                  <span className="text-white capitalize">
                    {report.analysisType || 'unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Generated</span>
                  <span className="text-white">
                    {generatedAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Findings</span>
                  <span className="text-white">{metadata.totalFindings}</span>
                </div>
                {video.duration != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Video Duration</span>
                    <span className="text-white">
                      {Math.floor(video.duration / 60)}:
                      {(video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Timestamp List - Now sorted chronologically */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-white font-medium">Key Moments</h3>
                <span className="text-xs text-slate-500">
                  {sortedTimestamps.length} timestamps
                </span>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
                {sortedTimestamps.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No timestamps found
                  </p>
                ) : (
                  sortedTimestamps.slice(0, 30).map((ts, i) => {
                    if (!ts) return null;
                    return (
                      <button
                        key={`sidebar-ts-${i}`}
                        onClick={() => handleTimestampClick(ts)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentTimestamp?.seconds === ts.seconds
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="font-mono text-emerald-400 mr-2">
                          [{ts.time || '0:00'}]
                        </span>
                        <span className="truncate">
                          {(ts.label || '').slice(0, 40)}
                          {(ts.label || '').length > 40 ? '...' : ''}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Validation Warnings */}
            {metadata.validationWarnings && metadata.validationWarnings.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <h4 className="text-yellow-400 text-xs uppercase mb-2">
                  Analysis Notes
                </h4>
                <ul className="text-xs text-yellow-300/80 space-y-1">
                  {metadata.validationWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Report Content */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 bg-slate-900/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Performance Analysis
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Self-scout report • {report.analysisType || 'unknown'} analysis
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-slate-800 px-2 py-1 rounded">
                {(report.id || 'unknown').slice(0, 8)}
              </span>
            </div>

            {renderOverallAssessment()}

            <div className="mt-4">{renderStatsGrid()}</div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-slate-700 bg-slate-850 flex gap-2 overflow-x-auto">
            <TabButton
              id="findings"
              label="Weaknesses"
              isActive={activeTab === 'findings'}
              onClick={handleTabChange}
              count={findings.length}
            />
            <TabButton
              id="strengths"
              label="Strengths"
              isActive={activeTab === 'strengths'}
              onClick={handleTabChange}
              count={strengths.length}
            />
            <TabButton
              id="improvements"
              label="Priority Fixes"
              isActive={activeTab === 'improvements'}
              onClick={handleTabChange}
              count={priorityImprovements.length}
            />
            <TabButton
              id="opponent-view"
              label="Opponent's View"
              isActive={activeTab === 'opponent-view'}
              onClick={handleTabChange}
            />
            <TabButton
              id="full-report"
              label="Full Report"
              isActive={activeTab === 'full-report'}
              onClick={handleTabChange}
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center flex-wrap gap-3">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                Export PDF
              </button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                Share
              </button>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors">
              Create Game Plan From This
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfScoutReportDisplay;