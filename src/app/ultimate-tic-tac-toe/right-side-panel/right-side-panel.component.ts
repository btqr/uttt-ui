import {Component, ElementRef, EventEmitter, HostListener, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {Settings} from '../../services/settings/settings.model';
import {FormsModule} from '@angular/forms';
import {SettingsService} from '../../services/settings/settings.service';
import {CommonModule} from '@angular/common';
import {GameStateService} from '../../services/game-state/game-state.service';
import {MatSlider, MatSliderModule} from '@angular/material/slider';
import {NgxSliderModule} from '@angular-slider/ngx-slider';
import {NouisliderComponent} from 'ng2-nouislider';
import {MatButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {ChartPanelComponent} from '../chart-panel/chart-panel.component';
import {MatIcon} from '@angular/material/icon';
import {timeout} from 'rxjs';
import {TopEvalPanel} from './top-eval-panel/top-eval-panel.component';

@Component({
  selector: 'right-side-panel',
  standalone: true,
  templateUrl: './right-side-panel.component.html',
  imports: [
    FormsModule,
    CommonModule,
    MatSliderModule,
    MatSlider,
    NgxSliderModule,
    NouisliderComponent,
    MatButton,
    MatTooltip,
    ChartPanelComponent,
    MatIcon,
    TopEvalPanel
  ],
  styleUrls: ['./right-side-panel.component.scss']
})
export class RightSidePanelComponent implements OnInit {
  settings!: Settings;
  moves: string[] = [];
  currentMove!: number;
  @Output() clearBoard = new EventEmitter<void>();

  @ViewChild('scrollContainer') private scrollContainerRef!: ElementRef

  activeTab: 'moves' | 'settings' = 'moves';
  lastLengthWhenScrolled = -1;

  constructor(private settingsService: SettingsService, private gameStateService: GameStateService) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = { ...settings };
    });
    this.gameStateService.gameStateHistory$.subscribe(gameStateHistory => {
      this.moves = gameStateHistory[gameStateHistory.length - 1].moves;
    });
    this.gameStateService.currentMoveDisplayed$.subscribe(currentMove => {
      this.currentMove = currentMove;
    });
  }

  maxMovesArray(): number[] {
    const maxMoves = Math.max(this.player1Moves.length, this.player2Moves.length);
    const maxLength = Math.max(10, maxMoves);
    if (maxMoves > 4) {
      if (this.lastLengthWhenScrolled != this.moves.length) {
        setTimeout(() => this.scrollToBottom());
        this.lastLengthWhenScrolled = this.moves.length;
      }
    }
    return Array.from({ length: maxLength }, (_, i) => i);
  }

  private scrollToBottom(): void {
    if (this.scrollContainerRef) {
      // Set the scroll position to the maximum possible height
      this.scrollContainerRef.nativeElement.scrollTop = this.scrollContainerRef.nativeElement.scrollHeight;
    }
  }

  isCurrentMove(player1Move: boolean, moveNumber: number): boolean {
    if (player1Move) {
      return this.currentMove%2 == 1 && moveNumber*2 + 1 == this.currentMove;
    } else {
      return this.currentMove%2 == 0 && (moveNumber*2) + 2 == this.currentMove;
    }
  }

  onSettingsChange(): void {
    this.settingsService.updateSettings(this.settings);
  }

  onClearBoard(): void {
    this.clearBoard.emit();
  }

  setTab(tab: 'moves' | 'settings') {
    this.activeTab = tab;
  }

  get player1Moves(): string[] {
    return this.moves.filter((_, index) => index % 2 === 0); // Even indexes
  }

  get player2Moves(): string[] {
    return this.moves.filter((_, index) => index % 2 === 1); // Odd indexes
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.onUndo();
        break;
      case 'ArrowRight':
        this.onNext();
        break;
      case 'n':
        this.clearBoard.emit();
        break;
    }
  }

  protected readonly Math = Math;

  onMoveClick(moveOfPlayer: number, player: string) {
    const move = player == 'player1' ? moveOfPlayer * 2 + 1 : moveOfPlayer * 2 + 2;
    this.gameStateService.changeCurrentMoveTo(move);
  }

  onGoToStart() {
    if (this.currentMove <= 0) {
      return;
    }
    this.gameStateService.goToStart();
  }

  onGoToEnd() {
    if (this.currentMove + 1 > this.moves.length) {
      return;
    }
    this.gameStateService.goToEnd();
  }

  onUndo() {
    if (this.currentMove <= 0) {
      return;
    }
    this.gameStateService.undoMove();
  }

  onNext() {
    if (this.currentMove + 1 > this.moves.length) {
      return;
    }
    this.gameStateService.goToNext();
  }
}
