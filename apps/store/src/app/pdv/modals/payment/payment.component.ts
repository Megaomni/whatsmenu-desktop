import { AfterContentChecked, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { faArrowLeft, faPaste, faRotate } from '@fortawesome/free-solid-svg-icons'
import { DateTime } from 'luxon'
import { AddressType } from 'src/app/address-type'
import { CartRequestType } from 'src/app/cart-request-type'
import { CupomType } from 'src/app/cupom'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import { ClientAddressComponent } from '../client-address/client-address.component'
import Table, { TableOpened } from 'src/classes/table'
import Command from 'src/classes/command'
import { WebsocketService } from 'src/app/services/websocket/websocket.service'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss'],
})
export class PaymentComponent implements OnInit, AfterContentChecked, OnDestroy {
  total = 0
  totalWithOutAddon = 0
  paidValue = 0
  lackValue = 0
  addonValue = 0
  demandAddonValue = true

  value: string | number = null
  profileFormPayment: CartFormPaymentType
  change: string | number
  flag: string
  lastSelectedAddressId: number | null

  formsPayment: Partial<CartFormPaymentType>[] = []

  deviceWidth = window.innerWidth
  faArrowLeft = faArrowLeft

  currentIndex = 0
  pixInvoice = { copyPaste: '', qrCode: '', id: '' }
  pixSecretNumber = ''
  pixQrCodeMode = false
  pixRegeneration = false
  pixSteps = [
    'Digite o CPF do cliente para gerar uma chave PIX',
    'Solicite ao seu cliente que escaneie o QR Code, ou passe o Código de Pagamento para o mesmo',
  ]

  @ViewChild('generatePixButton') generatePixButton: ElementRef<HTMLButtonElement>

