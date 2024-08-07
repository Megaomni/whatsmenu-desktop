import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { faMinusCircle, faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { CartPizza } from 'src/app/cart-pizza'
import { CartItem } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'

@Component({
  selector: 'app-cart-itens',
  templateUrl: './cart-itens.component.html',
  styleUrls: ['./cart-itens.component.scss'],
})
export class CartItensComponent implements OnInit {
  @Input() itens: CartItem[] = []
  @Input() cart: CartType[] = []
  @Output() cartChange = new EventEmitter<CartType[]>()
  @Input() cartPizza: CartPizza[] = []
  @Output() cartPizzaChange = new EventEmitter<CartPizza[]>()
  @Input() valueType: 'D' | 'T' | 'P'
  @Input() repeatCart: boolean

  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faTimesCircle = faTimesCircle

  constructor(public context: ContextService, public cartService: CartService) {}

  ngOnInit(): void {
    if (this.repeatCart) {
      const { cart, cartPizza } = this.cartService.itemCart({ itens: this.itens })
      this.cart = cart
      this.cartChange.emit(this.cart)
      this.cartPizza = cartPizza
      this.cartPizzaChange.emit(this.cartPizza)
    }
    // console.log(this.cart)
  }

  public trackBy(index: number, item: any): number {
    return item.id
  }
}
