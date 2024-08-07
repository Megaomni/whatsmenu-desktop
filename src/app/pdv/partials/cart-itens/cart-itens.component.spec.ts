import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartItensComponent } from './cart-itens.component';

describe('CartItensComponent', () => {
  let component: CartItensComponent;
  let fixture: ComponentFixture<CartItensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CartItensComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CartItensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
