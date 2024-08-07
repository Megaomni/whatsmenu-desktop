import { CommandType } from 'src/app/command-type'
import { TableComponent } from './../../table/table.component'
import { Component, OnInit, Inject } from '@angular/core'
import { formatCurrency } from '@angular/common'
import { ClientType } from 'src/app/client-type'
import { CartType } from 'src/app/cart-type'
import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { TableType } from './../../table-type'
import { DeliveryType } from 'src/app/delivery-type'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { ApiService } from 'src/app/services/api/api.service'
import { AlertComponent } from '../alert/alert.component'
import { CupomType } from 'src/app/cupom'
import { DateTime } from 'luxon'
import { ToastService } from 'ng-metro4'
import * as moment from 'moment'
import { faArrowLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { ProductOptionsComponent } from '../product-options/product-options.component'
import { CartRequestType } from 'src/app/cart-request-type'
import { CartService } from 'src/app/services/cart/cart.service'
import { ComplementItemType } from 'src/app/product-type'
import { ContextService } from 'src/app/services/context/context.service'
import { AddressType } from 'src/app/address-type'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  clientData: ClientType
  cartRequest: CartRequestType
  deliverySchedule: boolean
  localSchedule: boolean
  packageActive: boolean
  cart: CartType[] = []
  cartPizza: CartPizza[] = []
  cupom: CupomType
  cupomCode: string
  cupomIsValid = false
  enableSend = true

  taxDeliveryValue = 0
  timeDelivery: string
  viewContentAlternate: string = localStorage.getItem('viewContentAlternate') || 'delivery'
  packageDelivery: boolean
  packageLocal: boolean
  packageDate: any
  clientInfo: { id: number | null; defaultAddressId: number | null } = { id: null, defaultAddressId: null }

  storeTable: boolean
  tableComponent: TableComponent
  table: TableType
  tableCookie: string
  command: CommandType
  commandTotal: number
  // commandRequests: any;

  //icons
  arrowLeft = faArrowLeft
  verticalEllipsis = faEllipsisV

  delivery: DeliveryType = {
    formPayment: '',
    transshipment: '',
    name: undefined,
    contact: undefined,
    zipCode: '',
    street: undefined,
    number: undefined,
    complement: undefined,
    neighborhood: undefined,
    reference: undefined,
    city: undefined,
    latitude: undefined,
    longitude: undefined,
    distance: undefined,
  }

  constructor(
    public api: ApiService,
    public translate: TranslateService,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog,
    private toastService: ToastService,
    public cartService: CartService,
    private _bottomSheet: MatBottomSheet,
    public context: ContextService
  ) {}

  ngOnInit(): void {
    this.clientData = this.data.clientData
    this.viewContentAlternate = this.data.viewContentAlternate
    this.deliverySchedule =
      !this.clientData.options.delivery.disableDelivery &&
      this.delivery.neighborhood &&
      this.taxDeliveryValue !== -1 &&
      this.clientData.typeDelivery === 'neighborhood'
    this.localSchedule = this.clientData.deliveryLocal
    this.packageActive = JSON.parse(this.data.clientData.options.package.active)
    this.packageDelivery = JSON.parse(this.data.clientData.options.package.shippingDelivery.active)
    this.packageLocal = JSON.parse(this.data.clientData.options.package.shippingLocal.active)
    this.packageDate = this.data.packageDate
    this.cart = this.data.cart
    this.cartRequest = this.data.cartRequest
    this.cartPizza = this.data.cartPizza
    this.delivery = this.data.delivery
    this.taxDeliveryValue = this.data.taxDeliveryValue !== undefined ? this.data.taxDeliveryValue : -1
    this.timeDelivery = this.data.timeDelivery
    this.cupom = this.data.cupom
    if (this.api.getCookie('table')) {
      this.table = this.data.table
    }
    if (this.api.getCookie('table')) {
      this.tableCookie = this.api.getCookie('table')
    }
    if (sessionStorage.getItem('command')) {
      this.command = JSON.parse(sessionStorage.getItem('command'))
    }
    // this.getCommandRequests()
    if (!this.cupomIsValid) {
      this.cupom = undefined
    }
    if (this.data.linkCupom) {
      this.cupomCode = this.data.linkCupom
      this.verifyCupom()
    }
  }

  public isFirstImplementationOccurrence(item, flavorIndex, implementation) {
    const occurrences = this.cartService.mostExpensiveImplementationPrice(item, flavorIndex)?.occurrences
    const index = occurrences.find((imp) => imp.code === implementation.code).index
    return index === flavorIndex
  }

  public verifyCupom(): void {
    const storedClientInfo = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`))
    if (storedClientInfo) {
      this.clientInfo = storedClientInfo
    }
    // tslint:disable-next-line: no-unused-expression
    this.cupomCode !== undefined &&
      this.api
        .getCupom(this.clientData.slug, this.cupomCode, this.data.clientInfo.id)
        .then((cupom) => {
          if (this.totalCart().value >= cupom.minValue) {
            this.cupom = cupom
            this.data.cupom = cupom

            if (this.cupom.type === 'freight') {
              localStorage.fold = this.taxDeliveryValue.toFixed(2)
              this.taxDeliveryValue = 0
            } else if (localStorage.fold) {
              this.taxDeliveryValue = parseFloat(localStorage.fold)
            }

            this.cupomIsValid = true
          } else {
            this.matDialog.open(AlertComponent, {
              data: {
                message: `Esse cupom só pode ser usado em compras a partir de ${formatCurrency(cupom.minValue, 'en-us', 'R$ ').replace(
                  '.',
                  ','
                )}<br/>Este valor total não inclui a taxa de entrega.`,
                noReload: false,
              },
            })
          }
        })
        .catch((error: any) => {
          console.error(error)
          // tslint:disable-next-line: no-conditional-assignment
          if ((error.status = 404)) {
            alert(error.error.message)
          } else {
            alert('Falha ao validar cupom, verifique sua conexão!')
          }

          console.error(error)
        })
  }

  public cupomValue() {
    let value = 0
    if (this.cupom) {
      switch (this.cupom.type) {
        case 'value':
          value = this.cupom.value
          break

        case 'percent':
          value = (this.totalCart().value * this.cupom.value) / 100
          break
      }
    }

    return value
  }

  public totalCart(): { quantity: number; value: number } {
    const valueTotal = this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest)

    if (this.cupom && this.cupom.type === 'freight') {
      this.taxDeliveryValue = 0
    }

    return {
      quantity: this.cart.reduce((a, b) => a + b.quantity, 0) + this.cartPizza.reduce((a, b) => a + b.quantity, 0),
      value: valueTotal,
    }
  }

  public finalValueCart() {
    return Number(this.totalCart().value - this.cupomValue())
  }

  private saveCarts() {
    const storageCart = {
      cart: this.cart,
      cartPizza: this.cartPizza,
      date: DateTime.local().plus({ minutes: 30 }),
    }
    localStorage.setItem(`${this.table ? 'table' : this.viewContentAlternate}_cart_${this.clientData.slug}`, JSON.stringify(storageCart))
  }

  public async removeCartItem(item: number) {
    this.cart.splice(item, 1)
    // tslint:disable-next-line: no-unused-expression
    !this.cart.length && (this.viewContentAlternate === 'package' || this.viewContentAlternate === 'P') && localStorage.removeItem('packageDate')
    // tslint:disable-next-line: no-unused-expression
    !this.cart.length && (this.viewContentAlternate === 'package' || this.viewContentAlternate === 'P') && this.data.packageDateModify()

    this.saveCarts()
    this.closeCartBlank()
    if (this.cupom && this.totalCart().value < this.cupom.minValue) {
      this.cupom = undefined
      this.taxDeliveryValue = parseFloat(localStorage.fold)
      this.cupom = undefined
    }
  }

  public rmPizzaFromCart(item: number) {
    this.cartPizza.splice(item, 1)
    // tslint:disable-next-line: no-unused-expression
    this.cartPizza.length === 0 && this.data.viewContentAlternate === 'package' && localStorage.removeItem('packageDate')
    // tslint:disable-next-line: no-unused-expression
    this.cartPizza.length === 0 && this.data.viewContentAlternate === 'package' && this.data.packageDate()

    this.saveCarts()
    this.closeCartBlank()
    if (this.cupom && this.totalCart().value < this.cupom.minValue) {
      this.cupom = undefined
      this.taxDeliveryValue = parseFloat(localStorage.fold)
      this.cupom = undefined
    }
  }

  private closeCartBlank() {
    if (!this.cart.length && !this.cartPizza.length) {
      this.close()
    }
  }

  /* public setTypeDelivery(option: number) {
    if (option === 0 && !this.delivery.street || option === 0 && !this.delivery.number || option === 0 && !this.delivery.neighborhood) {
      this.openAddress();
    } else {
      this.typeDelivery = option;
    }
  } */

  public openAddress() {
    this.dialogRef.close({
      address: true,
      cupom: this.cupom,
    })
  }
  public setAddress(address: AddressType) {
    this.cartRequest.address = address
  }

  public calcProductTotalValue(product: CartType): number {
    const table = this.api.getCookie('table')

    if (table) {
      let valueTable = product.valueTable

      if (product.promoteStatusTable) {
        valueTable = product.promoteValueTable
      }

      product.complements.forEach((complement) => {
        valueTable += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
      })

      return valueTable * product.quantity
    } else {
      let value = product.value

      if (product.promoteStatus) {
        value = product.promoteValue
      }

      product.complements.forEach((complement) => {
        value += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
      })

      return value * product.quantity
    }
  }

  public totalCartVerify(minValue) {
    if (minValue > 0) {
      if (this.totalCart().value < minValue) {
        const minvalLocal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(minValue)
        this.matDialog.open(AlertComponent, {
          data: {
            message: `Seu pedido não atingiu o valor mínimo de ${minvalLocal}`,
            noReload: true,
          },
        })

        this.dialogRef.close()
      } else {
        this.dialogRef.close({
          itens: {
            cart: this.cart,
            cartPizza: this.cartPizza,
            delivery: this.delivery,
          },
          cupom: this.cupom,
        })
      }
    } else {
      this.saveCarts()
      this.dialogRef.close({
        itens: {
          cart: this.cart,
          cartPizza: this.cartPizza,
          delivery: this.delivery,
        },
        cupom: this.cupom,
      })
    }
  }

  public async close() {
    const buttonTable = document.querySelector('#btn-table') as HTMLButtonElement
    if (buttonTable) {
      buttonTable.disabled = true
    }
    try {
      const request = await this.api.getADMDate(this.clientData.slug) // Pega data do painel do usuário

      this.clientData.fuso = request.profileDate
      this.clientData.options.forceClose = request.forceClose

      if ((!this.isOpen() || request.closed) && this.viewContentAlternate !== 'P' && !this.table) {
        // Verifica se o a loja esta fechada na hora de fechar o pedido
        this.toastService
          .create(!request.closed ? 'LOJA FECHADA!' : 'FECHADO PARA DELIVERY', {
            additional: { distance: 300, showTop: true },
            cls: 'alert',
            timeout: 1500,
          })
          .subscribe(() => {
            localStorage.removeItem(
              `${this.table ? 'table_cart_' : this.data.viewContentAlternate === 'D' ? 'D_cart_' : 'P_cart_'}${this.clientData.slug}`
            )
            this.dialogRef.close()
            window.location.reload()
          })

        return null
      }
      if (this.cartRequest.type === 'D') {
        // tslint:disable-next-line: no-unused-expression
        this.cartRequest.addressId &&
          this.totalCartVerify(this.viewContentAlternate === 'D' ? this.clientData.minval : this.clientData.options.package.minValue)
        // tslint:disable-next-line: no-unused-expression
        !this.cartRequest.addressId &&
          this.totalCartVerify(this.viewContentAlternate === 'D' ? this.clientData.minvalLocal : this.clientData.options.package.minValueLocal)
      } else if (this.cartRequest.type === 'T') {
        this.cartRequest.itens = this.cartService.cartItem(this.cart, this.cartPizza as any, this.cartRequest.type)
        const table: TableType = this.data.table
        const command: CommandType = JSON.parse(sessionStorage.getItem('command'))
        this.cartRequest.commandId = command.id
        if (command.status !== 1) {
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
          localStorage.removeItem(`table_cart_${this.clientData.slug}`)
          return null
        }

        if (table.tableOpenedId && table.tableOpenedId !== command.tableOpenedId) {
          this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Ops!',
              message: 'Esta comanda não pertence a esta mesa',
            },
          })
          this.api.deleteCookie('table')
          sessionStorage.removeItem('command')
          this.dialogRef.close({ toDelivery: true })
          return null
        }
        this.saveCarts()
        await this.sendRequestToADM()
      }
    } catch (error) {
      console.error(error)
      if (error.error.code === 403) {
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
        localStorage.removeItem(`table_cart_${this.clientData.slug}`)
        return null
      } else if (error.error.tableIsPaused) {
        this.matDialog.open(AlertComponent, {
          closeOnNavigation: true,
          data: {
            title: 'Desculpe está mesa se encontra desativada!',
            message: `<strong>No momento, essa mesa não está disponível para novos pedidos.</strong><br>`,
          },
        })
        this.api.deleteCookie('table')
        location.replace(`https://${location.host}/${this.clientData.slug}`)
      }
    } finally {
      if (buttonTable) {
        buttonTable.disabled = false
      }
    }
  }

  public async sendRequestToADM() {
    try {
      if (this.enableSend) {
        this.enableSend = false
        await this.api.storeCart({
          slug: this.clientData.slug,
          cartRequest: this.cartRequest,
          userAgent: navigator.userAgent,
        })

        if (this.table) {
          this.dialogRef.close({ requestTable: true })
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      this.enableSend = true
    }
  }

  // public async getCommandRequests() {
  //   const req = this.command && await this.api.getCommandRequests(this.command.id)
  //   this.commandRequests = req
  //   this.commandTotal = 0
  //   if (this.commandRequests) for (const request of this.commandRequests) {
  //     this.commandTotal += request.total

  //   }
  // }

  public validation(): boolean {
    if (this.cart.length + this.cartPizza.length > 0) {
      return true
    } else {
      return false
    }
  }

  public async isPaused() {
    const table = this.data.table
    if (table.status !== 1) {
      this.matDialog.open(AlertComponent, {
        closeOnNavigation: true,
        data: {
          title: 'Desculpe está mesa se encotra desativada!',
          message: `<strong>No momento, está mesa não está disponivel para novos pedidos</strong><br>`,
        },
      })
      this.api.deleteCookie('table')
    }
  }

  closeCartBackToStore() {
    this.dialogRef.close({})
  }

  moveToPaymentModal() {
    this.dialogRef.close({ payment: true, cupom: this.cupom || null })
  }

  public isOpen() {
    const today = DateTime.fromISO(this.clientData.fuso, { zone: this.clientData.timeZone }).toFormat('EEEE').toLowerCase()
    const convert = (text: string) => parseFloat(text.replace(':', '.'))

    if (!this.clientData.week[today]) {
      return false
    }
    const now = parseFloat(DateTime.fromISO(this.clientData.fuso, { zone: this.clientData.timeZone }).toFormat('HH.mm'))
    const filter = this.clientData.week[today].filter((d) => now >= convert(d.open) && now <= convert(d.close))

    const forceNow = DateTime.local()
    const forceCloseDate = DateTime.fromISO(this.clientData.options.forceClose)

    if (forceCloseDate > forceNow) {
      return false
    }

    if (filter.length) {
      return true
    }

    return false
  }

  openBottomSheet(index: number, product: CartType | CartFlavorPizzaType, productType: string): void {
    const bottomSheetRef = this._bottomSheet.open(ProductOptionsComponent, {
      data: {
        index: index,
        product: product,
        productType: productType,
      },
    })
    bottomSheetRef.afterDismissed().subscribe((result) => {
      if (result) {
        if (result.target === 'remove') {
          if (result.productType === 'default') {
            this.cartService.removeProductCart(result.index, this.cart)
          } else {
            this.cartService.removePizzaCart(result.index, this.data.cartPizza)
          }
          this.saveCarts()
        }
        if (result.target === 'edit') {
          if (result.productType === 'default') {
            this.dialogRef.close({ target: 'editDefault', index: index, product: product, productType: productType })
          } else {
            this.dialogRef.close({ target: 'editPizza', index: index, product: product, productType: productType })
          }
        }
      }
    })
  }

  public timeFreightText() {
    return !!this.timeDelivery && !!this.timeDelivery.replace(/\D/g, '') ? `${this.timeDelivery} min.` : this.timeDelivery
  }

  public logger(data: any) {
    console.log(data)
  }

  public checkComplement(array: ComplementItemType[]) {
    return array.some((item) => item.quantity)
  }
}
