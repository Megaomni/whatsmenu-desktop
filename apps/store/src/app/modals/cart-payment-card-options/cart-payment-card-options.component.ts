import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faChevronLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import { CustomerCardTypeWithCodeAndId } from '../cart-payment/cart-payment.component';

type CloseAction = 'update' | 'delete'
export type CartPaymentCardOptionsComponentData = { card: CustomerCardTypeWithCodeAndId }
export type CartPaymentCardOptionsComponentReturn = { action: CloseAction, surname: string, updatedCard: CustomerCardTypeWithCodeAndId }

@Component({
  selector: 'app-cart-payment-card-options',
  templateUrl: './cart-payment-card-options.component.html',
  styleUrls: ['./cart-payment-card-options.component.scss', '../cart-payment/cart-payment.component.scss',]
})
export class CartPaymentCardOptionsComponent implements OnInit {
  surname: CartPaymentCardOptionsComponentReturn['surname']
  editMode: boolean

  // ICONS
  faTrashCan = faTrashCan
  faEdit = faEdit
  faChevronLeft = faChevronLeft

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: CartPaymentCardOptionsComponentData,
    private bottomSheetRef: MatBottomSheetRef<any, CartPaymentCardOptionsComponentReturn>,
  ) {}

  ngOnInit(): void {
    this.surname = this.data.card.surname || ''
    this.editMode = false
  }

  close(action: CloseAction) {
    const updatedCard: CustomerCardTypeWithCodeAndId = {
      ...this.data.card,
      type: this.data.card.type ?? 'credit',
      surname: this.surname,
    }
    this.bottomSheetRef.dismiss({ action, surname: this.surname, updatedCard })
  }
}
