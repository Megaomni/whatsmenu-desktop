import { ComponentFixture, TestBed } from '@angular/core/testing'

import { CashierTransactionsComponent } from './cashier-transactions.component'
import { MatDialogRef } from '@angular/material/dialog'
import { ProfileType } from 'src/app/profile-type'
import { profile } from 'src/test/utils/profile'

describe('CashierTransactionsComponent', () => {
  let component: CashierTransactionsComponent
  let fixture: ComponentFixture<CashierTransactionsComponent>
  let closeDialogSpy: jasmine.Spy

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CashierTransactionsComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: () => {} },
        },
      ],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierTransactionsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    component.context.profile = profile as unknown as ProfileType
    component.context.activeBartender = component.context.profile.bartenders.find((bartender) => bartender.controls.type !== 'default')
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

  // addTransaction
  it('should be possible to add a transaction', async () => {
    const cashier = component.context.profile.cashiers.find((cashier) => cashier.bartenderId === component.context.activeBartender.id)
    cashier.transactions.push({
      value: 20,
      type: 'income',
      obs: 'Teste',
      created_at: '',
    })
    const addTransactionSpy = spyOn(component.api, 'addTransaction').and.returnValue({ cashier } as any)
    await component.addTransaction({ preventDefault: () => {} })
    expect(addTransactionSpy).toHaveBeenCalledWith({
      bartenderId: component.context.activeBartender.id,
      slug: component.context.profile.slug,
      finality: component.finality,
      obs: component.obs,
      value: component.value,
      type: component.data.type,
      cashierId: cashier.id,
    })
    expect(closeDialogSpy).toHaveBeenCalledWith({ cashier: cashier })
  })
})
