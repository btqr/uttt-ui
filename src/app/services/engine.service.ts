import {Injectable, OnInit, signal} from '@angular/core';
import {JavaPosition} from './java-position.model';
import {withLatestFrom} from 'rxjs';
import {GameStateService} from './game-state.service';
import {SettingsService} from './settings.service';
import {GameState} from './game-state.model';
import {Settings} from './settings.model';
import {convertSmallBoard, isWin} from './utils';
import {resolve} from '@angular/compiler-cli';
import {analysisResult$} from './analysis-result-updater';


declare const TeaVM: any;

@Injectable({providedIn: 'root'})
export class EngineService {

  private currentAnalysisAbortController: AbortController | null = null;
  private analysisLock: Promise<void> = Promise.resolve();
  private teavm: any;

  constructor(private gameStateService: GameStateService, private settingsService: SettingsService) {
    this.init().then(() => {
      this.gameStateService.gameState$
        .pipe(withLatestFrom(this.settingsService.settings$))
        .subscribe(([gameState, settings]: [GameState, Settings]) => {
          this.analyze(gameState.board, gameState.activeBoard, gameState.currentPlayer, settings.thinkingTime,
            settings.playVsAi && gameState.lastMovePlayer);
        });
    });
  }

  private async init(): Promise<void> {
    this.teavm = await TeaVM.wasmGC.load('assets/classes.wasm', {});
    console.log('TeaVM loaded');
  }

  private async analyze(board: string[][][], activeBoard: number | null, currentPlayer: 'X' | 'O', thinkingTime: number, aiToMove: boolean):
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

}




