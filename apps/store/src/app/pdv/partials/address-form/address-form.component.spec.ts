import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressFormComponent } from './address-form.component';
import { AddressType } from 'src/app/address-type';

describe('AddressFormComponent', () => {
  let component: AddressFormComponent;
  let fixture: ComponentFixture<AddressFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddressFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // getInfoByZipCode
  it('should be possible to get address info by zipcode', async () => {
    const address: AddressType = {
      id: 1,
      city: 'Santos',
      distance: 1000,
      neighborhood: 'Embaré',
      number: 9,
      street: 'Major Santos Silva',
      uf: 'SP',
      zipcode: '00000000',
    }
    const getInfoByZipCodeSpy = spyOn(component.api, 'getInfoByZipCode')
    await component.getInfoByZipCode(address, 0)
    expect(getInfoByZipCodeSpy).toHaveBeenCalled()
  });
});
