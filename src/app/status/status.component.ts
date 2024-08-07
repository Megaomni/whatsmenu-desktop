import { Component, ElementRef, ViewChild, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { faArrowLeft, faPaste, faRotate } from '@fortawesome/free-solid-svg-icons'
import { DateTime } from 'luxon'
import { environment } from 'src/environments/environment'
import { CartItem, CartRequestType } from '../cart-request-type'
import { CupomType } from '../cupom'
import { CustomerType } from '../customer-type'
import { ComplementType } from '../product-type'
import { ProfileType } from '../profile-type'
import { ApiService } from '../services/api/api.service'
import { CartService } from '../services/cart/cart.service'
import { ContextService } from '../services/context/context.service'
import { NeighborhoodType, TaxDeliveryType } from '../tax-delivery-type'
import { WebsocketService } from 'src/app/services/websocket/websocket.service'
import { CartFormPaymentType } from 'src/app/formpayment-type'

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss', '../home/home.component.scss'],
})
export class StatusComponent implements OnInit {
  code: string
  slug: string
  cart: CartRequestType & {
    client: CustomerType
    controls?: {
      userAgent: string
      whatsApp: {
        alreadySent: boolean
      }
    }
  }
  profile: ProfileType
  pixSecretNumber = ''

  formsPayment: Partial<CartFormPaymentType>[] = []
  value: string | number = null
  pixQrCodeMode = false

  pixInvoice = { copyPaste: '', qrCode: '', id: '' }
  pixRegeneration = false
  loading = false

  // ICONS
  faPaste = faPaste
  faRotate = faRotate
  faArrowLeft = faArrowLeft
  faWhatsApp = faWhatsapp

  @ViewChild('generatePixButton') generatePixButton: ElementRef<HTMLButtonElement>

  constructor(
    private router: ActivatedRoute,
    private api: ApiService,
    public cartService: CartService,
    public context: ContextService,
    public toastService: ToastService,
    private websocket: WebsocketService
  ) {
    this.router.params.subscribe(({ code, slug }) => {
      this.code = code
      this.slug = slug
    })
  }

  async ngOnInit() {
    await this.getInfos()
    document.body.classList.remove('mat-typography')

    if (
      this.cart?.formsPayment?.find((form) => form.payment === 'pix' && !form.paid) &&
      !this.context.profile.options.legacyPix &&
      this.context.profile.options.asaas &&
      Boolean(this.cart.client?.secretNumber)
    ) {
      this.sendQrCodePix({ regenerate: false })
    }

    setInterval(async () => {
      const result = await this.api.getCartStatus({ slug: this.profile.slug, cartId: this.cart.id })
      this.cart.status = result.status
    }, 1000 * 60)
  }

  taxDelivery() {
    let verifyNeighborood: NeighborhoodType[][]
    if (this.profile.typeDelivery === 'neighborhood') {
      verifyNeighborood = (this.profile.taxDelivery as TaxDeliveryType[]).map((tax) => {
        return tax?.neighborhoods.filter((n) => n.name === this.cart.address?.neighborhood)
      })
      if (verifyNeighborood[0][0]?.value === null) {
        return 'À Consultar'
      } else {
        return `+ ${this.currencyNoSymbol(this.cart.taxDelivery)}`
      }
    }
    if (this.profile.typeDelivery === 'km') {
      if (this.cart.taxDelivery === null) {
        return 'À Consultar'
      } else {
        return `+ ${this.currencyNoSymbol(this.cart.taxDelivery)}`
      }
    }
  }

  async getInfos() {
    try {
      const [profile, { cart }] = await Promise.all([this.api.getClientData(this.slug), this.api.getCartByCode(this.slug, this.code)])

      this.cart = cart
      this.profile = profile
      this.cartService.profile = profile
      this.context.profile = profile
    } catch (error) {
      console.error(error)
    }
  }

  formatDate(date: string) {
    return DateTime.fromSQL(date).toFormat('dd/MM/yyyy HH:mm:ss')
  }

