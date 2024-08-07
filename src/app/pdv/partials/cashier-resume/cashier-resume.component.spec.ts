import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierResumeComponent } from './cashier-resume.component';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';
import { CashierCloseComponent } from '../../modals/cashier-close/cashier-close.component';
import { of } from 'rxjs';
import { CashierType } from 'src/app/cashier-type';

describe('CashierResumeComponent', () => {
  let component: CashierResumeComponent;
  let fixture: ComponentFixture<CashierResumeComponent>;
  let openDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CashierResumeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    openDialogSpy = spyOn(component['matDialog'], 'open')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // openClose
  it('should be possible open cashier-close modal', () => {
    const cashier = component.context.profile.cashiers.find(cashier => cashier.bartenderId === component.context.activeBartender.id)
    const cashierChangeEmitSpy = spyOn(component['cashierChange'], 'emit')
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () => of({
        cashier
      })
    })
    component.openClose()
    expect(openDialogSpy).toHaveBeenCalledWith(CashierCloseComponent, jasmine.objectContaining({}))
    expect(cashierChangeEmitSpy).toHaveBeenCalledWith(cashier)
  })
});
