import { ElectronService } from './../../../electron.service'
import { PrintService } from './../../../services/print/print.service'
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'

import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import {
  faArrowLeft,
  faCashRegister,
  faChevronDown,
  faChevronUp,
  faLock,
  faLockOpen,
  faMinusCircle,
  faPlusCircle,
  faPrint,
} from '@fortawesome/free-solid-svg-icons'
import { DateTime } from 'luxon'
import { TransactionType } from 'src/app/cashier-type'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { ApiService } from 'src/app/services/api/api.service'
import { ContextService } from 'src/app/services/context/context.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import { CashierTransactionsComponent } from '../cashier-transactions/cashier-transactions.component'
import { TranslateService } from 'src/app/translate.service'

interface CashierListType extends TransactionType {
  code?: string
  clientName?: string
  formsPayment?: CartFormPaymentType[]
}

@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss'],
})
export class CashierComponent implements OnInit {
  deviceWidth = window.innerWidth
  initialValue: number
  incomeTotal: number = 0
  outcomeTotal: number = 0

  faArrowLeft = faArrowLeft
  faCashRegister = faCashRegister
  faLockOpen = faLockOpen
  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faPrint = faPrint
  faLock = faLock
  faChevronUp = faChevronUp
  faChevronDown = faChevronDown

  @ViewChild('openCashierSubmitButton') openCashierSubmitButton: ElementRef<HTMLButtonElement>

  constructor(
    @Inject(MatDialogRef) private dialogRef,
    private matDialog: MatDialog,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public translate: TranslateService,
    public printService: PrintService,
    public electronService: ElectronService
  ) {}

  ngOnInit(): void {
    if (!this.context.activeCashier && !this.context.profile.options.pdv.cashierManagement) {
      this.api.openCashier(this.context.profile.slug, this.context.activeBartender.id, 0).then(({ cashier }) => {
        this.context.activeCashier = cashier
      })
    }
    const container = document.getElementById(this.dialogRef.id)
    if (container) {
      container.style.paddingBottom = '0'
    }

    if (this.context.profile.cashiers && this.context.profile.options.pdv.cashierManagement) {
      this.getCashierList()
    }
  }

  public close() {
    this.dialogRef.close()
  }

  /** Gera a lista do resumo de entradas e saidas do caixa */
  public getCashierList(): CashierListType[] {
    let carts: CashierListType[] = [],
      openeds: CashierListType[] = []
    if (this.context.activeCashier) {
      carts =
        this.context
          .getActiveCashierCarts()
          .filter((cart) => cart.type !== 'T' && cart.status !== 'canceled')
          .map((cart) => {
            let obs = ''
            switch (cart.type) {
              case 'D':
                obs = `${this.translate.text().order} ${cart.addressId ? 'Delivery' : this.translate.text().counter}`
                break
              case 'P':
                obs = `${this.translate.text().order} ${this.context.packageLabel}`
                break
              default:
                obs = ''
                break
            }
            return {
              created_at: cart.created_at,
              type: 'income',
              value: cart.total,
              obs,
              code: `WM-${cart.code}-${cart.type}`,
              clientName: cart.client?.name,
              formsPayment: cart.formsPayment,
            }
          }) ?? []

      /* openeds = this.context.activeCashier.openeds?.map(opened => {
        const { created_at, formsPayment } = opened
        return {
          created_at,
          clientName: `Mesa ${this.context.tables.find(table => table.id === opened.tableId)?.name}`,
          type: 'income',
          obs: 'Pedido Mesa',
          value: formsPayment.reduce((total, formPayment) => total += formPayment.value, 0),
          formsPayment
        }
      }) ?? [] */

      const cashierList: CashierListType[] = [
        ...this.context.activeCashier.transactions,
        ...carts,
        ...openeds,
        {
          type: 'income',
          obs: this.translate.text().initial_balance_n,
          value: this.context.activeCashier.initialValue,
          created_at: this.context.activeCashier.created_at,
          finality: '',
        },
      ]
      cashierList.sort((a, b) => {
        if (DateTime.fromSQL(a.created_at) > DateTime.fromSQL(b.created_at)) {
          return -1
        } else {
          return 1
        }
      })
      cashierList.forEach((transaction) => {
        transaction.formatedDate = transaction.formatedDate
          ? transaction.formatedDate
          : DateTime.fromSQL(transaction.created_at).toFormat(`${this.translate.masks().date_mask_two} HH'h'mm`)
        if (transaction.finality) {
          transaction.finalityLabel = transaction.finality === 'deposit' ? this.translate.text().deposit : this.translate.text().payment
        }

        if (transaction.formsPayment) {
          transaction.value = transaction.formsPayment?.reduce((total, formPayment) => {
            if (formPayment.paid || formPayment.paid === undefined) {
              return (total += formPayment.value ?? 0)
            }
          }, 0)
        }
      })

      this.incomeTotal = cashierList.reduce((total, transaction) => (total += transaction.type === 'income' ? transaction.value ?? 0 : 0), 0)
      this.outcomeTotal = cashierList.reduce((total, transaction) => (total += transaction.type === 'outcome' ? transaction.value ?? 0 : 0), 0)
      return cashierList
    }
  }

  public formatDate(date?: string): string {
    return date
      ? DateTime.fromSQL(date).toFormat(`${this.translate.masks().date_mask} : HH'h'mm`)
      : DateTime.local().toFormat(`${this.translate.masks().date_mask} : HH'h'mm`)
  }

  public haveOpenedCashier(): boolean {
    return !!this.context.activeCashier
  }

  public async openCashierAPI(event: any): Promise<void> {
    event.preventDefault()
    this.openCashierSubmitButton.nativeElement.disabled = true
    try {
      const { cashier } = await this.api.openCashier(this.context.profile.slug, this.context.activeBartender?.id, this.initialValue ?? 0)
      this.context.activeCashier = cashier

      this.context.profile.cashiers.push(this.context.activeCashier)
      this.getCashierList()
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      this.openCashierSubmitButton.nativeElement.disabled = false
    }
  }

  public openTransaction(data: { type: 'income' | 'outcome' }): void {
    this.matDialog
      .open(CashierTransactionsComponent, {
        data,
        maxWidth: '100vw',
        height: this.deviceWidth < 600 ? '100vh' : '35vh',
        width: this.deviceWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(({ cashier }) => {
        if (cashier) {
          this.context.activeCashier = { ...this.context.activeCashier, ...cashier }
          this.getCashierList()
        }
      })
  }
}
