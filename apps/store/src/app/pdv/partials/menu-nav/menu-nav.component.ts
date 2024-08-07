import { AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import { faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { BartenderType } from 'src/app/bartender-type';
import { CartPizza } from 'src/app/cart-pizza';
import { CartType } from 'src/app/cart-type';
import { CartService } from 'src/app/services/cart/cart.service';
import { ContextService } from 'src/app/services/context/context.service';

@Component({
  selector: 'app-menu-nav',
  templateUrl: './menu-nav.component.html',
  styleUrls: ['./menu-nav.component.scss', '../../pdv.component.scss']
})
export class MenuNavComponent implements OnInit, AfterViewChecked {
  activeCategory: string
  filter: 'default' | 'pizza' = 'default'
  search = ''
  faSearch = faSearch
  faChevronDown = faChevronDown

  constructor(
    public context: ContextService,
    public cartService: CartService,
  ) { }
  @Input() bartender: BartenderType
  @Input() cart: CartType[]
  @Input() cartPizza: CartPizza[]
  @Input() allProducts: any[]
  @Input() allPizzas: any[]
  @Input() valueType: 'D' | 'T' | 'P'
  @Input() tableMaxHeight: string;

  ngOnInit(): void {
    if (this.context.profile) {
      this.bartender = this.context.profile.bartenders[0]
      this.context.profile.categories.forEach(c => {
        if (c.type === 'default') {
          // c.products = [...c.products, ...c.products, ...c.products, ...c.products, ...c.products, ...c.products, ...c.products, ...c.products, ...c.products, ...c.products,]
        }
      })
    }
  }

  ngAfterViewChecked(): void {
    this.cartService.valueType = this.valueType
  }

  public scrollToCategory(event: NgbNavChangeEvent): void {
    const tab = document.getElementById(event.nextId)
    if (tab) {
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  }

  public trackBy(index: number, item: any): number {
    return item.id;
  }

}
