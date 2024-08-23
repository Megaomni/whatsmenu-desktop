import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { faArrowLeft, faKeyboard, faMinusCircle, faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { CartPizza } from 'src/app/cart-pizza'
import { CartItem } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { ComplementItemType, ComplementType } from 'src/app/product-type'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'pdv-complements',
  templateUrl: './complements.component.html',
  styleUrls: [
    './complements.component.scss',
    '../../bartender/info-modal/info-modal.component.scss',
    '../../pdv/pdv.component.scss',
    '../../../styles/modals.scss',
  ],
})
export class ComplementsComponent implements OnInit {
  @Input() complements: ComplementType[]
  @Input() originalComplements: ComplementType[]
  @Input() cart?: CartType[]
  @Input() cartPizza?: CartPizza[]
  @Output() complementsChange = new EventEmitter<ComplementType[]>()
  displayComplements: ComplementType[]
  cartType: 'cart' | 'cartPizza'

  // ICONES
  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faTimesCircle = faTimesCircle
  faArrowLeft = faArrowLeft
  faKeyboard = faKeyboard

  constructor(public cartService: CartService, public translate: TranslateService, public context: ContextService) {}

  ngOnInit(): void {
    this.displayComplements = structuredClone(this.originalComplements)
  }

  public scrollToElement(id: string) {
    const element = document.getElementById(id) as HTMLLIElement
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  public increase(item: ComplementItemType) {
    this.cartService.increaseItem(item)
    this.emitChanges()
  }

  public decrease(item: ComplementItemType) {
    this.cartService.decreaseItem(item)
    this.emitChanges()
  }

  public emitChanges() {
    let result: ComplementType[] = structuredClone(this.displayComplements)
    result = result.filter((complement) => {
      if (complement.itens.some((item) => item.quantity)) {
        complement.itens = complement.itens.filter((i) => i.quantity)
        return true
      } else {
        return false
      }
    })
    if (!result.length) {
      result = this.displayComplements
    }
    this.complementsChange.emit(result)
  }

  public trackBy(index: number, item: any): number {
    return item.id
  }
}
