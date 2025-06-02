import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {GameState} from './game-state.model';
import {convertSmallBoard, isWin, WIN_MASKS} from '../utils';
import {SettingsService} from '../settings/settings.service';

@Injectable({providedIn: 'root'})
export class GameStateService {

  private gameStateSubject: BehaviorSubject<GameState>;
  private gameStateHistorySubject: BehaviorSubject<GameState[]>;
  private currentMoveDisplayedSubject: BehaviorSubject<number>;

  private moveSound: HTMLAudioElement;
  private newGameSound: HTMLAudioElement;
  private changeMoveSound: HTMLAudioElement;
  private soundDisabled: boolean = false;

  gameState$: Observable<GameState>;
  gameStateHistory$: Observable<GameState[]>;
  currentMoveDisplayed$: Observable<number>;

  constructor(private settingsService: SettingsService) {
    this.gameStateSubject = new BehaviorSubject<GameState>(this.createStartState());
    this.gameState$ = this.gameStateSubject.asObservable();

    this.gameStateHistorySubject = new BehaviorSubject<GameState[]>([this.gameStateSubject.getValue()]);
    this.gameStateHistory$ = this.gameStateHistorySubject.asObservable();

    this.currentMoveDisplayedSubject = new BehaviorSubject(0);
    this.currentMoveDisplayed$ = this.currentMoveDisplayedSubject.asObservable();

    this.moveSound = new Audio('assets/move.mp3');
    this.moveSound.preload = 'auto';
    this.newGameSound = new Audio('assets/new_game.mp3');
    this.newGameSound.preload = 'auto';
    this.changeMoveSound = new Audio('assets/change_move.mp3');
    this.changeMoveSound.preload = 'auto';

    this.settingsService.settings$.subscribe(settings => {
      this.soundDisabled = settings.disableSoundEffects;
    })
  }

  makeMove(big: number, row: number, col: number, aiMove: boolean): void {
    const state = structuredClone(this.gameStateSubject.value);
    if (!this.canMove(state.board, big, row, col, state.activeBoard)) return;

    this.playSound(this.moveSound);

    state.board[big][row][col] = state.currentPlayer;

    const nextActiveBoard = this.isBoardCompleted(state.board, row * 3 + col)
      ? null
      : row * 3 + col;

    const winner = this.getWinnerFromBoard(state.board);
    const moves = state.moves;

    const rowStr = Math.floor(big/3) * 3 + Math.floor((row * 3 + col)/3);
    const columnStr = big%3 * 3 + (row * 3 + col)%3;
    moves.push(rowStr + '-' + columnStr);

    const currentMove = this.currentMoveDisplayedSubject.getValue() + 1;

    const newState: GameState = {
      ...state,
      currentMove: currentMove,
      board: state.board,
      currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
      activeBoard: nextActiveBoard,
      lastMove: { big, row, col },
      winner,
      lastMovePlayer: !aiMove,
      moves: moves
    };

    this.gameStateSubject.next(newState);
    this.currentMoveDisplayedSubject.next(currentMove);

    const newHistory = [];
    for (let state of this.gameStateHistorySubject.getValue()) {
      if (state.currentMove < currentMove) {
        newHistory.push(state);
      }
    }
    newHistory.push(newState);
    this.gameStateHistorySubject.next(newHistory);
  }

  undoMove(): void {
    this.playSound(this.changeMoveSound);
    const currentMove = this.currentMoveDisplayedSubject.getValue() - 1;
    const gameState = this.gameStateHistorySubject.getValue()
      .find(gameState => gameState.currentMove == currentMove);

    if (gameState == undefined) {
      throw new Error("Game state not found!");
    }

    this.gameStateSubject.next(gameState);
    this.currentMoveDisplayedSubject.next(currentMove);
  }

  changeCurrentMoveTo(move: number) {
    this.playSound(this.changeMoveSound);
    const history = this.gameStateHistorySubject.getValue();
    if (move >= history.length) {
      return;
    }
    const state = history[move];

    this.gameStateSubject.next(state);
    this.currentMoveDisplayedSubject.next(move);
  }

  goToStart() {
    this.playSound(this.changeMoveSound);
    const history = this.gameStateHistorySubject.getValue();
    if (history.length <= 0) {
      return;
    }
    const state = history[0];

    this.gameStateSubject.next(state);
    this.currentMoveDisplayedSubject.next(0);
  }

  goToEnd() {
    this.playSound(this.changeMoveSound);
    const history = this.gameStateHistorySubject.getValue();
    const state = history[history.length - 1];

    this.gameStateSubject.next(state);
    this.currentMoveDisplayedSubject.next(history.length - 1);
  }

