import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CartResumeComponent } from './cart-resume.component'
import { MatDialogRef } from '@angular/material/dialog'
import { profile } from 'src/test/utils/profile'
import { ProfileType } from 'src/app/profile-type'
import { CartType } from 'src/app/cart-type'
import { AddressType } from 'src/app/address-type'
import { ClientStoreComponent } from '../client-store/client-store.component'
import { of } from 'rxjs'
import { CupomType } from 'src/app/cupom'
import { client } from 'src/test/utils/client'

describe('CartResumeComponent', () => {
  let component: CartResumeComponent
  let fixture: ComponentFixture<CartResumeComponent>
  let closeDialogSpy: jasmine.Spy
  let openDialogSpy: jasmine.Spy
  let cupom: CupomType
  let hours: { time: string; quantity: number }[]

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CartResumeComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: () => {} },
        },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CartResumeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    openDialogSpy = spyOn(component['matDialog'], 'open')
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    component.context.profile = profile as unknown as ProfileType
    component.data.cart = []
    component.data.cartPizza = []
    component.data.client = client
    component.data.cartRequest = {
      addon: null,
      total: 50,
      taxDelivery: 5,
      addressId: null,
      bartenderId: null,
      cashierId: null,
      clientId: null,
      commandId: null,
      cupomId: 1,
      formsPayment: [],
      obs: '',
      packageDate: null,
      type: 'D',
    }
    cupom = {
      id: 1,
      code: 'TESTE',
      minValue: 10,
      profileId: component.context.profile.id,
      status: true,
      type: 'value',
      value: 5,
    }
    hours = new Array(30).fill({ time: '', quantity: 1 }).map((hour, index) => ({ ...hour, time: index })) as { time: string; quantity: number }[]
    hours.forEach((hour, index) => {
      const date = new Date()
      date.setMinutes(30 * index)
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      hour.time = time
    })
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // close
  it('should be possible to close the modal', () => {
    const data: { toPayment?: boolean; focusSearch?: boolean; finishCartRequest?: boolean } = {}
    const product = component.context.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]
    component.data.cart = [product as CartType]
    component.close(data)
    expect(closeDialogSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ...data,
        addressId: component.addressId,
        client: component.data.client,
        cupom: component.cupom,
        packageDate: component.packageDate,
        packageHours: component.data.packageHours,
      })
    )
  })

  it('should not be possible to close the modal if the carts are empty', () => {
    const data: { toPayment?: boolean; focusSearch?: boolean; finishCartRequest?: boolean } = {
      toPayment: true,
    }
    const toastServicetSpy = spyOn(component.toastService, 'show')
    component.close(data)
    expect(toastServicetSpy).toHaveBeenCalledWith(jasmine.stringMatching('Carrinho Vazio!'), jasmine.objectContaining({}))
  })

  // setSelectedAddress
  it('should be possible to set the address', () => {
    const setTaxDeliveryValueSpy = spyOn(component, 'setTaxDeliveryValue')
    component.data.client = {
      addresses: [
        {
          id: 1,
        },
      ] as AddressType[],
    }
    component.addressId = 1
    component.setSelectedAddress()
    expect(component.addressSelected).toEqual(component.data.client.addresses[0])
    expect(setTaxDeliveryValueSpy).toHaveBeenCalled()
  })

  // openClientRegister
  it('should be possible to render the client-store modal to create a new client', () => {
    const data: { type: 'update' | 'create' } = { type: 'create' }
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () =>
        of({
          client,
          addressId: null,
        }),
    })
    component.setSelectedAddress()
    component.openClientRegister(data)
    expect(openDialogSpy).toHaveBeenCalledWith(
      ClientStoreComponent,
      jasmine.objectContaining({ data: { ...data, client: component.data.client, addressId: component.addressId } })
    )
  })

  it('should be possible to render the client-store modal to update a client', () => {
    const data: { type: 'update' | 'create' } = { type: 'update' }
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () =>
        of({
          client,
          addressId: null,
        }),
    })
    const client = { name: 'update', addresses: [] }
    const oldClient = { ...component.data.client }
    component.openClientRegister(data)
    expect(openDialogSpy).toHaveBeenCalledWith(
      ClientStoreComponent,
      jasmine.objectContaining({ data: { ...data, client: oldClient, addressId: component.addressId } })
    )
    expect(component.data.client).toEqual(client)
  })

  // openAddress
  it('should be possible to render the client-address modal', () => {
    const address = { id: 1 } as AddressType
    component.data.client = { id: 1, addresses: [address] }
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () =>
        of({
          addressId: address.id,
        }),
    } as MatDialogRef<typeof component>)

    component.openAddress()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.addressId).toEqual(address.id)
    expect(component.addressSelected).toEqual(address)
  })

  // verifyCupom
  it('should be possible to fetch and validate a cupom', async () => {
    const getCupomSpy = spyOn(component.api, 'getCupom').and.returnValue(cupom as any)
    await component.verifyCupom('TESTE')
    expect(getCupomSpy).toHaveBeenCalled()
    expect(component.cupom).toEqual(cupom)
  })

  it('must be possible to search and validate a cupom and not let it proceed if the minimum value is greater than the cart total', async () => {
    const getCupomSpy = spyOn(component.api, 'getCupom').and.returnValue(cupom as any)
    const toastServicetSpy = spyOn(component.toastService, 'show')
    component.data.cartRequest.total = 0
    await component.verifyCupom('TESTE')
    expect(getCupomSpy).toHaveBeenCalled()
    expect(toastServicetSpy).toHaveBeenCalledWith(
      `Esse cupom só pode ser usado em vendas a partir de ${component.context.currency(cupom.minValue)}`,
      jasmine.objectContaining({})
    )
  })

  // filteredPeriod
  it('should be possible to filter the times of packages with 30 minutes more than the current date', async () => {
    const filtered = component.filteredPeriod(hours)
    const getTimeDate = (time: string) => {
      const [hour, minutes] = time.split(':')
      const date = new Date()
      date.setHours(Number(hour), Number(minutes))
      return date
    }
    const oldDate = getTimeDate(hours[0].time).getTime()
    const filterdDate = getTimeDate(filtered[0].time).getTime()
    expect(filterdDate).toBeGreaterThanOrEqual(oldDate + 1000 * 60 * 30)
  })

  // selectedAddressIndex
  it('should be possible to get the position of the address in the client address array', () => {
    component.data.client = { addresses: [{ id: 1 }, { id: 2 }] }
    component.addressSelected = component.data.client.addresses[1]
    expect(component.data.client.addresses[component.selectedAddressIndex()]).toEqual(component.addressSelected)
  })

  // setTaxDeliveryValue
  it('must be possible to set the value of the delivery fee', () => {
    component.data.client = {
      addresses: [
        { id: 1, distance: 1000 },
        { id: 2, distance: 3000 },
      ],
    }
    component.addressSelected = component.data.client.addresses[0]
    component.addressId = component.data.client.addresses[0].id
    component.data.cartRequest.addressId = component.addressId
    const tax = component.context.profile.taxDelivery.find((tax) => tax.distance >= component.addressSelected.distance / 1000)
    component.setTaxDeliveryValue()
    expect(component.data.cartRequest.taxDelivery).toEqual(Number(tax.value))
  })

  it('the value of the delivery fee must be equal to 0 if there is no selected address', () => {
    component.addressId = null
    component.setTaxDeliveryValue()
    expect(component.data.cartRequest.taxDelivery).toEqual(0)
  })

  // setPackageHour
  it('must be possible to set the initial value of the package time', () => {
    const date = new Date().toLocaleDateString()
    component.packageCalendar = `${date.replaceAll('/', '-')}`
    component.data.packageHours = {}
    component.data.packageHours[component.packageCalendar] = [hours]
    console.log(component.data.packageHours)

    component.setPackageHour()
    expect(component.packageHour).toEqual(component.filteredPeriod(hours)[0].time)
  })
})
