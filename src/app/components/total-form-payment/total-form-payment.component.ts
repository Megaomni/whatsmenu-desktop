import { Component, Input, OnInit } from '@angular/core'
import { faArrowLeft, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { CartRequestType } from 'src/app/cart-request-type'
import { CartService } from 'src/app/services/cart/cart.service'

@Component({
  selector: 'app-total-form-payment',
  templateUrl: './total-form-payment.component.html',
  styleUrls: ['./total-form-payment.component.scss'],
})
export class TotalFormPaymentComponent implements OnInit {
  arrowLeft = faArrowLeft
  chevronDown = faChevronDown
  chevronUp = faChevronUp

  totalModal: boolean = false

  constructor(public cartService: CartService) {}
  @Input() cartRequest: CartRequestType

  ngOnInit(): void {}

  calcCupom() {
    let value = 0
    if (this.cartRequest.cupom.type === 'percent') {
      value = (this.cartRequest.cupom.value / 100) * this.cartRequest.total
    }
    if (this.cartRequest.cupom.type === 'value') {
      value = this.cartRequest.cupom.value
    }
    return value
  }

  addonValue() {
    if (
      this.cartRequest &&
      this.cartRequest.formsPayment &&
      this.cartRequest.formsPayment[0] &&
      this.cartRequest.formsPayment[0]['addon'] &&
      this.cartRequest.formsPayment[0]['addon']['valueType'] === 'fixed'
    ) {
      return this.cartRequest.formsPayment[0]['addon']['value']
    } else {
      return (this.cartRequest.formsPayment[0]['addon']['value'] / 100) * this.cartRequest.total
    }
  }

  addonType() {
    if (
      this.cartRequest &&
      this.cartRequest.formsPayment &&
      this.cartRequest.formsPayment[0] &&
      this.cartRequest.formsPayment[0]['addon'] &&
      this.cartRequest.formsPayment[0]['addon']['type'] === 'fee'
    ) {
      return '+'
    } else {
      return '-'
    }
  }

  addonStatus() {
    if (
      this.cartRequest &&
      this.cartRequest.formsPayment &&
      this.cartRequest.formsPayment[0] &&
      this.cartRequest.formsPayment[0]['addon'] &&
      this.cartRequest.formsPayment[0]['addon']['status'] === true
    ) {
      return true
    }
  }

  public addonCalcResult() {
    let result = 0
    if (this.cartRequest.formsPayment[0]?.addon?.status) {
      result =
        this.cartRequest.formsPayment[0]['addon']['valueType'] === 'percentage'
          ? this.cartRequest.total * (this.cartRequest.formsPayment[0]['addon']['value'] / 100)
          : this.cartRequest.formsPayment[0]['addon']['value']
      if (this.cartRequest.formsPayment[0]['addon']['type'] === 'discount') {
        result = result * -1
      }
      return result
    }
  }

  public isSafari() {
    return false
  }

  convertToNumber(text: string | number) {
    const numberfy = Number(text)
    if (!text || !numberfy) {
      return 0
    }

    return numberfy.toFixed(2)
  }

  firstFormPayment() {
    if (this.cartRequest.formsPayment.length) {
      return this.cartRequest.formsPayment.filter(formPayment => formPayment.payment !== 'cashback')[0]
    }
  }

  cashback() {
    return this.cartRequest.formsPayment.find(formPayment => formPayment.payment === 'cashback')
  }
}
