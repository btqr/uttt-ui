import {Component, OnInit} from '@angular/core';
import {EngineService} from '../../services/engine/engine.service';
import {LineChartModule} from '@swimlane/ngx-charts';


@Component({
  selector: 'chart-panel',
  standalone: true,
  templateUrl: './chart-panel.component.html',
  imports: [
    LineChartModule
  ],
  styleUrls: ['./chart-panel.component.scss']
})
export class ChartPanelComponent implements OnInit {

  evalHistory: number[] = [];
  evalAsDataSeries: any[] = [];
  colorScheme = {
    domain: ['#2196f3'] // Single line: evaluation score
  };

  constructor(private engineService: EngineService) {
  }

  ngOnInit(): void {
    this.engineService.evalHistory$.subscribe(evalHistory => {
      this.evalHistory = evalHistory;
      this.evalAsDataSeries = this.getEvalAsDataSeries();
    })
  }

  getEvalAsDataSeries(): any[] {
    let mapped = this.evalHistory.map((value, index) => ({
      name: (index + 1).toString(),
      value: value
    }));

    mapped.unshift({
      name: '0',
      value: mapped[0].value
    });

    const series = [
      {
        name: 'Evaluation',
        series: mapped
      }
    ];

    return series;
  }

}
