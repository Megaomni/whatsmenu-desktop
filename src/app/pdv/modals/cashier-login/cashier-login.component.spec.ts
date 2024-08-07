import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierLoginComponent } from './cashier-login.component';
import { MatDialogRef } from '@angular/material/dialog';
import { profile } from 'src/test/utils/profile';
import { ProfileType } from 'src/app/profile-type';

describe('CashierLoginComponent', () => {
  let component: CashierLoginComponent;
  let fixture: ComponentFixture<CashierLoginComponent>;
  let closeDialogSpy: jasmine.Spy
  let openDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CashierLoginComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    openDialogSpy = spyOn(component['matDialog'], 'open')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', async () => {
    const authBartenderSpy = spyOn(component.api, 'authBartender').and.returnValue({ bartender: component.context.profile.bartenders[0] } as any)
    await component.close({ preventDefault: () => { } })
    expect(authBartenderSpy).toHaveBeenCalled()
    expect(sessionStorage.getItem('bartenderId')).toBeTruthy()
    expect(component.context.activeBartender).toEqual(component.context.profile.bartenders[0])
    expect(component.context.activeBartender.controls.activeCashier).toEqual(component.context.profile.cashiers.find(cashier => cashier.bartenderId === component.context.activeBartender.id))
    expect(closeDialogSpy).toHaveBeenCalled()
  });

});
