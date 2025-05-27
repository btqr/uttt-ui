import {Injectable, OnInit, signal} from '@angular/core';
import {JavaPosition} from './java-position.model';
import {BehaviorSubject, Observable, ReplaySubject, withLatestFrom} from 'rxjs';
import {GameStateService} from '../game-state/game-state.service';
import {SettingsService} from '../settings/settings.service';
import {GameState} from '../game-state/game-state.model';
import {Settings} from '../settings/settings.model';
import {convertSmallBoard, isWin} from '../utils';
import {AnalysisResult, Move} from './analysis-result.model';

declare const TeaVM: any;

@Injectable({providedIn: 'root'})
export class EngineService {

  private currentAnalysisAbortController: AbortController | null = null;
  private analysisLock: Promise<void> = Promise.resolve();
  private teavm: any;

  private analysisResultSubject = new BehaviorSubject<AnalysisResult | null>(null);
  private engineInitializedSubject = new BehaviorSubject<boolean>(false);
  private evalHistorySubject = new BehaviorSubject<number[]>([]);

  public analysisResult$: Observable<AnalysisResult | null>;
  public engineInitialized$ = this.engineInitializedSubject.asObservable();
  public evalHistory$: Observable<number[]>;

  constructor(private gameStateService: GameStateService, private settingsService: SettingsService) {
    (window as any).returnInfo = (result: any) => {
      const parsedResult = this.parseEngineOutput(result);
      this.analysisResultSubject.next(parsedResult);
    };
    this.analysisResult$ = this.analysisResultSubject.asObservable();


    this.init()
      .then(() => {
      this.gameStateService.gameState$
        .pipe(withLatestFrom(this.settingsService.settings$))
        .subscribe(([gameState, settings]: [GameState, Settings]) => {
          this.analyze(gameState.board, gameState.activeBoard, gameState.currentPlayer, settings.thinkingTime,
            settings.playVsAi && gameState.lastMovePlayer);
        });
    }).then(() => {
      this.analysisResult$
        .pipe(withLatestFrom(this.gameStateService.currentMoveDisplayed$))
        .subscribe(([analysisResult, move]: [AnalysisResult | null, number]) => {
          if (!analysisResult) return; // 🚫 Skip if null

          const evals = [...this.evalHistorySubject.getValue()];

          if (move >= 0) {
            if (move < evals.length) {
              if (move%2 == 1) {
                evals[move] = -analysisResult.bestEval;
              } else {
                evals[move] = analysisResult.bestEval;
              }
            } else {
              if (move%2 == 1) {
                evals.push(-analysisResult.bestEval);
              } else {
                evals.push(analysisResult.bestEval);
              }
            }
          }
          this.evalHistorySubject.next(evals);
        });
    })
    this.evalHistory$ = this.evalHistorySubject.asObservable();
  }

  private async init(): Promise<void> {
    this.teavm = await TeaVM.wasmGC.load('assets/classes.wasm', {});
    console.log('TeaVM loaded');
    this.engineInitializedSubject.next(true);
  }

  private async analyze(board: string[][][], activeBoard: number | null, currentPlayer: 'X' | 'O',
                        thinkingTime: number, aiToMove: boolean): Promise<void> {
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
      let javaPosition = this.convertToJavaPosition(board, activeBoard, currentPlayer);
      let a = javaPosition.smallBoardsCircle;
      let b = javaPosition.smallBoardsCross;
      for (let i = 0; i < thinkingTime; i += 100) {
        if (signal.aborted) {
          return;
        }
        this.teavm.exports.analyzePosition(
          javaPosition.bigBoardCircle, javaPosition.bigBoardCross,
          a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8],
          b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8],
          javaPosition.nextBoard, javaPosition.playerToMove, Math.min(100, thinkingTime - i),
          (thinkingTime - i) > thinkingTime / 2, false
        );
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally {
      unlock();
      if (this.currentAnalysisAbortController === myAbortController) {
        this.currentAnalysisAbortController = null;
      }
    }

    if (aiToMove) {
      const bestMove = this.getBestMove(board, activeBoard);
      this.gameStateService.makeMove(bestMove.big, bestMove.row, bestMove.col, true);
    }

  }

  private getBestMove(board: string[][][], activeBoard: number | null): {
    big: number;
    row: number;
    col: number;
  } {
    let bestMove!: { big: number; row: number; col: number };
    let maxVisits = -1;

    const boardsToCheck = activeBoard !== null ? [activeBoard] : [...Array(9).keys()];

    for (const big of boardsToCheck) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const move = this.analysisResultSubject.getValue()?.moves[big][row][col];
          if (move && move.visits > maxVisits) {
            maxVisits = move.visits;
            bestMove = {big, row, col};
          }
        }
      }
    }
    return bestMove
  }

  private convertToJavaPosition(
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

  private parseEngineOutput(input: string): AnalysisResult {
    // Initialize empty structure
    const moves: (Move | null)[][][] = Array.from({length: 9}, () =>
      Array.from({length: 3}, () =>
        Array.from({length: 3}, () => null as Move | null)
      )
    );
    const lines = input.trim().split('\n');

    let maxVisits = 0;
    let allEvals = []
    if (lines[0] == '') return {moves, maxVisits: 0, evalThreshold: 0, bestEval: 0};

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

    return {moves, maxVisits: maxVisits, evalThreshold: threshold, bestEval: allEvals[0]};
  }
}






