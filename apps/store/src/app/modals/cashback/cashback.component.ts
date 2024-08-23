import { TranslateService } from 'src/app/translate.service';
import { Component, EventEmitter, Input, Output, ElementRef, ViewChild } from '@angular/core'
import { CartFormPaymentType } from 'src/app/formpayment-type'

@Component({
  selector: 'app-cashback',
  templateUrl: './cashback.component.html',
  styleUrls: ['./cashback.component.scss'],
})
export class CashbackComponent {
  constructor(public translate: TranslateService) {}
  @Input() value: number
  @Input() formsPayment: CartFormPaymentType[]
  @Input() cashbackValue: number
  @Output('formsPaymentChange') formsPaymentChange = new EventEmitter()
  toggleCashback(checked: boolean) {
    if (checked) {
      this.formsPayment.push({ payment: 'cashback', value: this.value, label: 'Cashback', status: true })
    } else {
      this.formsPayment.splice(
        this.formsPayment.findIndex((x) => x.payment === 'cashback'),
        1
      )
    }
    this.formsPaymentChange.emit(this.formsPayment)
  }
}
