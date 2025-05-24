import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Settings} from '../../services/settings/settings.model';
import {FormsModule} from '@angular/forms';
import {SettingsService} from '../../services/settings/settings.service';
import {CommonModule} from '@angular/common';
import {GameStateService} from '../../services/game-state/game-state.service';
import {MatSlider, MatSliderModule} from '@angular/material/slider';
import {NgxSliderModule} from '@angular-slider/ngx-slider';
import {NouisliderComponent} from 'ng2-nouislider';

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
    NouisliderComponent
  ],
  styleUrls: ['./right-side-panel.component.scss']
})
export class RightSidePanelComponent implements OnInit {
  settings!: Settings;
  moves: string[] = [];
  @Output() clearBoard = new EventEmitter<void>();

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

  onSettingsChange(): void {
    console.log('Thinking time changed:', this.settings.thinkingTime);
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
    console.log('tab: ' + tab)
    this.activeTab = tab;
  }

  get player1Moves(): string[] {
    return this.moves.filter((_, index) => index % 2 === 0); // Even indexes
  }

  get player2Moves(): string[] {
    return this.moves.filter((_, index) => index % 2 === 1); // Odd indexes
  }

}
