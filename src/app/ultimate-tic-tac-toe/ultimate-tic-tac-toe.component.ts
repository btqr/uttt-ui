import {Component} from '@angular/core';
import {EngineService} from '../services/engine/engine.service';
import {CommonModule} from '@angular/common';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {AnalysisResult, Move} from '../services/engine/analysis-result.model';
import {FormsModule} from '@angular/forms';
import {MatDialogModule} from '@angular/material/dialog';
import {GameOverDialogComponent} from './game-over-popup/game-over-dialog.component';
import {Settings} from '../services/settings/settings.model';
import {RightSidePanelComponent} from './right-side-panel/right-side-panel.component';
import {SettingsService} from '../services/settings/settings.service';
import {GameState} from '../services/game-state/game-state.model';
import {GameStateService} from '../services/game-state/game-state.service';
import {LoadingPopup} from './loading-popup/loading-popup.component';

@Component({
  selector: 'app-ultimate-tic-tac-toe',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatGridListModule, MatButtonModule, FormsModule, GameOverDialogComponent, RightSidePanelComponent, LoadingPopup],
  templateUrl: './ultimate-tic-tac-toe.component.html',
  styleUrls: ['./ultimate-tic-tac-toe.component.scss']
})
export class UltimateTicTacToeComponent {
  gameState!: GameState;
  analysisResult: AnalysisResult | null = null;
  settings!: Settings;

  constructor(private engine: EngineService, public settingsService: SettingsService,
              private gameStateService: GameStateService) {
    this.gameStateService.gameState$.subscribe(gameState => {
      this.gameState = gameState
      // console.log(gameState);
    });
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
    })
    engine.analysisResult$.subscribe(result => {
      this.analysisResult = result;
      // console.log(result);
    });
  }

  isBestMove(big: number, row: number, col: number): boolean {
    const move = this.getMove(big, row, col);
    return move?.visits === this.analysisResult?.maxVisits;
  }

  getCellContent(big: number, row: number, col: number): string {
    return this.gameState.board[big][row][col];
  }

  getMove(big: number, row: number, col: number): Move | null {
    return this.analysisResult?.moves?.[big]?.[row]?.[col] ?? null;
  }

  clearBoard() {
    this.gameStateService.clearBoard();
  }

  toggleSettings() {
    this.settingsService.toggle();
  }

  isBoardCompleted(big: number) {
    return this.gameStateService.isBoardCompleted(this.gameState.board, big);
  }

  getMiniBoardWinner(big: number) {
    return this.gameStateService.getMiniBoardWinner(this.gameState.board, big);
  }

  makeMove(big: number, row: number, col: number) {
    return this.gameStateService.makeMove(big, row, col, false);
  }

  isLastMove(big: number, row: number, col: number) {
    const last = this.gameState.lastMove;
    return last?.big == big && last?.row == row && last?.col == col;
  }

  isMovePossible(big: number, row: number, col: number) {
    return this.gameState.winner == null
      && this.gameState.board[big][row][col] === ''
      && (this.gameState.activeBoard === null || this.gameState.activeBoard === big)
      && !this.isBoardCompleted(big)
  }

}


