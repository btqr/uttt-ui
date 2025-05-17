import { Component } from '@angular/core';
import {UltimateTicTacToeComponent} from './ultimate-tic-tac-toe/ultimate-tic-tac-toe.component';
import {CommonModule} from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    UltimateTicTacToeComponent,
    MatGridListModule,
    MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'uttt-app';
}
