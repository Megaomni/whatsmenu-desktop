import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentTypeComponent } from './payment-type.component';

describe('PaymentTypeComponent', () => {
  let component: PaymentTypeComponent;
  let fixture: ComponentFixture<PaymentTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
