import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {EngineService} from '../../services/engine/engine.service';

@Component({
  selector: 'loading-popup',
  standalone: true,
  templateUrl: './loading-popup.component.html',
  imports: [
    FormsModule,
    NgIf
  ],
  styleUrls: ['./loading-popup.component.scss']
})
export class LoadingPopup {

  engineLoaded: boolean = false;

  constructor(private engine: EngineService) {
    engine.engineInitialized$.subscribe(engineLoaded => {
      this.engineLoaded = engineLoaded;
    });
  }

}
