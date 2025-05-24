import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Settings} from '../../services/settings.model';
import {FormsModule} from '@angular/forms';
import {SettingsService} from '../../services/settings.service';

@Component({
  selector: 'right-side-panel',
  standalone: true,
  templateUrl: './right-side-panel.component.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./right-side-panel.component.scss']
})
export class SettingsComponent implements OnInit{
  settings!: Settings;
  @Output() clearBoard = new EventEmitter<void>();

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = { ...settings };
    });
  }

  onSettingsChange(): void {
    this.settingsService.updateSettings(this.settings);
  }

  onClearBoard(): void {
    this.clearBoard.emit();
  }

  toggleSettings(): void {
    this.settings.isSettingsVisible = !this.settings.isSettingsVisible;
    this.settingsService.updateSettings(this.settings);
  }

}
