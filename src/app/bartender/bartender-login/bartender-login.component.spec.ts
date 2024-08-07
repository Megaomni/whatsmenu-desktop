import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BartenderLoginComponent } from './bartender-login.component';

describe('BartenderLoginComponent', () => {
  let component: BartenderLoginComponent;
  let fixture: ComponentFixture<BartenderLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BartenderLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BartenderLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
