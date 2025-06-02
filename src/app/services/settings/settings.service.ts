import {Injectable} from '@angular/core';
import {Settings} from './settings.model';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class SettingsService {

  private settingsSubject = new BehaviorSubject<Settings>({
    thinkingTime: 500,
    showEval: true,
    playVsAi: false,
    showVisits: true,
    isSettingsVisible: true,
    disableSoundEffects: false
  });

  settings$: Observable<Settings>;

  constructor() {
    this.settings$ = this.settingsSubject.asObservable();
  }

  updateSettings(updated: Partial<Settings>) {
    const current = this.settingsSubject.value;
    const newSettings = { ...current, ...updated };
    this.settingsSubject.next(newSettings);
  }

  toggle() {
    const current = this.settingsSubject.value;
    this.updateSettings({ isSettingsVisible: !current.isSettingsVisible });
  }
}
