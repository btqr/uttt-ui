import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../../services/settings/settings.service';
import {GameStateService} from '../../../services/game-state/game-state.service';
import {AnalysisResult} from '../../../services/engine/analysis-result.model';
import {EngineService} from '../../../services/engine/engine.service';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: "top-eval-panel",
  standalone: true,
  templateUrl: './top-eval-panel.component.html',
  imports: [
    DecimalPipe
  ],
  styleUrls: ['./top-eval-panel.component.scss']
})
export class TopEvalPanel implements OnInit {

  eval: number | undefined;

  constructor(private engineService: EngineService) {

  }

  ngOnInit(): void {
    this.engineService.analysisResult$.subscribe(result => {
      this.eval = result?.bestEval;
    })
  }
}
