import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAddressComponent } from './client-address.component';
import { MatDialogRef } from '@angular/material/dialog';
import { AddressType } from 'src/app/address-type';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';

describe('ClientAddressComponent', () => {
  let component: ClientAddressComponent;
  let fixture: ComponentFixture<ClientAddressComponent>;
  let closeDialogSpy: jasmine.Spy
  let address: AddressType

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientAddressComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClientAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    address = {
      id: 1,
      city: 'Santos',
      distance: 1000,
      neighborhood: 'Embaré',
      number: 9,
      street: 'Major Santos Silva',
      uf: 'SP',
      zipcode: '00000-000',
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close({})
    expect(closeDialogSpy).toHaveBeenCalled()
  });

  // updateAddress
  it('should be possible to edit an address', () => {
    component.updateAddress(address)
    expect(component.address).toEqual(address)
    expect(component.data.type).toEqual('update')
  })

  // setAddress
  it('should be possible to set an address', () => {
    const closeSpy = spyOn(component, 'close')
    component.setAddress(address)
    expect(component.address).toEqual(address)
    expect(closeSpy).toHaveBeenCalledWith({ addressId: component.address.id })
  })

  // saveAddress
  it('should be possible to save an address', async () => {
    const route = component.data.type === 'create' ? 'clientCreateAddress' : 'clientUpdateAddress'
    const saveAddressAPISpy = spyOn(component.api, route).and.returnValue({ address } as any)
    component.address = address
    await component.saveAddress()
    expect(saveAddressAPISpy).toHaveBeenCalledWith({ 
      address: component.address,
      slug: component.context.profile.slug,
      clientId: component.clientId
    })
    expect(component.address).toEqual(address)
  })
});
