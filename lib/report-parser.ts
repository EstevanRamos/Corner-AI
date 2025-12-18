import { Timestamp } from '../components/video/TimestampMarker';
import { timestampToSeconds } from './video-processing';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  timestamps: Timestamp[];
  subsections?: ReportSection[];
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'striking' | 'grappling' | 'defensive' | 'pattern' | 'mental' |'movement'| 'cardio' | 'other';
  instanceCount: number;
  confidence: 'high' | 'medium' | 'low' | 'inconclusive';
  timestamps: Timestamp[];
  counterEvidence?: string;
}

export interface PriorityImprovement {
  area: string;
  issue: string;
  fix: string;
  drillRecommendation?: string;
  priority: number;
}

export interface OverallAssessment {
  level: string;
  archetype: string;
  summary: string;
}

export interface ReportMetadata {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  validationWarnings?: string[];
}

export interface DecisionNode {
  trigger: string;
  response: string;
  timestamp?: Timestamp;
}

export interface Technique {
    name: string;
    timestamps: Timestamp[];
}

export interface SelfScoutReport {
  id: string;
  generatedAt: Date;
  analysisType: 'full' | 'quick' | 'progress';
  overallAssessment: OverallAssessment;
  findings: Finding[];
  strengths: Finding[];
  priorityImprovements: PriorityImprovement[];
  opponentGamePlan?: string;
  sections: ReportSection[];
  timestamps: Timestamp[];
  metadata: ReportMetadata;
  rawContent: string;
}

export interface OpponentReport {
  id: string;
  generatedAt: Date;
  fighterName?: string;
  reportType: 'full' | 'quick';
  strengths: Finding[]; // 5 Good
  weaknesses: Finding[]; // 5 Bad
  decisionTree: DecisionNode[];
  mostUtilizedTechniques: Technique[];
  sections: ReportSection[];
  timestamps: Timestamp[];
  rawContent: string;
}

// ============================================================================
// TIMESTAMP EXTRACTION
// ============================================================================

/**
 * Extracts timestamps in format [MM:SS] or (MM:SS) or ranges [MM:SS-MM:SS] from text.
 */
export function extractTimestamps(text: string): Timestamp[] {
  if (!text) return [];
  
  // Match both [0:45], (0:45), [0:45-1:00], (0:45-1:00) formats
  // Captures group 1 as the first time "0:45"
  const regex = /[\[\(](\d{1,2}:\d{2})(?:-\d{1,2}:\d{2})?[\]\)]/g;
  const timestamps: Timestamp[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const timeString = match[1]; // Just the start time
    const [mins, secs] = timeString.split(':').map(Number);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const seconds = mins * 60 + secs;
    
    // Find surrounding context (50 chars before and after)
    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + 50);
    const context = text.substring(start, end).replace(/[\n\r]/g, ' ').trim();

    timestamps.push({
      time: timeStr,
      seconds,
      label: context.substring(0, 40) + (context.length > 40 ? '...' : ''),
      category: categorizeTimestampContext(context),
    });
  }

  return timestamps;
}

function categorizeTimestampContext(context: string): Timestamp['category'] {
  const lower = context.toLowerCase();
  
  // Striking keywords
  if (/punch|kick|jab|cross|hook|uppercut|overhand|elbow|knee|strike|striking|boxing/.test(lower)) {
    return 'striking';
  }
  
  // Grappling keywords
  if (/takedown|clinch|submission|guard|mount|choke|wrestling|grappl|ground|back control|half guard|side control/.test(lower)) {
    return 'grappling';
  }
  
  // Defensive keywords
  if (/block|dodge|slip|parry|defense|defensive|head movement|sprawl/.test(lower)) {
    return 'defensive';
  }
  
  // Pattern keywords
  if (/habit|pattern|always|tends|consistently|every time|predictable|telegrap/.test(lower)) {
    return 'pattern';
  }
  
  return 'other';
}

/**
 * Strip timestamp patterns from text (for cleaning titles).
 */
function stripTimestamps(text: string): string {
  // Remove [MM:SS], (MM:SS), [MM:SS-MM:SS], (MM:SS-MM:SS) patterns
  return text.replace(/[\[\(]\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[\]\)]/g, '').trim();
}

// ============================================================================
// SECTION PARSING
// ============================================================================

/**
 * Parses markdown text into structured sections.
 */
