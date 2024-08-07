import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashbackComponent } from './cashback.component';

describe('CashbackComponent', () => {
  let component: CashbackComponent;
  let fixture: ComponentFixture<CashbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CashbackComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
