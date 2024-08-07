import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartPaymentCardCheckCvvComponent } from './cart-payment-card-check-cvv.component';

describe('CartPaymentCardCheckCvvComponent', () => {
  let component: CartPaymentCardCheckCvvComponent;
  let fixture: ComponentFixture<CartPaymentCardCheckCvvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartPaymentCardCheckCvvComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartPaymentCardCheckCvvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