  returnAllFormsPayment() {
    return this.cart.formsPayment.filter((formPayment) => {
      if (
        !this.context.profile.options.legacyPix &&
        this.context.profile.options.asaas &&
        this.profile.options.onlinePix &&
        formPayment.payment === 'pix' &&
        !formPayment.paid
      ) {
        return false
      }
      return true
    })
  }
  async sendQrCodePix({ regenerate = true }: { regenerate?: boolean }) {
    this.pixRegeneration = regenerate
    if (regenerate || this.cart.statusPayment !== 'offline') {
      const generatePixButton = this.generatePixButton
      if (generatePixButton) {
        generatePixButton.nativeElement.disabled = true
      }
      if (regenerate && this.websocket.connection?.readyState) {
        this.websocket.disconnect()
      }
      const externalReference: { tableId?: number; commandId?: number; cartId?: number } = {}
      if (!this.cart.tableType) {
        if (!this.cart.id) {
          try {
            const { cart } = await this.api.storeCart({
              slug: this.context.profile.slug,
              cartRequest: { ...this.cart, paymentType: 'online' },
              userAgent: navigator.userAgent,
            })
          } catch (error) {
            if (generatePixButton) {
              generatePixButton.nativeElement.disabled = false
            }
            console.error(error)
          }
        }
        externalReference.cartId = this.cart.id
      }
      let name = this.cart.client.name
      const pixObject = {
        externalReference,
        billingType: 'PIX',
        dueDate: DateTime.local().toFormat('yyyy-MM-dd'),
        name,
        document: this.pixSecretNumber,
        value: Number(this.cartService.totalCartFinalValue({ cartRequest: this.cart, isOnline: true }).toFixed(2)),
        description: `Pedido ${this.context.profile.name} - WhatsMenu`,
        walletId: this.context.profile.options.asaas.walletId,
        clientId: !!this.cart.tableType ? 0 : this.cart.client.id,
      }

      let apiQuery
      try {
        apiQuery = await this.api.getPix(this.context.profile.slug, pixObject)
      } catch (error) {
        if (error?.error?.error?.message) {
          this.toastService.show(error?.error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
        }
        throw error
      } finally {
        this.pixSecretNumber = ''
      }
      this.pixInvoice = {
        copyPaste: apiQuery.payment.payload,
        qrCode: apiQuery.payment.encodedImage,
        id: apiQuery.id,
      }
      this.websocket.connect.subscribe(async ({ type, data }: { type: 'connection' | 'request' | 'command' | 'profile'; data: any }) => {
        this.websocket.subscribe('profile', this.pixInvoice.id)
        setTimeout(() => {
          this.pixRegeneration = true
        }, 5 * 1000 * 60)
        if (type === 'profile') {
          if (data.table) {
            this.context.getActiveTable().opened.formsPayment = [...data.table.formsPayment]
          }
          if (data.command) {
            const commandIndex = this.context.getActiveTable().opened.commands.findIndex((c) => c.id === this.context.activeCommandId)
            if (commandIndex !== -1) {
              this.context.getActiveTable().opened.commands[commandIndex].formsPayment = [
                ...this.context.getActiveTable().opened.commands[commandIndex].formsPayment,
                ...data.command.formsPayment,
              ]
            }
          }
          if (data.cart) {
            this.cart = { ...this.cart, ...data.cart }
            this.formsPayment = [...this.formsPayment, ...this.cart.formsPayment]
          }
          this.value = null
          this.pixQrCodeMode = false
          this.pixInvoice = {
            copyPaste: '',
            id: '',
            qrCode: '',
          }
          if (data.cart || data.table || data.command) {
            this.toastService.show(`Pagamento pix efetuado com sucesso`, {
              classname: 'bg-success text-light text-center pos middle-center',
              delay: 3000,
            })
            // this.finishCartAction(true)
          }
        }
      })
      if (!apiQuery.payment.success) {
        this.toastService.show('Não foi possível gerar o QR Code. Por favor, tente novamente.', {
          classname: 'bg-danger text-light text-center pos middle-center',
          delay: 3000,
        })
      }
    }
  }

  copyToClipboardOnline() {
    navigator.clipboard.writeText(this.pixInvoice.copyPaste)
    this.toastService.show(`Copiada com sucesso`, {
      classname: 'bg-success text-light text-center pos middle-center',
      delay: 3000,
    })
  }

  finishCartAction(forceModal?: boolean) {
    localStorage.removeItem(`${this.cart.type}_cart_${this.cart.client.slug}`)
    window.location.href = `${window.location.protocol}//${window.location.host}/${this.cart.client.slug}/status/${this.cart.code}`
  }

  async verifyPix() {
    this.loading = true
    try {
      const cart = await this.api.verifyOrder(this.cart.id)
      if (cart.statusPayment === 'paid') {
        this.finishCartAction(true)
      } else {
        this.toastService.show('Pagamento não detectado. por favor verifique o aplicativo do seu banco.', {
          classname: 'bg-danger text-light text-center pos middle-center',
          delay: 3000,
        })
      }
    } catch (error) {
      console.error(error)
      throw this.toastService.show(error?.error?.message || 'Algo inesperado aconteceu, tente novamente em instantes', {
        classname: 'bg-danger text-light text-center pos middle-center',
        delay: 3000,
      })
    } finally {
      this.loading = false
    }
  }

  /**
   * Calcula o status de um carrinho com base no estágio atual.
   *
   * @param {0 | 1 | 2 | 3 | 4} stage - O estágio atual do carrinho.
   * @return {{
   *   line: 'current' | 'completed' | 'pending' | '',
   *   pointer: 'completed' | 'cancelled' | 'pending' | '',
   *   text: 'pending' | ''
   * }} Um objeto contendo o status da linha, ponteiro e texto do carrinho.
   */
  processStatus(stage: 0 | 1 | 2 | 3 | 4): {
    line: 'current' | 'completed' | 'pending' | ''
    pointer: 'completed' | 'cancelled' | 'pending' | ''
    text: 'pending' | ''
  } {
    const result: {
      line: 'current' | 'completed' | 'pending' | ''
      pointer: 'completed' | 'cancelled' | 'pending' | ''
      text: 'pending' | ''
    } = { line: 'pending', pointer: 'pending', text: 'pending' }

    switch (this.cart.status) {
      case null:
        if (this.cart.statusPayment === 'offline' && stage === 1) {
          result.pointer = 'completed'
          result.line = 'current'
        }
        if (stage <= 0 && this.cart.statusPayment === 'pending') {
          result.pointer = 'completed'
          result.line = this.cart.statusPayment === 'pending' ? 'current' : 'completed'
        } else if (this.cart.statusPayment === 'paid') {
          if (stage <= 0) {
            result.pointer = 'completed'
            result.line = 'completed'
          }
          if (stage === 1) {
            result.pointer = 'completed'
            result.line = 'current'
          }
        }
        break
      case 'production':
        if (stage <= 1) {
          result.pointer = 'completed'
          result.line = 'completed'
        } else if (stage === 2) {
          result.pointer = 'completed'
          result.line = 'current'
        } else {
          result.pointer = 'pending'
        }
        break
      case 'transport':
        if (stage <= 2) {
          result.pointer = 'completed'
          result.line = 'completed'
        } else if (stage === 3) {
          result.pointer = 'completed'
          result.line = 'completed'
        } else {
          result.pointer = 'pending'
        }
        break
      case 'canceled':
        if (stage <= 4) {
          result.pointer = 'cancelled'
          result.line = ''
        }
        break
      default:
        result.pointer = 'pending'
        result.line = 'pending'
    }
    return result
  }

  formatCPF(cpf: string) {
    cpf = cpf.replace(/[^\d]/g, '')
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  calFinalValueAddon(): number {
    let total = this.cart.formsPayment[0].addon.value
    if (this.cart?.formsPayment[0].addon.valueType === 'percentage') {
      total = this.cart?.total * (total / 100)
      return total
    }
    return total
  }

  calculateTotal(subtotal: number, cupom: CupomType) {
    let valorCupom: number = 0
    let valorFrete: number = 0
    let total: number = 0

    switch (cupom?.type) {
      case 'value':
        valorCupom = cupom.value
        break
      case 'percent':
        valorCupom = subtotal * (cupom.value / 100)
        break
      case 'freight':
        valorFrete = this.cart.taxDelivery
        break
      default:
        valorCupom = 0
        break
    }
    const valueTotal = subtotal - valorCupom < 0 ? 0 : subtotal - valorCupom

    if (this.cart.formsPayment[0].addon?.status) {
      let addonValue = this.cart.formsPayment[0].addon.value
      if (this.cart.formsPayment[0].addon.type === 'fee') {
        if (this.cart.formsPayment[0].addon.valueType === 'percentage') {
          addonValue = subtotal * (addonValue / 100)
        }
        total = valueTotal + addonValue + this.cart.taxDelivery - valorFrete
      }

      if (this.cart.formsPayment[0].addon.type === 'discount') {
        if (this.cart.formsPayment[0].addon.valueType === 'percentage') {
          addonValue = subtotal * (addonValue / 100)
        }
        total = valueTotal - addonValue + this.cart.taxDelivery - valorFrete
      }
    } else {
      total = valueTotal + this.cart.taxDelivery - valorFrete
    }

    return total
  }

  private formatCurrency(val: any): string {
    let value = val
    if (typeof val === 'string') {
      value = parseFloat(val.replace(',', '.').replace('R$', '').split(' ').join(''))
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  async setAlreadySent() {
    try {
      const { cart } = await this.api.setAlreadySent({
        controls: {
          whatsApp: {
            alreadySent: true,
          },
        },
        slug: this.profile.slug,
        id: this.cart.id,
      })
      this.cart.controls = cart.controls
    } catch (error) {
      console.error(error)
    }
  }

  sendMessage() {
    const whatsapp = !environment.production ? '5513997884443' : this.profile.whatsapp.split(' ').join('').replace('-', '')
    return `https://wa.me/${whatsapp}?text=${this.getMessage()}`
  }

  getMessage() {
    // if (!this.cart.formsPayment[0]) {
    //   this.cart.formsPayment[0] = this.cart.formsPayment[0]
    // }
    const split = '*________________________________*\n'
    let message = `*${this.profile.name.trim()}*\n\n`
    let verifyHour
    if (this.cart.type === 'P' && this.cart.packageDate) {
      verifyHour = DateTime.fromISO(this.cart.packageDate).toFormat('ss') === '01'
    }

    const totalAddon = this.cartService.formPaymentAddonCalcResult(this.cart.formsPayment[0], this.cart.total)
    const cupomValue = this.cartService.cupomValue(this.cart.cupom, this.cart)

    if (this.cart.client.name) {
      message += `*Meu nome é ${this.cart.client.name}, contato ${this.cart.client.whatsapp}*\n\n`
    }
    message += `*Código do pedido: wm${this.cart.code}${'-' + this.cart.type}*\n\n`

    if (this.cart.type === 'P') {
      const formattedDate = DateTime.fromISO(this.cart.packageDate)

      message += `*Data de entrega: ${
        verifyHour ? formattedDate.toFormat('dd/MM/yyyy') + '(SEM HORÁRIO)' : formattedDate.toFormat('dd/MM/yyyy HH:mm')
      }*\n\n`
    }

    const { cart: whatsCart, cartPizza: whatsCartPizza } = this.cartService.itemCart({ itens: this.cart.itens })
    whatsCart.forEach((item) => {
      if (this.profile.showTotal) {
        const val = this.formatCurrency(item.promoteStatus ? item.promoteValue : item.value)
        let productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`
        productItem = `*${item.quantity}x - ${item.name.trim()}*\n*(${val})*\n`
        message += `${productItem}`
        item.details.complements?.forEach((complement) => {
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
        message += `*Observações:\n${item.obs}*\n`
      }
      if (this.profile.showTotal) {
        const itemValue = item.details.value || 0
        const complementValue = this.cartService.sumComplements(item.complements)
        message += `*${this.formatCurrency(item.quantity * (itemValue + complementValue))}*\n`
      }
      message += split
    })

    whatsCartPizza.forEach((item) => {
      item.name = item.name
        .split(item.details.flavors.length > 1 ? 'Sabores' : 'Sabor')
        .at(0)
        .concat(item.details.flavors.length > 1 ? 'Sabores' : 'Sabor')
        .trim()
      if (this.profile.showTotal) {
        message += `*${item.quantity}x ${item.name}*\n`
        item.details.flavors.forEach((flavor) => {
          const valFlavor = this.formatCurrency(
            flavor.values[this.cartService.getSizeNameByPizza({ pizza: item as any })] / item.details.flavors.length
          )
          let nameFlavor = `*${flavor.name.trim()}*\n`
          if (!this.profile.options.pizza) {
            nameFlavor = `*${flavor.name.trim()}*\n     *(${valFlavor})*\n`
          }
          message += `  ${nameFlavor}`
          if (this.profile.options.pizza.multipleComplements) {
            flavor.complements?.forEach((complement: ComplementType) => {
              message += `  *${complement.name}*\n`
              complement.itens?.forEach((i) => {
                message += `   *${i.quantity}X | ${i.name}      (${this.formatCurrency(i.value * (i.quantity || 1))})*\n`
              })
            })
          }

          if (this.profile.options.pizza.multipleBorders) {
            flavor.implementations?.forEach((i) => {
              message += `  *${i.name.trim()}*    *(${this.formatCurrency(i.value)})*\n`
            })
          }
        })
        if (!this.profile.options.pizza.multipleComplements) {
          item.details.complements?.forEach((complement: ComplementType) => {
            message += `  *${complement.name}*\n`
            complement.itens?.forEach((i) => {
              message += `   *${i.quantity}X | ${i.name}      (${this.formatCurrency(i.value * (i.quantity || 1))})*\n`
            })
          })
        }

        if (!this.profile.options.pizza.multipleBorders) {
          item.details.implementations.forEach((implementation) => {
            const valImplementation = this.formatCurrency(implementation.value)
            const nameImplementation = `  *${implementation.name.trim()}*     *(${valImplementation})*\n`

            message += `${nameImplementation}`
          })
        }
      } else {
        message += `*${item.quantity}x ${item.quantity}x ${item.name}*\n`
        item.details.flavors.forEach((product) => (message += `   *${product.name}*\n`))
        item.details.implementations.forEach((implementation) => (message += `   *com ${implementation.name.trim()}*\n`))
      }
      if (item.obs) {
        message += `*Observações:\n${item.obs}*\n`
      }

      if (this.profile.showTotal) {
        message += `*${this.formatCurrency(
          this.cartService.itemValueWithComplements({
            item: item as unknown as CartItem,
            type: 'pizza',
            valueType: this.cart.type,
            multiplyByQuantity: true,
            itemType: true,
            noImplementations: true,
          })
        )}*\n`
      }
      message += split
    })

    const totalCart = this.cartService.totalCartValue(whatsCart, whatsCartPizza, this.cart)
    message += '\n'

    if (this.cart.obs) {
      message += `*Obs: ${this.cart.obs}*\n`
      message += split
    }

    if (this.profile.showTotal && this.cart) {
      let value = this.currencyNoSymbol(totalCart)

      message += `*Pedido: + ${this.currencyNoSymbol(this.cartService.totalCartValue(whatsCart, whatsCartPizza, this.cart))}*\n`
      if (this.cart.addressId) {
        message += `*Entrega:* `
        if (this.cart.cupom?.type !== 'freight' && this.taxDelivery() === 'À Consultar') {
          message += `*${this.taxDelivery()}*\n`
        }
        if (
          this.taxDelivery() !== 'À Consultar' &&
          ((this.cart.cupomId && this.cart.cupom?.type === 'freight') || (this.cart.addressId && this.cart.taxDelivery === 0))
        ) {
          message += `*GRÁTIS*\n`
        }
        if (this.taxDelivery() !== 'À Consultar' && (!this.cart.cupom || this.cart.cupom?.type !== 'freight') && this.cart.addressId) {
          message += `*${this.currencyNoSymbol(this.cart.taxDelivery)}*\n`
        }
      }
      if (this.cart.formsPayment[0].addon?.status) {
        if (this.cart.formsPayment[0].addon.type === 'fee') message += `*Taxa: + ${this.currencyNoSymbol(totalAddon)}*\n`
      }
      if (this.cart.formsPayment[0].addon?.type === 'discount') {
        message += `*Desc. ${this.cart.formsPayment[0].label}: - ${this.currencyNoSymbol(Math.abs(totalAddon))}*\n`
      }
      if (this.cart.cupomId && this.cart.cupom?.type !== 'freight') {
        message += `*Cupom: - ${this.currencyNoSymbol(cupomValue)}*\n`
      }
      if (this.cashback()) {
        message += `*${this.cashback().label}: - ${this.currencyNoSymbol(this.cashback().value)}*\n`
      }
      value = this.currencyNoSymbol(this.cartService.totalCartFinalValue({ cartRequest: this.cart, isOnline: this.cart.paymentType === 'online' }))
      message += `*Total: ${value}*\n`
    }

    const formPayment =
      this.cart.formsPayment[0]?.flags?.length && this.cart.paymentType === 'online'
        ? `${this.cart.formsPayment[0].label}(${this.cart.formsPayment[0].flag?.name || 'Online'})`
        : this.cart.formsPayment[0].label

    message += `\n*Pagamento em:      ${formPayment}${
      this.cart.paymentType === 'online' && this.cart.statusPayment !== 'offline' ? ' - Pago Online' : ''
    }*\n`

    if (this.cart.formsPayment[0].change && formPayment === 'Dinheiro') {
      const transshipmentVal = parseFloat(this.cart.formsPayment[0].change.toString().replace(',', '.').trim())
      const transshipment = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transshipmentVal)

      if (this.cart.formsPayment[0].change > 0) {
        message += `*Troco para ${transshipment}*\n`

        if (this.profile.showTotal) {
          let totalRequest = totalCart - cupomValue + totalAddon

          if (this.cart.taxDelivery !== -1 && this.cart.addressId) {
            totalRequest += this.cart.taxDelivery
          }

          message += `*Troco: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            transshipmentVal ? transshipmentVal - totalRequest : totalRequest
          )}*\n`
        }
      } else {
        message += '*Não preciso de troco*\n'
      }
    }

    message += `*Acompanhar pedido*\n https://www.whatsmenu.com.br/${this.profile.slug}/status/${this.cart.code}`

    if (this.cart.addressId) {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.cart.type === 'P') {
        message += `\n\n*Encomendas*\n\n*Endereço da Entrega*\n\n`
      } else {
        message += `\n\n*Endereço da Entrega*\n\n`
      }
      // message += `\n\n*Endereço da Entrega*\n\n`;
      message += `*Rua: ${this.cart.address.street.trim()}*\n`
      message += `*Número: ${this.cart.address.number}*\n`

      if (this.cart.address.complement) {
        message += `*Complemento: ${this.cart.address.complement.trim()}*\n`
      }

      message += `*Bairro: ${this.cart.address.neighborhood.trim()}*\n`

      if (this.cart.address.reference) {
        message += `*Referencia: ${this.cart.address.reference.trim()}*\n`
      }

      message += `*Cidade: ${this.cart.address.city.trim()}*\n`
    } else {
      // if(localStorage.getItem('viewContentAlternate') === 'package'){
      if (this.cart.type === 'P') {
        message += `\n\n*Encomendas*\n\n*Vou retirar no local*\n\n`
      } else {
        message += `\n\n*Vou retirar no local*\n\n`
      }
    }

    message += split
    message += '*Tecnologia*\n      *www.whatsmenu.com.br*'

    // console.log(message)
    return encodeURIComponent(message)
  }

  goBack() {
    window.location.href = `${window.location.protocol}//${window.location.host}/${this.profile.slug}`
  }

  currencyNoSymbol(value: number) {
    return value.toFixed(2)
  }

  cashback() {
    return this.cart.formsPayment.find((formPayment) => formPayment.payment === 'cashback')
  }
}
