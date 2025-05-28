import {Component, OnInit} from '@angular/core';
import {EngineService} from '../../services/engine/engine.service';
import {Color, LineChartModule, ScaleType} from '@swimlane/ngx-charts';
import { curveBasis } from 'd3-shape';


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
  curve = curveBasis;
  colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#007bff']
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
    if (this.evalHistory.length == 0) {
      return [];
    }
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
