import {Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core';
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
    MatIcon
  ],
  styleUrls: ['./right-side-panel.component.scss']
})
export class RightSidePanelComponent implements OnInit {
  settings!: Settings;
  moves: string[] = [];
  @Output() clearBoard = new EventEmitter<void>();

  @ViewChild('scrollContainer') private scrollContainerRef!: ElementRef

  activeTab: 'moves' | 'settings' = 'moves';

  constructor(private settingsService: SettingsService, private gameStateService: GameStateService) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = { ...settings };
    });
    this.gameStateService.gameState$.subscribe(gameState => {
      this.moves = gameState.moves;
    });
  }

  maxMovesArray(): number[] {
    const maxLength = Math.max(7, Math.max(this.player1Moves.length, this.player2Moves.length));
    if (Math.max(this.player1Moves.length, this.player2Moves.length) > 4) {
      this.scrollToBottom();
    }
    return Array.from({ length: maxLength }, (_, i) => i);
  }

  private scrollToBottom(): void {
    if (this.scrollContainerRef) {
      // Set the scroll position to the maximum possible height
      this.scrollContainerRef.nativeElement.scrollTop = this.scrollContainerRef.nativeElement.scrollHeight;
    }
  }

  onSettingsChange(): void {
    this.settingsService.updateSettings(this.settings);
  }

  onClearBoard(): void {
    this.clearBoard.emit();
  }

  toggleSettings(): void {
    this.settings.isSettingsVisible = !this.settings.isSettingsVisible;
    this.settingsService.updateSettings(this.settings);
  }

  setTab(tab: 'moves' | 'settings') {
    this.activeTab = tab;
  }

  onUndo() {
    this.gameStateService.undoMove();
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
      case 'c':
        this.clearBoard.emit();
        break;
    }
  }

  protected readonly Math = Math;
}