export function parseReportSections(markdown: string): ReportSection[] {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
        if (currentSection) currentSection.content += '\n';
        return;
    }

    // Check if line is a Section Header
    let isHeader = false;
    let title = '';

    // 1. Hashtag headers (# Title or ## Title)
    // This is the preferred strict format now.
    const hashMatch = trimmedLine.match(/^(#{1,3})\s+(.+)/);
    
    // 2. Bold Headers (**TITLE**) - Legacy support, but we try to avoid this being triggered false positives
    const boldHeaderMatch = trimmedLine.match(/^\*\*[A-Z0-9\s&:,-]+\*\*$/);

    if (hashMatch) {
        isHeader = true;
        title = hashMatch[2].replace(/\*\*/g, '').trim();
    } else if (boldHeaderMatch) {
        isHeader = true;
        title = trimmedLine.replace(/\*\*/g, '').trim();
    } 

    if (isHeader) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        currentSection.timestamps = extractTimestamps(currentSection.content);
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        id: generateSectionId(title),
        title: title,
        content: '',
        timestamps: []
      };
    } else {
      // Append content to current section
      if (currentSection) {
        currentSection.content += line + '\n';
      } else {
        // Content before first header (preamble)
        currentSection = {
          id: 'intro',
          title: 'Introduction',
          content: line + '\n',
          timestamps: []
        };
      }
    }
  });

  // Push last section
  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    currentSection.timestamps = extractTimestamps(currentSection.content);
    sections.push(currentSection);
  }

  return sections;
}

function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// ============================================================================
// FINDING EXTRACTION
// ============================================================================

/**
 * Extract findings (weaknesses/patterns) from parsed sections.
 */
export function extractFindings(sections: ReportSection[], rawContent: string): Finding[] {
  const findings: Finding[] = [];
  
  // Specific headers we look for (Updated to match rigid prompts)
  const findingSectionKeywords = [
    'weaknesses', 
    'exploitable patterns', 
    'habits', 
    'bad habits', 
    'major holes'
  ];
  
  // Find sections that contain findings
  const findingSections = sections.filter(s => 
    findingSectionKeywords.some(kw => s.title.toLowerCase().includes(kw))
  );

  // Extract from identified sections
  findingSections.forEach(section => {
    const sectionFindings = extractFindingsFromSection(section);
    findings.push(...sectionFindings);
  });

  // Deduplicate by title similarity
  const uniqueFindings = deduplicateFindings(findings);
  
  // Sort by earliest timestamp
  uniqueFindings.sort((a, b) => {
    const aEarliest = a.timestamps.length > 0 
      ? Math.min(...a.timestamps.map(t => t.seconds)) 
      : Infinity;
    const bEarliest = b.timestamps.length > 0 
      ? Math.min(...b.timestamps.map(t => t.seconds)) 
      : Infinity;
    return aEarliest - bEarliest;
  });

  return uniqueFindings;
}

function extractFindingsFromSection(section: ReportSection): Finding[] {
  const findings: Finding[] = [];
  const lines = section.content.split('\n');
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    
    // Match bullet points or numbered items
    if (cleanLine.match(/^[-*•]|\d+\.\s/) && cleanLine.length > 15) {
      const text = cleanLine.replace(/^[-*•]|\d+\.\s*/, '').trim();
      
      if (text.length > 10) {
        const timestamps = extractTimestamps(text);
        
        findings.push({
          id: crypto.randomUUID(),
          title: extractTitle(text),
          description: text,
          severity: inferSeverity(section.title, text, index),
          category: inferCategory(text),
          instanceCount: timestamps.length || 1,
          confidence: inferConfidence(text, timestamps.length),
          timestamps,
          counterEvidence: extractCounterEvidence(text),
        });
      }
    }
  });

  return findings;
}

function extractTitle(text: string): string {
  // Try to extract a title from bold text first
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) {
    // Strip timestamps from the bold title
    const cleanTitle = stripTimestamps(boldMatch[1]);
    return cleanTitle.substring(0, 60) || 'Untitled Finding';
  }
  
  // Otherwise use first sentence or first 60 chars, but strip timestamps first
  const firstSentence = text.split(/[.!?]/)[0];
  const cleanText = stripTimestamps(firstSentence || text);
  
  if (!cleanText || cleanText.length < 3) {
    return 'Untitled Finding';
  }
  
  return cleanText.substring(0, 60) + (cleanText.length > 60 ? '...' : '');
}

