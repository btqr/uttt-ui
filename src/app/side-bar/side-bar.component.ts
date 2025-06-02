import {Component, EventEmitter, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import {RouterLink, RouterLinkActive, RouterModule} from '@angular/router';

@Component({
  selector: 'side-bar',
  standalone: true,
  templateUrl: './side-bar.component.html',
  imports: [
    NgClass,
    RouterModule  // <-- Import entire RouterModule here!
  ],
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  sidebarVisible: boolean = false;

  @Output() sidebarToggle  = new EventEmitter<boolean>();

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    this.sidebarToggle .emit(this.sidebarVisible);
  }
}
