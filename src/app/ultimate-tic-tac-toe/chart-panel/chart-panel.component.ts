import {Component, OnInit} from '@angular/core';
import {EngineService} from '../../services/engine/engine.service';
import {Color, LineChartModule, ScaleType} from '@swimlane/ngx-charts';
import { curveBasis } from 'd3-shape';
import {BaseChartDirective} from 'ng2-charts';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData, ChartDataset
} from 'chart.js';
import {GameStateService} from '../../services/game-state/game-state.service';

// Register controllers, elements and plugins
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

@Component({
  selector: 'chart-panel',
  standalone: true,
  templateUrl: './chart-panel.component.html',
  imports: [
    LineChartModule,
    BaseChartDirective
  ],
  styleUrls: ['./chart-panel.component.scss']
})
export class ChartPanelComponent implements OnInit {

  evalHistory: number[] = [];
  lineChartData!: any;
  currentMove!: number;
  constructor(private engineService: EngineService, private gameStateService: GameStateService) {

  }

  ngOnInit(): void {
    this.gameStateService.currentMoveDisplayed$.subscribe(currentMove => {
      this.currentMove = currentMove;
    });
    this.engineService.evalHistory$.subscribe(evalHistory => {
      this.evalHistory = evalHistory;

      this.lineChartData = {
        animation: false,   // disable all animations
        responsive: true,
        scales: {
          y: {
            min: -1.07,
            max: 1.07,
            ticks: {
              stepSize: 0.5,
              callback: function (value: number) {
                // Only show labels at -1, 0, and 1
                if (value === -1.07 || value === 0 || value === 1.07) {
                  return value.toFixed(0); // or just `return value;`
                }
                return '';
              }
            }
          },
        },
        plugins: {
          legend: {
            display: false
          }
        },
      };
    });
  }

  getEvalChartData(): ChartData<'line', number[], string> {
    if (this.evalHistory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels: string[] = ['0'];
    const data: number[] = [this.evalHistory[0]];

    if (this.currentMove > 0 || this.evalHistory.length > 1) {
      this.evalHistory.forEach((value, index) => {
        labels.push((index + 1).toString());
        data.push(value);
      });
    }

    const pointRadius: number[] = data.map((_, i) => (i === this.currentMove? 5 : 1));
    const pointBackgroundColor: (string | CanvasGradient | CanvasPattern)[] = data.map(
      (_, i) => (i === this.currentMove ? 'yellow' : '#42A5F5')
    );

    const datasets: ChartDataset<'line', number[]>[] = [
      {
        data,
        label: 'Evaluation',
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66,165,245,0.2)',
        fill: false,
        tension: 0.3,
        pointRadius,
        pointBackgroundColor
      } as ChartDataset<'line', number[]>
    ];

    return {
      labels,
      datasets
    };
  }

}