function inferSeverity(sectionTitle: string, text: string, index: number): Finding['severity'] {
  const lower = (sectionTitle + ' ' + text).toLowerCase();
  
  if (lower.includes('critical') || lower.includes('major hole') || lower.includes('biggest')) {
    return 'critical';
  }
  if (lower.includes('high') || lower.includes('significant') || lower.includes('dangerous')) {
    return 'high';
  }
  if (lower.includes('low') || lower.includes('minor') || lower.includes('small')) {
    return 'low';
  }
  
  // Use position in list as indicator
  if (index <= 2) return 'high';
  if (index <= 5) return 'medium';
  return 'low';
}

function inferCategory(text: string): Finding['category'] {
  const lower = text.toLowerCase();
  
  if (/punch|kick|jab|cross|hook|strike|striking|boxing|overhand|hands|chin/.test(lower)) {
    return 'striking';
  }
  if (/takedown|clinch|submission|guard|mount|grappl|wrestling|ground|back|rnc|choke/.test(lower)) {
    return 'grappling';
  }
  if (/stance|footwork|movement|balance|position|lateral|pivot|circle/.test(lower)) {
    return 'movement';
  }
  if (/cardio|tired|fatigue|gas|pace|breathing|output/.test(lower)) {
    return 'cardio';
  }
  if (/mental|frustrat|panic|composure|iq|decision/.test(lower)) {
    return 'mental';
  }
  
  return 'pattern';
}

function inferConfidence(text: string, timestampCount: number): Finding['confidence'] {
  const lower = text.toLowerCase();
  
  if (lower.includes('inconclusive') || lower.includes('unclear') || lower.includes('cannot assess')) {
    return 'inconclusive';
  }
  if (lower.includes('low confidence')) {
    return 'low';
  }
  
  // Base confidence on evidence count
  if (timestampCount >= 3) return 'high';
  if (timestampCount >= 1) return 'medium';
  return 'low';
}

function extractCounterEvidence(text: string): string | undefined {
  const counterMatch = text.match(/however|but|except|although|counter[- ]?evidence:?\s*([^.]+)/i);
  return counterMatch ? counterMatch[1]?.trim() : undefined;
}

function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter(f => {
    const key = f.title.toLowerCase().substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// STRENGTH EXTRACTION
// ============================================================================

/**
 * Extract strengths from parsed sections.
 */
export function extractStrengths(sections: ReportSection[], rawContent: string): Finding[] {
  const strengths: Finding[] = [];
  
  // Updated keywords to match rigid prompts
  const strengthKeywords = ['strengths', 'good things', 'offensive threats'];
  
  // Find strength sections
  const strengthSections = sections.filter(s => 
    strengthKeywords.some(kw => s.title.toLowerCase().includes(kw))
  );

  // Extract from identified sections
  strengthSections.forEach(section => {
    const lines = section.content.split('\n');
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.match(/^[-*•]|\d+\./) && cleanLine.length > 15) {
        const text = cleanLine.replace(/^[-*•]|\d+\.\s*/, '').trim();
        
        if (text.length > 10) {
          const timestamps = extractTimestamps(text);
          
          strengths.push({
            id: crypto.randomUUID(),
            title: extractTitle(text),
            description: text,
            severity: 'low',
            category: inferCategory(text),
            instanceCount: timestamps.length || 1,
            confidence: 'high',
            timestamps,
          });
        }
      }
    });
  });

  return deduplicateFindings(strengths);
}

// ============================================================================
// TECHNIQUES EXTRACTION
// ============================================================================

export function extractMostUtilizedTechniques(sections: ReportSection[]): Technique[] {
    const techniques: Technique[] = [];
    
    const relevantSections = sections.filter(s => 
        s.title.toLowerCase().includes('utilized') || 
        s.title.toLowerCase().includes('techniques') ||
        s.title.toLowerCase().includes('weapons')
    );

    relevantSections.forEach(section => {
        const lines = section.content.split('\n');
        lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.match(/^[-*•]|\d+\./) && cleanLine.length > 5) {
                const text = cleanLine.replace(/^[-*•]|\d+\.\s*/, '').trim();
                const timestamps = extractTimestamps(text);
                
                techniques.push({
                    name: stripTimestamps(text).replace(/^\*\*(.*?)\*\*.*$/, '$1').trim(),
                    timestamps
                });
            }
        });
    });

    return techniques.slice(0, 5); // Limit to 5
}


// ============================================================================
// IMPROVEMENT EXTRACTION
// ============================================================================

/**
 * Extract priority improvements from parsed sections.
 */
