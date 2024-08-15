import { AfterViewChecked, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core'
import { MatBottomSheet } from '@angular/material/bottom-sheet'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { faCcMastercard, faCcVisa } from '@fortawesome/free-brands-svg-icons'
import { faArrowLeft, faChevronRight, faCreditCard, faEllipsisVertical, faPaste, faRotate } from '@fortawesome/free-solid-svg-icons'
import { DateTime } from 'luxon'
import { CreateCardTokenType } from 'src/app/asaas-type'
import { CartItem, CartRequestType } from 'src/app/cart-request-type'
import { CustomerCardType, CustomerType } from 'src/app/customer-type'
import { AddonFormPaymentType, CartFormPaymentType } from 'src/app/formpayment-type'
import { ComplementType } from 'src/app/product-type'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import { emojiRegex } from 'src/app/services/utils/emojiRegex'
import { WebsocketService } from 'src/app/services/websocket/websocket.service'
import { environment } from 'src/environments/environment'
import {
  CartPaymentCardCheckCvvComponent,
  CartPaymentCardCheckCvvComponentReturn,
} from '../cart-payment-card-check-cvv/cart-payment-card-check-cvv.component'
import {
  CartPaymentCardOptionsComponent,
  CartPaymentCardOptionsComponentData,
  CartPaymentCardOptionsComponentReturn,
} from '../cart-payment-card-options/cart-payment-card-options.component'
import { ConfirmOrderComponent } from '../confirm-order/confirm-order.component'
import { TranslateService } from 'src/app/translate.service'

export declare const fbq: any
export declare const gtag: any

export type CartPaymentComponentData = {
  clientData: ProfileType
  cartRequest: CartRequestType
  customer: CustomerType
}

export type CustomerCardTypeWithCodeAndId = CustomerCardType & { code: number; id?: string }

@Component({
  selector: 'app-cart-payment',
  templateUrl: './cart-payment.component.html',
  styleUrls: ['./cart-payment.component.scss', '../../../styles/modals.scss'],
})
export class CartPaymentComponent implements OnInit, AfterViewChecked {
  paymentType: 'online' | 'local'
  paymentLayout: null | 'pix' | 'card'

  disabledPaymentChecked = false
  disabledPaymentDefault = false

  pixSteps = [
    'Digite seu CPF para gerar uma chave PIX',
    'Acesse seu APP de Pagamentos',
    'Escaneie o QR Code ou Copie e Cole o Código de Pagamento',
    'Pague e será creditado na hora',
  ]

  cards: CustomerCardTypeWithCodeAndId[] = []
  newCard: CreateCardTokenType
  selectedCard: CustomerCardTypeWithCodeAndId
  cardValidateDate: string
  cardAddress: {
    street: string
    state: string
    city: string
  }

  pixInvoice = { copyPaste: '', qrCode: '', id: '' }
  pixRegeneration = false

  loading = false
  onlineAccepted = this.data.clientData.options.legacyPix
    ? []
    : ['pix', 'credit'].filter((item) => {
        switch (item) {
          case 'pix':
            return this.data.clientData.options.onlinePix
          case 'credit':
            return this.data.clientData.options.onlineCard
        }
      })
  offlineFormsPayment: CartFormPaymentType[]
  onlineFormsPayment: CartFormPaymentType[]
  formPaymentSelected: CartFormPaymentType
  hasPendingCart = false
  changeIsHigher = false

  @ViewChild('submitCartButton') submitCartButton: ElementRef<HTMLButtonElement>
  @ViewChild('createCardButton') createCardButton: ElementRef<HTMLButtonElement>

  // ICONS
  faArrowLeft = faArrowLeft
  faChevronRight = faChevronRight
  faPaste = faPaste
  faRotate = faRotate
  faEllipsisVertical = faEllipsisVertical
  faCcVisa = faCcVisa
  faCcMastercard = faCcMastercard
  faCreditCard = faCreditCard

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CartPaymentComponentData,
    public dialogRef: MatDialogRef<any, { targetModal: 'back' }>,
    private matDialog: MatDialog,
    private matBottomSheet: MatBottomSheet,
    private api: ApiService,
    public translate: TranslateService,
    private websocket: WebsocketService,
    private context: ContextService,
    public cartService: CartService,
    public toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.paymentType = this.hasOnlineChoices() && !this.data.clientData.options.legacyPix && this.data.clientData.options.asaas ? 'online' : 'local'
    this.paymentLayout = null
    this.offlineFormsPayment = this.data.clientData.formsPayment
      .filter((f) => f.status)
      .filter((f) => !this.onlineAccepted.filter((item) => item !== 'credit').includes(f.payment))
    this.onlineFormsPayment = this.data.clientData.formsPayment.filter((f) => f.status).filter((f) => this.onlineAccepted.includes(f.payment))
    this.formPaymentSelected = this.paymentType === 'online' ? this.onlineFormsPayment[0] : this.offlineFormsPayment[0]
    if (this.data.customer.controls?.asaas?.cards.length) {
      this.cards = this.data.customer.controls.asaas.cards.map((card, index) => ({ ...card, code: index }))
    }
    this.cardAddress = {
      city: '',
      state: '',
      street: '',
    }
    this.cardValidateDate = ''
    this.newCard = {
      creditCard: {
        ccv: '',
        expiryMonth: '',
        expiryYear: '',
        holderName: '',
        number: '',
      },
      creditCardHolderInfo: {
        addressNumber: '',
        cpfCnpj: this.data.customer.secretNumber || '',
        email: this.data.customer.email,
        mobilePhone: this.data.customer.whatsapp,
        name: this.data.customer.name,
        postalCode: '',
        addressComplement: '',
      },
      surname: '',
      type: 'credit',
    }
    this.formPaymentSelected.change = null
    this.data.cartRequest.paymentType = this.paymentType
    this.data.customer.secretNumber = this.data.customer.secretNumber ?? ''
  }

  ngAfterViewChecked(): void {
    this.updatePaymentDefaultAndChecked()
    this.data.cartRequest.paymentType = this.paymentType
    this.formPaymentSelected.value = this.cartService.totalCartFinalValue({
      cartRequest: this.data.cartRequest,
      formPayment: this.formPaymentSelected,
    })
    if (this.paymentType === 'local') {
      const cashback = this.data.cartRequest.formsPayment.find((formPayment) => formPayment.payment === 'cashback')
      this.data.cartRequest.formsPayment[0] = this.formPaymentSelected
      if (cashback) {
        this.data.cartRequest.formsPayment[1] = cashback
      }
    }
    if (this.paymentType === 'online') {
      this.data.cartRequest.formsPayment = this.data.cartRequest.formsPayment.filter((formPayment) => formPayment.payment === 'cashback')
    }
  }

  updatePaymentDefaultAndChecked() {
    const cashback = this.data.cartRequest.formsPayment
      .filter((formPayment) => formPayment.payment === 'cashback')
      .reduce((cashbackTotalValue, formPayment) => (cashbackTotalValue += formPayment.value), 0)
    this.disabledPaymentChecked = cashback >= this.data.cartRequest.total
    this.disabledPaymentDefault = cashback >= this.data.cartRequest.total

    if (cashback >= this.data.cartRequest.total) {
      this.data.cartRequest.formsPayment = this.data.cartRequest.formsPayment.filter((formPayment) => formPayment.payment === 'cashback')
    }
  }

  getTitle() {
    switch (this.paymentLayout) {
      case 'card':
        return 'Online Cartão'
      case 'pix':
        return 'Online Pix'
      default:
        return ''
    }
  }

  creditCardIcon(firstNumber: string) {
    switch (firstNumber) {
      case '4':
      case 'VISA':
        return this.faCcVisa
      case '5':
      case 'MASTERCARD':
        return this.faCcMastercard
      default:
        return this.faCreditCard
    }
  }

  back() {
    if (this.paymentLayout) {
      this.paymentLayout = null
      return
    }
    this.dialogRef.close({ targetModal: 'back' })
  }

  setOnlineFormPayment(payment: 'pix' | 'credit', paymentLayout: 'pix' | 'card' | null) {
    if (paymentLayout === 'card' && !this.data.clientData.options.onlineCard) {
      paymentLayout = 'pix'
      payment = 'pix'
    }
    this.paymentLayout = paymentLayout
    this.formPaymentSelected = { ...this.onlineFormsPayment.find((f) => f.payment === payment) }
    if (payment === 'pix' && this.data.customer.secretNumber) {
      this.createCart()
    }
  }

  // handleSetSameCartAddress() {
  //   this.newCard.creditCardHolderInfo = {
  //     ...this.newCard.creditCardHolderInfo,
  //     postalCode: this.data.cartRequest.address.zipcode ?? this.newCard.creditCardHolderInfo.postalCode,
  //     addressNumber: (this.data.cartRequest.address.number ?? 0).toString(),
  //     addressComplement: this.data.cartRequest.address.complement ?? this.newCard.creditCardHolderInfo.addressComplement
  //   }
  // }

  createCardSubmitButtonText() {
    const { postalCode, addressNumber } = this.newCard.creditCardHolderInfo
    if (this.createCardButton) {
      this.createCardButton.nativeElement.disabled = postalCode.length < 8 || !addressNumber
    }
    if (postalCode.length < 8) return 'Informe o CEP'
    if (!addressNumber) return 'Informe o número'
    return 'Salvar cartão e Finalizar Pagamento'
  }

  // Visto: Alterna Local e Online
  handlePaymentTypeAlternate() {
    this.paymentType = this.paymentType === 'local' ? 'online' : 'local'
    this.formPaymentSelected = this.paymentType === 'online' ? this.onlineFormsPayment[0] : this.offlineFormsPayment[0]
    if (this.paymentType === 'local') {
      this.data.cartRequest.formsPayment = []
    }
  }

  // Visto: Checar o CVV
  handleCheckCVV(card: CustomerCardTypeWithCodeAndId) {
    this.selectedCard = card
    this.formPaymentSelected = this.getFormpayment('credit')
    this.setOnlineFormPayment('credit', null)
    this.matBottomSheet
      .open<CartPaymentCardCheckCvvComponent, any, CartPaymentCardCheckCvvComponentReturn>(CartPaymentCardCheckCvvComponent, {})
      .afterDismissed()
      .subscribe((result) => {
        if (result) {
          const { cvv } = result
          this.selectedCard.id = cvv
          this.createCart()
        }
      })
  }

  handleCardOptions(card: CustomerCardTypeWithCodeAndId) {
    const cardOptions = this.matBottomSheet.open<
      CartPaymentCardOptionsComponent,
      CartPaymentCardOptionsComponentData,
      CartPaymentCardOptionsComponentReturn
    >(CartPaymentCardOptionsComponent, {
      data: {
        card,
      },
    })
    cardOptions.afterDismissed().subscribe((result) => {
      if (result) {
        const { action, updatedCard } = result
        switch (action) {
          case 'delete':
            this.deleteAsaasCard(updatedCard)
            this.cards = this.cards.filter((c) => c.code !== updatedCard.code)
            break
          case 'update':
            this.cards = this.cards.map((c) => {
              if (c.creditCardNumber === updatedCard.creditCardNumber) {
                return updatedCard
              }
              return c
            })
            break
        }
      }
    })
  }

  addonCalcResult(addon: AddonFormPaymentType) {
    let result = 0
    addon.value = Number(addon.value)
    if (addon.status) {
      result = addon.valueType === 'percentage' ? this.data.cartRequest.total * (addon.value / 100) : addon.value
      if (addon.type === 'discount') {
        result = result * -1
      }
    }
    return result
  }

  addonDisplay(formPayment: CartFormPaymentType): string {
    if (formPayment.addon?.status) {
      const valueFormatted = this.addonCalcResult(formPayment.addon).toFixed(2)

      return (
        formPayment.addon?.type === 'fee'
          ? `${this.translate.text().fee_comment} +${valueFormatted}`
          : `${this.translate.text().discount_comment} ${valueFormatted}`
      ).concat(formPayment.addon?.valueType === 'percentage' ? ` (${formPayment.addon?.value}%)` : '')
    }
    return ''
  }

  getFormpayment(payment: string) {
    return this.data.clientData.formsPayment.find((formPayment) => formPayment.payment === payment)
  }

  hasOnlineChoices() {
    return this.onlineAccepted.some((payment) => !!this.getFormpayment(payment)?.status)
  }

  splitValidateDate(value: string) {
    const [expiryMonth, expiryYear] = value.match(/.{1,2}/g)
    this.newCard.creditCard.expiryMonth = expiryMonth
    this.newCard.creditCard.expiryYear = expiryYear
  }

  submitButtonValidation() {
    const { total, taxDelivery, cupom, addressId } = this.data.cartRequest

    if (!this.cartService.dayDisponiblity({ profile: this.data.clientData, cartRequest: this.data.cartRequest })) {
      return { buttonText: this.translate.text().time_closed_comment, disable: true }
    }
    const totalCartValueSum =
      total +
      (addressId ? taxDelivery : 0) +
      this.addonCalcResult(this.formPaymentSelected.addon) -
      this.cartService.cupomValue(cupom, this.data.cartRequest) -
      this.cashbackValueAvaliable()

    if (this.formPaymentSelected.change !== null) {
      this.changeIsHigher = this.formPaymentSelected.change > totalCartValueSum
    }

    let disable = false
    let buttonText = this.translate.text().finalize_order_comment

    if (this.cartService.totalCartFinalValue({ cartRequest: this.data.cartRequest, isOnline: this.paymentType === 'online' }) <= 0) {
      return { buttonText, disable }
    }

    switch (this.formPaymentSelected.payment) {
      case 'money':
        disable = !this.changeIsHigher
        if (disable) {
          buttonText = this.translate.text().change_less_purchase_comment
        }
        return { buttonText, disable }
      case 'pix':
      case 'picpay':
        return { buttonText, disable }
      default:
        this.formPaymentSelected.change = null
        if (this.formPaymentSelected.flags?.length && !this.formPaymentSelected.flag) {
          disable = true
          buttonText = this.translate.text().select_the_flag_comment
        }
        return { buttonText, disable }
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.formPaymentSelected.key.value)
    this.toastService.show(`Chave ${this.formPaymentSelected.label} copiada com sucesso`, {
      classname: 'bg-success text-light text-center pos middle-center',
      delay: 3000,
    })
  }

  copyToClipboardOnline() {
    navigator.clipboard.writeText(this.pixInvoice.copyPaste)
    this.toastService.show(`Copiada com sucesso`, {
      classname: 'bg-success text-light text-center pos middle-center',
      delay: 3000,
    })
  }

  removeEmojiString(text: string) {
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

  sendMessage() {
    const whatsapp = !environment.production ? '5513997884443' : this.data.clientData.whatsapp.split(' ').join('').replace('-', '')
    const popup = window.open(`https://wa.me/${whatsapp}?text=${this.getMessage()}`)
    return !!popup
  }

  getMessage() {
    if (!this.data.cartRequest.formsPayment[0]) {
      this.data.cartRequest.formsPayment[0] = this.formPaymentSelected
    }
    const split = '*________________________________*\n'
    let message = `*${this.data.clientData.name.trim()}*\n\n`
    let verifyHour
    if (this.data.cartRequest.type === 'P' && this.data.cartRequest.packageDate) {
      verifyHour = DateTime.fromFormat(this.data.cartRequest.packageDate, 'yyyy-MM-dd HH:mm').toFormat('ss') === '01'
    }

    const totalAddon = this.cartService.formPaymentAddonCalcResult(this.formPaymentSelected, this.data.cartRequest.total)
    const cupomValue = this.cartService.cupomValue(this.data.cartRequest.cupom, this.data.cartRequest)

    if (this.data.customer.name) {
      message += `*${this.translate.text().my_name_is} ${this.data.customer.name}, ${this.translate.text().contact} ${this.data.customer.whatsapp}*\n\n`
    }
    message += `*${this.translate.text().order_coder}: wm${this.data.cartRequest.code}${'-' + this.data.cartRequest.type}*\n\n`

    if (this.data.cartRequest.type === 'P') {
      const formattedDate = DateTime.fromFormat(this.data.cartRequest.packageDate.substring(0, 19), 'yyyy-MM-dd HH:mm:ss')

      message += `*${this.translate.text().delivery_date}: ${
        verifyHour
          ? formattedDate.toFormat(this.translate.masks().date_mask) + `(${this.translate.text().no_time_up})`
          : formattedDate.toFormat(`${this.translate.masks().date_mask} HH:mm`)
      }*\n\n`
    }

    const { cart: whatsCart, cartPizza: whatsCartPizza } = this.cartService.itemCart({ itens: this.data.cartRequest.itens })
    whatsCart.forEach((item) => {
      if (this.data.clientData.showTotal) {
        const val = this.formatCurrency(item.promoteStatus ? item.promoteValue : item.value)
        let productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`
        productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`
        message += `${productItem}`
        item.details.complements.forEach((complement) => {
          message += `*${complement.name}:*\n`
          complement.itens.forEach((itemComplement, indexComplementItem) => {
            const compleVal = this.formatCurrency(itemComplement.value)
            const compleItem = `*${itemComplement.quantity > 1 ? itemComplement.quantity + 'x ' : ''}${itemComplement.name.trim()}${
              itemComplement.value ? `        (${compleVal})*` : '*'
            }`
            message += `${compleItem}${indexComplementItem === complement.itens.length - 1 ? '\n\n' : '\n'}`
          })
        })
      } else {
        message += `*${item.quantity}x ${item.name.trim()}*\n`
        item.details.complements.forEach((complement) => {
          message += `*${complement.name}:*\n`
          complement.itens.forEach((itemComplement) => {
            message += `*${itemComplement.quantity}x - ${itemComplement.name}*\n`
          })
        })
      }
      if (item.obs) {
        message += `*${this.translate.text().obs}:\n${item.obs}*\n`
      }
      if (this.data.clientData.showTotal) {
        const itemValue = item.details.value || 0
        const complementValue = this.cartService.sumComplements(item.complements)
        message += `*${this.formatCurrency(item.quantity * (itemValue + complementValue))}*\n`
      }
      message += split
    })

    whatsCartPizza.forEach((item) => {
      item.name = item.name
        .split(item.details.flavors.length > 1 ? this.translate.text().flavors_comment : this.translate.text().flavor_comment)
        .at(0)
        .concat(item.details.flavors.length > 1 ? this.translate.text().flavors_comment : this.translate.text().flavor_comment)
        .trim()
      if (this.data.clientData.showTotal) {
        message += `*${item.quantity}x ${item.name}*\n`
        item.details.flavors.forEach((flavor) => {
          const valFlavor = this.formatCurrency(
            flavor.values[this.cartService.getSizeNameByPizza({ pizza: item as any })] / item.details.flavors.length
          )
          let nameFlavor = `*${flavor.name.trim()}*\n`
          if (!this.data.clientData.options.pizza) {
            nameFlavor = `*${flavor.name.trim()}*\n     *(${valFlavor})*\n`
          }
          message += `  ${nameFlavor}`
          if (this.data.clientData.options.pizza.multipleComplements) {
            flavor.complements?.forEach((complement: ComplementType) => {
              message += `  *${complement.name}*\n`
              complement.itens?.forEach((i) => {
                message += `   *${i.quantity}X | ${i.name}      (${this.formatCurrency(i.value * (i.quantity || 1))})*\n`
              })
            })
          }

          if (this.data.clientData.options.pizza.multipleBorders) {
            flavor.implementations?.forEach((i) => {
              message += `  *${i.name.trim()}*    *(${this.formatCurrency(i.value)})*\n`
            })
          }
        })
        if (!this.data.clientData.options.pizza.multipleComplements) {
          item.details.complements?.forEach((complement: ComplementType) => {
            message += `  *${complement.name}*\n`
            complement.itens?.forEach((i) => {
              message += `   *${i.quantity}X | ${i.name}      (${this.formatCurrency(i.value * (i.quantity || 1))})*\n`
            })
          })
        }

        if (!this.data.clientData.options.pizza.multipleBorders) {
          item.details.implementations.forEach((implementation) => {
            const valImplementation = this.formatCurrency(implementation.value)
            const nameImplementation = `  *${implementation.name.trim()}*     *(${valImplementation})*\n`

            message += `${nameImplementation}`
          })
        }
      } else {
        message += `*${item.quantity}x ${item.quantity}x ${item.name}*\n`
        item.details.flavors.forEach((product) => (message += `   *${product.name}*\n`))
        item.details.implementations.forEach((implementation) => (message += `   *${this.translate.text().with} ${implementation.name.trim()}*\n`))
      }
      if (item.obs) {
        message += `*${this.translate.text().obs}:\n${item.obs}*\n`
      }

      if (this.data.clientData.showTotal) {
        message += `*${this.formatCurrency(
          this.cartService.itemValueWithComplements({
            item: item as unknown as CartItem,
            type: 'pizza',
            valueType: this.data.cartRequest.type,
            multiplyByQuantity: true,
            itemType: true,
          })
        )}*\n`
      }
      message += split
    })

    const totalCart = this.cartService.totalCartValue(whatsCart, whatsCartPizza, this.data.cartRequest)
    message += '\n'

    if (this.data.cartRequest.obs) {
      message += `*Obs: ${this.data.cartRequest.obs}*\n`
      message += split
    }

    if (this.data.clientData.showTotal) {
      let value = new Intl.NumberFormat(this.translate.masks().cell, { style: 'currency', currency: this.translate.currency() }).format(totalCart)

      if (this.data.cartRequest.addressId) {
        if (this.data.cartRequest.taxDelivery > 0) {
          message += `*Subtotal: ${this.formatCurrency(this.cartService.totalCartValue(whatsCart, whatsCartPizza, this.data.cartRequest))}*\n`

          if (this.formPaymentSelected.addon.status) {
            if (this.formPaymentSelected.addon.type === 'fee')
              message += `*${this.translate.text().fee_comment}: ${this.formatCurrency(totalAddon)}*\n`
          }
          if (this.formPaymentSelected.addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}: ${this.formatCurrency(totalAddon)}*\n`
          }

          if (this.data.cartRequest.cupomId && this.data.cartRequest.cupom?.type !== 'freight') {
            message += `*${this.translate.text().coupon}: ${this.formatCurrency(cupomValue * -1)}*\n`
          }

          message += `*${this.translate.text().delivery}: ${
            this.data.cartRequest.cupom?.type === 'freight'
              ? `${this.translate.text().free_shipping_comment}` + this.data.cartRequest.taxDelivery
              : this.formatCurrency(this.data.cartRequest.taxDelivery)
          }*\n`
          value = new Intl.NumberFormat(this.translate.masks().cell, { style: 'currency', currency: this.translate.currency() }).format(
            this.cartService.totalCartFinalValue({ cartRequest: this.data.cartRequest, isOnline: this.paymentType === 'online' })
          )

          message += `*Total: ${value}*\n`
        }

        if (this.data.cartRequest.taxDelivery === 0) {
          message += `*Subtotal: ${this.formatCurrency(totalCart)}*\n`

          if (this.formPaymentSelected.addon.status) {
            if (this.formPaymentSelected.addon.type === 'fee') message += `*Taxa: ${this.formatCurrency(totalAddon)}*\n`
          }
          0
          if (this.formPaymentSelected.addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(totalAddon)}*\n`
          }

          if (this.data.cartRequest.cupomId && this.data.cartRequest.cupom?.type !== 'freight') {
            message += `*${this.translate.text().coupon}: ${this.formatCurrency(cupomValue * -1)}*\n`
          }

          message += `*${this.translate.text().shipping}: ${this.translate.text().free}*\n`
          value = new Intl.NumberFormat(this.translate.masks().cell, { style: 'currency', currency: this.translate.currency() }).format(
            totalCart - cupomValue + totalAddon
          )
          message += `*Total: ${value}*\n`
        }

        if (this.data.cartRequest.taxDelivery === null) {
          if (this.formPaymentSelected.addon.type === 'discount') {
            message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(totalAddon)}\*n`
          }
          message += `*Subtotal: ${this.formatCurrency(totalCart)}*\n`

          if (this.data.cartRequest.cupomId && this.data.cartRequest.cupom?.type !== 'freight') {
            message += `*${this.translate.text().coupon}: ${this.formatCurrency(cupomValue * -1)}*\n`
          }

          message += `*${this.translate.text().shipping}: ${this.translate.text().consult_comment}*\n`
        }
      } else {
        message += `*Subtotal: ${this.formatCurrency(totalCart)}*\n`

        if (this.formPaymentSelected.addon.status) {
          if (this.formPaymentSelected.addon.type === 'fee') message += `*Taxa: ${this.formatCurrency(totalAddon)}*\n`
        }
        if (this.formPaymentSelected.addon.type === 'discount') {
          message += `*${this.translate.text().discount_comment}:  ${this.formatCurrency(totalAddon)}*\n`
        }

        if (this.data.cartRequest.cupomId && this.data.cartRequest.cupom?.type !== 'freight') {
          message += `*${this.translate.text().coupon}: ${this.formatCurrency(cupomValue * -1)}*\n`
        }

        message += `*${this.translate.text().shipping}: ${this.translate.text().location_comment}*\n`
        value = this.formatCurrency(totalCart - cupomValue + totalAddon)
        message += `*Total: ${value}*\n`
      }
    }

    const formPayment =
      this.formPaymentSelected?.flags?.length && this.paymentType === 'online'
        ? `${this.formPaymentSelected.label}(${this.formPaymentSelected.flag?.name || 'Online'})`
        : this.formPaymentSelected.label

    message += `\n*${this.translate.text().payment_in_comment}:      ${formPayment} ${
      this.data.cartRequest.paymentType === 'online' && this.paymentType === 'online' ? ` - ${this.translate.text().paid_online_comment}` : ''
    }*\n`

    if (this.formPaymentSelected.change && formPayment === 'Dinheiro') {
      const transshipmentVal = parseFloat(this.formPaymentSelected.change.toString().replace(',', '.').trim())
      const transshipment = new Intl.NumberFormat(this.translate.masks().cell, { style: 'currency', currency: this.translate.currency() }).format(
        transshipmentVal
      )

      if (this.formPaymentSelected.change > 0) {
        message += `*${this.translate.text().change_for_comment} ${transshipment}*\n`

        if (this.data.clientData.showTotal) {
          let totalRequest = totalCart - cupomValue + totalAddon

          if (this.data.cartRequest.taxDelivery !== -1 && this.data.cartRequest.addressId) {
            totalRequest += this.data.cartRequest.taxDelivery
          }

          message += `*${this.translate.text().change}: ${new Intl.NumberFormat(this.translate.masks().cell, {
            style: 'currency',
            currency: this.translate.currency(),
          }).format(transshipmentVal ? transshipmentVal - totalRequest : totalRequest)}*\n`
        }
      } else {
        message += `*${this.translate.text().i_not_need_transhipment}*\n`
      }
    }

    message += `*${this.translate.text().track_order}*\n https://www.whatsmenu.com.br/${this.data.clientData.slug}/status/${this.data.cartRequest.code}`

    if (this.data.cartRequest.addressId) {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.data.cartRequest.type === 'P') {
        message += `\n\n*${this.translate.text().package}*\n\n*${this.translate.text().delivery_address}*\n\n`
      } else {
        message += `\n\n*${this.translate.text().delivery_address}*\n\n`
      }
      // message += `\n\n*Endereço da Entrega*\n\n`;
      message += `*${this.translate.text().street}: ${this.data.cartRequest.address.street.trim()}*\n`
      message += `*${this.translate.text().number}: ${this.data.cartRequest.address.number}*\n`

      if (this.data.cartRequest.address.complement) {
        message += `*${this.translate.text().address_complement}: ${this.data.cartRequest.address.complement.trim()}*\n`
      }

      message += `*${this.translate.text().neighborhood}: ${this.data.cartRequest.address.neighborhood.trim()}*\n`

      if (this.data.cartRequest.address.reference) {
        message += `*${this.translate.text().reference}: ${this.data.cartRequest.address.reference.trim()}*\n`
      }

      message += `*${this.translate.text().city}: ${this.data.cartRequest.address.city.trim()}*\n`
    } else {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.data.cartRequest.type === 'P') {
        message += `\n\n*${this.translate.text().package}*\n\n*${this.translate.text().pickup_the_location}*\n\n`
      } else {
        message += `\n\n*${this.translate.text().pickup_the_location}*\n\n`
      }
    }

    message += split
    message += `*${this.translate.text().technology}*\n      *www.whatsmenu.com.br*`

    return encodeURI(message)
  }

  async createAsaasCustomer({
    cpfCnpj,
    ...rest
  }: {
    name: string
    cpfCnpj: string
    mobilePhone: string
    email: string
    postalCode: string
    addressNumber: string
  }) {
    try {
      const customerBody = {
        id: this.data.customer.id,
        asaas: {
          ...rest,
          cpfCnpj: this.context.superNormalize(cpfCnpj),
        },
      }
      const newCustomer = await this.api.createRestaurantCustomer(customerBody)
      return newCustomer
    } catch (error) {
      console.error(error)
      throw this.toastService.show(this.translate.text().unable_create_customer, {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    }
  }

  async createAsaasCard() {
    this.loading = true
    try {
      const { client } = await this.api.saveCard(this.data.customer.id, this.newCard)
      this.data.customer = client
      const newCard = client.controls.asaas.cards.at(-1)
      this.selectedCard = { ...newCard, code: this.data.customer.controls.asaas.cards.length + 1, id: this.newCard.creditCard.ccv }
    } catch (error) {
      throw error
      // throw this.toastService.show(error?.error?.message || 'Algo inesperado aconteceu, tente novamente em instantes', {
      //   classname: 'bg-danger text-light text-center pos middle-center',
      //   delay: 3000,
      // })
    } finally {
      this.loading = false
    }
  }

  async createCardAndSubmitOrder() {
    this.createCardButton.nativeElement.disabled = true
    try {
      if (!this.data.customer.controls.asaas?.id) {
        await this.createAsaasCustomer({
          name: this.newCard.creditCard.holderName,
          cpfCnpj: this.newCard.creditCardHolderInfo.cpfCnpj,
          addressNumber: this.newCard.creditCardHolderInfo.addressNumber,
          email: this.data.customer.email || `${this.data.customer.id}@whatsmenu.com.br`,
          mobilePhone: this.data.customer.whatsapp,
          postalCode: this.newCard.creditCardHolderInfo.postalCode,
        })
      }
      await this.createAsaasCard()
      await this.createCart()
    } catch (error) {
      console.error(error)
      throw this.toastService.show(error?.error?.error?.message || this.translate.alert().try_again_moment, {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    } finally {
      this.createCardButton.nativeElement.disabled = false
    }
  }

  async deleteAsaasCard({ creditCardNumber }: CustomerCardType) {
    try {
      await this.api.deleteCard(this.data.clientData.slug, { clientId: this.data.customer.id, creditCardNumber })
    } catch (error) {
      console.error(error)
      throw this.toastService.show(error?.error?.message || 'Algo inesperado aconteceu, tente novamente em instantes', {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    }
  }

  finishCartAction(forceModal?: boolean) {
    localStorage.removeItem(`${this.data.cartRequest.type}_cart_${this.data.clientData.slug}`)
    window.location.href = `${window.location.protocol}//${window.location.host}/${this.data.clientData.slug}/status/${this.data.cartRequest.code}`
  }

  async createCart() {
    this.loading = true
    if (this.submitCartButton) {
      this.submitCartButton.nativeElement.disabled = true
    }
    try {
      if (!this.hasPendingCart) {
        this.data.cartRequest.itens.forEach((item) => {
          item.name = this.removeEmojiString(item.name)
          item.details.complements.forEach((compl) => {
            compl.itens.forEach((item) => {
              item.name = this.removeEmojiString(item.name)
              item.description = this.removeEmojiString(item.description)
            })
          })
        })

        if (this.data.cartRequest.type === 'P' && DateTime.fromISO(this.data.cartRequest.packageDate) < DateTime.local()) {
          throw {
            error: {
              code: '403-D',
              message: this.translate.alert().selected_date_earlier_choose_later_date,
              minHour: DateTime.local().toFormat('HH:mm'),
            },
          }
        }

        if (this.paymentType === 'online') {
          this.data.cartRequest.formsPayment.forEach((f) => {
            f.addon = {
              ...f.addon,
              status: false,
              value: 0,
            }
          })
        }

        const { cart } = await this.api.storeCart({
          slug: this.data.clientData.slug,
          cartRequest: this.data.cartRequest,
          userAgent: navigator.userAgent,
        })

        if (this.data.clientData.options.tracking && this.data.clientData.options.tracking.pixel) {
          fbq('track', 'Purchase', {
            value: cart.total.toFixed(2),
            currency: this.translate.currency(),
          })
        }

        if (this.data.clientData?.options?.tracking?.googleAds?.id && this.data.clientData?.options?.tracking?.googleAds?.label) {
          gtag('event', 'conversion', {
            send_to: `${this.data.clientData.options.tracking.googleAds.id}/${this.data.clientData.options.tracking.googleAds.label}`,
            value: cart.total,
            currency: this.translate.currency(),
            transaction_id: cart.code,
          })
        }
        this.data.cartRequest = {
          ...cart,
          taxDelivery: this.data.cartRequest.taxDelivery === null ? this.data.cartRequest.taxDelivery : cart.taxDelivery,
        }
      }

      if (this.paymentType === 'online') {
        this.hasPendingCart = true
        if (this.paymentLayout === 'pix') {
          this.data.cartRequest.formsPayment.unshift(this.formPaymentSelected)
          await this.generatePix({ regenerate: false })
          return
        } else {
          await this.processCardOrder()
        }
      } else {
        if (this.hasPendingCart) {
          const { cart } = await this.api.updateCartFormsPayment({
            cartId: this.data.cartRequest.id,
            formsPayment: [
              ...this.data.cartRequest.formsPayment.filter((formPayment) => formPayment.payment === 'cashback'),
              this.formPaymentSelected,
            ],
            slug: this.data.clientData.slug,
            paymentType: this.paymentType,
          })
          this.data.cartRequest = {
            ...this.data.cartRequest,
            ...cart,
            taxDelivery: this.data.cartRequest.taxDelivery === null ? this.data.cartRequest.taxDelivery : cart.taxDelivery,
          }
        }
      }

      this.finishCartAction()
    } catch (error) {
      console.error(error)
      console.log(error.error?.message)
      throw this.toastService.show(
        (error?.error?.message as string)?.toLowerCase().includes('split')
          ? this.translate.alert().try_again_moment
          : error?.error?.message.replace('Error: ', ''),
        {
          classname: 'bg-danger text-light text-center pos middle-center',
          delay: 3000,
        }
      )
    } finally {
      if (this.submitCartButton) {
        this.submitCartButton.nativeElement.disabled = false
      }
      this.loading = false
    }
  }

  async generatePix({ regenerate = false }: { regenerate?: boolean }) {
    this.loading = true
    if (regenerate && this.websocket.connection.readyState) {
      this.websocket.disconnect()
    }
    const pixObject = {
      externalReference: {
        cartId: this.data.cartRequest.id,
      },
      billingType: 'PIX',
      dueDate: DateTime.local().toFormat('yyyy-MM-dd'),
      name: this.data.customer.name,
      document: this.data.customer.secretNumber,
      value: Number(this.cartService.totalCartFinalValue({ cartRequest: this.data.cartRequest, isOnline: true }).toFixed(2)),
      description: `Pedido ${this.data.clientData.name} - WhatsMenu`,
      walletId: this.data.clientData.options.asaas.walletId,
      clientId: this.data.customer.id,
    }
    let apiQuery
    try {
      apiQuery = await this.api.getPix(this.data.clientData.slug, pixObject)
    } catch (error) {
      console.error(error)
      this.toastService.show(error?.error?.message || this.translate.alert().try_again_moment, {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    } finally {
      this.loading = false
    }

    this.pixInvoice = {
      copyPaste: apiQuery.payment.payload,
      qrCode: apiQuery.payment.encodedImage,
      id: apiQuery.id,
    }

    this.websocket.connect.subscribe(async ({ type, data }: { type: 'connection' | 'request' | 'command' | 'profile'; data: any }) => {
      this.websocket.subscribe('profile', this.pixInvoice.id)
      setTimeout(
        () => {
          this.pixRegeneration = true
        },
        5 * 1000 * 60
      )
      if (type === 'connection') {
        // const order = await this.api.verifyOrder(this.data.cartRequest.id)
        // if (order.statusPayment === 'paid') {
        //   this.finishCartAction(true)
        // }
      }
      if (type === 'profile') {
        this.finishCartAction(true)
      }
    })

    if (!apiQuery.payment.success) {
      this.toastService.show(this.translate.alert().error_generate_qrcode, {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    }

    this.pixInvoice = {
      copyPaste: apiQuery.payment.payload,
      qrCode: apiQuery.payment.encodedImage,
      id: apiQuery.id,
    }
  }

  async verifyPix() {
    this.loading = true
    try {
      const cart = await this.api.verifyOrder(this.data.cartRequest.id)
      if (cart.statusPayment === 'paid') {
        this.finishCartAction(true)
      } else {
        this.toastService.show(this.translate.alert().payment_not_detected, {
          classname: 'bg-danger text-light text-center pos middle-center',
          delay: 3000,
        })
      }
    } catch (error) {
      console.error(error)
      throw this.toastService.show(error?.error?.message || this.translate.alert().try_again_moment, {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    } finally {
      this.loading = false
    }
  }

  async processCardOrder() {
    try {
      const orderInfo = {
        customer: this.data.customer.controls.asaas?.id,
        billingType: 'CREDIT_CARD',
        value: Number(this.cartService.totalCartFinalValue({ cartRequest: this.data.cartRequest, isOnline: true }).toFixed(2)),
        dueDate: DateTime.now().toFormat('yyyy-MM-dd'),
        saveCard: true,
        externalReference: JSON.stringify({
          cartId: this.data.cartRequest.id,
        }),
        description: `${this.translate.text().order} ${this.data.clientData.name} - WhatsMenu`,
      }
      const order = await this.api.processCard(this.data.clientData.slug, {
        card: this.selectedCard,
        order: orderInfo,
        restaurantWalletId: this.data.clientData.options.asaas.walletId,
        clientId: this.data.customer.id,
      })

      return this.toastService.show(order.message, {
        classname: 'bg-success text-light text-center pos middle-center',
        delay: 3000,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  cashbackValueAvaliable() {
    let result = 0
    if (this.data.customer.vouchers.length && this.data.clientData.options.voucher[0].status) {
      result = this.data.customer.vouchers.reduce((total, voucher) => total + voucher.value, 0)
    }
    return result
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
