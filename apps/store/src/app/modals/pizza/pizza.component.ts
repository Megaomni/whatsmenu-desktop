import { AfterContentChecked, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { NgbNav } from '@ng-bootstrap/ng-bootstrap'

import { faArrowLeft, faCircleMinus, faCirclePlus, faSearch } from '@fortawesome/free-solid-svg-icons'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { PizzaFlavorType, PizzaProductType } from 'src/app/pizza-product-type'
import { CartItem, CartRequestType } from 'src/app/cart-request-type'
import { AlertComponent } from '../alert/alert.component'
import { ComplementType } from 'src/app/product-type'
import { TranslateService } from 'src/app/translate.service'
import { TableType } from 'src/app/table-type'
declare const fbq: any

export interface PizzaComponentData {
  pizza: PizzaProductType
  sizeName: string
  flavorsCount: number
  valueType: CartRequestType['type']
  cover: string
  editPizza?: CartItem
  table: TableType
}

@Component({
  selector: 'app-pizza',
  templateUrl: './pizza.component.html',
  styleUrls: ['./pizza.component.scss'],
})
export class PizzaComponent implements OnInit, AfterContentChecked {
  pizza: CartItem = {
    type: 'pizza',
    obs: '',
    quantity: 1,
    pizzaId: this.data.pizza.id,
    details: {
      size: this.data.sizeName,
      value: 0,
      complements: [],
      flavors: Array(this.data.flavorsCount).fill(null),
      implementations: [null],
    },
  }

  step: 'flavors' | 'implementations' | 'complements' = 'flavors'
  filter = ''
  tabs = Array(this.data.flavorsCount)
    .fill('')
    .map((_, i) => i + 1)

  @ViewChild('nav') nav: NgbNav
  @ViewChild('implementationNav') implementationNav: NgbNav
  @ViewChild('complementNav') complementNav: NgbNav
  @ViewChild('confirmPizzaButton') confirmPizzaButton: ElementRef<HTMLButtonElement>

  faCirclePlus = faCirclePlus
  faCircleMinus = faCircleMinus
  faSearch = faSearch
  faArrowLeft = faArrowLeft

  constructor(
    public dialogRef: MatDialogRef<any>,
    public translate: TranslateService,
    public api: ApiService,
    public cartService: CartService,
    public contextService: ContextService,
    @Inject(MAT_DIALOG_DATA) public data: PizzaComponentData,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.data.pizza.implementations?.length === 0) {
      this.pizza.details.implementations = [null]
    } else if (this.contextService.profile.options.pizza.hideBorderNone) {
      this.pizza.details.implementations = [this.data.pizza.implementations?.find((i) => i.status)]
    }

    const { multipleComplements } = this.contextService.profile.options.pizza
    if (this.data.editPizza) {
      this.pizza = structuredClone(this.data.editPizza)
      if (multipleComplements) {
        this.pizza.details.flavors.forEach((flavor) => {
          if (multipleComplements) {
            flavor.complements = this.data.pizza.complements.map((complement, complementIndex) => ({
              ...complement,
              itens: [
                ...complement.itens.map((item) => ({
                  ...item,
                  quantity: flavor.complements[complementIndex]?.itens.find((i) => i.code === item.code)?.quantity || 0,
                  complementId: complement.id,
                })),
              ],
            }))
          } else {
            this.pizza.details.complements = this.data.pizza.complements.map((complement, complementIndex) => ({
              ...complement,
              itens: [
                ...complement.itens.map((item) => ({
                  ...item,
                  quantity: this.pizza.details.complements[complementIndex]?.itens.find((i) => i.code === item.code)?.quantity || 0,
                  complementId: complement.id,
                })),
              ],
            }))
          }
        })
      }
    }
    this.data.pizza.flavors.forEach((flavor) => {
      if (this.data.pizza.implementations?.length === 0) {
        flavor.implementations = [null]
      } else {
        flavor.implementations = !this.contextService.profile.options.pizza.hideBorderNone
          ? [null]
          : [this.data.pizza.implementations.find((i) => i.status)]
      }

      if (multipleComplements) {
        flavor.complements = this.data.pizza.complements.map((complement) => ({
          ...complement,
          itens: [...complement.itens.map((item) => ({ ...item, quantity: 0, complementId: complement.id }))],
        }))
      } else {
        this.pizza.details.complements = this.data.pizza.complements.map((complement) => ({
          ...complement,
          itens: [...complement.itens.map((item) => ({ ...item, quantity: 0, complementId: complement.id }))],
        }))
      }
    })
  }

  ngAfterContentChecked(): void {
    this.pizza.details.value =
      this.cartService.pizzaItemTotalValue({ pizza: this.pizza, valueType: this.data.valueType }) +
      this.cartService.totalImplementations(this.pizza) +
      (this.contextService.profile.options.pizza.multipleComplements
        ? this.cartService.flavorsComplementsReduce(this.pizza)
        : this.cartService.pizzaComplementsReduce(this.pizza))
  }

  public filterFlavors() {
    let filtered: PizzaFlavorType[] = this.data.pizza.flavors
    const filter =
      this.filter &&
      this.filter
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    if (filter) {
      filtered = this.data.pizza.flavors.filter((pizza) => {
        if (pizza.description == null) {
          pizza.description = '' // Seta description como string vazia caso seja null
        }

        if (
          pizza.name
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(filter) ||
          pizza.description
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(filter)
        ) {
          return pizza
        }
      })
    }
    return filtered
  }

  public flavorDisplayValue(flavor: PizzaFlavorType) {
    let result = flavor[this.data.valueType !== 'T' ? 'values' : 'valuesTable'][this.data.sizeName]
    if (!this.contextService.profile.options.pizza.higherValue) {
      result /= this.data.flavorsCount
    }
    return result
  }

  public confirmButtonText(): string {
    if (this.confirmPizzaButton) {
      if (this.contextService.profile.options.inventoryControl && !this.data.pizza.bypass_amount && this.data.pizza.amount < this.pizza.quantity) {
        this.confirmPizzaButton.nativeElement.disabled = true
        return this.translate.text().quantity_unavaible
      }
      switch (this.step) {
        case 'flavors':
          if (!this.pizza.details.flavors[this.nav?.activeId - 1]) {
            this.confirmPizzaButton.nativeElement.disabled = true
            return this.translate.text().choose_flavor_comment
          }
          if (this.data.flavorsCount > this.nav?.activeId) {
            this.confirmPizzaButton.nativeElement.disabled = false
            return this.translate.text().next_flavor_comment
          }
        default:
          this.confirmPizzaButton.nativeElement.disabled = false
          return this.translate.text().next
      }
    }
  }

  public messageItemRequired(complements: ComplementType[], messageType: 'soldOut' | 'required' = 'required') {
    let messages = ''
    switch (messageType) {
      case 'required':
        messages = `<h2>${this.translate.text().complete_toppings_comment}:</h2><ul style="list-style: none;">`
        complements.forEach((c) => (messages += `<li><b>${c.name}:</b> mínimo ${c.min} ${c.min === 1 ? 'item' : 'itens'}</li>`))
        break
      case 'soldOut':
        messages = `<h2>${this.translate.text().out_stock_toppings_comment}:</h2><ul style="list-style: none;">`
        complements.forEach(
          (c) =>
            (messages += `<li><b>${c.name}:</b> <ul class="px-2">${c.itens
              .filter((item) => !item.bypass_amount && item.amount < item.quantity)
              .map(
                (item) =>
                  `<li class="d-flex justify-content-between"><span>${item.name}:</span><span>${this.translate.text().in_stock_comment}: ${
                    item.amount
                  }</span> </li>`
              )}</ul> </li>`)
        )
        break
      default:
        break
    }

    messages += '</ul>'
    this.matDialog.open(AlertComponent, {
      data: {
        message: messages,
        noReload: true,
      },
    })
  }

  public previousStep() {
    switch (this.step) {
      case 'implementations':
        this.step = 'flavors'
        break
      case 'complements':
        this.step = this.data.pizza.implementations?.length ? 'implementations' : 'flavors'
        break
      default:
        this.dialogRef.close()
        break
    }
  }

  public nextStep() {
    switch (this.step) {
      case 'flavors':
        if (this.data.flavorsCount > this.nav.activeId) {
          this.nav.select(this.nav.activeId + 1)
          break
        }
        this.step = this.data.pizza.implementations?.length ? 'implementations' : 'complements'
        break
      case 'implementations':
        if (this.data.flavorsCount > this.implementationNav.activeId) {
          this.implementationNav.select(this.implementationNav.activeId + 1)
          break
        }
        this.step = 'complements'
        break
      case 'complements':
        const complements = this.contextService.profile.options.pizza.multipleComplements
          ? this.pizza.details.flavors[this.complementNav?.activeId - 1]?.complements
          : this.pizza.details.complements
        const checkComplements = complements?.map((complement) => this.cartService.complementIsAvailable(complement))
        const messageType = checkComplements.some((item) => item.messageType === 'soldOut') ? 'soldOut' : 'required'
        if (!checkComplements.every((c) => c.available)) {
          this.messageItemRequired(
            complements.filter((c) => c.required),
            messageType
          )
          break
        }
        if (this.data.flavorsCount > this.complementNav.activeId) {
          this.complementNav.select(this.complementNav.activeId + 1)
          break
        }
        this.addPizzaInCart()
        break
      default:
        break
    }
  }

  public addPizzaInCart() {
    if (this.contextService.profile.options.pizza.multipleComplements) {
      this.pizza.details.flavors.forEach((flavor) => {
        flavor.complements = flavor.complements
          .map((c) => {
            c.itens = c.itens.filter((i) => i.quantity)
            return c
          })
          .filter((c) => c.itens.some((i) => i.quantity))
      })
    }
    this.pizza.details.complements = this.pizza.details.complements
      .map((c) => {
        c.itens = c.itens.filter((i) => i.quantity)
        return c
      })
      .filter((c) => c.itens.some((i) => i.quantity))

    if (this.contextService.profile.options.pizza.hideBorderNone && this.contextService.profile.options.pizza.multipleBorders) {
      this.pizza.details.implementations = [null]
    }

    if (this.contextService.profile.options.pizza.multipleBorders) {
      this.pizza.details.flavors.forEach((flavor) => {
        flavor.implementations = flavor.implementations.filter(Boolean)
        console.log('flavor IMPLEMENTATIONS; ', flavor.implementations)
      })
    }
    if (!this.contextService.profile.options.pizza.multipleBorders) {
      this.pizza.details.flavors.forEach((flavor) => {
        flavor.implementations = [null]
      })
    }
    this.pizza.details.implementations = this.pizza.details.implementations.filter(Boolean)

    if (this.contextService.profile.options.tracking && this.contextService.profile.options.tracking.pixel) {
      fbq('track', 'AddToCart', {
        content_name: `Pizza ${this.data.sizeName} ${this.data.flavorsCount} ${
          this.data.flavorsCount === 1 ? this.translate.text().flavor_comment : this.translate.text().flavors_comment
        } (${this.pizza.details.flavors.map((flavor) => flavor.name)})`,
        content_category: this.contextService.profile.categories.find((c) => c.id === this.data.pizza.categoryId).name,
        content_ids: [this.pizza.pizzaId],
        content_type: 'product',
        value: this.pizza.details.value,
        currency: 'BRL',
      })
    }
    this.dialogRef.close({ item: this.pizza })
  }

  testeImplementation(seted, value) {
    console.log({ seted, value })
    return seted === value
  }
}
