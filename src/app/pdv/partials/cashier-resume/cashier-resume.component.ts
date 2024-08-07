import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core'
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { CashierType } from 'src/app/cashier-type'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { ContextService } from 'src/app/services/context/context.service'
import { CashierCloseComponent } from '../../modals/cashier-close/cashier-close.component'

@Component({
  selector: 'app-cashier-resume',
  templateUrl: './cashier-resume.component.html',
  styleUrls: ['./cashier-resume.component.scss', '../../pdv.component.scss'],
})
export class CashierResumeComponent implements OnInit {
  @Input() cashier: CashierType
  @Output() cashierChange = new EventEmitter<CashierType>()
  @Input() cashierList: any[]
  outcomeTotal: number
  moneyTotal: number

  faLock = faLock
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private matDialog: MatDialog, public context: ContextService) {}

  ngOnInit(): void {}

  public openClose(): void {
    this.matDialog
      .open(CashierCloseComponent, {
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '75vh',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ cashier }) => {
          if (cashier) {
            this.cashierChange.emit(cashier)
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public outcomesSummary(): {
    payment: string
    label: string
    value: number
  }[] {
    let outcomesSummary = []
    if (this.cashierList) {
      outcomesSummary = this.cashierList.reduce((outcomes, transaction) => {
        this.outcomeTotal = this.cashierList.reduce((total, transaction) => (total += transaction.type === 'outcome' ? transaction.value ?? 0 : 0), 0)
        if (transaction.type === 'outcome') {
          const haveTransaction = outcomes.find((t) => t.finality === transaction.finality)
          if (haveTransaction) {
            haveTransaction.value += transaction.value
          } else {
            outcomes.push({ ...transaction })
          }
        }
        return outcomes
      }, [])
    }
    return outcomesSummary
  }

  public  incomesSummary(): {
    payment: string
    label: string
    value: number
  }[] {
    let incomes: { payment: string; label: string; value: number, paid?: boolean }[]
    incomes = this.context.profile?.formsPayment.map((formPayment) => ({ payment: formPayment.payment, label: formPayment.label, value: 0 }))
    if (incomes) {
      const moneyIncome = incomes.find((i) => i.payment === 'money')
      if (moneyIncome) {
        moneyIncome.value += this.cashier.initialValue
      }
      const moneyType = incomes.find((income) => income.payment === 'money')

      this.cashier.transactions.forEach((transaction) => {
        if (moneyType && transaction.type === 'income') {
          moneyType.value
        }
      })

      this.moneyTotal = this.cashierList.reduce((total, transaction) => {
        if (transaction.formsPayment) {
          total += transaction.formsPayment.reduce((fTotal, formPayment) => (fTotal += formPayment.payment === 'money' ? formPayment.value : 0), 0)
        } else {
          total += moneyType ? transaction.value ?? 0 : 0
        }
        return total
      }, 0)
      this.cashierList
        .flatMap((transaction) => transaction.formsPayment)
        .filter((item) => item)
        .forEach((formPayment: CartFormPaymentType) => {
          const income = incomes.find((i) => i.payment === formPayment.payment && (Object().hasOwnProperty.call(formPayment, 'paid') ? formPayment.paid : true))
          if (income) {
            income.value += formPayment.value
          }
        })
    }
    return incomes
  }

  public total(): number {
    let total = 0
    if (this.cashierList) {
      total = this.cashierList.reduce((total, transaction) => (total += transaction.paid || transaction.paid === undefined ? transaction.value ?? 0 : 0), 0)
    }
    return total
  }
}
