import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartPaymentCardOptionsComponent } from './cart-payment-card-options.component';

describe('CartPaymentCardOptionsComponent', () => {
  let component: CartPaymentCardOptionsComponent;
  let fixture: ComponentFixture<CartPaymentCardOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartPaymentCardOptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartPaymentCardOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
