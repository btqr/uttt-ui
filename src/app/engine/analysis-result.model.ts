export interface AnalysisResult {
  moves: (Move | null)[][][];
  maxVisits: number | null;
  evalThreshold: number | null;
}

export interface Move {
  visits: number;
  score: number;
}
