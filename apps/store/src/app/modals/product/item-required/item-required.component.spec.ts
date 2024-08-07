import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ItemRequiredComponent } from './item-required.component';

describe('ItemRequiredComponent', () => {
  let component: ItemRequiredComponent;
  let fixture: ComponentFixture<ItemRequiredComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemRequiredComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemRequiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
