import { useState, useCallback, useEffect } from 'react';
import { generateReportFromTemplate, ReportType } from '../services/geminiService';
import { parseSelfScoutReport, SelfScoutReport } from '../lib/report-parser';

interface AnalysisProgress {
  stage: 'idle' | 'uploading' | 'analyzing' | 'parsing' | 'complete' | 'error';
  message: string;
  percent: number;
}

interface SelfScoutInput {
  videos: File[];
  analysisType: 'full' | 'quick' | 'progress';
  context?: string;
  specificQuestions?: string;
}

interface UseSelfScoutReturn {
  analyze: (input: SelfScoutInput) => Promise<SelfScoutReport>;
  report: SelfScoutReport | null;
  isAnalyzing: boolean;
  progress: AnalysisProgress;
  error: Error | null;
  reset: () => void;
}

const STORAGE_KEY = 'fight_analyzer_self_scout_report';

// Map analysis type to report type
const ANALYSIS_TYPE_TO_REPORT_TYPE: Record<SelfScoutInput['analysisType'], ReportType> = {
  full: 'SELF_SCOUT_FULL',
  quick: 'SELF_SCOUT_QUICK',
  progress: 'SELF_SCOUT_PROGRESS',
};

export function useSelfScout(): UseSelfScoutReturn {
  const [report, setReport] = useState<SelfScoutReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'idle',
    message: '',
    percent: 0,
  });

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Revive dates
        if (parsed.generatedAt) parsed.generatedAt = new Date(parsed.generatedAt);
        setReport(parsed);
      }
    } catch (e) {
      console.error('Failed to load self scout report from local storage', e);
    }
  }, []);

  const reset = useCallback(() => {
    setReport(null);
    setError(null);
    setProgress({ stage: 'idle', message: '', percent: 0 });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const analyze = useCallback(async (input: SelfScoutInput): Promise<SelfScoutReport> => {
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      // Get the report type from analysis type
      const reportType = ANALYSIS_TYPE_TO_REPORT_TYPE[input.analysisType];
      if (!reportType) {
        throw new Error(`Unknown analysis type: ${input.analysisType}`);
      }

      // Update progress
      setProgress({
        stage: 'uploading',
        message: 'Preparing video for analysis...',
        percent: 10,
      });

      setProgress({
        stage: 'analyzing',
        message: 'Analyzing footage with AI...',
        percent: 30,
      });

      // Call Gemini API using the new template-based function
      const rawResponse = await generateReportFromTemplate({
        reportType,
        userVideos: input.videos,
        context: input.context || '',
        specificQuestions: input.specificQuestions || '',
      });
      
      console.log('--- GEMINI RAW REPORT OUTPUT ---');
      console.log(rawResponse);
      console.log('--------------------------------');

      setProgress({
        stage: 'parsing',
        message: 'Processing analysis results...',
        percent: 80,
      });

      // Parse the response into structured report
      const parsedReport = parseSelfScoutReport(rawResponse, input.analysisType);

      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedReport));

      setProgress({
        stage: 'complete',
        message: 'Analysis complete!',
        percent: 100,
      });

      setReport(parsedReport);
      setIsAnalyzing(false);

      return parsedReport;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Analysis failed');
      setError(error);
      setProgress({
        stage: 'error',
        message: error.message,
        percent: 0,
      });
      setIsAnalyzing(false);
      throw error;
    }
  }, []);

  return {
    analyze,
    report,
    isAnalyzing,
    progress,
    error,
    reset,
  };
}

export default useSelfScout;