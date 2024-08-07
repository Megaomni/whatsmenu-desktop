import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewcommandComponent } from './newcommand.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('NewcommandComponent', () => {
  let component: NewcommandComponent;
  let fixture: ComponentFixture<NewcommandComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewcommandComponent ],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewcommandComponent);
    component = fixture.componentInstance;
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    const data = { createCommand: true }
    component.close(data)
    expect(closeDialogSpy).toHaveBeenCalledWith({ ...data, name: component.name })
  });
});
