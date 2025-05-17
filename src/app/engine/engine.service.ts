import { Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class EngineService {
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
            if (cell === '') options.push({ big, row, col });
          });
        });
      }
    });
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
  }
}
