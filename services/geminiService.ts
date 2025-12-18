import { GoogleGenAI, Type } from "@google/genai";
import { FightAnalysis } from "../types";
import { 
  getPrompt, 
  buildUserPrompt, 
  validateInputs,
  PromptTemplate 
} from "../lib/prompts";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY must be defined in the build/runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 encoded string.
 * Includes MIME type normalization to prevent "Invalid video data" errors.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      
      let mimeType = file.type;
      
      // Fix: Normalize MIME types if missing or generic
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'mov') mimeType = 'video/quicktime';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'avi') mimeType = 'video/x-msvideo';
        else if (ext === 'mpg' || ext === 'mpeg') mimeType = 'video/mpeg';
      }

      // Gemini specific fixes: 
      // video/quicktime (MOV) sometimes causes "Invalid video data" (400) errors if sent as inline data.
      // Mapping it to video/mp4 often resolves this if the underlying codec is compatible (e.g. H.264).
      if (mimeType === 'video/quicktime' || mimeType === 'video/x-m4v') {
        console.warn(`Normalizing ${mimeType} to video/mp4 for Gemini compatibility.`);
        mimeType = 'video/mp4';
      }

      if (!mimeType) {
        console.warn("Could not determine MIME type for file, defaulting to video/mp4");
        mimeType = 'video/mp4';
      }

      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Main analysis function calling Gemini for JSON Fight Analysis
 * This is for structured fight scoring, not report generation.
 */
export const analyzeFightData = async (
  videoFile: File | null,
  imageFiles: File[],
  textNotes: string
): Promise<FightAnalysis> => {
  
  // Get the appropriate prompt template for fight analysis
  const template = getPrompt('FIGHT_SCORING');
  
  const parts: any[] = [];

  // Add System Instruction as text part first
  if (template) {
    parts.push({ text: template.systemPrompt });
  }

  // Add User Notes
  if (textNotes.trim()) {
    parts.push({ text: `Additional Context/Notes: ${textNotes}` });
  }

  // Process Video
  if (videoFile) {
    const videoPart = await fileToGenerativePart(videoFile);
    parts.push(videoPart);
  }

  // Process Images (Stats/Profiles)
  for (const img of imageFiles) {
    const imagePart = await fileToGenerativePart(img);
    parts.push(imagePart);
  }

  // Define the JSON Schema for strict output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      fighter_a_name: { type: Type.STRING },
      fighter_b_name: { type: Type.STRING },
      rounds: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            round: { type: Type.INTEGER },
            winner: { type: Type.STRING },
            score: { type: Type.STRING },
            striking: { type: Type.STRING },
            grappling: { type: Type.STRING },
            aggression: { type: Type.STRING },
            control: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["round", "winner", "score", "striking", "grappling", "aggression", "control", "explanation"]
        },
      },
      fighter_a_strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      fighter_a_weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      fighter_b_strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      fighter_b_weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      detected_tells: { type: Type.ARRAY, items: { type: Type.STRING } },
      overall_rating: { type: Type.INTEGER },
      overall_summary: { type: Type.STRING },
    },
    required: [
      "fighter_a_name",
      "fighter_b_name",
      "rounds", 
      "fighter_a_strengths", 
      "fighter_a_weaknesses", 
      "fighter_b_strengths", 
      "fighter_b_weaknesses",
      "detected_tells",
      "overall_rating",
      "overall_summary"
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for objective analysis
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FightAnalysis;
    } else {
      throw new Error("No data returned from Gemini.");
    }

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// ============================================================================
// REPORT GENERATION USING PROMPT TEMPLATES
// ============================================================================

export type ReportType = 
  | 'SELF_SCOUT_FULL' 
  | 'SELF_SCOUT_QUICK' 
  | 'SELF_SCOUT_PROGRESS'
  | 'OPPONENT_BREAKDOWN_FULL' 
  | 'OPPONENT_BREAKDOWN_QUICK'
  | 'GAME_PLAN_FULL'
  | 'GAME_PLAN_QUICK';

export interface ReportGenerationOptions {
  reportType: ReportType;
  userVideos?: File[];
  opponentVideos?: File[];
  imageFiles?: File[];
  context?: string;
  specificQuestions?: string;
}

/**
 * Generate a report using the prompt templates from prompts.ts
 * This is the main function for generating self-scout reports, opponent breakdowns, etc.
 */
