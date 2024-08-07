import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import { CartPizza } from 'src/app/cart-pizza';
import { CartItem, CartRequestType } from 'src/app/cart-request-type';
import { CartType } from 'src/app/cart-type';
import { RequestType } from 'src/app/request-type';

@Component({
  selector: 'app-cart-repeat',
  templateUrl: './cart-repeat.component.html',
  styleUrls: ['./cart-repeat.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})
export class CartRepeatComponent implements OnInit {
  request: RequestType
  cart: CartType[] = []
  cartPizza: CartPizza[] = []
  itens: CartItem[] = []

  faArrowLeft = faArrowLeft
  constructor(
    @Inject(MatDialogRef) private dialogRef,
    @Inject(MAT_DIALOG_DATA) public data: { cart: any, cartPizza: any, client: any, request: RequestType },
    ) { }

  ngOnInit(): void {
    this.cart = this.data.request?.cart ?? []
    this.cartPizza = this.data.request?.cartPizza ?? []
    this.itens = ([...this.cartPizza, ...this.cart] as unknown) as CartItem[]
  }

  public close(data: { confirm: boolean, cart?: CartType[], cartPizza?: CartPizza[] }): void {
    if (data.confirm) {
      data.cart = this.cart
      data.cartPizza = this.cartPizza
    } else {
      data = { confirm: false }
    }
    this.dialogRef.close(data)
  }

  /** Retorna a diferença do tempo com a data fornecida */
  public requestDate(date: string): string {
    return DateTime.fromSQL(date).toFormat('dd/MM/yyyy')
  }
}
