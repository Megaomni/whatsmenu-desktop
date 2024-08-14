import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core'
import { CartRequestType } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { DeliveryType } from 'src/app/delivery-type'
import { CartFormPaymentType, Flag } from 'src/app/formpayment-type'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from 'src/app/services/api/api.service'
import { emojiRegex } from '../../services/utils/emojiRegex'
import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { DateTime } from 'luxon'
import { cpf } from 'cpf-cnpj-validator'
import { AddonFormPaymentType } from 'src/app/formpayment-type'
import { HttpClient } from '@angular/common/http'
import { faCcMastercard, faCcVisa, faPaypal, faPix } from '@fortawesome/free-brands-svg-icons'
import {
  fa1,
  fa2,
  fa3,
  fa4,
  faArrowLeft,
  faCirclePlus,
  faCreditCard,
  faMotorcycle,
  faPaste,
  faRotate,
  faTrashAlt,
  faWarning,
} from '@fortawesome/free-solid-svg-icons'
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap'
import { CupomType } from 'src/app/cupom'
import { CustomerType } from 'src/app/customer-type'
import { CartService } from 'src/app/services/cart/cart.service'
import { ComponentService } from 'src/app/services/components/component.service'
import { ContextService } from 'src/app/services/context/context.service'
import { WebsocketService } from 'src/app/services/websocket/websocket.service'
import { environment } from 'src/environments/environment'
import { AlertComponent } from '../alert/alert.component'
import { CardCheckoutType } from 'src/app/card-checkout-type'
import * as moment from 'moment'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { TranslateService } from 'src/app/translate.service'
import { profile } from 'src/test/utils/profile'
import { ProfileOptionsType } from 'src/app/profile-type'

export declare const fbq: any

@Component({
  selector: 'app-payment-type',
  templateUrl: './payment-type.component.html',
  styleUrls: ['./payment-type.component.scss'],
})
export class PaymentTypeComponent implements OnInit, AfterViewChecked {
  profile: ProfileOptionsType
  pixRegeneration: boolean
  orderId: number
  isAvailable: boolean
  clientData: ProfileType
  paymentFlag: Flag | null
  change: number | null
  cart: CartType[] = []
  cartRequest: CartRequestType
  formsPayment: CartFormPaymentType[]
  cartPizza: CartFlavorPizzaType[] = []
  whatsCart: CartType[] = []
  whatsCartPizza: CartPizza[] = []
  notNeedTransshipment: boolean
  delivery: DeliveryType
  requestCode: number
  viewContentAlternate: string
  typeDelivery: string
  pendingCart: any
  enableSend = true
  enableDeliveryAddress: boolean
  cupom: CupomType
  popupblock = false
  paidTaxDelivery: number
  taxDeliveryValue: number
  addon: AddonFormPaymentType
  cupomIsValid: boolean
  pixInvoice: any
  error: boolean = false
  customer: CustomerType
  loading: boolean
  pixStatus: string
  sameAddress: boolean
  totalAmount: number
  cardError: boolean | string
  onlineOrLocal: 'online' | 'local' | null
  processingAnOnlineOrder: boolean
  intervalNumber: any
  saveCard: boolean = true
  selectedCard?: { brand: string; last_four_digits: string }
  showForm: boolean
  billing: {
    document: string
    address: {
      city: string
      country: string
      state: string
      line_1: string
      zip_code: string
    }
    card: {
      holder_name: string
      number: string
      exp: string
      cvv: string
    }
  }
  totalModal: boolean

  arrowLeft = faArrowLeft
  paste = faPaste
  visa = faCcVisa
  pix = faPix
  deliver = faMotorcycle
  masterCard = faCcMastercard
  creditCard = faCreditCard
  alert = faWarning
  addCard = faCirclePlus
  xIcon = faTrashAlt
  rotate = faRotate

