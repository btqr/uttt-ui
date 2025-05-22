import {ChangeDetectorRef, Component, OnInit, OnDestroy, NgZone, signal} from '@angular/core';
import {analysisResult$, convertBigBoards, EngineService} from '../engine/engine.service';
import {CommonModule} from '@angular/common';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {AnalysisResult, Move} from '../engine/analysis-result.model';
import {FormsModule} from '@angular/forms';
import {BehaviorSubject, Subscription} from 'rxjs';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {GameOverDialogComponent} from './game-over-popup/game-over-dialog.component';

@Component({
  selector: 'app-ultimate-tic-tac-toe',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatGridListModule, MatButtonModule, FormsModule, GameOverDialogComponent],
  templateUrl: './ultimate-tic-tac-toe.component.html',
  styleUrls: ['./ultimate-tic-tac-toe.component.scss']
})


export class UltimateTicTacToeComponent implements OnInit, OnDestroy {
  board: string[][][] = Array.from({length: 9}, () =>
    Array.from({length: 3}, () => Array(3).fill(''))
  );
  currentPlayer: 'X' | 'O' = 'X';
  activeBoard: number | null = null; // 0-8 or null for any
  lastMove: { big: number; row: number; col: number } | null = null;
  analysisResult = signal<AnalysisResult | null>(null);
  thinkingTime = 500;
  showEval = true;
  playVsAi = false;
  aggresiveOptimiziations = false;
  showVisits = true;
  isSettingsVisible = true;

  winner$ = new BehaviorSubject<'O' | 'X' | 'Draw' | null>(null);

  private subscription: Subscription;

  constructor(private engine: EngineService, private ngZone: NgZone, private dialog: MatDialog) {
    this.subscription = analysisResult$.subscribe(result => {
      this.ngZone.run(() => {
        this.analysisResult.set(result);
      });
    });
  }

  async ngOnInit() {
    this.engine.init()
      .then(() => this.engine.analyze(this.board, this.activeBoard, this.currentPlayer, this.thinkingTime, this.aggresiveOptimiziations));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  makeMove(big: number, row: number, col: number, aiMove: boolean): void {
    if (
      this.board[big][row][col] === '' &&
      (this.activeBoard === null || this.activeBoard === big)
      && !this.isBoardCompleted(big)
      && this.getWinnerFromBoard() == null
    ) {
      this.board[big][row][col] = this.currentPlayer;
      this.lastMove = {big, row, col};
      this.activeBoard = row * 3 + col;
      if (this.isBoardCompleted(this.activeBoard)) {
        this.activeBoard = null;
      }
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      if (this.getWinnerFromBoard() == null) {
        this.engine.analyze(this.board, this.activeBoard, this.currentPlayer, this.thinkingTime, this.aggresiveOptimiziations);
        if (this.playVsAi && !aiMove) {
          setTimeout(() => {
            const move = this.engine.getBestMove(this.board, this.activeBoard);
            if (move) this.makeMove(move.big, move.row, move.col, true);
          }, this.thinkingTime);
        }
      }
      this.winner$.next(this.getWinnerFromBoard());
    }
  }

  isBoardCompleted(big: number): boolean {
    const board = this.board[big];

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

  getMiniBoardWinner(big: number): string | null {
    const board = this.board[big];

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

  isBestMove(big: number, row: number, col: number): boolean {
    const move = this.getMove(big, row, col);
    return move?.visits === this.analysisResult()?.maxVisits;
  }

  getCellContent(big: number, row: number, col: number): string {
    return this.board[big][row][col];
  }

  getMove(big: number, row: number, col: number): Move | null {
    return this.analysisResult()?.moves?.[big]?.[row]?.[col] ?? null;
  }

  toggleSettings() {
    this.isSettingsVisible = !this.isSettingsVisible;
  }

  clearBoard() {
    this.board = this.createEmptyBoard();
    this.activeBoard = null;
    this.currentPlayer = 'X';
    this.lastMove = null;
    // this.engine.init();
    this.engine.analyze(this.board, this.activeBoard, this.currentPlayer, this.thinkingTime, this.aggresiveOptimiziations);
  }

  createEmptyBoard() {
    return Array.from({length: 9}, () =>
      Array.from({length: 3}, () => Array(3).fill(''))
    );
  }

  getWinnerFromBoard(): "X" | "O" | "Draw" | null {
    return this.engine.getWinner(this.board);
  }

  handleRestart() {
    this.clearBoard();
  }
}


