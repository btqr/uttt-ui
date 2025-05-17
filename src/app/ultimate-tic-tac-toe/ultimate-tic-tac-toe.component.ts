import { Component, OnInit } from '@angular/core';
import { EngineService } from '../engine/engine.service';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ultimate-tic-tac-toe',
  standalone: true,
  imports: [CommonModule, MatGridListModule, MatButtonModule],
  templateUrl: './ultimate-tic-tac-toe.component.html',
  styleUrls: ['./ultimate-tic-tac-toe.component.scss']
})
export class UltimateTicTacToeComponent implements OnInit {
  board: string[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 3 }, () => Array(3).fill(''))
  );
  currentPlayer: 'X' | 'O' = 'X';
  activeBoard: number | null = null; // 0-8 or null for any
  lastMove: { big: number; row: number; col: number } | null = null;

  constructor(private engine: EngineService) {}

  ngOnInit(): void {}

  makeMove(big: number, row: number, col: number): void {
    if (
      this.board[big][row][col] === '' &&
      (this.activeBoard === null || this.activeBoard === big)
    ) {
      this.board[big][row][col] = this.currentPlayer;
      this.lastMove = { big, row, col };
      this.activeBoard = row * 3 + col;
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

      if (this.currentPlayer === 'O') {
        setTimeout(() => {
          const move = this.engine.getRandomMove(this.board, this.activeBoard);
          if (move) this.makeMove(move.big, move.row, move.col);
        }, 500);
      }
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

  getCellContent(big: number, row: number, col: number): string {
    return this.board[big][row][col];
  }
}
