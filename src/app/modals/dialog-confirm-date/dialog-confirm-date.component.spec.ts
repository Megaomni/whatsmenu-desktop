import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmDateComponent } from './dialog-confirm-date.component';

describe('DialogConfirmDateComponent', () => {
  let component: DialogConfirmDateComponent;
  let fixture: ComponentFixture<DialogConfirmDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogConfirmDateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
