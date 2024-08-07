import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartPaymentComponent } from './cart-payment.component';

describe('CartPaymentComponent', () => {
  let component: CartPaymentComponent;
  let fixture: ComponentFixture<CartPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartPaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
