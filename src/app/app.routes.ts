import { Routes } from '@angular/router';
import {UltimateTicTacToeComponent} from './ultimate-tic-tac-toe/ultimate-tic-tac-toe.component';
import {GuideComponent} from './guide/guide.component';
import {AboutComponent} from './about/about.component';

export const routes: Routes = [
  { path: 'play', component: UltimateTicTacToeComponent },
  { path: 'guide', component: GuideComponent },
  { path: 'about', component: AboutComponent },
  { path: '', redirectTo: '/play', pathMatch: 'full' },
];
