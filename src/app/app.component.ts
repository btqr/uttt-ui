import {Component, OnInit} from '@angular/core';
import {UltimateTicTacToeComponent} from './ultimate-tic-tac-toe/ultimate-tic-tac-toe.component';
import {CommonModule} from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import {FooterComponent} from './footer/footer.component';
import {FormsModule} from '@angular/forms';
import {MatSlider, MatSliderModule} from '@angular/material/slider';

declare const TeaVM: any;
let teavm : any;



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    UltimateTicTacToeComponent,
    MatGridListModule,
    MatButtonModule,
    FooterComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit {
  title = 'uttt-app';

  ngOnInit() {}

}