export function extractImprovements(sections: ReportSection[], rawContent: string): PriorityImprovement[] {
  const improvements: PriorityImprovement[] = [];
  
  // Find improvement/priority sections
  const improvementSections = sections.filter(s => 
    s.title.toLowerCase().includes('priority') || 
    s.title.toLowerCase().includes('improvement') ||
    s.title.toLowerCase().includes('fix')
  );

  // Extract from sections
  improvementSections.forEach(section => {
    const lines = section.content.split('\n');
    let priority = improvements.length + 1;
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.match(/^[-*•]|\d+\./) && cleanLine.length > 15) {
        const text = cleanLine.replace(/^[-*•]|\d+\.\s*/, '').trim();
        
        improvements.push({
          area: inferCategory(text),
          issue: text,
          fix: extractFix(text),
          drillRecommendation: extractDrill(text),
          priority: priority++,
        });
      }
    });
  });

  return improvements.slice(0, 10); // Limit to top 10
}

function extractFix(text: string): string {
  // Look for fix-related keywords
  const fixMatch = text.match(/(?:fix|improve|work on|focus on|practice|develop)[:\s]+([^.]+)/i);
  if (fixMatch) return fixMatch[1].trim();
  
  // Otherwise, suggest based on the issue
  return `Address this issue through focused training and drilling.`;
}

function extractDrill(text: string): string | undefined {
  const drillMatch = text.match(/(?:drill|exercise|practice)[:\s]+([^.]+)/i);
  return drillMatch ? drillMatch[1].trim() : undefined;
}

// ============================================================================
// DECISION TREE EXTRACTION
// ============================================================================

export function extractDecisionTree(sections: ReportSection[]): DecisionNode[] {
  const nodes: DecisionNode[] = [];
  
  const treeSections = sections.filter(s => 
    s.title.toLowerCase().includes('decision') || 
    s.title.toLowerCase().includes('counter logic') ||
    s.title.toLowerCase().includes('tree')
  );

  treeSections.forEach(section => {
    const lines = section.content.split('\n');
    lines.forEach(line => {
       // Look for "IF [Trigger] THEN [Response]" pattern
       // Case insensitive, handles various bullet formats
       const regex = /(?:[-*•]|\d+\.)?\s*IF\s+(.+?)\s+THEN\s+(.+)/i;
       const match = line.match(regex);
       
       if (match) {
         const triggerText = match[1].replace(/\*\*/g, '').trim();
         const responseText = match[2].trim();
         
         const timestamps = extractTimestamps(line);

         nodes.push({
           trigger: triggerText,
           response: responseText,
           timestamp: timestamps[0] // Attach the primary timestamp if available
         });
       }
    });
  });

  return nodes;
}

// ============================================================================
// OVERALL ASSESSMENT EXTRACTION
// ============================================================================

/**
 * Extract overall assessment from sections.
 */
export function extractOverallAssessment(sections: ReportSection[], rawContent: string): OverallAssessment {
  const defaultAssessment: OverallAssessment = {
    level: 'Unknown',
    archetype: 'Unknown',
    summary: 'No assessment available.',
  };

  // Find overall assessment section
  const assessmentSection = sections.find(s => 
    s.title.toLowerCase().includes('overall') || 
    s.title.toLowerCase().includes('assessment')
  );

  if (!assessmentSection && !rawContent) return defaultAssessment;

  const content = assessmentSection?.content || rawContent;

  // Extract archetype - handle both "**Archetype:** Value" and "Archetype: Value" formats
  const archetypeMatch = content.match(/\*?\*?Archetype\*?\*?[:\s]*\*?\*?([^*\n]+)/i);
  if (archetypeMatch) {
    defaultAssessment.archetype = archetypeMatch[1].replace(/\*\*/g, '').trim().substring(0, 100);
  }

  // Extract level - handle both "**Current Level:** Value" and "Level: Value" formats
  const levelMatch = content.match(/\*?\*?(?:Current\s+)?Level\*?\*?[:\s]*\*?\*?([^*\n]+)/i);
  if (levelMatch) {
    defaultAssessment.level = levelMatch[1].replace(/\*\*/g, '').trim().substring(0, 100);
  }

  // Build summary - get content after the level/archetype lines
  if (assessmentSection?.content) {
    let summaryText = assessmentSection.content;
    
    // Remove the Archetype and Level lines from the summary
    summaryText = summaryText
      .replace(/\*?\*?Archetype\*?\*?[:\s]*\*?\*?[^*\n]+\*?\*?/gi, '')
      .replace(/\*?\*?(?:Current\s+)?Level\*?\*?[:\s]*\*?\*?[^*\n]+\*?\*?/gi, '')
      .replace(/\*\*/g, '')
      .trim();
    
    // If content is very long, try to find a good cut-off point at a sentence boundary
    if (summaryText.length > 1500) {
      // Find the last sentence boundary before 1500 chars
      const cutoff = 1500;
      const lastPeriod = summaryText.lastIndexOf('.', cutoff);
      const lastQuestion = summaryText.lastIndexOf('?', cutoff);
      const lastExclaim = summaryText.lastIndexOf('!', cutoff);
      
      const bestCutoff = Math.max(lastPeriod, lastQuestion, lastExclaim);
      
      if (bestCutoff > 500) {
        // Good sentence boundary found
        summaryText = summaryText.substring(0, bestCutoff + 1);
      } else {
        // No good boundary, just use first 1500 chars
        summaryText = summaryText.substring(0, 1500);
      }
    }
    
    defaultAssessment.summary = summaryText || defaultAssessment.summary;
  }

  return defaultAssessment;
}

