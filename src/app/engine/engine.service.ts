import { Injectable } from '@angular/core';
import {AppComponent} from '../app.component';
import {JavaPosition} from './java-position.model';
import {AnalysisResult, Move} from './analysis-result.model';
import {BehaviorSubject, interval, map, Observable} from 'rxjs';

declare const TeaVM: any;
let teavm : any;
export let analysisResult$ = new BehaviorSubject<AnalysisResult | null>(null);

@Injectable({providedIn: 'root'})
export class EngineService {

  currentAnalysisAbortController: AbortController | null = null;
  analysisLock: Promise<void> = Promise.resolve(); // A resolved promise (initially unlocked)

  constructor() {
  }

  async init(): Promise<void> {


    teavm = await TeaVM.wasmGC.load('assets/classes.wasm', {});
    console.log('TeaVM loaded');
  }

  getRandomMove(board: string[][][], activeBoard: number | null): {
    big: number;
    row: number;
    col: number;
  } | null {
    const options: { big: number; row: number; col: number }[] = [];
    board.forEach((mini, big) => {
      if (activeBoard === null || big === activeBoard) {
        mini.forEach((rowArr, row) => {
          rowArr.forEach((cell, col) => {
            if (cell === '') options.push({big, row, col});
          });
        });
      }
    });
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
  }

  getBestMove(board: string[][][], activeBoard: number | null): {
    big: number;
    row: number;
    col: number;
  } | null {
    let bestMove: { big: number; row: number; col: number } | null = null;
    let maxVisits = -1;

    const boardsToCheck = activeBoard !== null ? [activeBoard] : [...Array(9).keys()];

    for (const big of boardsToCheck) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const move = analysisResult$.getValue()?.moves[big][row][col];
          if (move && move.visits > maxVisits) {
            maxVisits = move.visits;
            bestMove = {big, row, col};
          }
        }
      }
    }

    return bestMove
  }

  async analyze(board: string[][][], activeBoard: number | null, currentPlayer: 'X' | 'O', thinkingTime: number, aggresiveOptimiziations: boolean):
    Promise<void> {
    // Cancel any ongoing analysis
    const prevAbort = this.currentAnalysisAbortController;
    const prevLock = this.analysisLock;

    if (prevAbort) {
      prevAbort.abort(); // Abort the previous one
    }

    const myAbortController = new AbortController();
    this.currentAnalysisAbortController = myAbortController;

    // Wait for previous task to finish
    await prevLock;

    // Lock the current task
    let unlock!: () => void;
    this.analysisLock = new Promise<void>(resolve => unlock = resolve as () => void);
    try {
      const signal = myAbortController.signal;
      let javaPosition = convertToJavaPosition(board, activeBoard, currentPlayer);
      let a = javaPosition.smallBoardsCircle;
      let b = javaPosition.smallBoardsCross;
      for (let i = 0; i < thinkingTime; i += 100) {
        if (signal.aborted) {
          return;
        }
        teavm.exports.analyzePosition(
          javaPosition.bigBoardCircle, javaPosition.bigBoardCross,
          a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8],
          b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8],
          javaPosition.nextBoard, javaPosition.playerToMove, Math.min(100, thinkingTime - i),
          (thinkingTime - i) > thinkingTime / 2, aggresiveOptimiziations
        );
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      unlock();
      if (this.currentAnalysisAbortController === myAbortController) {
        this.currentAnalysisAbortController = null;
      }
    }
  }
}

(window as any).returnInfo = function(result : any) {
  analysisResult$.next(parseEngineOutput(result));
}
// Helper to convert 3x3 to bitboard
function convertSmallBoard(board: string[][], player: 'X' | 'O'): number {
  let bits = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = board[row][col];
      if ((player === 'X' && cell === 'X') || (player === 'O' && cell === 'O')) {
        const bitIndex = row * 3 + col;
        bits |= (1 << bitIndex);
      }
    }
  }
  return bits;
}

// Winning masks for 3x3
const WIN_MASKS = [
  0b000000111, // row 0
  0b000111000, // row 1
  0b111000000, // row 2
  0b001001001, // col 0
  0b010010010, // col 1
  0b100100100, // col 2
  0b100010001, // diag
  0b001010100  // anti-diag
];

// Check if bitboard is a win
function isWin(bits: number): boolean {
  return WIN_MASKS.some(mask => (bits & mask) === mask);
}

function convertToJavaPosition(
  board: string[][][],
  activeBoard: number | null,
  currentPlayer: 'X' | 'O'
): JavaPosition {
  const smallBoardsCircle = new Array(9).fill(0);
  const smallBoardsCross = new Array(9).fill(0);
  let bigBoardCircle = 0;
  let bigBoardCross = 0;

  for (let big = 0; big < 9; big++) {
    const smallBoard = board[big];

    const bitsCircle = convertSmallBoard(smallBoard, 'O');
    const bitsCross = convertSmallBoard(smallBoard, 'X');

    smallBoardsCircle[big] = bitsCircle;
    smallBoardsCross[big] = bitsCross;

    if (isWin(bitsCircle)) bigBoardCircle |= (1 << big);
    if (isWin(bitsCross)) bigBoardCross |= (1 << big);
  }

  return {
    bigBoardCircle,
    bigBoardCross,
    smallBoardsCircle,
    smallBoardsCross,
    nextBoard: activeBoard !== null ? activeBoard : -1,
    playerToMove: currentPlayer === 'O' ? 0 : 1 // Java: 0 = Circle/O, 1 = Cross/X
  };
}

function parseEngineOutput(input: string): AnalysisResult {
  // Initialize empty structure
  const moves: (Move | null)[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => null as Move | null)
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

    moves[big][row][col] = { visits, score };
  }
  allEvals.sort((a, b) => b - a);
  const index = Math.min(9, allEvals.length - 1);
  let threshold : number | null = allEvals.length > 0 ? allEvals[index] : 0;
  // let threshold = 0;

  return { moves, maxVisits: maxVisits, evalThreshold: threshold };
}
