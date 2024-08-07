import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierCloseComponent } from './cashier-close.component';
import { MatDialogRef } from '@angular/material/dialog';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';

describe('CashierCloseComponent', () => {
  let component: CashierCloseComponent;
  let fixture: ComponentFixture<CashierCloseComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CashierCloseComponent ],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierCloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    component.context.profile = (profile as unknown) as ProfileType
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  });

  // closeCashier
  it('should be possible to close the modal', async () => {
    const closeCashierSpy = spyOn(component.api, 'closeCashier').and.returnValue({ cashier: {} } as any)
    await component.closeCashier({ preventDefault: () => {} })
    expect(closeCashierSpy).toHaveBeenCalled()
    expect(closeDialogSpy).toHaveBeenCalled()
  });
});
