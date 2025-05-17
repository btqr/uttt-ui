import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltimateTicTacToeComponent } from './ultimate-tic-tac-toe.component';

describe('UltimateTicTacToeComponent', () => {
  let component: UltimateTicTacToeComponent;
  let fixture: ComponentFixture<UltimateTicTacToeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UltimateTicTacToeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UltimateTicTacToeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
