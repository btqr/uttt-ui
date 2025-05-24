export interface JavaPosition {
  bigBoardCircle: number;
  bigBoardCross: number;
  smallBoardsCircle: number[]; // 9 elements
  smallBoardsCross: number[]; // 9 elements
  nextBoard: number;
  playerToMove: number; // 0 for Circle (O), 1 for Cross (X)
}
