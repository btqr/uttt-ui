import {Component, EventEmitter, Inject, Input, OnChanges, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-game-over-dialog',
  standalone: true,
  templateUrl: './game-over-dialog.component.html',
    imports: [CommonModule],
  styleUrls: ['./game-over-dialog.component.scss']
})
export class GameOverDialogComponent implements OnChanges {
  @Input() winner: "X" | "O" | "Draw" | null = null;
  @Output() restart = new EventEmitter<void>();
  isVisible: boolean = true;

  ngOnChanges() {
    if (this.winner) {
      this.isVisible = true;
    }
  }

  onClose() {
    this.isVisible = false;
  }

  onReset() {
    this.isVisible = false;
    this.restart.emit();
  }
}
