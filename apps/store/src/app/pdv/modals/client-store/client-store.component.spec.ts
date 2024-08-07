import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientStoreComponent } from './client-store.component';
import { MatDialogRef } from '@angular/material/dialog';
import { ProfileType } from 'src/app/profile-type';
import { profile } from 'src/test/utils/profile';
import { client as clientTest } from 'src/test/utils/client';
import { AddressType } from 'src/app/address-type';

describe('ClientStoreComponent', () => {
  let component: ClientStoreComponent;
  let fixture: ComponentFixture<ClientStoreComponent>;
  let closeDialogSpy: jasmine.Spy
  let address: AddressType
  let client: any

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientStoreComponent],
      providers: [{
        provide: MatDialogRef,
        useValue: { close: () => { } }
      }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    component.context.profile = (profile as unknown) as ProfileType
    address = {
      id: 1,
      city: 'Santos',
      distance: 1000,
      neighborhood: 'Embaré',
      number: 9,
      street: 'Major Santos Silva',
      uf: 'SP',
      zipcode: '00000000',
    }
    client = clientTest
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  });

  // addAddress
  it('should be possible to add a new address', () => {
    const oldAddressesLength = component.addresses.length
    component.addAddress()
    expect(component.addresses.length).toBeGreaterThan(oldAddressesLength)
  });

  // addAddress
  it('should be possible to add a new address', () => {
    const oldAddressesLength = component.addresses.length
    component.addAddress()
    expect(component.addresses.length).toBeGreaterThan(oldAddressesLength)
  });

  // getInfoByZipCode
  it('should be possible to get address info by zipcode', async () => {
    const getInfoByZipCodeSpy = spyOn(component.api, 'getInfoByZipCode')
    await component.getInfoByZipCode(address, 0)
    expect(getInfoByZipCodeSpy).toHaveBeenCalled()
  });

  // clientAPI
  it('should be possible to register a client in server', async () => {
    const clientRegisterSpy = spyOn(component.api, 'clientRegister').and.returnValue({ client } as any)
    const type = 'create'
    await component.clientAPI({ preventDefault: () => { } }, type)
    expect(clientRegisterSpy).toHaveBeenCalledWith({
      slug: component.context.profile.slug,
      client: {
        name: component.name,
        whatsapp: component.whatsapp,
        secretNumber: component.secretNumber,
        email: component.email,
      },
      addresses: component.addresses
    })
    expect(closeDialogSpy).toHaveBeenCalledWith({ client, addressId: component.addressId })
  });

  it('should be possible to update a client in server', async () => {
    component.data.client = client
    const clientRegisterSpy = spyOn(component.api, 'clientUpdate').and.returnValue({ client } as any)
    const type = 'update'
    await component.clientAPI({ preventDefault: () => { } }, type)
    expect(clientRegisterSpy).toHaveBeenCalledWith({
      slug: component.context.profile.slug,
      clientId: component.data.client.id,
      client: {
        name: component.name,
        whatsapp: component.whatsapp,
        secretNumber: component.secretNumber,
        email: component.email,
      },
      addresses: component.addresses,
      clientAddresses: component.data.client.addresses,

    })
    expect(closeDialogSpy).toHaveBeenCalledWith({ client, addressId: component.addressId })
  });
});