import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomProductComponent } from './custom-product.component';

describe('CustomProductComponent', () => {
  let component: CustomProductComponent;
  let fixture: ComponentFixture<CustomProductComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomProductComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
