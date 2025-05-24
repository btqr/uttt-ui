export interface GameState {
  board: string[][][];
  currentPlayer: 'X' | 'O';
  activeBoard: number | null;
  lastMove: { big: number; row: number; col: number } | null;
  winner: 'X' | 'O' | 'Draw' | null;
  lastMovePlayer: boolean;
  moves: string[];
}
