import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartRepeatComponent } from './cart-repeat.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('CartRepeatComponent', () => {
  let component: CartRepeatComponent;
  let fixture: ComponentFixture<CartRepeatComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartRepeatComponent ],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CartRepeatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('must be possible to close the modal when confirming and sending the carts to order', () => {
    component.close({ confirm: true })
    expect(closeDialogSpy).toHaveBeenCalledWith(jasmine.objectContaining({ cart: component.cart, cartPizza: component.cartPizza }))
  })

  it('must be possible to close the modal when canceling and not sending the carts to order', () => {
    component.close({ confirm: false })
    expect(closeDialogSpy).toHaveBeenCalled()
    expect(closeDialogSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ cart: component.cart, cartPizza: component.cartPizza }))
  })
});
