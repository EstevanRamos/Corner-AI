import { useState, useEffect } from 'react';
import { OpponentReportInput } from '../components/reports/OpponentReportForm';
import { OpponentReport, parseReportSections, extractStrengths, extractFindings, extractDecisionTree, extractMostUtilizedTechniques } from '../lib/report-parser';
import { generateReport } from '../services/geminiService';
import { PROMPTS, buildUserPrompt, withEvidenceRequirements } from '../lib/prompts';

interface UseOpponentAnalysisReturn {
  analyze: (input: OpponentReportInput) => Promise<void>;
  report: OpponentReport | null;
  isAnalyzing: boolean;
  error: Error | null;
  reset: () => void;
}

const STORAGE_KEY = 'fight_analyzer_opponent_report';

const useOpponentAnalysis = (): UseOpponentAnalysisReturn => {
  const [report, setReport] = useState<OpponentReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
      console.error('Failed to load opponent report from local storage', e);
    }
  }, []);

  const analyze = async (input: OpponentReportInput) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Select Prompt Template
      const templateId = input.reportType === 'quick' ? 'OPPONENT_BREAKDOWN_QUICK' : 'OPPONENT_BREAKDOWN_FULL';
      const template = PROMPTS[templateId];
      if (!template) throw new Error("Invalid prompt template");

      // 2. Build User Prompt with explicit context
      const userPrompt = buildUserPrompt(template, {
        fighterName: input.context.fighterName || 'Unknown',
        weightClass: input.context.weightClass || 'Unknown',
        background: input.context.knownBackground || 'Unknown',
        context: input.context.record ? `Record: ${input.context.record}` : '',
        specificQuestions: input.context.additionalNotes || ''
      });

      // 3. Prepare Files
      const videoFiles = input.videos.map(v => v.file);
      const imageFiles: File[] = [];

      // 4. Call Service
      const markdown = await generateReport(
        template.systemPrompt, 
        userPrompt, 
        videoFiles, 
        imageFiles
      );

      // 5. Parse Result
      const sections = parseReportSections(markdown);
      
      // Extract specific structured data
      const strengths = extractStrengths(sections, markdown);
      const weaknesses = extractFindings(sections, markdown);
      const decisionTree = extractDecisionTree(sections);
      const mostUtilizedTechniques = extractMostUtilizedTechniques(sections);
      
      // Extract all timestamps from sections for the master list
      const timestamps = sections.flatMap(s => s.timestamps);

      const newReport: OpponentReport = {
        id: crypto.randomUUID(),
        generatedAt: new Date(),
        fighterName: input.context.fighterName,
        reportType: input.reportType,
        sections,
        strengths,
        weaknesses,
        decisionTree,
        mostUtilizedTechniques,
        timestamps,
        rawContent: markdown
      };

      // Save to local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReport));

      setReport(newReport);

    } catch (err: any) {
      setError(err);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setReport(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { analyze, report, isAnalyzing, error, reset };
};

export default useOpponentAnalysis;