  number1 = fa1
  number2 = fa2
  number3 = fa3
  number4 = fa4
  paypal = faPaypal

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<any>,
    public translate: TranslateService,
    private api: ApiService,
    private matDialog: MatDialog,
    public cartService: CartService,
    private context: ContextService,
    private componentService: ComponentService,
    private websocket: WebsocketService,
    private http: HttpClient
  ) {
    this.sendMessage = this.sendMessage.bind(this)
  }
  ngOnInit(): void {
    this.cartRequest = this.data.cartRequest
    this.typeDelivery = this.data.typeDelivery
    this.delivery = this.data.delivery
    this.clientData = this.data.clientData
    this.onlineOrLocal = this.clientData.options.onlineCard || this.clientData.options.onlinePix ? null : 'local'
    this.customer = this.data.customer
    this.showForm = !this.customer.controls.asaas?.cards?.length
    this.selectedCard = null
    this.cart = this.cartService.itemCart(this.data.cartRequest).cart
    this.cartPizza = this.data.cartPizza
    this.pixInvoice = { copyPaste: '', qrCode: '', id: '' }
    this.taxDeliveryValue = this.data.cupom?.type === 'freight' ? 0 : this.data.taxDeliveryValue
    this.cupom = this.data.cupom
    this.sameAddress = false
    this.totalAmount = Math.ceil(
      (this.convertToNumber(this.totalCart()) -
        this.cupomValue() +
        (this.cupom?.type === 'freight' || this.typeDelivery === 'local' ? 0 : this.taxDeliveryValue)) *
        100
    )
    this.billing = {
      document: this.customer.secretNumber || '',
      address: {
        city: this.delivery.city,
        country: 'BR',
        line_1: this.delivery.street ? this.delivery.street + ', ' + this.delivery.number + ', ' + this.delivery.complement : '',
        state: this.delivery.uf,
        zip_code: this.delivery.zipCode,
      },
      card: {
        holder_name: this.customer.name,
        number: '',
        exp: null,
        cvv: '',
      },
    }
  }

  ngAfterViewChecked(): void {
    this.isAvailable = this.cartService.checkAvailability(this.clientData)
  }

  money() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Dinheiro') {
      return true
    }
  }

  credit() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Crédito') {
      return true
    }
  }

  debit() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Débito') {
      return true
    }
  }

  pixPayment() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Pix') {
      return true
    }
  }

  ValeR() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Vale Refeição') {
      return true
    }
  }

  ValeA() {
    if (this.cartRequest.formsPayment[0]['label'] === 'Vale Alimentação') {
      return true
    }
  }

  picPay() {
    if (this.cartRequest.formsPayment[0]['label'] === 'PicPay') {
      return true
    }
  }

  addonValueType() {
    if (
      this.cartRequest &&
      this.cartRequest.formsPayment &&
      this.cartRequest.formsPayment[0] &&
      this.cartRequest.formsPayment[0]['addon'] &&
      this.cartRequest.formsPayment[0]['addon']['valueType'] === 'fixed'
    ) {
      return ''
    } else {
      return `(${this.cartRequest.formsPayment[0]['addon']['value']}%)`
    }
  }

  addonValue() {
    if (this.cartRequest && this.cartRequest.formsPayment && this.cartRequest.formsPayment[0] && this.cartRequest.formsPayment[0]['addon']) {
      let value = this.cartRequest.formsPayment[0]['addon']['value']
      return value
    } else {
      return ''
    }
  }

  addonType() {
    if (
      this.cartRequest &&
      this.cartRequest.formsPayment &&
      this.cartRequest.formsPayment[0] &&
      this.cartRequest.formsPayment[0]['addon'] &&
      this.cartRequest.formsPayment[0]['addon']['type'] === 'fee'
    ) {
      return `${this.translate.text().fee_comment}: +`
    } else {
      return this.translate.text().discount_comment
    }
  }

  public addonCalcResult() {
    let result = 0
    if (this.cartRequest.formsPayment[0]?.addon?.status) {
      result =
        this.cartRequest.formsPayment[0]['addon']['valueType'] === 'percentage'
          ? this.cartRequest.total * (this.cartRequest.formsPayment[0]['addon']['value'] / 100)
          : this.cartRequest.formsPayment[0]['addon']['value']
      if (this.cartRequest.formsPayment[0]['addon']['type'] === 'discount') {
        result = result * -1
      }
    }

    return result
  }

  public enableSameAddress() {
    return this.delivery.city && this.delivery.street && this.delivery.uf && this.delivery.zipCode
  }

  public enableCreditCardOrder() {
    if (this.selectedCard) {
      if (this.billing.card.cvv.length < 3) return { message: this.translate.text().check_the_cvv }
      return false
    }
    if (Object.entries(this.billing.card).some((info) => !info[1])) return { message: this.translate.text().check_card_details }
    if (Object.entries(this.billing.address).some((info) => !info[1])) return { message: this.translate.text().check_billing_address }
    const expDate = DateTime.fromFormat(this.billing.card.exp, 'MMyy')
    const difference = expDate.diff(DateTime.now(), 'milliseconds')
    if (difference.milliseconds < 0) return { message: this.translate.text().check_card_expiration_date }
    if (this.billing.card.number.replace(' ', '').length < 16) return { message: this.translate.text().check_card_number }
    if (this.billing.card.cvv.length < 3) return { message: this.translate.text().check_security_code }
    if (this.billing.address.zip_code.length < 8) return { message: this.translate.text().check_zip_code }
    return false
  }

  public closePaymentModal() {
    this.dialogRef.close({ send: false, targetModal: 'back', cupom: this.cupom })
  }

  public creditCardIcon(data) {
    switch (data) {
      case '4':
        return this.visa
      case 'VISA':
        return this.visa
      case '5':
        return this.masterCard
      case 'MASTERCARD':
        return this.masterCard
      default:
        return this.creditCard
    }
  }

  public async getRequestCode() {
    return (this.requestCode = null)
  }
  public getWhatsappNumber() {
    if (!environment.production) {
      return '5513997884443'
    }

    return this.clientData.whatsapp.split(' ').join('').replace('-', '')
  }

  public defineStoreMethod(): 'D' | 'T' | 'P' {
    const storeCookies: any = document.cookie.split('; ').reduce((prev, current) => {
      const [name, ...value] = current.split('=')
      prev[name] = value.join('=')
      return prev
    }, {})

    if (storeCookies.onlyBasic) {
      this.cartRequest.type = 'D'
      return 'D'
    }
    if (storeCookies.onlyPackage) {
      this.cartRequest.type = 'P'
      return 'P'
    }
    if (storeCookies.onlyTable || storeCookies.table) {
      this.cartRequest.type = 'T'
      return 'T'
    }
    return this.cartRequest.type
  }

  public async sendRequestToADM() {
    // this.channel = this.socket.subscribe('request');
    try {
      if (this.enableSend) {
        this.enableSend = false
        setTimeout(async () => {
          this.enableSend = true
        }, 30000)

        if (!this.isSafari() && !this.requestCode) {
          await this.getRequestCode()
        }

        this.cartPizza.forEach((pizza) => {
          pizza.flavors.forEach((fl) => {
            fl.name = this.removeEmojiString(fl.name)
            fl.description = this.removeEmojiString(fl.description)
          })

          pizza.implementations.forEach((imp) => {
            imp.name = this.removeEmojiString(imp.name)
          })
        })

        this.cart.forEach((product) => {
          product.name = this.removeEmojiString(product.name)
          product.description = this.removeEmojiString(product.description)
          product.details.complements.forEach((compl) => {
            compl.itens.forEach((item) => {
              item.name = this.removeEmojiString(item.name)
              item.description = this.removeEmojiString(item.description)
            })
          })
        })

        const packageDate = this.data.viewContentAlternate === 'P' ? this.data.dataPackage : null

        if (packageDate && packageDate < DateTime.local()) {
          throw {
            error: {
              code: '403-D',
              message: this.translate.text().chosen_date_earlier_current_date,
              minHour: DateTime.local().toFormat('HH:mm'),
            },
          }
        }

        // Definir o valor da forma de pagamento unica
        this.cartRequest.formsPayment[0].value =
          this.convertToNumber(this.totalCart()) -
          this.cupomValue() +
          (this.calculateTaxDelivery(this.delivery) > 0 && this.cartRequest.addressId
            ? this.convertToNumber(this.calculateTaxDelivery(this.delivery))
            : 0)

        const cartRequest: CartRequestType = {
          ...this.cartRequest,
          paymentType: this.onlineOrLocal,
          itens: this.cartService.cartItem(this.cart, this.cartPizza, this.defineStoreMethod()),
          address: this.typeDelivery === 'local' ? null : this.delivery,
          addressId: this.typeDelivery === 'local' ? null : this.delivery.id,
          type: this.defineStoreMethod(),
          taxDelivery: this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery),
          cupomId: this.cupom?.id,
          total: this.convertToNumber(this.totalCart()),
          formsPayment:
            this.cartRequest.formsPayment[0].payment === 'money'
              ? [{ ...this.cartRequest.formsPayment[0], change: Number(Math.abs(this.change).toFixed(2)) }]
              : [
                  {
                    ...this.cartRequest.formsPayment[0],
                    flag: this.getPayment(this.cartRequest.formsPayment[0].payment).flags ? this.paymentFlag : null,
                  },
                ],
        }

        const { cart } = await this.api.storeCart({
          slug: this.clientData.slug,
          cartRequest,
          userAgent: navigator.userAgent,
        })

        if (!cart || !cart.code || typeof cart.code !== 'string') {
          throw { error: { message: this.translate.text().unable_register_your_order_try_again } }
        }

        if (this.cartRequest.type === 'P') {
          localStorage.removeItem(`${this.clientData.slug}_packageDate`)
        }
        this.requestCode = Number(cart.code)
        this.taxDeliveryValue = this.data.cupom?.type === 'freight' ? 0 : cart.taxDelivery
        //this.timeDelivery = cart.timeDelivery;

        const formPayment = this.cartRequest.formsPayment[0]?.flags?.length
          ? `${this.cartRequest.formsPayment[0].label}(${this.paymentFlag?.name})`
          : this.cartRequest.formsPayment[0].label

        if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
          const value = (
            this.totalCart() -
            this.cupomValue() +
            (this.taxDeliveryValue > 0 && this.cartRequest.addressId ? this.taxDeliveryValue : 0)
          ).toFixed(2)
          fbq('track', 'Purchase', {
            value: (
              this.totalCart() -
              this.cupomValue() +
              (this.taxDeliveryValue > 0 && this.cartRequest.addressId ? this.taxDeliveryValue : 0)
            ).toFixed(2),
            currency: 'BRL',
          })
        }
        this.pendingCart = cart
      } else {
        throw { error: { message: this.translate.text().unable_register_your_order_try_again } }
      }
    } catch (error) {
      if (error.error?.code === '405-2') {
        this.dialogRef.close({ send: false, cupom: this.cupom })
      } else if (error.error?.code === '403-188') {
        alert(this.translate.text().system_identified_you_are_outside)
        location.reload()
      } else if (error.error?.code === '409') {
        error.error.dates.length > 0
          ? error.error.dates.forEach((el) => {
              this.clientData.options.package.specialsDates.push(moment(new Date(`${el} `)))
            })
          : this.clientData.options.package.specialsDates.push(moment(new Date(`${error.error.date} `)))

        const newPackageDate = await this.componentService.getPackageDate({
          clientData: this.clientData,
          packageHours: {},
          everOpen: true,
        })

        this.cartRequest.packageDate = newPackageDate.toFormat(`yyyy-MM-dd HH:mm`)
      } else if (error.error?.code === 418) {
        const dateChoiced = DateTime.fromJSDate(new Date(error.error.date))

        if (this.clientData.options.package.hoursBlock) {
          if (this.clientData.options.package.hoursBlock[dateChoiced.toFormat('MMdd')]) {
            this.clientData.options.package.hoursBlock[dateChoiced.toFormat('MMdd')]?.hours.push(error.error.hour)
          } else {
            const hourBlocked = {
              hours: [error.error.hour],
              date: dateChoiced.toISO(),
            }
            this.clientData.options.package.hoursBlock[dateChoiced.toFormat('MMdd')] = hourBlocked
          }
        }

        const newPackageDate = await this.componentService.getPackageDate({
          clientData: this.clientData,
          packageHours: {},
          everOpen: true,
          errorType: error.error.code,
          dateChoiced: dateChoiced,
        })
      } else if (error.error.code === '400') {
      } else if (error.error.code === '401') {
        this.matDialog.open(AlertComponent, {
          data: {
            title: `${this.translate.text().attention}!`,
            message: error.error.message,
            textButton: 'Ok',
          },
        })
      } else if (error.error?.code === '403-D') {
        const newPackageDate = await this.componentService.getPackageDate({
          clientData: this.clientData,
          packageHours: {},
          everOpen: true,
          errorType: error.error.code,
        })
      } else if (error.error?.code === '403-239') {
        this.matDialog.open(AlertComponent, {
          data: {
            title: `${this.translate.text().attention}!`,
            message: this.translate.alert().address_covarage_area,
            textButton: 'Ok',
          },
        })
      } else {
        this.showErrorRegister()
      }
      throw error
    }
    this.saveAddress()
    this.data.viewContentAlternate === 'P' && localStorage.removeItem('packageDate')
  }

  isChangeButtonEnabled(): boolean {
    const totalValue =
      Number(
        this.convertToNumber(this.totalCart()) -
          this.cupomValue() +
          (this.calculateTaxDelivery(this.delivery) > 0 && this.cartRequest.addressId
            ? this.convertToNumber(this.calculateTaxDelivery(this.delivery))
            : 0)
      ) +
      this.addonCalcResult() -
      this.change
    if (totalValue < 0 || this.change === undefined || !this.change || this.change === null) {
      return true
    } else {
      return false
    }
  }

  public saveAddress() {
    localStorage.setItem(this.clientData.slug, JSON.stringify({ ...this.delivery, version: this.clientData.version }))
  }
  private showErrorRegister() {
    let textMessage = 'Sua conexão falhou, clique em "ENVIAR NOVAMENTE"!'
    let button = 'ENVIAR NOVAMENTE'

    if (!navigator.onLine) {
      textMessage = 'Você precisa estar conectado na internet para concluir o seu pedido!'
      button = 'Tentar novamente'
    }

    const dialog = this.matDialog.open(AlertComponent, {
      data: {
        title: `${this.translate.text().attention}!`,
        message: textMessage,
        textButton: 'Tentar novamente',
      },
    })

    // tslint:disable-next-line: deprecation
    dialog.afterClosed().subscribe(async () => {
      await this.sendRequestToADM()
    })
  }
  public calculateTaxDelivery(address?: DeliveryType) {
    if (!address) {
      return
    }
    let tax: number
    if (this.clientData.typeDelivery === 'km' && this.delivery.street) {
      const taxValues = this.clientData.taxDelivery.filter((tax) => tax.distance * 1000 > address.distance)
      if (taxValues.length) {
        tax = taxValues[0].value
        this.enableDeliveryAddress = true
      } else {
        this.enableDeliveryAddress = false
      }
    } else {
      const city = address && this.clientData.taxDelivery.find((t) => t.city === address.city)
      if (city) {
        let neighborhood = city.neighborhoods.find((n) => n.name === address.neighborhood)
        if (neighborhood) {
          this.delivery.formPayment = undefined
          this.delivery.transshipment = undefined
          tax = neighborhood.value
        }
      }
    }
    this.paidTaxDelivery = tax
    if (this.clientData.typeDelivery === 'km') {
      this.taxDeliveryValue = this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : JSON.parse(JSON.stringify(Number(tax)))
    }
    if (this.clientData.typeDelivery != 'km') {
      this.taxDeliveryValue = this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : tax
    }
    return this.cupom?.type === 'freight' ? 0 : tax
  }
  public cupomValue() {
    let value = 0
    if (this.cupom) {
      switch (this.cupom.type) {
        case 'value':
          value = this.cupom.value
          break

        case 'percent':
          value = (this.totalCart() * this.cupom.value) / 100
          break
      }
    }

    return value
  }

  public isSafari() {
    return false
  }

  public removeEmojiString(text: string) {
    const rgx = emojiRegex
    if (text && typeof text === 'string') {
      return text
        .split(rgx)
        .filter(Boolean)
        .map((el) => {
          if (rgx.test(el)) {
            //@ts-ignore
            return ''
          }

          return el
        })
        .join(' ')
    } else {
      return text
    }
  }
  private formatCurrency(val: any): string {
    let value = val
    if (typeof val === 'string') {
      value = parseFloat(val.replace(',', '.').replace('R$', '').split(' ').join(''))
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }
  public getPayment(name: string): CartFormPaymentType {
    return this.clientData?.formsPayment.find((f) => f.payment === name)
  }
  public handlePaymentFlag(code: string, type: string): void {
    const flags = this.getPayment(type).flags
    if (flags) {
      this.paymentFlag = flags.find((flag) => flag.code === code)
    }
  }
  public resetTransshipment(event: boolean) {
    if (event) {
      this.change = null
    }
  }
  convertToNumber(text: string | number) {
    const numberfy = Number(text)
    if (!text || !numberfy) {
      return 0
    }

    return numberfy
  }
  public totalCart() {
    return this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest)
  }

  public getMessage() {
    const split = '*________________________________*\n'
    let message = `*${this.clientData.name.trim()}*\n\n`
    let verifyHour = moment(new Date(this.data.dataPackage)).format('ss') === '01'

    if (this.customer.name) {
      message += `*${this.translate.text().my_name_is} ${this.customer.name}, contato ${this.customer.whatsapp}*\n\n`
    }
    message += `*${this.translate.text().order_coder}: wm${this.requestCode}${'-' + this.cartRequest.type}\n\n`

    if (this.cartRequest.type === 'P') {
      message += `*${this.translate.text().delivery_date} : ${
        verifyHour
          ? moment(new Date(this.cartRequest.packageDate)).format(this.translate.masks().date_mask_format_m) + `(${this.translate.text().no_time_up})`
          : moment(new Date(this.cartRequest.packageDate)).format(`${this.translate.masks().date_mask_format_m} HH:mm`)
      } *\n\n`
    }

    // message += `*QTD.   PRODUTO          VL.*\n${split}`;
    this.whatsCart = this.api.returnResumeCart(this.cart, [], 'default', { resume: this.clientData.options.print.groupItems }).cart
    this.whatsCartPizza = this.api.returnResumeCart([], this.cartPizza, 'pizza', { resume: this.clientData.options.print.groupItems }).cartPizza

    this.whatsCart.forEach((item) => {
      if (this.clientData.showTotal) {
        const val = this.formatCurrency(item.promoteStatus ? item.promoteValue : item.value)
        let productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`

        productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`
        // while (productItem.length < 32) {
        //   val = ' ' + val;
        //   productItem = `${item.quantity}x - ${item.name.trim()}`;
        // }

        message += `${productItem}`

        item.complements.forEach((complement) => {
          message += `*${complement.name}:*\n`
          complement.itens.forEach((itemComplement, indexComplementItem) => {
            const compleVal = this.formatCurrency(itemComplement.value)
            const compleItem = `*_${itemComplement.quantity > 1 ? itemComplement.quantity + 'x ' : ''}${itemComplement.name.trim()}${
              itemComplement.value ? `_*\n        *_(${compleVal})` : ''
            }`

            // while (compleItem.length < 32) {
            //   compleVal = ' ' + compleVal;
            // tslint:disable-next-line: max-line-length
            //   compleItem = `     *_${itemComplement.quantity > 1 ? itemComplement.quantity + 'x ' : ''}${itemComplement.name}_*${itemComplement.value ? `\n     *_(${compleVal})` : ''}`;
            // }

            message += `${compleItem}_*${indexComplementItem === complement.itens.length - 1 ? '\n\n' : '\n'}`
          })
        })
      } else {
        message += `*${item.quantity}x ${item.name.trim()}*\n`
        item.complements.forEach((complement) => {
          message += `*${complement.name}:*\n`
          complement.itens.forEach((itemComplement) => {
            message += `*_${itemComplement.quantity}x - ${itemComplement.name}_*\n`
          })
        })
      }
      // item.addons.forEach(addon => message += `   ${addon.name}\n`);
      if (item.obs) {
        message += `*${this.translate.text().observations}:\n${item.obs}*\n`
      }
      if (this.clientData.showTotal) {
        // const val = this.formatCurrency((item.promoteStatus ? item.promoteValue : item.value) * item.quantity);
        message += `*${this.formatCurrency(this.calcProductTotalValue(item))}*\n`
      }
      message += split
    })

    this.whatsCartPizza.forEach((item) => {
      if (this.clientData.showTotal) {
        // let val = this.formatCurrency(item.value * item.quantity);
        const sabor = item.flavors.length === 1 ? '' : `${item.flavors.length} ${this.translate.text().flavors}`
        let pizza = `${item.quantity}x ${item.size} ${sabor}`
        pizza = `${item.quantity}x ${item.size.trim()} ${sabor}`
        // while (pizza.length < 32) {
        //   val = ' ' + val;
        //   pizza = `${item.quantity}x ${item.size} ${sabor} ${val}`;
        // }

        message += `*${pizza}*\n`
        // item.addons.forEach(addon => message += `   ${addon.name}\n`);
        item.flavors.forEach((product) => {
          const valFlavor = this.formatCurrency(product.values[item.size] / item.flavors.length)
          let nameFlavor = `*${product.name.trim()}*\n`

          if (!this.clientData.options.pizza) {
            nameFlavor = `*${product.name.trim()}*\n     *(${valFlavor})*\n`
          }

          // while (nameFlavor.length < 32) {
          //   valFlavor = ' ' + valFlavor;
          //   nameFlavor = `   *${product.name.trim()} ${valFlavor}`;
          // }

          message += `${nameFlavor}`
        })

        item.implementations.forEach((implementation) => {
          const valImplementation = this.formatCurrency(implementation.value)
          const nameImplementation = `*com ${implementation.name.trim()}*\n     *(${valImplementation})*\n`

          // while (nameImplementation.length < 32) {
          //   valImplementation = ' ' + valImplementation;
          //   nameImplementation = `   *com ${implementation.name.trim()}*\n     *${valImplementation}*\n`;
          // }

          message += `${nameImplementation}`
        })
      } else {
        const sabor = item.flavors.length === 1 ? '' : `${item.flavors.length} ${this.translate.text().flavors}`
        message += `*${item.quantity}x ${item.size} ${sabor}*\n`
        // item.addons.forEach(addon => message += `   ${addon.name}\n`);
        item.flavors.forEach((product) => (message += `   *${product.name}*\n`))
        item.implementations.forEach((implementation) => (message += `   *com ${implementation.name.trim()}*\n`))
      }
      if (item.obs) {
        message += `*${this.translate.text().observations}:\n${item.obs}*\n`
      }

      if (this.clientData.showTotal) {
        message += `*${this.formatCurrency(this.cartService.pizzaTotalValue(item as CartFlavorPizzaType, this.cartRequest.type) * item.quantity)}*\n`
      }
      message += split
    })

    // message += `\n*Forma de Pagamento*\n\n`;
    message += '\n\n'

    if (this.clientData.showTotal) {
      let value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.totalCart())

      message += `*${this.translate.text().coupon_used}: ${this.cupom.code.toUpperCase()}*\n`
      if (this.typeDelivery === 'delivery') {
        if (this.taxDeliveryValue > 0) {
          message += `*Subtotal: ${this.formatCurrency(this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest))}*\n`

          if (this.cartRequest.formsPayment[0].addon.status) {
            if (this.cartRequest.formsPayment[0].addon.type === 'fee')
              message += `*${this.translate.text().fee}: ${this.addonType()}${this.formatCurrency(this.addonCalcResult())}*\n`
          }
          if (this.cartRequest.formsPayment[0].addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(this.addonCalcResult())}*\n`
          }

          if (this.cupom) {
            message += `*${this.translate.text().coupon}: ${this.cupom.type !== 'freight' ? this.formatCurrency(this.cupomValue() * -1) : 'Frete Grátis'}*\n`
          }

          message += `*${this.translate.text().delivery}: ${this.cupom && this.cupom.type === 'freight' ? this.translate.text().fee_shipping_up : this.formatCurrency(this.taxDeliveryValue)}*\n`
          value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            this.totalCart() - this.cupomValue() + this.taxDeliveryValue + this.addonCalcResult()
          )

          message += `*Total: ${value}*\n`
        }

        if (this.taxDeliveryValue === 0) {
          message += `*Subtotal: ${this.formatCurrency(this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest))}*\n`

          if (this.cartRequest.formsPayment[0].addon.status) {
            if (this.cartRequest.formsPayment[0].addon.type === 'fee')
              message += `*${this.translate.text().fee_comment}: ${this.addonType()} ${this.formatCurrency(this.addonCalcResult())}*\n`
          }
          0
          if (this.cartRequest.formsPayment[0].addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(this.addonCalcResult())}*\n`
          }

          if (this.cupom && this.cupom.type !== 'freight') {
            message += `*${this.translate.text().coupon}: ${this.formatCurrency(this.cupomValue() * -1)}*\n`
          }

          message += `*${this.translate.text().delivery}: ${this.translate.text().free}*\n`
          value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            this.totalCart() - this.cupomValue() + this.addonCalcResult()
          )
          message += `*Total: ${value}*\n`
        }

        if (this.taxDeliveryValue === null) {
          if (this.cartRequest.formsPayment[0].addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(this.addonCalcResult())}\*n`
          }
          message += `*Subtotal: ${this.formatCurrency(this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest))}*\n`

          if (this.cupom && this.cupom.type !== 'freight') {
            message += `*${this.translate.text().coupon}: ${this.formatCurrency(this.cupomValue() * -1)}*\n`
          }

          message += `*${this.translate.text().delivery}: ${this.translate.text().consult}*\n`
        }
      } else {
        message += `*Subtotal: ${this.formatCurrency(this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest))}*\n`

        if (this.cartRequest.formsPayment[0].addon.status) {
          if (this.cartRequest.formsPayment[0].addon.type === 'fee')
            message += `*${this.translate.text().fee_comment}: ${this.addonType()} ${this.formatCurrency(this.addonCalcResult())}*\n`
        }
        if (this.cartRequest.formsPayment[0].addon.type === 'discount') {
          message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(this.addonCalcResult())}*\n`
        }

        if (this.cupom) {
          message += `*${this.translate.text().coupon}: ${
            this.cupom.type !== 'freight' ? this.formatCurrency(this.cupomValue() * -1) : this.translate.text().free_freight_comment
          }*\n`
        }

        message += `*${this.translate.text().delivery}: Local*\n`
        value = this.formatCurrency(this.totalCart() - this.cupomValue() + this.addonCalcResult())
        message += `*Total: ${value}*\n`
      }
    }

    const formPayment = this.cartRequest.formsPayment[0]?.flags?.length
      ? `${this.cartRequest.formsPayment[0].label}(${this.paymentFlag?.name || 'Online'})`
      : this.cartRequest.formsPayment[0].label

    message += `\n*${this.translate.text().payment_in_comment}:      ${formPayment} ${
      this.onlineOrLocal === 'online' ? ` - ${this.translate.text().paid_online_comment}` : ''
    }*\n`

    if (this.change && formPayment === 'Dinheiro') {
      const transshipmentVal = parseFloat(this.change.toString().replace(',', '.').trim())
      const troco = new Intl.NumberFormat(this.profile.locale.language, { style: 'currency', currency: this.profile.locale.currency }).format(
        transshipmentVal
      )

      if (transshipmentVal > 0) {
        message += `*${this.translate.text().change_for_comment} ${troco}*\n`

        if (this.clientData.showTotal) {
          let totalRequest = this.totalCart() - this.cupomValue() + this.addonCalcResult()

          if (this.taxDeliveryValue !== -1 && this.cartRequest.addressId) {
            totalRequest += this.taxDeliveryValue
          }

          message += `*${this.translate.text().change}: ${new Intl.NumberFormat(this.profile.locale.language, {
            style: 'currency',
            currency: this.profile.locale.currency,
          }).format(transshipmentVal ? transshipmentVal - totalRequest : totalRequest)}*\n`
        }
      } else {
        this.delivery.transshipment = ''
        message += `*${this.translate.text().i_not_need_transhipment}*\n`
      }
    }

    message += `*${this.translate.text().link_for_order_status}*\n http://www.whatsmenu.com.br/${this.clientData.slug}/status/${this.requestCode}`

    if (this.typeDelivery === 'delivery') {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.cartRequest.type === 'P') {
        message += `\n\n*${this.translate.text().package_s}*\n\n*${this.translate.text().delivery_address}*\n\n`
      } else {
        message += `\n\n*${this.translate.text().i_not_need_transhipment}*\n\n`
      }
      // message += `\n\n*Endereço da Entrega*\n\n`;
      message += `*${this.translate.text().delivery_address}: ${this.delivery.street.trim()}*\n`
      message += `*${this.translate.text().number_comment}: ${this.delivery.number}*\n`

      if (this.delivery.complement) {
        message += `*${this.translate.text().add_on}: ${this.delivery.complement.trim()}*\n`
      }

      message += `*${this.translate.text().neighborhood}: ${this.delivery.neighborhood.trim()}*\n`

      if (this.delivery.reference) {
        message += `*${this.translate.text().reference}: ${this.delivery.reference.trim()}*\n`
      }

      message += `*${this.translate.text().city}: ${this.delivery.city.trim()}*\n`
    } else {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.cartRequest.type === 'P') {
        message += `\n\n*${this.translate.text().package_s}*\n\n*${this.translate.text().pickup_the_location}*\n\n`
      } else {
        message += `\n\n*${this.translate.text().pickup_the_location}*\n\n`
      }
    }

    message += split
    message += `*${this.translate.text().technology}*\n      *www.whatsmenu.com.br*`

    console.log(message)
    return encodeURI(message)
  }
  public calcProductTotalValue(product: CartType): number {
    let value = product.value

    if (product.promoteStatus) {
      value = product.promoteValue
    }

    product.details.complements.forEach((complement) => {
      value += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
    })

    return value * product.quantity
  }
  public sendMessage() {
    if (window.open(`https://wa.me/${this.getWhatsappNumber()}?text=${this.getMessage()}`)) {
      this.popupblock = false
    } else {
      this.popupblock = true
    }
    return this.popupblock
  }
  public close(data: any) {
    this.cardError = null
    this.selectedCard = null
    this.cartRequest.formsPayment[0] = {
      flags: [],
      flag: null,
      label: '',
      status: true,
      payment: '',
    }
    if (this.pixInvoice) {
      clearInterval(this.intervalNumber)
      this.pixInvoice = { copyPaste: '', qrCode: '', id: '' }
    }
    if (this.websocket?.connection?.readyState) {
      this.websocket.disconnect()
    }
    if (this.onlineOrLocal) {
      return (this.onlineOrLocal = null)
    }
    this.dialogRef.close(data)
  }

  public tooltipAutoClose(tooltip: NgbTooltip) {
    setTimeout(() => {
      tooltip.close()
    }, 600)
  }

  public copyToClipboard(data: string) {
    navigator.clipboard.writeText(data)
  }

  logger(data: any) {
    console.log(data)
  }

  public scrollTo(id: string, ms: number) {
    this.paymentFlag = null
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, ms)
  }

  public async submitRegularOrder() {
    try {
      await this.sendRequestToADM()
      return this.closeModal({ success: true, sendMessage: this.sendMessage })
    } catch (error) {
      console.error(error)
      return this.closeModal({ success: false, targetModal: 'cart', message: error.error.message })
    }
  }

  public closeModal(result?) {
    this.dialogRef.close(result)
  }

  /** SEÇÃO DE PAGAMENTOS */

  public async generatePix(regenerate?: boolean) {
    if (regenerate && this.websocket.connection.readyState) {
      this.websocket.disconnect()
    }
    this.pixRegeneration = false
    this.loading = true
    this.cardError = null
    if (!regenerate) {
      await this.sendRequestToADM()
      this.orderId = this.pendingCart.id
    }
    const pixObject = {
      externalReference: {
        cartId: this.orderId,
      },
      billingType: 'PIX',
      dueDate: DateTime.local().toFormat('yyyy-MM-dd'),
      name: this.customer.name,
      document: String(this.cartRequest.secretNumber),
      value:
        this.convertToNumber(this.totalCart()) -
        this.cupomValue() +
        (this.cupom?.type === 'freight' || this.typeDelivery === 'local' ? 0 : this.taxDeliveryValue),
      description: `${this.translate.text().order} ${this.clientData.name} - WhatsMenu`,
      walletId: this.clientData.options.asaas.walletId,
      clientId: this.customer.id,
    }

    const apiQuery = await this.api.getPix(this.clientData.slug, pixObject)

    this.websocket.connect.subscribe(async ({ type, data }: { type: 'connection' | 'request' | 'command' | 'profile'; data: any }) => {
      setTimeout(() => {
        return (this.pixRegeneration = true)
      }, 300 * 1000)

      this.websocket.subscribe('profile', this.pixInvoice.id)

      if (type === 'connection') {
        const order = await this.api.verifyOrder(this.orderId)
        if (order.statusPayment === 'paid') {
          return this.closeModal({ success: true, sendMessage: this.sendMessage })
        }
      }

      if (type === 'profile') {
        return this.closeModal({ success: true, sendMessage: this.sendMessage })
      }
    })

    this.loading = false
    this.scrollTo('copy-paste', 1000)

    if (!apiQuery.payment.success) {
      this.cardError = `${this.translate.text().error_generating_qrcode}`
    }

    this.pixInvoice = {
      copyPaste: apiQuery.payment.payload,
      qrCode: apiQuery.payment.encodedImage,
      id: apiQuery.id,
    }

    return /* this.checkPixPayment() */
  }

  public async verifyPix() {
    const order = await this.api.verifyOrder(this.orderId)
    if (order.cart.statusPayment === 'paid') {
      return this.closeModal({ success: true, sendMessage: this.sendMessage })
    } else {
      this.scrollTo('cardError', 300)
    }
    this.cardError = this.translate.text().payment_not_detected_check_banking
  }

  public calculateOrderTotal() {
    return Number(
      Math.fround(
        this.convertToNumber(this.totalCart()) -
          this.cupomValue() +
          (this.cupom?.type === 'freight' || this.typeDelivery === 'local' ? 0 : this.taxDeliveryValue)
      ).toFixed(2)
    )
  }

  public async processCardOrder() {
    try {
      let customerId = this.customer.controls.asaas?.id

      if (!customerId) {
        customerId = ((await this.createAsaasCustomer()) as any).id
      }
      let pendingCart = this.pendingCart || (await this.sendRequestToADM())
      this.loading = true
      this.processingAnOnlineOrder = true
      const cardInfo = this.selectedCard
        ? { ...this.selectedCard, id: this.billing.card.cvv }
        : {
            creditCard: {
              number: this.billing.card.number,
              holderName: this.billing.card.holder_name,
              expiryMonth: this.billing.card.exp.match(/.{1,2}/g)[0],
              expiryYear: this.billing.card.exp.match(/.{1,2}/g)[1],
              ccv: this.billing.card.cvv,
            },
            creditCardHolderInfo: {
              name: this.billing.card.holder_name,
              cpfCnpj: this.context.superNormalize(this.billing.document),
              phone: this.customer.whatsapp,
              email: this.customer.email || 'email@whatsmenu.com.br',
              postalCode: this.billing.address.zip_code,
              addressNumber: this.billing.address.line_1,
            },
          }
      const orderInfo = {
        customer: customerId,
        billingType: 'CREDIT_CARD',
        value: this.calculateOrderTotal(),
        dueDate: DateTime.now().toFormat('yyyy-MM-dd'),
        saveCard: this.saveCard,
        externalReference: {
          cartId: this.pendingCart.id,
        },
        description: `Pedido ${this.clientData.name} - WhatsMenu`,
      }
      const order = await this.api.processCard(this.clientData.slug, {
        card: cardInfo as any,
        order: orderInfo,
        restaurantWalletId: this.clientData.options.asaas.walletId,
        clientId: this.customer.id,
      })
      if (order.statusPayment === 'paid') {
        return this.closeModal({ success: true, sendMessage: this.sendMessage })
      } else {
        this.cardError = this.translate.text().error_processing_payment
      }
    } catch (error) {
      console.log(error)
      this.cardError = typeof error?.error?.message === 'string' ? error?.error?.message : this.translate.text().error_processing_payment
    } finally {
      this.loading = false
    }

    /* if (!cardToken.creditCardToken) throw new Error('Erro ao criar token do cartão. Por favor tente novamente.')

    const cardObject = {
      customerId: this.customer.id,
      asaasId: this.customer.controls.asaasId,
      value: this.calculateOrderTotal(),
      card: { ...cardToken, uuid: this.billing.card.cvv },
      dueDate: DateTime.now().toFormat('yyyy-MM-dd'),
      shopkeeperWallet: this.clientData.options.asaas.walletId,
      description: `Pedido ${this.clientData.name} - WhatsMenu`,
    }
    const apiQuery = await this.api.processCard(this.clientData.slug, cardObject)

    if (apiQuery?.status === 'paid') {
      this.sendRequestToADM()
      this.processingAnOnlineOrder = false
      console.log('caiu aqui')
      return this.closeModal({ success: true, sendMessage: this.sendMessage })
    } else {
      this.loading = false
      this.cardError = apiQuery?.message || 'Erro ao processar cartão. Por favor tente novamente.'
      this.scrollTo('cardError', 500)
      return (this.processingAnOnlineOrder = false)
    } */
  }

  public async deleteCreditCard(creditCardNumber: string) {
    this.selectedCard = null
    try {
      const { client } = await this.api.deleteCard(this.clientData.slug, { clientId: this.customer.id, creditCardNumber })
      this.customer = client
      if (!this.customer.controls.asaas.cards.length) {
        this.showForm = true
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  public async createAsaasCustomer() {
    try {
      const customerBody = {
        id: this.customer.id,
        asaas: {
          name: this.billing.card.holder_name,
          cpfCnpj: this.context.superNormalize(this.billing.document),
          mobilePhone: this.customer.whatsapp,
          email: this.customer.email,
          postalCode: this.billing.address.zip_code,
          addressNumber: this.billing.address.line_1,
        },
      }
      const newCustomer = await this.api.createRestaurantCustomer(customerBody)
      return newCustomer
    } catch (error) {
      console.log(error)
      throw new Error(this.translate.text().error_creating_customer)
    }
  }

  public resetCardError() {
    this.cardError = false
  }

  public validatePixCPF(): string | boolean {
    if (this.cartRequest.formsPayment[0].label === 'Pix' && !cpf.isValid(this.cartRequest.secretNumber)) {
      return `${this.translate.text().enter_a_valid_cpf}`
    }
    return false
  }
}
