import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {GameState} from './game-state.model';
import {convertSmallBoard, isWin, WIN_MASKS} from '../utils';

@Injectable({providedIn: 'root'})
export class GameStateService {

  private gameStateSubject: BehaviorSubject<GameState>;

  gameState$: Observable<GameState>;

  constructor() {
    this.gameStateSubject = new BehaviorSubject<GameState>(this.createStartState());
    this.gameState$ = this.gameStateSubject.asObservable();
  }

  makeMove(big: number, row: number, col: number, aiMove: boolean): void {
    const state = structuredClone(this.gameStateSubject.value);

    if (!this.canMove(state.board, big, row, col, state.activeBoard)) return;

    state.board[big][row][col] = state.currentPlayer;

    const nextActiveBoard = this.isBoardCompleted(state.board, row * 3 + col)
      ? null
      : row * 3 + col;

    const winner = this.getWinnerFromBoard(state.board);
    const moves = state.moves;

    const rowStr = Math.floor(big/3) * 3 + Math.floor((row * 3 + col)/3);
    const columnStr = big%3 * 3 + (row * 3 + col)%3;
    moves.push(rowStr + ' ' + columnStr);

    const newState: GameState = {
      ...state,
      board: state.board,
      currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
      activeBoard: nextActiveBoard,
      lastMove: { big, row, col },
      winner,
      lastMovePlayer: !aiMove,
      moves: moves
    };

    this.gameStateSubject.next(newState);
  }

  clearBoard(): void {
    this.gameStateSubject.next(this.createStartState());
  }

  createStartState(): GameState {
    return {
      board: this.createEmptyBoard(),
      currentPlayer: 'X',
      activeBoard: null,
      lastMove: null,
      winner: null,
      lastMovePlayer: false,
      moves: []
    }
  }

  isBoardCompleted(b: string[][][], big: number): boolean {
    return this.getWinningLine(b[big]) !== null;
  }

  getMiniBoardWinner(b: string[][][], big: number): string | null {
    return this.getWinningLine(b[big]);
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
