import { Component, Input, OnInit } from '@angular/core'
import { BartenderType } from 'src/app/bartender-type'
import { CartPizza } from 'src/app/cart-pizza'
import { CartType } from 'src/app/cart-type'
import { animate, state, style, transition, trigger } from '@angular/animations'
import { InfoModalComponent } from '../info-modal/info-modal.component'
import { MatDialog } from '@angular/material/dialog'
import { faCartPlus, faExclamationCircle, faMinusCircle, faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { ContextService } from 'src/app/services/context/context.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { CartItem } from 'src/app/cart-request-type'

@Component({
  selector: 'bartender-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['../bartender.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MenuComponent implements OnInit {
  expandedProduct: any
  expandedPizza: any
  displayedProductsColumns: string[] = ['Produto', 'Valor', 'Ação']
  displayedPizzasColumns: string[] = ['Sabor', 'Ação']
  productsColumnsWithExpand = ['expand', ...this.displayedProductsColumns]
  pizzasColumnsWithExpand = ['expand', ...this.displayedPizzasColumns]

  // ICONES
  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faTimesCircle = faTimesCircle
  faExclamationCircle = faExclamationCircle
  faCartPlus = faCartPlus
  constructor(private matDialog: MatDialog, public context: ContextService, public cartService: CartService) {}

  @Input() search?: string
  @Input() type: 'default' | 'pizza'
  @Input() profile: any
  @Input() cart: CartType[]
  @Input() cartPizza: CartPizza[]
  @Input() bartender: BartenderType
  @Input() dataSource: any
  @Input() valueType: 'D' | 'T' | 'P'
  @Input() closeTable: () => void
  @Input() tableMaxHeight: string

  ngOnInit(): void {}

  public trackBy(index: number, item: any): number {
    return item.id
  }

  public openInfoModal(item: CartItem) {
    const previousPopState = window.onpopstate
    const infoModal = this.matDialog.open(InfoModalComponent, {
      data: {
        type: this.type,
        valueType: this.valueType,
        item: JSON.parse(JSON.stringify(item)),
        cartOriginal: this.cart,
        cartOriginalPizza: this.cartPizza,
      },

      maxWidth: '100vw',
      height: window.innerWidth <= 600 ? '100vh' : '80vh',
      width: window.innerWidth <= 600 ? '100vw' : window.innerWidth >= 790 ? '39.5rem' : '80vw',

      autoFocus: false,
    })
    infoModal.afterClosed().subscribe((data) => {
      if (data) {
        if (this.type === 'default') {
          this.cartService.addProductToCart(data.item, this.cart)
        } else {
          this.cartService.addPizzaToCart(data.item, this.cartPizza)
        }
      }
      window.onpopstate = previousPopState
    })
  }

  public logger(value: any) {
    console.log(value)
  }
}
