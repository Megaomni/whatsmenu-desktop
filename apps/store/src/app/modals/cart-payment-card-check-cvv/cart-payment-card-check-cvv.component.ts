import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { TranslateService } from 'src/app/translate.service';

export type CartPaymentCardCheckCvvComponentReturn = {
  cvv: string
}
@Component({
  selector: 'app-cart-payment-card-check-cvv',
  templateUrl: './cart-payment-card-check-cvv.component.html',
  styleUrls: ['./cart-payment-card-check-cvv.component.scss', '../cart-payment/cart-payment.component.scss',]
})
export class CartPaymentCardCheckCvvComponent {
  cvv = ''
  constructor(
    private bottomSheetRef: MatBottomSheetRef<any, CartPaymentCardCheckCvvComponentReturn>,
    public translate: TranslateService,
  ) {}

  dismiss() {
    this.bottomSheetRef.dismiss({ cvv: this.cvv })
  }
}
