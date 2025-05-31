import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../../services/settings/settings.service';
import {GameStateService} from '../../../services/game-state/game-state.service';
import {AnalysisResult} from '../../../services/engine/analysis-result.model';
import {EngineService} from '../../../services/engine/engine.service';
import {DecimalPipe, NgIf} from '@angular/common';
import {Settings} from '../../../services/settings/settings.model';
import {FormsModule} from '@angular/forms';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';

@Component({
  selector: "top-eval-panel",
  standalone: true,
  templateUrl: './top-eval-panel.component.html',
  imports: [
    DecimalPipe,
    FormsModule,
    NgIf,
    MatDialogActions,
    MatCheckbox,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatDialogClose
  ],
  styleUrls: ['./top-eval-panel.component.scss']
})
export class TopEvalPanel implements OnInit {
  settings!: Settings;
  eval: number | undefined = 0.42;
  showSettingsModal = false;

  constructor(private settingsService: SettingsService, private engineService: EngineService) {

  }

  ngOnInit(): void {
    this.engineService.analysisResult$.subscribe(result => {
      this.eval = result?.bestEval;
    })
    this.settingsService.settings$.subscribe(settings => {
      this.settings = {...settings};
    });
  }

  toggleSettings() {
    this.settings.isSettingsVisible = !this.settings.isSettingsVisible;
    this.settingsService.updateSettings(this.settings);
  }

  openSettings() {
    this.showSettingsModal = true;
  }

  onCloseSettings() {
    this.showSettingsModal = false;
  }

  onSettingsChange() {
    this.settingsService.updateSettings(this.settings);
  }
}
