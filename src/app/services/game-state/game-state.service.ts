import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {GameState} from './game-state.model';
import {convertSmallBoard, isWin} from '../utils';

@Injectable({providedIn: 'root'})
export class GameStateService {

  // Winning masks for 3x3
  WIN_MASKS = [
    0b000000111, // row 0
    0b000111000, // row 1
    0b111000000, // row 2
    0b001001001, // col 0
    0b010010010, // col 1
    0b100100100, // col 2
    0b100010001, // diag
    0b001010100  // anti-diag
  ];

  private gameStateSubject: BehaviorSubject<GameState>;

  gameState$: Observable<GameState>;

  constructor() {
    this.gameStateSubject = new BehaviorSubject<GameState>(this.createStartState());
    this.gameState$ = this.gameStateSubject.asObservable();
  }

  createStartState(): GameState {
    return {
      board: this.createEmptyBoard(),
      currentPlayer: 'X',
      activeBoard: null,
      lastMove: null,
      winner: null,
      lastMovePlayer: false
    }
  }

  makeMove(big: number, row: number, col: number, aiMove: boolean): void {
    const state = this.gameStateSubject.value;
    const board = state.board.map(boardRow =>
      boardRow.map(boardCol => [...boardCol])
    );

    if (this.canMove(board, big, row, col, state.activeBoard)) {
      board[big][row][col] = state.currentPlayer;
      let activeBoard: number | null = row * 3 + col;
      if (this.isBoardCompleted(board, activeBoard)) {
        activeBoard = null;
      }
      const newPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
      const lastMove = { big, row, col };
      const winner = this.getWinnerFromBoard(board);

      const updatedState: GameState = {
        board,
        currentPlayer: newPlayer,
        activeBoard,
        lastMove,
        winner,
        lastMovePlayer: !aiMove
      };
      this.gameStateSubject.next(updatedState);
    }
  }

  clearBoard() {
    this.gameStateSubject.next(this.createStartState());
  }

  isBoardCompleted(b:string[][][], big: number): boolean {
    const board = b[big];

    const checkLine = (a: string, b: string, c: string) =>
      a !== '' && a === b && b === c;

    for (let i = 0; i < 3; i++) {
      if (checkLine(board[i][0], board[i][1], board[i][2])) return true;
      if (checkLine(board[0][i], board[1][i], board[2][i])) return true;
    }
    if (checkLine(board[0][0], board[1][1], board[2][2])) return true;
    if (checkLine(board[0][2], board[1][1], board[2][0])) return true;

    return false;
  }

  getMiniBoardWinner(b:string[][][], big: number): string | null {
    const board = b[big];

    const checkLine = (a: string, b: string, c: string) =>
      a !== '' && a === b && b === c;

    for (let i = 0; i < 3; i++) {
      if (checkLine(board[i][0], board[i][1], board[i][2])) return board[i][2];
      if (checkLine(board[0][i], board[1][i], board[2][i])) return board[2][i];
    }
    if (checkLine(board[0][0], board[1][1], board[2][2])) return board[2][2];
    if (checkLine(board[0][2], board[1][1], board[2][0])) return board[2][0];

    return null;
  }

  private canMove(board: string[][][], big: number, row: number, col: number, activeBoard: number | null): boolean {
    return board[big][row][col] === ''
      && (activeBoard === null || activeBoard === big)
      && !this.isBoardCompleted(board, big)
      && this.getWinnerFromBoard(board) === null
  }

  private createEmptyBoard() {
    return Array.from({length: 9}, () =>
      Array.from({length: 3}, () => Array(3).fill(''))
    );
  }

  private getWinnerFromBoard(board: string[][][]): 'X' | 'O' | 'Draw' | null {
    const {bigBoardCircle, bigBoardCross} = this.convertBigBoards(board);
    const finishedBoardsMask = this.getFinishedBoardsMask(board);

    // Check for big board wins
    for (const mask of this.WIN_MASKS) {
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
