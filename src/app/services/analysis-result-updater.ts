import {AnalysisResult, Move} from './analysis-result.model';
import {BehaviorSubject} from 'rxjs';

export let analysisResult$ = new BehaviorSubject<AnalysisResult | null>(null);

(window as any).returnInfo = function (result: any) {
  analysisResult$.next(parseEngineOutput(result));
}

function parseEngineOutput(input: string): AnalysisResult {
  // Initialize empty structure
  const moves: (Move | null)[][][] = Array.from({length: 9}, () =>
    Array.from({length: 3}, () =>
      Array.from({length: 3}, () => null as Move | null)
    )
  );
  const lines = input.trim().split('\n');

  let maxVisits = 0;
  let allEvals = []
  for (const line of lines) {
    const [indexStr, visitsStr, scoreStr] = line.trim().split(/\s+/);

    const index = parseInt(indexStr, 10);
    const visits = parseInt(visitsStr, 10);
    if (visits) {
      maxVisits = Math.max(visits, maxVisits);
    }
    let score = parseFloat(scoreStr);
    score = Math.max(score, -1);
    score = Math.min(score, 1);
    if (score) {
      allEvals.push(score);
    }

    const big = Math.floor(index / 9);
    const field = index % 9;
    const row = Math.floor(field / 3);
    const col = field % 3;

    moves[big][row][col] = {visits, score};
  }
  allEvals.sort((a, b) => b - a);
  const index = Math.min(9, allEvals.length - 1);
  let threshold: number | null = allEvals.length > 0 ? allEvals[index] : 0;
  // let threshold = 0;

  return {moves, maxVisits: maxVisits, evalThreshold: threshold};
}
