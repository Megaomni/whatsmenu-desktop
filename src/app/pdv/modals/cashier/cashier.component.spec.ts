import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CashierComponent } from './cashier.component'
import { MatDialogRef } from '@angular/material/dialog'
import { ProfileType } from 'src/app/profile-type'
import { profile } from 'src/test/utils/profile'
import { of } from 'rxjs'
import Table from 'src/classes/table'

describe('CashierComponent', () => {
  let component: CashierComponent
  let fixture: ComponentFixture<CashierComponent>
  let openDialogSpy: jasmine.Spy
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CashierComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: () => {} },
        },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierComponent)
    component = fixture.componentInstance
    component.context.profile = profile as unknown as ProfileType
    component.context.tables = component.context.profile.tables.map((table) => new Table(table))
    component.context.activeBartender = component.context.profile.bartenders.find((bartender) => bartender.controls.type !== 'default')
    component.context.activeCashier = component.context.profile.cashiers.find(
      (cashier) => cashier.bartenderId === component.context.activeBartender.id
    )
    component.context.profile.cashiers = [
      {
        id: 1,
        bartenderId: component.context.activeBartender.id,
        carts: [
          {
            addon: null,
            addressId: null,
            bartenderId: null,
            cashierId: 1,
            clientId: null,
            commandId: null,
            cupomId: null,
            formsPayment: [],
            obs: '',
            packageDate: null,
            taxDelivery: 0,
            total: 50,
            type: 'D',
            client: { name: 'Teste' },
            code: '1',
          },
        ],
        closed_at: null,
        closedValues_system: null,
        closedValues_user: null,
        initialValue: 200,
        openeds: [
          {
            tableId: component.context.profile.tables[0].id,
            commands: [],
            fees: [],
            formsPayment: [],
            id: 1,
            status: true,
          },
        ],
        profileId: component.context.profile.id,
        transactions: [
          {
            value: 20,
            type: 'income',
            obs: 'teste',
            created_at: '',
          },
          {
            value: 10,
            type: 'outcome',
            obs: 'teste',
            created_at: '',
          },
        ],
      },
    ]
    fixture.detectChanges()
    openDialogSpy = spyOn(component['matDialog'], 'open')
    closeDialogSpy = spyOn(component['dialogRef'], 'close')
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // close
  it('should be possible to close the modal', () => {
    component.close()
    expect(closeDialogSpy).toHaveBeenCalled()
  })

  // getCashierList
  it('should be possible to generate transaction summary list', () => {
    component.getCashierList()
    const incomeTotal = component
      .getCashierList()
      .filter((item) => item.type === 'income')
      .reduce((total, item) => (total += item.value), 0)
    const outcomeTotal = component
      .getCashierList()
      .filter((item) => item.type === 'outcome')
      .reduce((total, item) => (total += item.value), 0)
    expect(component.getCashierList()).toHaveSize(
      component.context.activeCashier.transactions.length +
        component.context.activeCashier.carts.length +
        component.context.activeCashier.openeds.length +
        1
    )
    expect(component.incomeTotal).toEqual(incomeTotal)
    expect(component.outcomeTotal).toEqual(outcomeTotal)
  })

  // haveOpenedCashier
  it('must return true if there is an open cashier for the logged in user', () => {
    component.context.profile.cashiers = [
      {
        id: 1,
        bartenderId: component.context.activeBartender.id,
        profileId: component.context.profile.id,
        carts: [],
        closed_at: null,
        closedValues_system: null,
        closedValues_user: null,
        initialValue: 200,
        openeds: [],
        transactions: [],
      },
    ]
    expect(component.haveOpenedCashier()).toBe(true)
  })

  it("should be no open cashiers if you don't have a user logged in", () => {
    component.context.activeBartender = undefined
    expect(component.haveOpenedCashier()).toBe(false)
  })

  // openCashierAPI
  it('should be possible open a cashier', () => {
    const openCashiertSpy = spyOn(component.api, 'openCashier').and.returnValue({} as any)
    const getCashierListSpy = spyOn(component, 'getCashierList')
    component.openCashierAPI({ preventDefault: () => {} })
    expect(openCashiertSpy).toHaveBeenCalledWith(component.context.profile.slug, component.context.activeBartender.id, component.initialValue ?? 0)
    expect(getCashierListSpy).not.toHaveBeenCalled()
  })

  // openTransaction
  it('should be possible to render the cashier-transactions modal and update cashierList', () => {
    const data: { type: 'income' | 'outcome' } = { type: 'income' }
    const getCashierListSpy = spyOn(component, 'getCashierList')
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () =>
        of({
          cashier: component.context.activeCashier,
        }),
    })
    component.openTransaction(data)
    expect(openDialogSpy).toHaveBeenCalled()
    expect(getCashierListSpy).toHaveBeenCalled()
  })

  it('should be possible to render the cashier-transactions modal and not update cashierList when not returns cashier', () => {
    const data: { type: 'income' | 'outcome' } = { type: 'income' }
    const getCashierListSpy = spyOn(component, 'getCashierList')
    openDialogSpy = openDialogSpy.and.returnValue({
      afterClosed: () => of({}),
    })
    component.openTransaction(data)
    expect(openDialogSpy).toHaveBeenCalled()
    expect(getCashierListSpy).not.toHaveBeenCalled()
  })
})
