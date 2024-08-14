import { client } from 'src/test/utils/client'
import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core'
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { faArrowLeft, faCalendarDay, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap'
import { DateTime } from 'luxon'
import { AddressType } from 'src/app/address-type'
import { CartPizza } from 'src/app/cart-pizza'
import { CartRequestType } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { CupomType } from 'src/app/cupom'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { CustomAdapter, CustomDateParserFormatter, CustomDatepickerI18n, I18n } from 'src/app/services/ngb-datepicker/ngb-datepicker.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import { ClientAddressComponent } from '../client-address/client-address.component'
import { ClientStoreComponent } from '../client-store/client-store.component'
import { CartTypeComponent } from '../cart-type/cart-type.component'
import { ProfileOptionsType } from 'src/app/client-type'
import { ProfileType } from '../../../profile-type'
import { TranslateService } from 'src/app/translate.service'

interface CartResumeComponentData {
  packageHours: { [key: string]: Array<{ time: string; quantity: number }[]> }
  cartRequest: CartRequestType
  cart: CartType[]
  cartPizza: CartPizza[]
  client: any
  cupom: CupomType | null
  addressSelectedId: number
}
@Component({
  selector: 'app-cart-resume',
  templateUrl: './cart-resume.component.html',
  providers: [
    I18n,
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n },
    { provide: NgbDateAdapter, useClass: CustomAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
  styleUrls: ['./cart-resume.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss'],
})
export class CartResumeComponent implements OnInit, AfterViewChecked {
  addressId: number | null
  addressSelected: AddressType | null
  cupom: CupomType | null = null
  profileOptions: ProfileOptionsType
  startDate: any
  endDate: any
  packageCalendar: string
  packageHour: string
  hourFilter = ''
  taxDelivery = 0
  clientData: ProfileType
  clientInfo: { id: number | null; defaultAddressId: number | null } = { id: null, defaultAddressId: null }

  faArrowLeft = faArrowLeft
  faChevronDown = faChevronDown
  faCalendarDay = faCalendarDay

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CartResumeComponentData,
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public translate: TranslateService,
    public cartService: CartService,
    public api: ApiService,
    public toastService: ToastService,
    private matDialog: MatDialog
  ) {
    this.cartService.markDisabled = this.cartService.markDisabled.bind(this)
  }

  ngOnInit(): void {
    if (this.data.packageHours) {
      if (typeof Worker !== 'undefined') {
        const worker = new Worker(new URL('../../../workers/package-hours.worker.ts', import.meta.url))
        worker.onmessage = ({ data }) => {
          const { packageHours, packageCalendar } = data
          this.data.packageHours = packageHours
          this.packageCalendar = packageCalendar
          this.setPackageHour()
          worker.terminate()
        }
        worker.postMessage(JSON.stringify({ context: this.context, packageHours: this.data.packageHours }))
      } else {
        this.setPackageHour()
      }
    }
    const start = DateTime.local().plus({ days: this.context.profile?.options.package.distanceDays.start }).toObject()
    this.startDate = {
      day: start.day,
      month: start.month,
      year: start.year,
    }
    const end = DateTime.local().plus({ days: this.context.profile?.options.package.distanceDays.end }).toObject()
    this.endDate = {
      day: end.day,
      month: end.month,
      year: end.year,
    }

    this.addressId = this.data.cartRequest?.addressId ?? null
    if (this.data.cupom) {
      this.cupom = this.data.cupom
    }
    this.setSelectedAddress()
  }

  ngAfterViewChecked(): void {
    if (this.data.cartRequest?.type === 'P' && this.packageCalendar) {
      this.data.cartRequest.packageDate = DateTime.fromFormat(
        `${this.packageCalendar} ${this.packageHour}`,
        `${this.translate.masks().date_mask} HH:mm`
      ).toFormat('yyyy-MM-dd HH:mm:ss')
    }
  }

  public close(data: { toPayment?: boolean; focusSearch?: boolean; finishCartRequest?: boolean }): void {
    this.data.cartRequest.cupomId = data.toPayment ? this.data.cartRequest.cupomId : null
    if (data.toPayment && !this.data.cart.length && !this.data.cartPizza.length) {
      return this.toastService.show(`${this.translate.text().cart_empty}!`, {
        classname: 'bg-warning text-black text-center pos middle-center',
        delay: 3000,
      })
    }
    this.dialogRef.close({
      ...data,
      addressId: this.addressId,
      client: this.data.client,
      cupom: this.cupom,
      packageDate: this.data.cartRequest?.packageDate,
      packageHours: this.data.packageHours,
      addressSelectedId: this.addressSelected?.id,
    })
  }

  /** Seta o endereço para o pedido */
  public setSelectedAddress(): void {
    if (this.data.client) {
      if (this.data.addressSelectedId) {
        this.addressSelected = this.data.client.addresses.find((a: AddressType) => a.id === this.data.addressSelectedId)
      } else {
        this.addressSelected = this.data.client.addresses.find((a: AddressType, index: number) => index === 0)
      }
    }
    this.setTaxDeliveryValue()
  }

  public openCartType(): void {
    if (
      this.context.profile.plans.flatMap((plan) => plan.category).includes('basic') &&
      this.context.profile.plans.flatMap((plan) => plan.category).includes('package')
    ) {
      this.matDialog
        .open(CartTypeComponent, {
          maxWidth: '100vw',
          height: window.innerWidth < 600 ? '100vh' : '60vh',
          width: window.innerWidth < 600 ? '100vw' : '700px',
          disableClose: true,
        })
        .afterClosed()
        .subscribe(
          ({ type }) => {
            this.data.cartRequest.type = type
          },
          (error) => {
            console.error(error)
          }
        )
    } else {
      this.data.cartRequest.type = this.context.profile.plans.includes('package') ? 'P' : 'D'
    }
  }

  public openClientRegister(data?: { type: 'update' | 'create'; refId?: number }): void {
    this.matDialog
      .open(ClientStoreComponent, {
        data: { ...data, client: this.data.client, addressId: this.addressId },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '80vh',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed()
      .subscribe(
        ({ client, addressId }) => {
          if (client) {
            this.data.client = client
          }
          this.addressId = addressId ?? null
          this.addressSelected = this.data.client?.addresses.find((a: AddressType) => a.id === this.addressId)
          this.openCartType()
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public openAddress(): void {
    this.matDialog
      .open(ClientAddressComponent, {
        data: { type: this.data.client.addresses.length ? 'list' : 'create', addresses: this.data.client.addresses, clientId: this.data.client.id },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : 'auto',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ address, goBack, oldAddresses }) => {
          if (goBack) {
            this.addressSelected = address
            this.setTaxDeliveryValue()
            this.data.client.addresses = oldAddresses
            return
          }
          if (address) {
            this.data.cartRequest.addressId = address.id
            this.addressId = address.id
            const faddress = this.data.client.addresses.find((a: AddressType) => a.id === address.id)
            if (!faddress) {
              this.data.client.addresses = [...oldAddresses, address]
            }
            this.addressSelected = this.data.client.addresses.find((a: AddressType) => a.id === this.addressId) ?? address
            this.setTaxDeliveryValue()
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  /** Verifica se o cupom é válido */
  public async verifyCupom(cupomCode: string): Promise<void> {
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
    if (button) {
      button.disabled = true
    }

    const storedClientInfo = JSON.parse(localStorage.getItem(`${this.context.profile.slug}-clientInfo`))
    if (storedClientInfo) {
      this.clientInfo = storedClientInfo
    }

    try {
      const cupom = await this.api.getCupom(this.context.profile?.slug, cupomCode, this.clientInfo.id)
      if (this.cartService.cupomValue(cupom, this.data.cartRequest) < this.data.cartRequest.total) {
        this.cupom = cupom
      } else {
        return this.toastService.show(`${this.translate.text().discount_coupon_greater_total}`, {
          classname: 'bg-danger text-white text-center pos middle-center',
          delay: 3000,
        })
      }

      if (this.data.cartRequest.total >= cupom.minValue) {
        this.cupom = cupom
      } else {
        return this.toastService.show(`${this.translate.text().coupon_only_used_purchases} ${this.context.currency(cupom.minValue)}`, {
          classname: 'bg-warning text-black text-center pos middle-center',
          delay: 3000,
        })
      }
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-white text-center pos middle-center', delay: 3000 })
    }
  }

  /** Retorna um array de datas para encomenda com numero de quantidades possiveis de encomendas a partir de 30 minutos a mais na data atual */
  public filteredPeriod(hour: { time: string; quantity: number }[]): { time: string; quantity: number }[] {
    return hour.filter((h) => {
      return (
        h.time.includes(this.hourFilter.replace(/(\d{2})(\d{1,2})/, '$1:$2')) && h.time > DateTime.local().plus({ minutes: 30 }).toFormat('HH:mm')
      )
    })
  }

  /** Retorna a posição do endereço no array de endereços do cliente */
  public selectedAddressIndex(): number {
    if (this.data.client?.addresses.length) {
      return (this.data.client?.addresses as AddressType[]).findIndex((address) => address.id === this.addressSelected.id)
    }
    return 0
  }

  public clearString(text: string) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim()
  }

  /** Seta a taxa de entrega de acordo com o endereço selecionado do cliente */
  public setTaxDeliveryValue(): void {
    if (this.data.cartRequest) {
      let tax
      if (this.addressId) {
        const address: AddressType = this.data.client?.addresses.find((address: AddressType) => address.id === this.data.cartRequest.addressId)
        if (this.context.profile?.typeDelivery === 'km') {
          tax = this.context.profile?.taxDelivery.find((tax) => tax.distance >= address?.distance / 1000)
        }

        if (this.context.profile?.typeDelivery === 'neighborhood') {
          tax = this.context.profile?.taxDelivery
            .filter((tax) => this.clearString(tax.city) === this.clearString(address.city))
            .flatMap((tax) => tax.neighborhoods)
            .find((neighborhood) => this.clearString(neighborhood.name) === this.clearString(address.neighborhood))
        }

        if (tax) {
          this.data.cartRequest.taxDelivery = isNaN(Number(tax.value)) ? tax.value : Number(tax.value)
          this.taxDelivery = isNaN(Number(tax.value)) ? tax.value : Number(tax.value)
        }
      } else {
        this.data.cartRequest.taxDelivery = -1
      }
      this.data.cartRequest.total
    }
  }

  /** Seta valor horário da encomenda  */
  public setPackageHour(): void {
    if (this.data.packageHours && this.data.packageHours[this.packageCalendar]) {
      this.packageHour = this.filteredPeriod(this.data.packageHours[this.packageCalendar][0])[0]?.time
    }
  }

  public alternateTypeDelivery(addressId: number | null) {
    this.addressId = addressId
    this.data.cartRequest.addressId = addressId
    this.setTaxDeliveryValue()
  }

  public updatePackageCalendar(data: { packageCalendar: string; packageHour: string }) {
    this.packageCalendar = data.packageCalendar
    this.packageHour = data.packageHour
  }
}
