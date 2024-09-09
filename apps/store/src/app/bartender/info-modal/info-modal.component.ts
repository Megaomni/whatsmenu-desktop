import { AfterViewChecked, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_SCROLL_STRATEGY } from '@angular/material/dialog'
import { faArrowLeft, faKeyboard, faMinusCircle, faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { CartType } from 'src/app/cart-type'
import { MatKeyboardComponent, MatKeyboardRef, MatKeyboardService } from 'angular-onscreen-material-keyboard'
import { NgControl, NgModel } from '@angular/forms'
import { animate, style, transition, trigger } from '@angular/animations'
import { ItemRequiredComponent } from 'src/app/modals/product/item-required/item-required.component'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { PizzaProductType } from 'src/app/pizza-product-type'
import { PizzaFlavorComplementsComponent } from 'src/app/pdv/modals/pizza-flavor-complements/pizza-flavor-complements.component'
import { ComplementType } from 'src/app/product-type'
import { AlertComponent } from 'src/app/modals/alert/alert.component'
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap'
import { TranslateService } from 'src/app/translate.service'

export interface InfoDataProps {
  type: 'default' | 'pizza'
  item: CartType | CartFlavorPizzaType | any
  valueType: 'D' | 'T' | 'P'
  cartOriginal: CartType[]
  cartOriginalPizza: CartPizza[]
}

@Component({
  selector: 'app-info-modal',
  templateUrl: './info-modal.component.html',
  styleUrls: ['./info-modal.component.scss', '../../pdv/pdv.component.scss', '../../../styles/modals.scss'],
  animations: [trigger('startPreview', [transition(':enter', [style({ opacity: 0 }), animate('0.8s', style({ opacity: 1 }))])])],
})
export class InfoModalComponent implements OnInit, AfterViewChecked {
  product: CartType & { originalComplements: ComplementType[] }
  pizza: CartFlavorPizzaType & { originalComplements: ComplementType[] }
  pizzaProduct: PizzaProductType
  keyBoardIsEnable = !!navigator.maxTouchPoints && window.innerWidth > 768
  deviceWidth = window.innerWidth
  previewMode = false
  itemName: string
  itemImage: string
  flavorTabActive = 0
  obs = ''
  cart = []
  cartPizza = []

  // ICONES
  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faTimesCircle = faTimesCircle
  faArrowLeft = faArrowLeft
  faKeyboard = faKeyboard

  // KEYBOARD
  private _keyboardRef: MatKeyboardRef<MatKeyboardComponent>

  @ViewChild('obsInput', { read: ElementRef }) obsInputElement: ElementRef<HTMLInputElement>
  @ViewChild('obsInput', { read: NgModel }) obsInputControl: NgControl
  @ViewChild('flavorsDropdown') flavorsDropdown: NgbDropdown

  constructor(
    @Inject(MAT_DIALOG_SCROLL_STRATEGY) public scrollStrategy,
    @Inject(MAT_DIALOG_DATA) public data: InfoDataProps,
    @Inject(MatDialogRef) private dialogRef,
    private keyboardService: MatKeyboardService,
    private matDialog: MatDialog,
    public cartService: CartService,
    public context: ContextService,
    public translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.cart = this.data.cartOriginal
    this.cartPizza = this.data.cartOriginalPizza
    if (this.data.type === 'default') {
      this.product = { ...this.data.item, originalComplements: structuredClone(this.data.item.complements) }
      this.itemName = this.product.name
      this.itemImage = this.product.image
    } else {
      this.pizza = { ...this.data.item, originalComplements: structuredClone(this.data.item.complements) }
      this.pizza.flavors = this.pizza.flavors.map((flavor) => ({ ...flavor, complements: [], implementations: [] }))
      this.itemName = this.pizza.flavors[0].name
      this.itemImage = this.pizza.flavors[0].image
      this.pizzaProduct = this.context.profile.categories
        .filter((category) => category.type === 'pizza')
        .flatMap((category) => category.product)
        .find((p) => p.id === this.pizza.id)
      this.pizza.amount = this.pizzaProduct.amount
      this.pizza.amount_alert = this.pizzaProduct.amount_alert
      this.pizza.bypass_amount = this.pizzaProduct.bypass_amount
      this.pizzaProduct.flavors = this.pizzaProduct.flavors.map((flavor) => ({ ...flavor, complements: [], implementations: [] }))
      this.pizzaProduct.complements.forEach((complement) => {
        complement.itens.forEach((item) => {
          item.quantity = 0
        })
      })
    }
  }

  ngAfterViewChecked(): void {
    if (this.data.type === 'default') {
      this.product.obs = this.obsInputElement.nativeElement.value
    } else {
      this.pizza.obs = this.obsInputElement.nativeElement.value
    }
  }

  // UTILS

  public copyObj(obj: any) {
    const copy = JSON.parse(JSON.stringify(obj))
    return copy
  }

  public trackBy(index: number, item: any): number {
    return item.id
  }

  public scrollToElement(id: string) {
    const element = document.getElementById(id) as HTMLLIElement
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // MODAL ACTIONS

  public clear() {
    this.data.item.quantity = 1
    this.data.item.obs = ''
    if (this.data.type === 'default') {
      this.data.item.complements.forEach((complement) => {
        complement.itens.forEach((item) => {
          item.quantity = 0
        })
      })
    } else {
      this.data.item.quantity = 1
      this.data.item.obs = ''
      this.data.item.flavors = [this.data.item.flavors[0]]
    }
    this.dialogRef.close()
  }

  public async close() {
    const checkProductDisponibility = await this.cartService.checkProductDisponibility(
      this.data.type === 'default' ? this.product : this.pizza,
      this.data.type === 'default' ? this.cart : this.cartPizza,
      'D'
    )
    if (this.data.type === 'default' && this.product.amount === null) {
      this.product.bypass_amount = true
    }
    if (this.data.type === 'pizza' && this.pizza.amount === null) {
      this.pizza.bypass_amount = true
    }

    if (!checkProductDisponibility.disponibility) {
      const message = `<h2 style="text-align: center;">Produto Indisponível</h2>${checkProductDisponibility.message ?? this.product.name}`
      this.matDialog.open(AlertComponent, {
        data: {
          message,
        },
      })

      return false
    }
    this.cartService.savePDVCart({
      cart: this.cart,
      cartPizza: this.cartPizza,
    })
    this.dialogRef.close({ item: this.data.type === 'default' ? this.product : this.pizza })
  }

  public pizzaFlavorComplements() {
    return this.context.profile.options.pizza.multipleComplements
      ? this.pizza.flavors.flatMap((flavor) => this.menuComplements(flavor.complements))
      : this.pizza.complements
  }

  /**
   * Retorna um array que combina os complementos do produto e seus complementos originais.
   *
   * @return {Array<ComplementType>} Um array contendo todos os complementos do produto e seus complementos originais.
   */
  public productAllComplements(): Array<ComplementType> {
    const complements = this.product.originalComplements.map((complement) => {
      complement.itens = complement.itens.map((item) => {
        const updatedItem = this.product.complements.flatMap((c) => c.itens).find((i) => i.code === item.code)
        if (updatedItem) {
          item = updatedItem
        }
        return item
      })
      return complement
    })
    return complements
  }

  public async messageItemRequired(complements: ComplementType[]) {
    complements = complements.filter((complement) => {
      if (complement.required === 1) {
        return !complement.itens.some((item) => item.quantity >= (complement.min === 0 ? 1 : complement.min))
      }
      return false
    })

    const dialog = this.matDialog.open(ItemRequiredComponent, {
      data: {
        itens: complements.map((complement) => complement.name),
        bartenderStyle: true,
      },
    })

    dialog.afterClosed().subscribe(() => {
      document.getElementById(complements[0].id.toString()).scrollIntoView({ behavior: 'smooth' })
    })
    // this.requiredModal.open();
    return false
  }

  public toggleKeyboard() {
    this.keyBoardIsEnable = !this.keyBoardIsEnable
    if (this.keyBoardIsEnable) {
      setTimeout(() => {
        this.obsInputElement.nativeElement.focus()
      }, 10)
    }
  }

  public openKeyboard() {
    if (this.keyBoardIsEnable && this.obsInputControl) {
      this._keyboardRef = this.keyboardService.open(navigator.language)
      this._keyboardRef.instance.setInputInstance(this.obsInputElement)
      this._keyboardRef.instance.attachControl(this.obsInputControl.control)
      setTimeout(() => {
        this.obsInputElement.nativeElement.focus()
      }, 10)
    }
  }

  public closeKeyboard() {
    this._keyboardRef?.dismiss()
  }

  public clearInput() {
    this.obsInputControl.control.setValue('')
  }

  public menuComplements(complements?: ComplementType[]) {
    const menuComplements = this.pizzaProduct.complements.map((complement) => ({
      ...complement,
      itens: [...complement.itens.map((item) => ({ ...item, quantity: 0 }))],
    }))
    if (complements) {
      return this.cartService.editComplements(complements, menuComplements)
    }
    return menuComplements
  }

  public openFlavorComponents(flavor: any) {
    this.matDialog
      .open(PizzaFlavorComplementsComponent, {
        data: {
          flavor,
          complements: this.pizzaProduct.complements,
        },
        width: window.innerWidth <= 768 ? '100vw' : '50vw',
        height: window.innerWidth <= 768 ? '100vh' : 'auto',
      })
      .afterClosed()
      .subscribe(
        (result) => {
          if (result?.complements) {
            flavor.complements = result.complements.filter((complement) => {
              if (complement.itens.some((item) => item.quantity)) {
                complement.itens = complement.itens.filter((i) => i.quantity)
                return true
              } else {
                return false
              }
            })
          }
        },
        (error) => {
          console.error(error)
          throw error
        }
      )
  }

  public addNewFlavor() {
    this.pizza.flavors.push({
      ...this.pizzaProduct.flavors[0],
      implementations: [],
      complements: [],
    })
    this.flavorTabActive++
  }

  public removeFlavor(index: number) {
    this.cartService.removeFlavor(this.pizza, index)
    this.flavorTabActive--
  }

  public logger(value: any, stringify = false) {
    console.log(stringify ? JSON.stringify(value) : value)
  }
}