// ============================================================================
// OPPONENT GAME PLAN EXTRACTION
// ============================================================================

/**
 * Extract "If I Were Your Opponent" section.
 */
export function extractOpponentGamePlan(rawContent: string): string | undefined {
  // Handle both "### 10. IF I WERE..." and "**IF I WERE..." formats
  // Updated regex to catch # IF I WERE...
  const match = rawContent.match(/(?:#+|(?:\*\*)?)["']?IF I WERE YOUR OPPONENT["']?(?:\*\*)?[:\s]*\n?([\s\S]*?)(?=(?:\*\*)?Corner AI|#|---|\n\n\n|$)/i);
  if (match) {
    return match[1]
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\*\*Corner AI.*$/is, '') // Remove any trailing "Corner AI Verdict" section
      .trim()
      .substring(0, 1500); // Increased limit for full content
  }
  return undefined;
}

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

/**
 * Parse raw Gemini markdown response into structured SelfScoutReport.
 */
export function parseSelfScoutReport(
  rawContent: string,
  analysisType: 'full' | 'quick' | 'progress' = 'full'
): SelfScoutReport {
  // Parse sections
  const sections = parseReportSections(rawContent);
  
  // Extract all timestamps from raw content
  const allTimestamps = extractTimestamps(rawContent);
  
  // Sort timestamps chronologically
  allTimestamps.sort((a, b) => a.seconds - b.seconds);
  
  // Extract findings (weaknesses/patterns) - now sorted chronologically
  const findings = extractFindings(sections, rawContent);
  
  // Extract strengths
  const strengths = extractStrengths(sections, rawContent);
  
  // Extract improvements
  const priorityImprovements = extractImprovements(sections, rawContent);
  
  // Extract overall assessment
  const overallAssessment = extractOverallAssessment(sections, rawContent);
  
  // Extract opponent game plan
  const opponentGamePlan = extractOpponentGamePlan(rawContent);
  
  // Build metadata
  const metadata: ReportMetadata = {
    totalFindings: findings.length,
    criticalCount: findings.filter(f => f.severity === 'critical').length,
    highCount: findings.filter(f => f.severity === 'high').length,
    mediumCount: findings.filter(f => f.severity === 'medium').length,
    lowCount: findings.filter(f => f.severity === 'low').length,
    validationWarnings: validateReport(findings, strengths),
  };

  return {
    id: crypto.randomUUID(),
    generatedAt: new Date(),
    analysisType,
    overallAssessment,
    findings,
    strengths,
    priorityImprovements,
    opponentGamePlan,
    sections,
    timestamps: allTimestamps,
    metadata,
    rawContent,
  };
}

/**
 * Validate report and generate warnings.
 */
function validateReport(findings: Finding[], strengths: Finding[]): string[] {
  const warnings: string[] = [];
  
  // Check for findings with low evidence
  const lowEvidenceFindings = findings.filter(f => f.instanceCount < 2 && f.confidence !== 'inconclusive');
  if (lowEvidenceFindings.length > 0) {
    warnings.push(`${lowEvidenceFindings.length} finding(s) have limited timestamp evidence.`);
  }
  
  // Check if no strengths found
  if (strengths.length === 0) {
    warnings.push('No strengths were identified in this analysis.');
  }
  
  // Check if too many critical findings (might indicate over-sensitivity)
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  if (criticalCount > 5) {
    warnings.push('High number of critical findings - review may be over-sensitive.');
  }
  
  return warnings;
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * Legacy function for backward compatibility.
 */
export function extractFindingsFromSections(sections: ReportSection[]): Finding[] {
  return extractFindings(sections, sections.map(s => s.content).join('\n'));
}