  goToNext() {
    this.playSound(this.changeMoveSound);
    const history = this.gameStateHistorySubject.getValue();
    const currentMove = this.currentMoveDisplayedSubject.getValue();
    if (currentMove >= history.length) {
      return;
    }
    const state = history[currentMove + 1];

    this.gameStateSubject.next(state);
    this.currentMoveDisplayedSubject.next(currentMove + 1);
  }

  clearBoard(): void {
    this.playSound(this.newGameSound);
    this.gameStateSubject.next(this.createStartState());
    this.gameStateHistorySubject.next([this.gameStateSubject.getValue()]);
    this.currentMoveDisplayedSubject.next(0);
  }

  isBoardCompleted(b: string[][][], big: number): boolean {
    return this.getWinningLine(b[big]) !== null;
  }

  getMiniBoardWinner(b: string[][][], big: number): string | null {
    return this.getWinningLine(b[big]);
  }

  private playSound(sound: HTMLAudioElement) {
    if (!this.soundDisabled && sound.readyState >= 2) {
      sound.currentTime = 0;
      sound.play()
    }
  }

  private createStartState(): GameState {
    return {
      currentMove: 0,
      board: this.createEmptyBoard(),
      currentPlayer: 'X',
      activeBoard: null,
      lastMove: null,
      winner: null,
      lastMovePlayer: false,
      moves: []
    }
  }

  private canMove(board: string[][][], big: number, row: number, col: number, activeBoard: number | null): boolean {
    return board[big][row][col] === ''
      && (activeBoard === null || activeBoard === big)
      && !this.isBoardCompleted(board, big)
      && this.getWinnerFromBoard(board) === null
  }

  private createEmptyBoard(): string[][][] {
    return Array.from({ length: 9 }, () =>
      Array.from({ length: 3 }, () => Array(3).fill(''))
    );
  }

  private getWinningLine(board: string[][]): string | null {
    const checkLine = (a: string, b: string, c: string): string | null =>
      a !== '' && a === b && b === c ? a : null;

    // Rows and Columns
    for (let i = 0; i < 3; i++) {
      const row = checkLine(board[i][0], board[i][1], board[i][2]);
      if (row) return row;

      const col = checkLine(board[0][i], board[1][i], board[2][i]);
      if (col) return col;
    }

    // Diagonals
    return (
      checkLine(board[0][0], board[1][1], board[2][2]) ??
      checkLine(board[0][2], board[1][1], board[2][0]) ??
      null
    );
  }

  private getWinnerFromBoard(board: string[][][]): 'X' | 'O' | 'Draw' | null {
    const {bigBoardCircle, bigBoardCross} = this.convertBigBoards(board);
    const finishedBoardsMask = this.getFinishedBoardsMask(board);

    // Check for big board wins
    for (const mask of WIN_MASKS) {
      if ((bigBoardCircle & mask) === mask) return 'O';
      if ((bigBoardCross & mask) === mask) return 'X';
    }

    // Check if all boards are finished
    if (finishedBoardsMask === 0b111111111) {
      const circleWins = this.countBits(bigBoardCircle);
      const crossWins = this.countBits(bigBoardCross);

      if (circleWins > crossWins) return 'O';
      if (crossWins > circleWins) return 'X';
      return 'Draw';
    }
    return null;
  }

  private getFinishedBoardsMask(board: string[][][]): number {
    let mask = 0;
    for (let i = 0; i < 9; i++) {
      if (this.isBoardFinished(board[i])) {
        mask |= (1 << i);
      }
    }
    return mask;
  }

  private isBoardFinished(smallBoard: string[][]): boolean {
    const bitsCircle = convertSmallBoard(smallBoard, 'O');
    const bitsCross = convertSmallBoard(smallBoard, 'X');

    if (isWin(bitsCircle) || isWin(bitsCross)) {
      return true;
    }

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (smallBoard[row][col] === '') {
          return false; // board not finished yet
        }
      }
    }
    return true; // drawn board (full, no winner)
  }

  private countBits(bits: number): number {
    let count = 0;
    while (bits) {
      bits &= bits - 1;
      count++;
    }
    return count;
  }

  private convertBigBoards(board: string[][][]): { bigBoardCircle: number; bigBoardCross: number } {
    let bigBoardCircle = 0;
    let bigBoardCross = 0;

    for (let big = 0; big < 9; big++) {
      const smallBoard = board[big];

      const bitsCircle = convertSmallBoard(smallBoard, 'O');
      const bitsCross = convertSmallBoard(smallBoard, 'X');

      if (isWin(bitsCircle)) bigBoardCircle |= (1 << big);
      if (isWin(bitsCross)) bigBoardCross |= (1 << big);
    }

    return {bigBoardCircle, bigBoardCross};
  }
}
