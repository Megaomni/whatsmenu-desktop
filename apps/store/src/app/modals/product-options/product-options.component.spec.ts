import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductOptionsComponent } from './product-options.component';

describe('ProductOptionsComponent', () => {
  let component: ProductOptionsComponent;
  let fixture: ComponentFixture<ProductOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductOptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
