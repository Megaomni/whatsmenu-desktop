import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BartenderLoginComponent } from './bartender-login.component';
import { MatDialogRef } from '@angular/material/dialog';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';
import Table from 'src/classes/table';

describe('BartenderLoginComponent', () => {
  let component: BartenderLoginComponent;
  let fixture: ComponentFixture<BartenderLoginComponent>;
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BartenderLoginComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BartenderLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
  });

  afterEach(() => {
    sessionStorage.clear()
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  })

  // authBartender
  it('must be possible to authenticate a user', async () => {
    const bartender = component.context.profile.bartenders[0]
    const table = component.context.profile.tables[0]
    const authBartenderSpy = spyOn(component.api, 'authBartender').and.returnValue({ bartender, table } as any)
    component.password = '123456'
    component.context.profile.options.table.persistBartender = true
    await component.authBartender()
    expect(authBartenderSpy).toHaveBeenCalled()
    expect(JSON.parse(sessionStorage.getItem('bartenderId'))).toEqual(bartender.id)
    component.context.profile.options.table.persistBartender = false
    await component.authBartender()
    expect(sessionStorage.getItem('bartenderId')).toBe(null)
    expect(closeDialogSpy).toHaveBeenCalledWith({ authenticated: true, table })    
  })
});
