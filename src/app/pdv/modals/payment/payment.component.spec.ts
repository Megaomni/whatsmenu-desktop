import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PaymentComponent } from './payment.component'
import { MatDialogRef } from '@angular/material/dialog'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { ProfileType } from 'src/app/profile-type'
import { profile } from 'src/test/utils/profile'
import Table from 'src/classes/table'
import { of } from 'rxjs'
import { client } from 'src/test/utils/client'

describe('PaymentComponent', () => {
  let component: PaymentComponent
  let fixture: ComponentFixture<PaymentComponent>
  let closeDialogSpy: jasmine.Spy
  let openDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: () => {} },
        },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentComponent)
    component = fixture.componentInstance
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
    component.context.profile = profile as unknown as ProfileType
    component.context.tables = component.context.profile.tables.map((table) => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    component.context.activeCommandId = component.context.tables
      .flatMap((table) => table.opened?.commands)
      .filter((c) => c)
      .find((command) => command.status)?.id
    openDialogSpy = spyOn(component['matDialog'], 'open')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // close
  it('should be possible to close the modal and close table', async () => {
    const closeTableSpy = spyOn(component, 'closeTable')
    component.data.tableType = 'table'
    await component.close()
    expect(closeTableSpy).toHaveBeenCalled()
    expect(closeDialogSpy).toHaveBeenCalledWith({})
  })

  it('should be possible to close the modal and close command', async () => {
    const closeCommandSpy = spyOn(component, 'closeCommand')
    component.data.tableType = 'command'
    await component.close()
    expect(closeDialogSpy).toHaveBeenCalledWith({})
    expect(closeCommandSpy).toHaveBeenCalled()
  })

  it('should be possible to close the modal', async () => {
    component.data.tableType = undefined
    const data: { goBack?: boolean; formsPayment?: CartFormPaymentType[]; finishCartRequest?: boolean } = {}
    await component.close(data)
    expect(closeDialogSpy).toHaveBeenCalledWith({ ...data, finishCartRequest: true, formsPayment: component.formsPayment })
  })

  // openAddress
  it('should be possible to render the client-address modal', () => {
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
      status: null,
    }
    const address = (client as any).addresses[0]
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () =>
        of({
          addressId: address.id,
        }),
    } as MatDialogRef<typeof component>)

    component.openAddress()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.data.cartRequest.addressId).toEqual(address.id)
    expect(component.data.client.addresses).toContain(address)
  })

  // setFormPayment
  it('should be possible to set a new formpayment', () => {
    const oldLength = component.formsPayment.length
    const setValuesSpy = spyOn(component, 'setValues')
    component.setFormPayment()
    expect(component.formsPayment.length).toEqual(oldLength + 1)
    expect(setValuesSpy).toHaveBeenCalled()
  })

  it('should be possible to set a new formpayment and set change propriety if payment is money', () => {
    component.profileFormPayment = 'money'
    const oldLength = component.formsPayment.length
    const setValuesSpy = spyOn(component, 'setValues')
    component.setFormPayment()
    expect(component.formsPayment.length).toEqual(oldLength + 1)
    expect(setValuesSpy).toHaveBeenCalled()
    expect(component.formsPayment[component.formsPayment.length - 1]).toEqual(jasmine.objectContaining({ change: component.change }))
  })

  it('should be possible to set a new formpayment and set flag propriety if formpayment have flags', () => {
    const formPayment = component.context.profile.formsPayment.find((formPayment) => formPayment.flags && formPayment.flags.length)
    component.profileFormPayment = formPayment?.payment
    component.flag = formPayment.flags[0].code
    const oldLength = component.formsPayment.length
    const setValuesSpy = spyOn(component, 'setValues')
    component.setFormPayment()
    expect(component.formsPayment.length).toEqual(oldLength + 1)
    expect(setValuesSpy).toHaveBeenCalled()
    expect(component.formsPayment[component.formsPayment.length - 1].flag.code).toEqual(component.flag)
  })

  it('should be not possible to set a new formpayment if value is less than 0.01', () => {
    const formPayment = component.context.profile.formsPayment.find((formPayment) => formPayment.flags && formPayment.flags.length)
    component.profileFormPayment = formPayment?.payment
    component.flag = formPayment.flags[0].code
    const oldLength = component.formsPayment.length
    const setValuesSpy = spyOn(component, 'setValues')
    component.value = 0
    component.setFormPayment()
    expect(component.formsPayment.length).not.toEqual(oldLength + 1)
    expect(setValuesSpy).not.toHaveBeenCalled()
  })

  // setValues
  it('should be possible to set table values', () => {
    component.data.tableType = 'table'
    component.setValues()
    expect(component.total).toEqual(component.context.getActiveTable().opened?.getTotalValue('lack'))
    expect(component.paidValue).toEqual(
      component.formsPayment.reduce((total, paymentForm) => (total += paymentForm.value), 0) +
        component.context.getActiveTable().opened?.getTotalValue('paid')
    )
    expect(component.lackValue).toEqual(Math.fround(Math.max(0, component.total - component.paidValue)))
    expect(component.value).toEqual(Math.fround(component.lackValue).toFixed(2))
  })

  it('should be possible to set command values', () => {
    component.data.tableType = 'command'
    component.setValues()
    expect(component.total).toEqual(component.context.getActiveCommand().getTotalValue('lack'))
    expect(component.paidValue).toEqual(
      component.formsPayment.reduce((total, paymentForm) => (total += paymentForm.value), 0) +
        component.context.getActiveTable().opened?.getTotalValue('paid')
    )
    expect(component.lackValue).toEqual(Math.fround(Math.max(0, component.total - component.paidValue)))
    expect(component.value).toEqual(Math.fround(component.lackValue).toFixed(2))
  })

  it('should be possible to set cart values', () => {
    component.data.tableType = undefined
    component.setValues()
    expect(component.total).toEqual(
      component.data.cartRequest?.total +
        Number(component.data.cartRequest?.taxDelivery) -
        component.cartService.cupomValue(component.data.cupom, component.data.cartRequest)
    )
    expect(component.paidValue).toEqual(component.formsPayment.reduce((total, paymentForm) => (total += paymentForm.value), 0))
    expect(component.lackValue).toEqual(Math.max(0, component.total - component.paidValue))
    expect(component.value).toEqual(component.lackValue)
  })

  it('should be possible to set cart values', () => {
    component.data.tableType = undefined
    component.data.cartRequest = undefined
    component.setValues()
    expect(component.total).toEqual(0)
  })

  // removePayment
  it('should be possible to remove a formPayment', () => {
    const setValuesSpy = spyOn(component, 'setValues')
    const formPayment = {
      payment: 'money',
      value: 5,
      label: 'Dinheiro',
    }
    component.formsPayment = [formPayment, { ...formPayment, payment: 'pix' }, { ...formPayment, value: 20 }]
    component.removePayment(1)
    expect(setValuesSpy).toHaveBeenCalled()
    expect(component.formsPayment).not.toEqual(jasmine.arrayContaining([{ ...formPayment, payment: 'pix' }]))
  })

  // closeCommand
  it('should be possible to close command in server', async () => {
    const closeCommandSpy = spyOn(component.api, 'closeCommand').and.returnValue({ status: false } as any)
    const closeCommandEffectSpy = spyOn(component.context, 'closeCommandEffect')
    await component.closeCommand()
    expect(closeCommandSpy).toHaveBeenCalledWith(
      component.context.getActiveCommand(),
      component.context.getActiveTable().id,
      component.context.profile.slug,
      component.formsPayment
    )
    expect(closeCommandEffectSpy).toHaveBeenCalledWith(component.context.getActiveCommand())
  })

  // closeTable
  it('should be possible to close command in server', async () => {
    const closeTableSpy = spyOn(component.api, 'closeTable').and.returnValue({ status: false } as any)
    await component.closeTable()
    // expect(closeTableSpy).toHaveBeenCalledWith(component.context.getActiveTable(), component.context.profile.slug, component.formsPayment)
    expect(component.context.getActiveTable().opened).toBeUndefined()
  })
})
