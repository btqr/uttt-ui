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
    const maxLength = Math.max(11, maxMoves);
    if (maxMoves > 4) {
      if (this.lastLengthWhenScrolled != this.moves.length) {
        // setTimeout(() => this.scrollToBottom());
        this.lastLengthWhenScrolled = this.moves.length;
      }
    }
    return Array.from({ length: maxLength }, (_, i) => i);
  }

  // private scrollToBottom(): void {
  //   if (this.scrollContainerRef) {
  //     // Set the scroll position to the maximum possible height
  //     this.scrollContainerRef.nativeElement.scrollTop = this.scrollContainerRef.nativeElement.scrollHeight;
  //   }
  // }

  isCurrentMove(player1Move: boolean, moveNumber: number): boolean {
    if (player1Move) {
      return this.currentMove%2 == 1 && moveNumber*2 + 1 == this.currentMove;
    } else {
      return this.currentMove%2 == 0 && (moveNumber*2) + 2 == this.currentMove;
    }
  }

  onClearBoard(): void {
    this.clearBoard.emit();
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
        event.preventDefault();
        this.onUndo();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.onNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.onUndo2();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.onNext2();
        break;
      case 'n':
        event.preventDefault();
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

  onUndo2() {
    if (this.currentMove <= 1) {
      return;
    }
    this.gameStateService.undoMove();
    this.gameStateService.undoMove();
  }

  onNext() {
    if (this.currentMove + 1 > this.moves.length) {
      return;
    }
    this.gameStateService.goToNext();
  }

  onNext2() {
    if (this.currentMove + 2 > this.moves.length) {
      return;
    }
    this.gameStateService.goToNext();
    this.gameStateService.goToNext();
  }
}
