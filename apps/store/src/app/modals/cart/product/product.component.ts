import { Component, Inject, OnInit, ViewChild } from '@angular/core'
import { ItemRequiredComponent } from './../../product/item-required/item-required.component'
// import { M4DialogDataEmitter, M4DialogDataInput } from 'ng-metro4';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'

import { CartType } from 'src/app/cart-type'

import { faArrowLeft, faCircleMinus, faCirclePlus, faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons'

import { ComplementItemType, ComplementType, ProductType } from 'src/app/product-type'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ComponentService } from 'src/app/services/components/component.service'
import { ContextService } from 'src/app/services/context/context.service'
import { AlertComponent } from '../../alert/alert.component'
import * as moment from 'moment'
import { TranslateService } from 'src/app/translate.service'

declare const fbq: any

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  cartOriginal: CartType[]
  cart: CartType
  editProduct: boolean
  product: ProductType
  productBackup: ProductType
  storeDelivery: boolean
  storeTable: boolean
  storePackage: boolean
  categoryName: string
  originalValue = 0
  clientData: ProfileType
  dialogDataInput: any
  requiredItens: string[] = []
  obs: string
  category: any
  textButton: string
  packageAccess: boolean
  viewContentAlternate: string // = localStorage.getItem('viewContentAlternate')
  table: any
  disponibility: boolean
  leftArrow = faArrowLeft
  plusCircle = faPlusCircle
  value: number = 1
  valueComplement: number = 1
  minusCircle = faMinusCircle
  outlineCirclePlus = faCirclePlus
  outlineCircleMinus = faCircleMinus
  status: 0 | 1

  // Variaveis de encomendas
  datesAndHours = {}
  @ViewChild('requiredModal') requiredModal: any

  constructor(
    public dialogRef: MatDialogRef<any>,
    public api: ApiService,
    public translate: TranslateService,
    public context: ContextService,
    public component: ComponentService,
    public cartService: CartService,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog
  ) {
    this.messageItemRequired = this.messageItemRequired.bind(this)

    if (this.data.datesAndHours) {
      this.datesAndHours = this.data.datesAndHours
    }
    this.cartOriginal = data.cart
  }

  ngOnInit(): void {
    this.start()
    this.verifyAvailableQuantity()
    this.editProduct = this.data.editProduct
    // tslint:disable-next-line: no-unused-expression
    document.getElementById('totalItem') &&
      document.getElementById('totalItem').addEventListener('change', (e: any) => {
        // tslint:disable-next-line: radix
        if (parseInt(e.target.value) === 0 || isNaN(e.target.value)) {
          this.cart.quantity = 1
        }
      })
    // console.log({cart: this.cart, product: this.product});
  }

  private start() {
    this.viewContentAlternate = this.data.viewContentAlternate
    this.disponibility = this.data.disponibility
    this.clientData = this.data.clientData
    this.packageAccess = this.clientData.options.package.active && this.data.product.disponibility.store.package
    this.product = this.data.product
    this.storeDelivery = this.data.product.disponibility.store.delivery
    this.storeTable = this.data.product.disponibility.store.table
    this.storePackage = this.data.product.disponibility.store.package
    this.categoryName = this.data.catName
    this.initCart(this.data.product)
    this.originalValue = this.cart.value
    this.category = this.data.category
    this.table = this.api.getCookie('table')
  }

  initCart(product: ProductType) {
    product = JSON.parse(JSON.stringify(product))
    this.cart = {
      id: product.id,
      ncm_code: product.ncm_code ? product.ncm_code : null,
      amount: product.amount,
      amount_alert: product.amount_alert,
      bypass_amount: product.bypass_amount,
      name: product.name,
      description: product.description,
      complements: product.complements,
      image: product.image,
      obs: product.obs,
      value: product.value,
      promoteStatus: product.promoteStatus,
      promoteValue: product.promoteValue,
      valueTable: product.valueTable,
      promoteStatusTable: product.promoteStatusTable,
      promoteValueTable: product.promoteValueTable,
      quantity: product.quantity || 1,
      status: product.status,
      disponibility: product.disponibility,
    }
  }

  verifyAvailableQuantity() {
    const menuItems = this.clientData.categories.flatMap((item) => item.products)
    const item = menuItems.find((item) => item?.id === this.product?.id)
    const originalQuantity = this.cartOriginal.find((originalCartItem) => originalCartItem.id === item.id)?.quantity || 0
    if (item && item.bypass_amount) {
      return true
    }

    if (!this.clientData.options.inventoryControl) {
      return true
    }

    if (this.cart.quantity + (this.editProduct ? 0 : originalQuantity) > item.amount) {
      return false
    }
    if (this.data.type === 'default' && this.product.amount === null) {
      this.product.bypass_amount = true
    } else {
      return true
    }
  }

  verifyAvailableComplements(item?: ComplementItemType) {
    if (!this.clientData.options.inventoryControl) {
      return true
    }
    if (item && item.bypass_amount) {
      return true
    }
    if ((item && !('amount' in item)) || (item && item.amount === null)) {
      if (this.data.type === 'default') {
        if (item) {
          item.bypass_amount = true
        }
        return true
      } else {
        return true
      }
    }
    if (item && typeof item?.amount == 'number' && item.quantity > item.amount) {
      return false
    }

    const cartPlusItem = this.cartOriginal.concat(this.cart)
    const menuItems = cartPlusItem
      .flatMap((item) =>
        item.complements.flatMap((complement) => {
          return complement.itens.map((itm) => ({
            ...itm,
            quantity: itm.quantity * item.quantity,
          }))
        })
      )
      .filter((item) => item.quantity)
      .reduce((acc, curr) => {
        const existingItem = acc.find((item) => item.code === curr.code)
        if (existingItem) {
          existingItem.quantity += curr.quantity
        } else {
          acc.push({ ...curr })
        }

        return acc
      }, [])

    if (item) {
      const index = menuItems.findIndex((menuItem) => menuItem.code === item.code)
      if (item.bypass_amount) {
        return true
      }
      if (!menuItems[index]) {
        return item.quantity < item.amount
      }
      if (item.bypass_amount === false) {
        if (!menuItems[index].amount) return false
        if (menuItems[index].quantity + item.quantity >= menuItems[index]?.amount) return false
      } else {
        if (menuItems.some((item) => item.amount !== null && item.quantity > item.amount)) return false
      }
    }
    return true
  }

  changeQuantity(type: string) {
    switch (type) {
      case 'add':
        if (this.verifyAvailableQuantity()) this.cartService.increaseProduct(this.cart)
        break
      case 'subtract':
        this.cartService.decreaseProduct(this.cart)
        break
      default:
        break
    }
  }

  async addProductToCart(product: ProductType, item: CartType[]) {
    const disponibility = await this.checkProductDisponibility()
    if (!disponibility) return
    if (!this.verifyAvailableQuantity()) return
    const allowRegisterProduct = await this.messageItemRequired()
    if (allowRegisterProduct) {
      this.cartService.addProductToCart(product, item)
      if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
        fbq('track', 'AddToCart', {
          content_name: this.product.name,
          content_category: this.categoryName,
          content_ids: [this.product.id],
          content_type: 'product',
          value: this.product.promoteStatus ? this.product.promoteValue : this.product.value,
          currency: 'BRL',
        })
      }
      this.dialogRef.close({ item })
    }
  }

  async saveUpdatedCart() {
    if (!(await this.checkProductDisponibility(true, this.product.code))) return
    this.dialogRef.close({ item: this.cart })
  }

  addComplementToCart(complement: ComplementType, item: any) {
    // console.log(item);
    if (item.quantity < complement.max) {
      item.quantity++

      const c: ComplementType = { ...complement }
      c.itens = []

      const comp = this.cart.complements.find((co) => co.id === complement.id)
      if (!comp) {
        c.itens.push(item)
        this.cart.complements.push(c)
      } else {
        // console.log(comp);
        const it = comp.itens.find((i) => i.code === item.code)
        if (it) {
          it.quantity = item.quantity
        } else {
          comp.itens.push(item)
        }
      }
    }
  }

  rmComplementToCart(complement: ComplementType, item: any) {
    const indexComplement = this.cart.complements.findIndex((c) => c.id === complement.id)
    console.log(this.cart, 'cartComplements')
    const indexItem = this.cart.complements[indexComplement].itens.findIndex((i) => i.code === item.code)

    this.cart.complements[indexComplement].itens[indexItem].quantity--

    if (this.cart.complements[indexComplement].itens[indexItem].quantity === 0) {
      this.cart.complements[indexComplement].itens.splice(indexItem, 1)
    }

    if (this.cart.complements[indexComplement].itens.length === 0) {
      this.cart.complements.splice(indexComplement, 1)
    }
  }

  controlItemAdd(complement: ComplementType) {
    const comple = this.cart.complements.find((c) => c.id === complement.id)
    if (comple) {
      return comple.itens.reduce((a, b) => a + b.quantity, 0)
    }
    return 0
  }

  blockButtonToCart() {
    const complements = this.product.complements.filter((complement) => complement.required === 1)
    const allComplements = complements.map((complement) => complement.id)
    const cartComplements = this.cart.complements.map((complement) => complement.id)
    const tests = allComplements.map((complement) => cartComplements.includes(complement))

    if (tests.includes(false)) {
      return true
    }
    return false
  }

  async getCommand() {
    const command = sessionStorage.getItem('command')
    if (command !== null) {
      const req = await this.api.getCommand(JSON.parse(command).id, this.clientData.slug)
      sessionStorage.setItem('command', JSON.stringify(req))
    }
  }

  async checkProductDisponibility(edit?: boolean, code?: string) {
    try {
      const checkProductDisponibility = await this.api.checkProductDisponibility(
        this.clientData.slug,
        'product',
        this.product.id,
        {
          packageType: this.viewContentAlternate === 'P',
          packageDate: localStorage.getItem(`${this.clientData.slug}_packageDate`)
            ? moment(localStorage.getItem(`${this.clientData.slug}_packageDate`)).toISOString()
            : null,
          amount: this.cart.quantity,
          cart: this.data.cart,
          edit: edit,
          code: code,
        },
        '',
        [],
        [],
        this.cart.complements
      )

      if (!checkProductDisponibility.disponibility) {
        this.matDialog.open(AlertComponent, {
          data: {
            title: checkProductDisponibility.closed ? 'Loja Fechada para delivery' : 'Produto Indisponível',
            message: checkProductDisponibility.message,
            textButton: 'Ok',
          },
        })
        /* this.dialogRef.close() */
        return false
      }
      return true
    } catch (error) {
      console.error(error)
      if (error.status === 401) {
        this.alertProd(error.error.message)
      }
    }
  }

  async messageItemRequired() {
    const complements = this.product.complements.filter((complement) => complement.required === 1)

    if (!complements.length) {
      return true
    }
    // const allComplements = complements.map(complement => complement.id);
    const cartComplements = this.cart.complements.map((complement) => complement.id)
    const tests = complements.filter((c) => !cartComplements.includes(c.id))
    this.requiredItens = tests.map((c) => c.name)

    const testMin = this.cart.complements.filter((c) => c.required && c.min > c.itens.reduce((a, b) => a + b.quantity, 0))

    if (testMin.length > 0) {
      let messages = `<h2 class="text-capitalize">${ this.translate.text().mandatory_items }:</h2><ul style="list-style: none;">`
      testMin.forEach((c) => (messages += `<li class="text-capitalize"><b>${c.name}:</b> ${ this.translate.text().minimum } ${c.min} ${c.min === 1 ? 'item' : 'itens'}</li>`))
      messages += '</ul>'
      const completeAlert = this.matDialog.open(AlertComponent, {
        data: {
          message: messages,
          noReload: true,
        },
      })

      completeAlert.afterClosed().subscribe(() => {
        document.querySelector(`#c-${testMin[0].id}`).scrollIntoView({ behavior: 'smooth' })
      })
      return false
    }

    if (tests.length) {
      const dialog = this.matDialog.open(ItemRequiredComponent, {
        data: { itens: tests.map((c) => c.name) },
      })

      dialog.afterClosed().subscribe(() => {
        document.querySelector(`#c-${tests[0].id}`).scrollIntoView({ behavior: 'smooth' })
      })
      return false
    }
    return true
  }

  async close() {
    await this.checkProductDisponibility(this.editProduct, this.product.code)
    if (this.editProduct) {
      this.dialogRef.close({ item: this.cart })
    } else {
      this.dialogRef.close({ itemUpdate: this.productBackup })
    }
    await this.getCommand()
    const command = JSON.parse(sessionStorage.getItem('command'))

    if (this.data.table) {
      if (!command.status) {
        this.matDialog.open(AlertComponent, {
          minWidth: '100vw',
          data: {
            message: 'A comanda anterior já foi finalizada, você ainda esta no restaurante ou deseja fazer um novo pedido para entrega?',
            textButton: 'Estou na mesa',
            goToAnotherCommand: true,
            secondTextButton: 'Entregar pedido',
            clientData: this.clientData,
            table: true,
          },
        })
      }
    }
  }

  public parse(js: any) {
    if (js) {
      return JSON.parse(js)
    }
  }

  alertProd(message?: string) {
    this.matDialog.open(AlertComponent, {
      data: {
        message: message ? message : `Produto ${this.product.name}, está indisponível no momento.`,
        noReload: true,
      },
    })

    this.dialogRef.close()
  }

  public logger(...itemArr: any[]) {
    console.log(itemArr)
  }
}
