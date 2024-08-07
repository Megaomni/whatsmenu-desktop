import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartTypeComponent } from './cart-type.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('CartTypeComponent', () => {
  let component: CartTypeComponent;
  let fixture: ComponentFixture<CartTypeComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartTypeComponent ],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CartTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    const data: { type: 'D' | 'P' } = { type: 'D' }
    component.close(data)
    expect(closeDialogSpy).toHaveBeenCalledWith(jasmine.objectContaining(data))
  })
});