export const generateReportFromTemplate = async (
  options: ReportGenerationOptions
): Promise<string> => {
  const { 
    reportType, 
    userVideos = [], 
    opponentVideos = [],
    imageFiles = [], 
    context = '', 
    specificQuestions = '' 
  } = options;

  // Get the prompt template
  const template = getPrompt(reportType);
  if (!template) {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  // Validate inputs
  const validation = validateInputs(template, {
    userVideo: userVideos,
    opponentVideo: opponentVideos,
  });
  
  if (!validation.valid) {
    throw new Error(`Missing required inputs: ${validation.missing.join(', ')}`);
  }

  // Build the user prompt with variables filled in
  const userPrompt = buildUserPrompt(template, {
    context,
    specificQuestions,
  });

  // Build the parts array for Gemini
  const parts: any[] = [];
  
  // System Prompt - using the template's system prompt
  parts.push({ text: `SYSTEM INSTRUCTION:\n${template.systemPrompt}` });
  
  // User Prompt
  parts.push({ text: `USER REQUEST:\n${userPrompt}` });

  // Attach User Videos (labeled)
  for (let i = 0; i < userVideos.length; i++) {
    parts.push({ text: `[USER VIDEO ${i + 1}]` });
    const part = await fileToGenerativePart(userVideos[i]);
    parts.push(part);
  }

  // Attach Opponent Videos (labeled)
  for (let i = 0; i < opponentVideos.length; i++) {
    parts.push({ text: `[OPPONENT VIDEO ${i + 1}]` });
    const part = await fileToGenerativePart(opponentVideos[i]);
    parts.push(part);
  }

  // Attach Images
  for (const img of imageFiles) {
    const part = await fileToGenerativePart(img);
    parts.push(part);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        temperature: 0.4,
        // No JSON schema - we want Markdown text output
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("No report generated.");
    }
  } catch (error) {
    console.error("Report Generation Failed:", error);
    throw error;
  }
};

/**
 * Convenience function for Self-Scout Full Report
 */
export const generateSelfScoutReport = async (
  videoFiles: File[],
  context: string = '',
  specificQuestions: string = ''
): Promise<string> => {
  return generateReportFromTemplate({
    reportType: 'SELF_SCOUT_FULL',
    userVideos: videoFiles,
    context,
    specificQuestions,
  });
};

/**
 * Convenience function for Quick Self-Scout (Session Review)
 */
export const generateQuickSelfScout = async (
  videoFiles: File[],
  context: string = ''
): Promise<string> => {
  return generateReportFromTemplate({
    reportType: 'SELF_SCOUT_QUICK',
    userVideos: videoFiles,
    context,
  });
};

/**
 * Convenience function for Opponent Breakdown
 */
export const generateOpponentBreakdown = async (
  opponentVideos: File[],
  context: string = '',
  specificQuestions: string = ''
): Promise<string> => {
  return generateReportFromTemplate({
    reportType: 'OPPONENT_BREAKDOWN_FULL',
    opponentVideos,
    context,
    specificQuestions,
  });
};

/**
 * Convenience function for Game Plan (requires both user and opponent footage)
 */
export const generateGamePlan = async (
  userVideos: File[],
  opponentVideos: File[],
  context: string = ''
): Promise<string> => {
  return generateReportFromTemplate({
    reportType: 'GAME_PLAN_FULL',
    userVideos,
    opponentVideos,
    context,
  });
};

/**
 * Legacy function - kept for backward compatibility
 * Prefer using generateReportFromTemplate or the convenience functions above
 */
export const generateReport = async (
  systemPrompt: string,
  userPrompt: string,
  videoFiles: File[],
  imageFiles: File[] = []
): Promise<string> => {
  
  const parts: any[] = [];
  
  // System Prompt
  parts.push({ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` });
  
  // User Prompt
  parts.push({ text: `USER REQUEST:\n${userPrompt}` });

  // Attach Videos
  for (const vid of videoFiles) {
    const part = await fileToGenerativePart(vid);
    parts.push(part);
  }

  // Attach Images
  for (const img of imageFiles) {
    const part = await fileToGenerativePart(img);
    parts.push(part);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        temperature: 0.4,
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("No report generated.");
    }
  } catch (error) {
    console.error("Report Generation Failed:", error);
    throw error;
  }
};