export const WIN_MASKS = [
  0b000000111, // row 0
  0b000111000, // row 1
  0b111000000, // row 2
  0b001001001, // col 0
  0b010010010, // col 1
  0b100100100, // col 2
  0b100010001, // diag
  0b001010100  // anti-diag
];

export function isWin(bits: number): boolean {
  return WIN_MASKS.some(mask => (bits & mask) === mask);
}

export function convertSmallBoard(board: string[][], player: 'X' | 'O'): number {
  let bits = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = board[row][col];
      if ((player === 'X' && cell === 'X') || (player === 'O' && cell === 'O')) {
        const bitIndex = row * 3 + col;
        bits |= (1 << bitIndex);
      }
    }
  }
  return bits;
}

