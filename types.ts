export interface RoundAnalysis {
  round: number;
  winner: string;
  score: string;
  striking: string;
  grappling: string;
  aggression: string;
  control: string;
  explanation: string;
}

export interface FightAnalysis {
  fighter_a_name: string;
  fighter_b_name: string;
  rounds: RoundAnalysis[];
  fighter_a_strengths: string[];
  fighter_a_weaknesses: string[];
  fighter_b_strengths: string[];
  fighter_b_weaknesses: string[];
  detected_tells: string[];
  overall_rating: number;
  overall_summary: string;
}

export interface MediaInput {
  file: File | null;
  previewUrl: string | null;
  mimeType: string;
}

export enum TabView {
  INPUT = 'INPUT',
  RESULTS = 'RESULTS'
}