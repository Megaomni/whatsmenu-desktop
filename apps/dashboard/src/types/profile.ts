import { BubbleControllerDatasetOptions } from 'chart.js'
import { WeekType } from './dates'
import { CupomType } from './cupom'

export interface ProfileType {
  address: ProfileAddress
  background: string
  color: string
  command: number
  created_at: string
  deliveryLocal: boolean
  description: string
  fees: ProfileFee[]
  formsPayment: ProfileFormPayment[]
  id: number
  logo: string
  minval: number | string
  minvalLocal: number | string
  name: string
  not_security_key?: boolean
  options: ProfileOptions
  request: number
  showTotal: boolean
  slug: string
  status: boolean
  taxDelivery: ProfileTaxDeliveryKM[] | ProfileTaxDeliveryNeighborhood[]
  timeZone: string
  typeDelivery: 'km' | 'neighborhood'
  typeStore: string
  updated_at: string
  userId: number
  week: WeekType
  whatsapp: string
  firstOnlyCupom?: CupomType
}

export default class Profile {
  address: ProfileAddress
  background: string
  color: string
  command: number
  created_at: string
  deliveryLocal: boolean
  description: string
  fees: ProfileFee[]
  formsPayment: ProfileFormPayment[]
  id: number
  logo: string
  minval: number | string
  minvalLocal: number | string
  name: string
  not_security_key?: boolean
  options: ProfileOptions
  request: number
  showTotal: boolean
  slug: string
  status: boolean
  taxDelivery: ProfileTaxDeliveryKM[] | ProfileTaxDeliveryNeighborhood[]
  timeZone: string
  typeDelivery: 'km' | 'neighborhood'
  typeStore: string
  // categories: Category[];
  updated_at: string
  userId: number
  week: WeekType
  whatsapp: string
  firstOnlyCupom?: CupomType

  constructor(profile: ProfileType) {
    this.address = profile.address
    this.background = profile.background
    this.color = profile.color
    this.command = profile.command
    this.created_at = profile.created_at
    this.deliveryLocal = profile.deliveryLocal
    this.description = profile.description
    this.fees = profile.fees
    this.formsPayment = profile.formsPayment
    this.id = profile.id
    this.logo = profile.logo
    this.minval = profile.minval
      ? (typeof profile.minval === 'number'
          ? profile.minval
          : Number(profile.minval)
        ).toFixed(2)
      : ''
    this.minvalLocal = profile.minvalLocal
      ? (typeof profile.minvalLocal === 'number'
          ? profile.minvalLocal
          : Number(profile.minvalLocal)
        ).toFixed(2)
      : ''
    this.name = profile.name
    this.not_security_key = profile.not_security_key
    this.options = profile.options
    this.request = profile.request
    this.showTotal = profile.showTotal
    this.slug = profile.slug
    this.status = profile.status
    this.taxDelivery = profile.taxDelivery
    this.timeZone = profile.timeZone
    this.typeDelivery = profile.typeDelivery
    this.typeStore = profile.typeStore
    this.updated_at = profile.updated_at
    this.userId = profile.userId
    this.week = profile.week
    this.whatsapp = profile.whatsapp
    this.firstOnlyCupom = profile.firstOnlyCupom

    if (
      this.options &&
      this.options.placeholders &&
      !this.options.placeholders?.clientText
    ) {
      this.options.placeholders.clientText = 'Olá [NOME], Tudo bem?'
    }
    if (this.options) {
      if (this.options.print.copies < 0) {
        this.options.print.copies = 1
      } else if (this.options.print.copies > 100) {
        this.options.print.copies = 100
      }
    }
  }

  headers = (token: string) => {
    return new Headers({
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    })
  }

  public weekDate = () => {
    Object.keys(this.week).forEach((day: string) => {
      this.week[day]
    })
  }
}

export interface ProfileAddress {
  city: string
  complement: string
  neigborhood: string
  number: string
  state: string
  street: string
  zipcode: string
}

export interface BankAccountSettings {
  password?: string
  holder_name: string
  bank: string
  branch_number: string
  account_number: string
  account_check_digit: string
  holder_type: 'individual' | 'company'
  holder_document: string
  type: 'checking' | 'savings'
}

