import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientSearchListComponent } from './client-search-list.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('ClientSearchListComponent', () => {
  let component: ClientSearchListComponent;
  let fixture: ComponentFixture<ClientSearchListComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientSearchListComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientSearchListComponent);
    component = fixture.componentInstance;
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalledWith({})
  });

  // selectClient
  it('should be possible to close the modal and select a client', () => {
    const client = {}
    component.selectClient(client)
    expect(closeDialogSpy).toHaveBeenCalledWith({ client })
  });
});
