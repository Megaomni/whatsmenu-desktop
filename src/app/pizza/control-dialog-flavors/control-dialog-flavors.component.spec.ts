import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ControlDialogFlavorsComponent } from './control-dialog-flavors.component';

describe('ControlDialogFlavorsComponent', () => {
  let component: ControlDialogFlavorsComponent;
  let fixture: ComponentFixture<ControlDialogFlavorsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ControlDialogFlavorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlDialogFlavorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
