import { AfterViewChecked, Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { DateTime } from 'luxon'
import { AlertComponent } from '../alert/alert.component'
// import * as Ws from '@adonisjs/websocket-client';

import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { CartType } from 'src/app/cart-type'
import { FormPaymentType } from 'src/app/client-type'
import { CupomType } from 'src/app/cupom'
import { DeliveryType } from 'src/app/delivery-type'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { ApiService } from 'src/app/services/api/api.service'
import { environment } from 'src/environments/environment'

import { faArrowLeft, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { AddressComponent, AddressComponentData } from 'src/app/address/address.component'
import { CartRequestType } from 'src/app/cart-request-type'
import { CustomerType } from 'src/app/customer-type'
import { ProfileType } from 'src/app/profile-type'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { Flag } from '../../formpayment-type'
import { DialogConfirmDateComponent } from '../dialog-confirm-date/dialog-confirm-date.component'
import { ListAdressesComponent } from '../list-adresses/list-adresses.component'
import { TranslateService } from 'src/app/translate.service'

declare const fbq: any

@Component({
  selector: 'app-form-payment',
  templateUrl: './cart-details.component.html',
  styleUrls: ['./cart-details.component.scss'],
})
export class CartDetailsComponent implements OnInit, OnDestroy, AfterViewChecked {
  clientData: ProfileType
  customer: CustomerType
  cart: CartType[] = []
  cartRequest: CartRequestType
  cartPizza: CartFlavorPizzaType[] = []
  whatsCart: CartType[] = []
  whatsCartPizza: CartPizza[] = []
  private requestCode = 0
  cupom: CupomType
  obs: string | null
  secretNumber: string | null
  enableSend = true
  formsPayment: FormPaymentType[]
  paymentFlag: Flag
  enableDeliveryAddress: boolean
  cupomCode: string
  cupomIsValid: boolean
  change: number | null
  pixInvoice: any
  cupomValue: number
  clientInfo: { id: number | null; defaultAddressId: number | null } = { id: null, defaultAddressId: null }

  taxDeliveryValue = -1
  timeDelivery = ''
  notNeedTransshipment = false
  popupblock = false
  viewContentAlternate: 'D' | 'P'

  // delivery: DeliveryType = {
  //   formPayment: '',
  //   formPaymentFlag: '',
  //   transshipment: '',
  //   name: '',
  //   contact: '',
  //   zipCode: '',
  //   street: '',
  //   number: '',
  //   id: null,
  //   complement: '',
  //   neighborhood: '',
  //   reference: '',
  //   city: '',
  //   uf: '',
  //   latitude: NaN,
  //   longitude: NaN,
  //   distance: NaN,
  // }
  // addressConfirm: boolean = true;

  arrowLeft = faArrowLeft
  chevronDown = faChevronDown
  chevronUp = faChevronUp

  // Variáveis de encomendas
  datesAndHours = {}
  Math: any

  totalModal: boolean
  paidTaxDelivery: number

  delivery = this.data.customer.addresses.find((a) => a.id === this.data.clientInfo.defaultAddressId)

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data,
    private api: ApiService,
    public translate: TranslateService,
    private matDialog: MatDialog,
    public cartService: CartService,
    public context: ContextService
  ) {}

  ngOnInit(): void {
    this.clientData = this.data.clientData
    this.cart = this.data.cart
    this.cartPizza = this.data.cartPizza
    this.cartRequest = {
      ...this.data.cartRequest,
      addressId: 0,
      clientId: this.data.customer.id,
      cupomId: this.cupom?.id,
      commandId: null,
      bartenderId: null,
      itens: this.cartService.cartItem(this.cart, this.cartPizza, this.data.viewContentAlternate || 'D'),
      cashierId: null,
      obs: this.obs,
      type: this.data.viewContentAlternate || undefined,
      taxDelivery: this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery),
      typeDelivery: null,
      formsPayment: [
        {
          flags: [],
          label: '',
          status: true,
          payment: '',
          change: null,
        },
      ],
      secretNumber: this.secretNumber,
    }
    this.defineStoreMethod()
    this.paymentFlag = null

    this.customer = this.data.customer
    // if (this.customer.addresses.length) {
    //   this.delivery = this.customer.addresses[this.customer.addresses.length - 1]
    // }
    // console.log(this.customer);

    this.whatsCart = this.data.cart
    this.viewContentAlternate = this.data.viewContentAlternate
    this.whatsCartPizza = this.data.cartPizza
    this.requestCode = this.data.requestCode
    this.timeDelivery = this.data.timeDelivery
    this.taxDeliveryValue = this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery)
    this.cupom = this.data.cupom
    this.cupomCode = this.cupom?.code || ''
    this.cupom && this.verifyCupom()
    this.datesAndHours = this.data.datesAndHours
    this.enableDeliveryAddress = this.enableDelivery()
    this.totalModal = false

    if (this.isSafari()) {
      this.getRequestCode()
    }

    const actives = this.clientData.formsPayment.filter((f) => f.status === true)

    if (actives.length === 1) {
      switch (actives[0].payment) {
        case 'money':
          this.delivery.formPayment = 'Dinheiro'
          break

        case 'card':
          this.delivery.formPayment = 'Cartao'
          break

        case 'Debit':
          this.delivery.formPayment = 'Debito'
          break

        case 'Credit':
          this.delivery.formPayment = 'Credito'
          break

        case 'pix':
          this.delivery.formPayment = 'Pix'
          break

        case 'picpay':
          this.delivery.formPayment = 'PicPay'
          break
      }
    }

    const clientLocal = JSON.parse(localStorage.getItem(`${this.clientData?.slug}-clientInfo`))

    if (this.customer?.addresses.length) {
      clientLocal.defaultAddressId = this.customer?.addresses[0].id
      this.delivery = this.data.customer.addresses.find((a) => a.id === clientLocal.defaultAddressId)
      localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(clientLocal))
      // this.cartRequest.addressId = this.delivery.id
    }

    this.cartRequest.taxDelivery = this.cartRequest.addressId ? this.cartRequest.taxDelivery : 0
  }

  ngOnDestroy(): void {
    this.data.removeCupom()
  }

  // public time() {
  //   if (this.clientData.typeDelivery === 'km') {
  //     const expectedTime = this.context.calculateDeliveryEstimates(this.delivery)?.time
  //       ? this.context.calculateDeliveryEstimates(this.delivery).time +
  //         (this.context.calculateDeliveryEstimates(this.delivery).time === 'A consultar' ? '' : ' Minutos')
  //       : 'ver'
  //     return expectedTime
  //   }
  //   if (this.clientData.typeDelivery === 'neighborhood') {
  //     const expectedTime = this.clientData.taxDelivery
  //       .find((city) => city.city === this.delivery.city)
  //       .neighborhoods.find((n) => n.name === this.delivery.neighborhood)
  //     return expectedTime.time
  //   }
  // }

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
    return this.viewContentAlternate
  }

  ngAfterViewChecked(): void {
    this.cartRequest.taxDelivery = this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery)
  }

  public enableDelivery() {
    if (this.clientData.typeDelivery === 'neighborhood') {
      const city = this.clientData.taxDelivery.find((location) => location?.city === this.delivery?.city)

      if (!city) return false

      if (!city.neighborhoods.find((location) => location.name === this.delivery.neighborhood)) return false
      return true
    }
    if (this.delivery) {
      return this.clientData.taxDelivery.some((tax) => tax.distance >= this.delivery.distance / 1000)
    }
    return false
  }

  // public defaultDelivery() {
  //   if (localStorage.getItem(`${this.clientData.slug}`)) {
  //     let defaultDelivery = JSON.parse(localStorage.getItem(`${this.clientData.slug}`) || '')
  //     /* this.cartRequest.addressId = defaultDelivery.id;   */
  //     return defaultDelivery
  //   }
  //   return this.data.customer.addresses[0]
  // }

  public closePaymentModal() {
    this.dialogRef.close({ send: false, targetModal: 'back', cupom: this.cupom })
  }

  // public async closeSendOnly() {
  //   this.saveAddress()
  //   this.dialogRef.close({ send: true, cupom: this.cupom })
  // }

  private wsNotConnected() {
    alert('A página precisa ser recarregada!')
    location.reload()
  }

  public totalCart() {
    return this.cartService.totalCartValue(this.cart, this.cartPizza, this.cartRequest)
  }

  public async setPaymentForm(form: string) {}

  public validationPaymentForm(): string {
    this.enableDeliveryAddress = this.enableDelivery()

    if (localStorage.getItem(`${this.clientData.slug}-bl`) && localStorage.getItem(`${this.clientData.slug}-bl`) === '1') {
      return `${this.translate.text().you_are_blocked}!`
    }

    if (!this.customer.name) {
      return `${this.translate.text().enter_your_name}!`
    }

    if (!this.customer.whatsapp) {
      return `${this.translate.text().enter_your_cell}!`
    }

    if (this.customer.whatsapp.length < 10) {
      return `${this.translate.text().enter_you_ddd}!`
    }

    if (this.cartRequest.typeDelivery === 'delivery' && this.clientData.minval && this.totalCart() < this.clientData.minval) {
      return `${this.translate.text().minimum_unconceived_value}! ${this.formatCurrency(this.clientData.minval)}`
    }

    if (this.cartRequest.typeDelivery === 'local' && this.clientData.minvalLocal && this.totalCart() < this.clientData.minvalLocal) {
      return `${this.translate.text().minimum_unconceived_value}! (${this.formatCurrency(this.clientData.minvalLocal)})`
    }

    if (this.cartRequest.typeDelivery === null) {
      return `${this.translate.text().select_shipoing}!`
    }

    if ((this.delivery?.city === 'others' || this.delivery?.neighborhood === 'others') && this.cartRequest.typeDelivery === 'delivery') {
      return `${this.translate.text().outside_the_coverage_area}!`
    }

    const val =
      this.totalCart() +
      (this.cartRequest.addressId && this.taxDeliveryValue > 0 ? this.convertToNumber(this.taxDeliveryValue) : 0) -
      this.cartService.cupomValue(this.cupom, this.cartRequest)
    if (
      !this.notNeedTransshipment &&
      this.cartRequest.formsPayment[0].label === 'Dinheiro' &&
      (!this.change || this.change < this.convertToNumber(val))
    ) {
      return 'Revise o valor do troco!'
    }

    if (!this.cartService.dayDisponiblity({ profile: this.clientData, cartRequest: this.cartRequest })) {
      return 'Horário Encerrado!'
    }

    if (!navigator.onLine) {
      return 'Sem Internet!'
    }

    return this.cartRequest.formsPayment[0].payment === 'pix' ? this.translate.text().finish_payment_pix : this.translate.text().go_to_payment
  }

  private convertToFloat(text: string) {
    const total =
      this.convertToNumber(this.totalCart()) +
      (this.cartRequest.addressId && this.taxDeliveryValue > 0 ? this.convertToNumber(this.taxDeliveryValue) : 0) -
      this.cartService.cupomValue(this.cupom, this.cartRequest)
    const value = text ? parseFloat(text.trim().replace(',', '.')) : NaN

    if (!value || (value && value < total) || value > total + 200) {
      return null
    }

    return value
  }

  public resetTransshipment(event: boolean) {
    if (event) {
      this.change = null
    }
  }

  public async searchZipCode() {
    this.delivery.city = ''

    if (this.delivery.zipCode && this.delivery.zipCode.length === 8) {
      const address: any = await this.api.getInfoByZipCode(this.delivery.zipCode)

      this.delivery.street = address.logradouro
      this.delivery.neighborhood = address.bairro
      this.delivery.city = address.localidade

      if (address.erro) {
        this.delivery.street = 'CEP não encontrado'
        this.delivery.neighborhood = 'CEP não encontrado'
        this.delivery.city = 'CEP não encontrado'
      }
    }
  }

  public calcProductTotalValue(product: CartType): number {
    let value = product.value

    if (product.promoteStatus) {
      value = product.promoteValue
    }

    product.complements.forEach((complement) => {
      value += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
    })

    return value * product.quantity
  }

  public getWhatsappNumber() {
    if (!environment.production) {
      return '5513997884443'
    }

    return this.clientData.whatsapp.split(' ').join('').replace('-', '')
  }

  private formatCurrency(val: any): string {
    let value = val
    if (typeof val === 'string') {
      value = parseFloat(val.replace(',', '.').replace('R$', '').split(' ').join(''))
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // public saveAddress() {
  //   localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(this.data.clientInfo))
  // }

  public async getRequestCode() {
    return (this.requestCode = null)
  }

  public openListAddressModal() {
    const confirmDialog = this.matDialog.open(ListAdressesComponent, {
      autoFocus: false,
      minWidth: '70vw',
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      maxWidth: window.innerWidth < 700 ? '100vw' : 'auto',
      data: {
        delivery: JSON.parse(JSON.stringify(this.delivery)),
        clientData: this.clientData,
        customer: this.customer,
        clientInfo: this.data.clientInfo,
      },
      closeOnNavigation: true,
    })
    confirmDialog.afterClosed().subscribe((result) => {
      if (result) {
        if (result.targetModal === 'addAddress') {
          this.addressConfirmProcess()
        }

        if (result.targetModal === 'paymentInfo') {
          this.delivery = result.data?.delivery
          this.customer.addresses = result.data?.allAddresses
          this.cartRequest.addressId = this.enableDeliveryAddress ? result.data?.delivery?.id : null
          this.data.clientInfo = result.data.clientInfo
          this.delivery = this.data.customer.addresses.find((a) => a.id === this.data.clientInfo.defaultAddressId)
          this.cartRequest.typeDelivery = 'delivery'
          this.enableDeliveryAddress = this.enableDelivery()
          this.calculateTaxDelivery(this.delivery)
          this.taxDeliveryValue = this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery)
          localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(this.data.clientInfo))
          setTimeout(() => {
            const option: any = document.querySelector('#deliveryOption0')
            option.checked = true
          }, 200)
          // console.log(this.delivery);
          // console.log(result.data.delivery?.id);
          // console.log(result);
          // console.log(this.cartRequest);
        }

        if (this.enableDeliveryAddress === false && result.targetModal !== 'addAddress') {
          return this.matDialog
            .open(AlertComponent, {
              closeOnNavigation: true,
              data: {
                title: 'Aviso',
                message: `<strong>Endereço fora da área de cobertura</strong><br>`,
                noReload: true,
              },
            })
            .afterClosed()
            .subscribe((result) => {
              if (this.delivery) {
                this.delivery.id = null
              }
              this.cartRequest.addressId = null
            })
        }
      }
    })
  }

  public addressConfirmProcess() {
    const confirmDialog = this.matDialog.open<AddressComponent, AddressComponentData>(AddressComponent, {
      autoFocus: false,
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      maxWidth: window.innerWidth < 700 ? '100vw' : 'auto',
      data: {
        clientData: this.clientData,
        addressRevalidation: true,
        customer: this.customer,
      },
      closeOnNavigation: true,
    })

    confirmDialog.afterClosed().subscribe(({ address }) => {
      if (!address) {
        return
      }

      if (address) {
        this.delivery = address
        this.calculateTaxDelivery(this.delivery)
        // localStorage.setItem(this.clientData.slug, JSON.stringify({ ...address, version: this.clientData.version }))
        this.cartRequest.addressId = address.id
        this.customer.addresses.unshift(address)
        this.cartRequest.typeDelivery = 'delivery'
        setTimeout(() => {
          const option: any = document.querySelector('#deliveryOption0')
          option.checked = true
        }, 200)
      }

      if (this.clientData.typeDelivery === 'km') {
        const taxValues = this.clientData.taxDelivery.filter((tax) => tax.distance * 1000 > address.distance)
        if (taxValues.length) {
          this.taxDeliveryValue = this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : Number(taxValues[0].value)
          this.timeDelivery = taxValues[0].time
        }
      } else {
        const city = this.delivery && this.clientData.taxDelivery.find((t) => t.city === this.delivery.city)
        if (city) {
          this.enableDeliveryAddress = true
          const tax = city.neighborhoods.find((n) => n.name === this.delivery.neighborhood)

          if (tax) {
            this.delivery.formPayment = undefined
            this.delivery.transshipment = undefined
            this.taxDeliveryValue = Number(tax.value)
            this.timeDelivery = tax.time
          }
        }
      }
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
        this.timeDelivery = taxValues[0].time
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
          this.timeDelivery = neighborhood.time
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
    return this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : tax
  }

  public openConfirmDateModal(modalProps: any) {
    const dialogDate = this.matDialog.open(DialogConfirmDateComponent, {
      data: {
        clientData: this.clientData,
        time: DateTime.fromFormat(this.clientData.fuso, 'yyyy-MM-dd HH:mm'),
        datesAndHours: this.datesAndHours,
        ...modalProps,
      },
      maxWidth: '100vw',
      width: window.innerWidth < 700 ? '100vw' : '400px',
      height: window.innerWidth < 700 ? '100vh' : '800px',
    })

    dialogDate.afterClosed().subscribe(async (time) => {
      if (!time && time !== null) {
        this.enableSend = true
        return
      }

      if (time === null) {
        localStorage.removeItem('packageDate')
        this.cart = []
        this.data.packageDate = null
        this.enableSend = true
        return
      }

      localStorage.setItem('packageDate', time.toFormat(`yyyy-MM-dd HH:mm`))
      this.data.dataPackage = time
      this.cartRequest.packageDate = time.toFormat(`yyyy-MM-dd HH:mm`)
      this.data.modifyData(time)
      this.enableSend = true
    })
  }

  public isSafari() {
    return false
  }

  public disponibility() {
    const today = DateTime.fromISO(this.clientData.fuso, { zone: this.clientData.timeZone }).toFormat('EEEE').toLowerCase()
    const convert = (text) => parseFloat(text.replace(':', '.'))

    if (!this.clientData.week[today]) {
      return false
    }
    const now = parseFloat(DateTime.local().setZone(this.clientData.timeZone).toFormat('HH.mm'))
    const filter = this.clientData.week[today].filter((d) => now >= convert(d.open) && now <= convert(d.close))

    if (filter.length) {
      return true
    }

    return false
  }

  public getPayment(name: string): CartFormPaymentType {
    return this.clientData.formsPayment.find((f) => f.payment === name)
  }

  public trackBy(index: number, item: any): number {
    return item.id
  }

  public getPaymentsCardsOnly() {
    return this.clientData.formsPayment.filter(
      (f) => f.payment === 'credit' || f.payment === 'debit' || f.payment === 'snack' || f.payment === 'food'
    )
  }

  public removeEmojiString(text: string) {
    const rgx =
      /([\uD800-\uDBFF][\uDC00-\uDFFF](?:[\u200D\uFE0F][\uD800-\uDBFF][\uDC00-\uDFFF]){2,}|\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F\u200D[\u2640\u2642]|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F)/

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

  convertToNumber(text: string | number) {
    const numberfy = Number(text)
    if (!text || !numberfy) {
      return 0
    }

    return numberfy
  }

  async closeToPayment() {
    if (
      (this.cartRequest.typeDelivery === 'delivery' && this.clientData.minval && this.totalCart() < this.clientData.minval) ||
      (this.cartRequest.typeDelivery === 'local' && this.clientData.minvalLocal && this.totalCart() < this.clientData.minvalLocal)
    ) {
      return
    }
    this.cartRequest = {
      ...this.cartRequest,
      itens: this.cartService.cartItem(this.cart, this.cartPizza, this.defineStoreMethod()),
      address: this.cartRequest.typeDelivery === 'local' ? null : this.delivery,
      addressId: this.cartRequest.typeDelivery === 'local' ? null : this.delivery.id,
      type: this.defineStoreMethod(),
      taxDelivery: this.context.calculateTaxDelivery(this.delivery, this.clientData, this.delivery),
      cupomId: this.cupom?.id,
      //total: (this.convertToNumber(this.totalCart()) - this.cartService.cupomValue(this.cupom, this.cartRequest)) + (this.calculateTaxDelivery(this.delivery) > 0 && this.cartRequest.typeDelivery === 0 ? this.convertToNumber(this.calculateTaxDelivery(this.delivery)) : 0),
      total: this.convertToNumber(this.totalCart()),
      formsPayment:
        this.cartRequest.formsPayment[0].payment === 'money'
          ? [{ ...this.cartRequest.formsPayment[0], change: this.change }]
          : [
              {
                ...this.cartRequest.formsPayment[0],
                flag: this.getPayment(this.cartRequest.formsPayment[0].payment)?.flags ? this.paymentFlag : null,
              },
            ],
    }

    this.dialogRef.close({
      paymentModal: true,
      cartRequest: this.cartRequest,
      customer: this.customer,
      typeDelivery: this.cartRequest.typeDelivery,
      delivery: this.delivery,
      taxDeliveryValue: this.taxDeliveryValue,
      cupom: this.cupomIsValid ? this.cupom : null,
    })
  }

  public currency(value: number) {
    return (value ? value : 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  public openClientIdModal() {
    this.dialogRef.close({ targetModal: 'clientId', cupom: this.cupom })
  }

  public scrollToStep(id: string) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  public verifyCupom(): void {
    const storedClientInfo = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`))
    if (storedClientInfo) {
      this.clientInfo = storedClientInfo
    }
    // tslint:disable-next-line: no-unused-expression
    this.cupomCode !== undefined &&
      this.api
        .getCupom(this.clientData.slug, this.cupomCode, this.clientInfo.id)
        .then((cupom) => {
          if (this.totalCart() >= cupom.minValue) {
            this.cupom = cupom
            this.data.cupom = cupom
            this.cartRequest.cupom = cupom
            this.cupomIsValid = true
            this.calculateTaxDelivery(this.delivery)
          } else {
            this.matDialog.open(AlertComponent, {
              data: {
                message: `Esse cupom só pode ser usado em compras a partir de ${this.formatCurrency(
                  cupom.minValue
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

  public handlePaymentFlag(code: string, type: string): void {
    const flags = this.getPayment(type).flags
    if (flags) {
      this.paymentFlag = flags.find((flag) => flag.code === code)
    }
  }

  public requiredSection(messages: string[], title: boolean = false) {
    const background = document.body.style.getPropertyValue('--bg-theme')
    const color = 'white'

    if (messages.includes(this.validationPaymentForm())) {
      if (title) {
        return { color: color }
      }
      return { background: background }
    }

    return {}
  }

  public verifyDeliveryDisponibility() {
    const ambient = localStorage.viewContentAlternate
    const result = { delivery: false, local: false }

    switch (ambient) {
      case 'D':
        result.delivery = !this.clientData.options.delivery.disableDelivery
        result.local = this.clientData.deliveryLocal
        break

      case 'delivery':
        result.delivery = !!this.clientData.options.delivery.disableDelivery
        result.local = this.clientData.deliveryLocal
        break

      case 'P':
        result.delivery = this.clientData.options.package.shippingDelivery.active
        result.local = this.clientData.options.package.shippingLocal.active
        break

      case 'package':
        result.delivery = this.clientData.options.package.shippingDelivery.active
        result.local = this.clientData.options.package.shippingLocal.active
        break

      default:
        result.delivery = !this.clientData.options.delivery.disableDelivery
        result.local = this.clientData.deliveryLocal
    }

    return result
  }
}
