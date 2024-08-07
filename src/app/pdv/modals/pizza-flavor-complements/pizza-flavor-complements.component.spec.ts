import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PizzaFlavorComplementsComponent } from './pizza-flavor-complements.component';

describe('PizzaFlavorComplementsComponent', () => {
  let component: PizzaFlavorComplementsComponent;
  let fixture: ComponentFixture<PizzaFlavorComplementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PizzaFlavorComplementsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PizzaFlavorComplementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