export interface ProfileFormPayment {
  payment: string
  status?: boolean
  flags?: { code: string; image: string; name: string }[]
  newFlag?: string
  label: string
  key?: { type: string; value: string }
  addon: {
    status: boolean
    type: 'fee' | 'discount' | string
    valueType: 'fixed' | 'percentage' | string
    value: number
  }
}

export interface ProfileOptions {
  order: string
  integrations: {
    grovenfe:{
      plan: any
      config:{
        fiscal_notes:{
          day_limiter: number | null
          forms_payment: {type: string}[]
        }
      }
      created_at: string
      company_id: number
    }
  }
  pizza: {
    higherValue: boolean
    multipleBorders: boolean
    multipleComplements: boolean
  }
  invoiceMessage?: boolean
  print: {
    width: string
    active: boolean
    copies: number
    textOnly: boolean
    groupItems: boolean
    bolder: boolean
    fontSize: number
    margin: number
    app?: boolean
    web?: 'bluetooth' | 'usb' | ''
  }
  locale: {
    currency: string
    language: string
  }
  store: {
    productModal: {
      imgFull: boolean
      infoPosition: 'last' | 'first'
    }
    catalogMode: {
      table: boolean
      delivery: boolean
    }
  }
  favicon: string
  package: OptionsPackage
  delivery: {
    enableKm: boolean
    disableDelivery: boolean
  }
  table?: {
    persistBartender?: boolean
    callBartender?: boolean
  }
  tracking: {
    pixel: string
    google: string
    googleAds: { id: string; label: string }
  }
  hideSecretNumber: boolean
  forceClose: string | null
  activeCupom: boolean
  linkWhatsapp: boolean
  betaWhatsMenu?: boolean
  whatsappOficial?: boolean
  twoSend?: boolean
  recipient: {
    data: any
    created_at: any
  }
  placeholders: ProfilePlaceholders
  disponibility: {
    showProductsWhenPaused: boolean
  }
  forceLogout?: number
  pdv: {
    cashierManagement: boolean
    clientConfig: {
      birthDate: boolean
      required: boolean
    }
    sendWhatsMessage: boolean
  }
  onlinePix: boolean
  onlineCard: boolean
  inventoryControl: boolean
  asaas: {
    id: string
    loginEmail: string
    mobilePhone: string
    advanceCardPayment: boolean
    terms?: {
      ip: string
      userAgent: string
      created_at: string
    }
    negotiation?: {
      pix: Array<{ fee: number; expiration_date: string }>
    }
    accountNumber: {
      agency: string
      account: string
      accountDigit: string
    }
    incomeValue?: number
  }
  legacyPix?: boolean
  voucher: Array<{
    percentage: number
    expirationDays: number
    status: boolean
    createdAt: string
  }>
}

export interface ProfilePlaceholders {
  pizzaObs: string
  productObs: string
  statusSend: string
  statusToRemove: string
  statusProduction: string
  clientText: string
  sendWhatsMessage: string
  welcomeMessage: string
}
export interface ProfileOptionsWeekDays {
  name: string
  active: boolean
}

export interface ProfileTaxDeliveryKM {
  code: string
  time: string
  value: number | string
  distance: number | string
}

export interface ProfileTaxDeliveryNeighborhood {
  city: string
  code: string
  neighborhoods: ProfileTaxDeliveryNeighborhoodItem[]
}

export interface ProfileTaxDeliveryNeighborhoodItem {
  code: string
  name: string
  time: string
  value: number | string
}

export interface ProfileFee {
  id?: number | null
  code: string | null
  profileId?: number | null
  type: 'percent' | 'fixed' | null
  value: number
  quantity?: number
  oldQuantity?: number
  status: boolean | null
  automatic: boolean
  deleted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface OptionsPackage {
  active: boolean
  minValue: number | string
  minValueLocal: number | string
  week: WeekType
  weekDays: ProfileOptionsWeekDays[]
  maxPackage: number
  maxPackageHour: number
  label2?: boolean
  intervalTime: number
  weekDistance: number
  shippingLocal: {
    active: boolean
  }
  specialsDates: string[]
  allowPackageDay: boolean
  shippingDelivery: {
    active: boolean
  }
  distanceDays: {
    start: number
    end: number
  }
  cashierDate?: 'nowDate' | 'deliveryDate' | string
}
