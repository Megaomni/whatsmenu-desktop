import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenhourComponent } from './openhour.component';

describe('OpenhourComponent', () => {
  let component: OpenhourComponent;
  let fixture: ComponentFixture<OpenhourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenhourComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenhourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