  faRotate = faRotate
  faPaste = faPaste

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { client: any; cartRequest: CartRequestType; cupom: CupomType | null; tableType?: 'command' | 'table' },
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public cartService: CartService,
    private matDialog: MatDialog,
    public toastService: ToastService,
    public api: ApiService,
    private websocket: WebsocketService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initKeyBoardShortCurts({ firstTime: true })
    this.profileFormPayment = this.context.profile?.formsPayment[0]
    const cashback = this.data.cartRequest.formsPayment.find((formPayment) => formPayment.payment === 'cashback')
    if (cashback) {
      this.formsPayment.push(cashback)
    }
    this.setValues()
  }

  ngAfterContentChecked(): void {
    this.initKeyBoardShortCurts({})
    this.setValues()
    const { flags } = this.profileFormPayment
    if (flags && flags.length && !this.flag) {
      this.flag = flags[0].code
    }
  }

  ngOnDestroy(): void {
    window.document.onkeydown = null
  }

  public async close(data?: {
    goBack?: boolean
    formsPayment?: CartFormPaymentType[]
    finishCartRequest?: boolean
    cancel?: boolean
  }): Promise<void> {
    window.document.onkeydown = null
    if (data.cancel === true) return this.dialogRef.close({ cancel: true, addonValue: this.addonValue })
    switch (this.data.tableType) {
      case 'table': {
        !data.goBack && (await this.closeTable())
        this.dialogRef.close({ addonValue: this.addonValue })
        break
      }
      case 'command': {
        const commandId = this.context.getActiveCommand().id
        let tableEmpty: boolean
        if (!data.goBack) {
          if (this.lackValue <= 0) {
            tableEmpty = await this.closeCommand()
          } else {
            await this.updateFormPayment()
          }
        }
        this.dialogRef.close({ commandId, tableEmpty })
        break
      }
      default: {
        let cart = this.data.cartRequest.id ? this.data.cartRequest : null
        if (cart) {
          try {
            const result = await this.api.updateCartFormsPayment({
              cartId: this.data.cartRequest.id,
              formsPayment: this.formsPayment as CartFormPaymentType[],
              slug: this.context.profile.slug,
              paymentType: this.data.cartRequest.statusPayment !== 'offline' ? 'online' : 'local',
            })
            cart = result.cart
          } catch (error) {
            throw error
          }
        }
        this.dialogRef.close({ ...data, finishCartRequest: !data.cancel, formsPayment: this.formsPayment, addonValue: this.addonValue, cart })
        break
      }
    }
  }

  public openAddress(): void {
    this.matDialog
      .open(ClientAddressComponent, {
        data: { type: 'list', addresses: this.data.client.addresses, clientId: this.data.client.id },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : 'auto',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ addressId }) => {
          if (this.data.cartRequest && addressId) {
            this.data.cartRequest.addressId = addressId
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public getAddressString(): string {
    const address: AddressType = this.data.client?.addresses.find((address) => address.id === this.data.cartRequest?.addressId)
    if (address) {
      return `${address.street}, ${address.number ? address.number : 'SN'} - ${address.neighborhood} - ${address.city} - ${address.uf}`
    } else {
      return this.translate.text().pick_up_counter
    }
  }

  public getPackageDateString(): string {
    return DateTime.fromFormat(this.data.cartRequest?.packageDate, 'yyyy-MM-dd HH:mm:ss').toFormat(`${this.translate.masks().date_mask} • HH:mm:ss'`)
  }

  public getFilterPayment(): CartFormPaymentType[] {
    if (this.profileFormPayment.payment === 'pix' && !this.context.profile.options.legacyPix && this.context.profile.options.asaas) {
      this.data.cartRequest.paymentType = 'online'
    }
    return this.context.profile?.formsPayment
      .filter((f) => f.status === true)
      .filter((f) => {
        if (f.payment === 'pix' && this.data.cartRequest.paymentType === 'local') {
          return true
        } else if (this.data.cartRequest.paymentType === 'online' && this.data.cartRequest.statusPayment !== 'paid') {
          return true
          // return this.generatePix({ regenerate: true })
        }
        return true
      })
  }

  public getFormPayment(payment: string): CartFormPaymentType {
    this.profileFormPayment = this.context.profile?.formsPayment.find((f) => f.payment === payment ?? this.profileFormPayment.payment)
    this.setValues(true)
    return this.profileFormPayment
  }

  public setFormPayment(): void {
    this.value = Number(this.value)
    if (this.value < 0.01) {
      return
    }
    const { label, payment, flags, addon } = this.profileFormPayment
    const newFormPayment: Partial<CartFormPaymentType> = { value: Number(this.value.toFixed(2)), label, payment, addon }
    if (this.formsPayment.length > 0) {
      delete newFormPayment.addon
    }
    if (newFormPayment.payment === 'money') {
      newFormPayment.change = Number(this.change)
    }
    if (flags && flags.length) {
      newFormPayment.flag = flags.find((f) => f.code === this.flag)
    }
    this.formsPayment.push(newFormPayment)
    this.setValues()
    this.value = null
  }

  public setValues(refreshValue?: boolean) {
    this.demandAddonValue = !this.formsPayment.length || this.formsPayment.every((f) => f.payment === this.profileFormPayment.payment)
    if (!this.demandAddonValue) {
      this.formsPayment = this.formsPayment.map((f) => {
        const { addon, ...rest } = f
        return rest
      })
      this.addonValue = 0
    } else {
      this.addonValue = this.cartService.formPaymentAddonCalcResult(this.profileFormPayment, this.totalWithOutAddon)
    }
    switch (this.data.tableType) {
      case 'table': {
        this.totalWithOutAddon = this.context.getActiveTable().opened?.getTotalValue('tableFee')
        this.total = this.totalWithOutAddon + this.addonValue || 0
        this.total = Number(this.total.toFixed(2))
        this.paidValue =
          this.formsPayment.reduce((total, paymentForm) => (total += this.formPaymentListValue(paymentForm)), 0) +
          this.context.getActiveTable().opened?.getTotalValue('paid')
        this.lackValue = Math.fround(Math.max(0, this.total - this.paidValue))
        this.value = this.value === null || refreshValue ? Math.fround(this.lackValue).toFixed(2) : this.value
        break
      }
      case 'command': {
        this.totalWithOutAddon = this.context.getActiveCommand()?.getTotalValue('commandFee')
        this.total = this.totalWithOutAddon + this.addonValue || 0
        this.total = Number(this.total.toFixed(2))
        this.paidValue =
          this.formsPayment.reduce((total, paymentForm) => (total += this.formPaymentListValue(paymentForm)), 0) +
          this.context.getActiveCommand()?.getTotalValue('paid')
        this.lackValue = Math.fround(Math.max(0, this.total - this.paidValue))
        this.value = this.value === null || refreshValue ? Math.fround(this.lackValue).toFixed(2) : this.value
        break
      }
      default: {
        this.totalWithOutAddon = this.data.cartRequest
          ? this.data.cartRequest?.total +
            Number(!this.data.cartRequest?.addressId ? 0 : this.data.cartRequest?.taxDelivery) -
            this.cartService.cupomValue(this.data.cupom, this.data.cartRequest)
          : 0
        this.total = this.totalWithOutAddon + this.addonValue //caso não tenha addressId ele não cobra taxa
        this.total = Number(this.total.toFixed(2))
        this.paidValue = this.formsPayment.reduce((total, paymentForm) => (total += this.formPaymentListValue(paymentForm)), 0)
        this.lackValue = Math.fround(Math.max(0, this.total - this.paidValue))
        this.value = this.value === null || refreshValue ? Math.fround(this.lackValue).toFixed(2) : this.value
        break
      }
    }
  }

  public removePayment(paymentIndex: number): void {
    this.formsPayment.splice(paymentIndex, 1)
    this.setValues()
    this.value = this.lackValue.toFixed(2)
  }

  public closeVerify(): boolean {
    if (this.data.cartRequest.taxDelivery === -1 && this.data.cartRequest.addressId !== null) return true
    switch (this.data.cartRequest?.type) {
      case 'D':
      case 'P':
        return this.lackValue > 0
      case 'T':
        if (this.data.tableType === 'command') {
          return false
        }
        return Number(Math.fround(this.paidValue).toFixed(2)) < Number(Math.fround(this.total).toFixed(2))
      default:
        return false
    }
  }

  // API

  public async updateFormPayment(): Promise<void> {
    try {
      const formsPayment = await this.api.updateFormPayment(this.context.getActiveCommand().id, this.formsPayment)
      this.context.getActiveCommand().formsPayment = [...this.context.getActiveCommand().formsPayment, ...formsPayment]
    } catch (error) {
      console.error(error)
      return this.toastService.show(error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    }
  }

  public async closeCommand(): Promise<boolean> {
    const button = document.querySelector<HTMLButtonElement>('#finishPaymentButton')
    if (button) {
      button.disabled = true
    }
    const formsPayment = this.formsPayment.filter((f) => !f.paid)
    this.context.getActiveCommand().formsPayment = this.context.getActiveCommand().formsPayment.filter((f) => !f.paid)
    try {
      const { tableEmpty, ...command } = await this.api.closeCommand(
        this.context.getActiveCommand(),
        this.context.getActiveTable().id,
        this.context.profile.slug,
        formsPayment,
        this.context.activeCashier.id
      )
      const commandIndex = this.context.getActiveTable().opened.commands.findIndex((c) => c.id === this.context.activeCommandId)
      if (commandIndex !== -1) {
        this.context.getActiveTable().opened.commands[commandIndex] = new Command(command)
      }
      // this.context.getActiveCommand().status = !!status
      return tableEmpty
    } catch (error) {
      console.error(error)
      throw this.toastService.show(error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
        button.disabled = false
      }
    }
  }

  public async closeTable(): Promise<void> {
    const button = document.querySelector<HTMLButtonElement>('#finishPaymentButton')
    if (button) {
      button.disabled = true
    }
    const formsPayment = this.formsPayment.filter((f) => !f.paid)
    this.context.getActiveTable().opened.formsPayment = this.context.getActiveTable().opened.formsPayment.filter((f) => !f.paid)
    try {
      const { cashier, table } = await this.api.closeTable(
        this.context.getActiveTable(),
        this.context.profile.slug,
        formsPayment,
        this.context.activeCashier?.id
      )
      this.context.activeCashier = cashier
      const tableUpdateIndex = this.context.tables.findIndex((t) => t.id === this.context.activeTableId)
      if (tableUpdateIndex !== -1) {
        this.context.tables[tableUpdateIndex] = new Table(table)
      }
    } catch (error) {
      console.error(error)
      return this.toastService.show(error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
        button.disabled = false
      }
    }
  }

  public valueToNumber(value: string | number) {
    return Number(value)
  }

  public changeValueSet(value: string) {
    if (value) {
      value = value.replace(/\D+/g, '')
      return value.replace(/^(\d+)(\d{2})$/g, '$1.$2')
    }
  }

  public initKeyBoardShortCurts({ firstTime = false }: { firstTime?: boolean }) {
    const formPaymentForm = document.querySelector('#formPaymentForm')
    if (!formPaymentForm) {
      return
    }
    const focusableElements: NodeListOf<HTMLInputElement> = formPaymentForm.querySelectorAll(
      'input, button:not(:disabled), select:not(:disabled), a, [tabindex]:not([tabindex="-1"])'
    )
    const confirmPaymentButton = document.getElementById('confirmPayment')
    if (firstTime) {
      setTimeout(() => {
        focusableElements[0].select()
      }, 500)
    }
    window.document.onkeydown = (event) => {
      if (this.lackValue === 0) {
        return
      }
      switch (event.key) {
        case 'Enter':
        case 'Tab':
          event.preventDefault()
          if (focusableElements[this.currentIndex]?.nodeName === 'BUTTON') {
            focusableElements[this.currentIndex].click()
            if (Number(this.value) >= this.lackValue) {
              setTimeout(() => {
                confirmPaymentButton.focus()
              }, 10)
              break
            }
          }
          focusableElements[this.currentIndex]?.blur()
          this.currentIndex = (this.currentIndex + 1) % focusableElements.length
          if (this.currentIndex === 0) {
            setTimeout(() => {
              focusableElements[this.currentIndex].select()
            }, 10)
          } else {
            focusableElements[this.currentIndex].focus()
          }
          break
        case 'Escape':
          if (this.currentIndex === 0) {
            this.close({ goBack: true })
            break
          }
          event.preventDefault()
          focusableElements[this.currentIndex].blur()
          this.currentIndex = (this.currentIndex - 1) % focusableElements.length
          focusableElements[this.currentIndex].focus()
          break
        default:
          break
      }
    }
  }

  public allFormsPayment() {
    if (this.data.tableType === 'command') {
      return this.context.getActiveCommand().formsPayment.concat(this.formsPayment)
    }
    return this.profileFormPayment
  }

  async generatePix({ regenerate = false }: { regenerate?: boolean }) {
    this.pixRegeneration = regenerate
    const generatePixButton = this.generatePixButton
    if (generatePixButton) {
      generatePixButton.nativeElement.disabled = true
    }
    if (regenerate && this.websocket.connection.readyState) {
      this.websocket.disconnect()
    }

    const externalReference: { tableId?: number; commandId?: number; cartId?: number } = {}
    if (!this.data.tableType) {
      if (!this.data.cartRequest.id) {
        try {
          const { cart } = await this.api.storeCart({
            slug: this.context.profile.slug,
            cartRequest: { ...this.data.cartRequest, paymentType: 'online' },
            userAgent: navigator.userAgent,
          })
          if (this.data.cartRequest.taxDelivery !== cart.taxDelivery) {
            this.value = Number(this.value) + cart.taxDelivery - this.data.cartRequest.taxDelivery
          }
          this.data.cartRequest = cart
        } catch (error) {
          if (generatePixButton) {
            generatePixButton.nativeElement.disabled = false
          }
          throw error
        }
      }
      externalReference.cartId = this.data.cartRequest.id
    }
    let name = this.data.client?.name

    if (this.data.tableType === 'command') {
      externalReference.commandId = this.context.getActiveCommand().id
      name = this.context.getActiveCommand().name
    }
    if (this.data.tableType === 'table') {
      externalReference.tableId = this.context.getActiveTable()?.opened.id
      name = this.context.getActiveTable().name
    }
    const pixObject = {
      externalReference,
      billingType: 'PIX',
      dueDate: DateTime.local().toFormat('yyyy-MM-dd'),
      name,
      document: this.pixSecretNumber,
      value: Number(Number(this.value).toFixed(2)),
      description: `Pagamento Mesa ${this.context.profile.name} - WhatsMenu`,
      walletId: this.context.profile.options.asaas.walletId,
      clientId: !!this.data.tableType ? 0 : this.data.client.id,
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
      this.generatePixButton.nativeElement.disabled = false
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
          this.data.cartRequest = data.cart
          this.formsPayment = [...this.formsPayment, ...this.data.cartRequest.formsPayment]
        }
        this.setValues()
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

  addPaymentDisableCondition() {
    if (this.profileFormPayment.payment === 'pix' && !this.context.profile.options.legacyPix && this.context.profile.options.asaas) {
      return Number(this.value) < 5
    }
    return Number(this.value) < 0.01 || (Number(this.change) > 0 && Number(this.value) > Number(this.change))
  }

  async cancelPixMode() {
    const body: { paymentId: string; commandId?: number; tableId?: number } = { paymentId: this.pixInvoice.id }
    if (this.data.tableType === 'command') {
      body.commandId = this.context.getActiveCommand().id
    }
    if (this.data.tableType === 'table') {
      body.tableId = this.context.getActiveTable().opened.id
    }
    try {
      if (this.pixInvoice.qrCode) {
        await this.api.deletePixPdv(body)
        this.toastService.show(`Operação cancelada com sucesso!`, {
          classname: 'bg-success text-light text-center pos middle-center',
          delay: 3000,
        })
      }
    } catch (error) {
      console.error(error)
      if (error?.error?.message) {
        return this.toastService.show(error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      }
    } finally {
      this.pixQrCodeMode = false
      this.pixSecretNumber = ''
      this.pixInvoice = {
        copyPaste: '',
        id: '',
        qrCode: '',
      }
    }
  }

  public copyToClipboardOnline() {
    navigator.clipboard.writeText(this.pixInvoice.copyPaste)
    this.toastService.show(`Copiada com sucesso`, {
      classname: 'bg-success text-light text-center pos middle-center',
      delay: 3000,
    })
  }

  async verifyPix() {
    const body: { paymentId: string; commandId?: number; tableId?: number; cartId?: number } = { paymentId: this.pixInvoice.id }
    if (!this.data.tableType) {
      body.cartId = this.data.cartRequest.id
    }
    if (this.data.tableType === 'command') {
      body.commandId = this.context.getActiveCommand().id
    }
    if (this.data.tableType === 'table') {
      body.tableId = this.context.getActiveTable().opened.id
    }
    try {
      const { payment, cart } = await this.api.verifPixPdv(body)
      if (payment.paid) {
        if (cart) {
          this.data.cartRequest = cart
          this.formsPayment = [...this.formsPayment, ...this.data.cartRequest.formsPayment]
        }
        this.pixInvoice = {
          copyPaste: '',
          id: '',
          qrCode: '',
        }
        if (this.data.tableType === 'command') {
          this.context.getActiveCommand().formsPayment.push(payment)
        }
        if (this.data.tableType === 'table') {
          this.context.getActiveTable().opened.formsPayment.push(payment)
        }
        this.setValues()
        this.pixQrCodeMode = false
        this.toastService.show(`Pagamento pix efetuado com sucesso`, {
          classname: 'bg-success text-light text-center pos middle-center',
          delay: 3000,
        })
      } else {
        this.toastService.show('Pagamento não detectado.', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      }
    } catch (error) {
      console.error(error)
      if (error?.error?.message) {
        return this.toastService.show(error?.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      }
    }
  }

  disableCancelButton() {
    if (!!this.data.tableType) {
      return (
        this.data.tableType === 'command' ? this.context.getActiveCommand().formsPayment : this.context.getActiveTable().opened.formsPayment
      ).some((f) => f.paid)
    }
    return false
  }

  formPaymentListValue(formPayment: Partial<CartFormPaymentType>) {
    if (formPayment.payment === 'cashback') {
      return this.total <= formPayment.value ? this.total : formPayment.value
    }
    return formPayment.value
  }

  cashbackValueAvaliable() {
    let result = 0
    if (this.data.client.vouchers.length && this.context.profile.options.voucher[0].status) {
      result = this.data.client.vouchers.reduce((total, voucher) => (total += voucher.value), 0)
    }
    return result
  }
}
