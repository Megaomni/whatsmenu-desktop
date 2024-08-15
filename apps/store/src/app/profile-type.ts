import { AdmTableType } from 'src/classes/table'
import { BartenderType } from './bartender-type'
import { CashierType } from './cashier-type'
import { CategoryType } from './category-type'
import { WeekType } from './client-type'
import { FeeType } from './fee-type'
import { CartFormPaymentType } from './formpayment-type'
import { TaxDeliveryType } from './tax-delivery-type'

export interface ProfileType {
  id: number
  userId: number
  name: string
  slug: string
  typeStore: null
  status: boolean
  deliveryLocal: boolean
  showTotal: number
  description: string
  whatsapp: string
  typeDelivery: string
  taxDelivery: TaxDeliveryType[]
  address: any
  formsPayment: CartFormPaymentType[]
  fees: FeeType[]
  week: WeekType
  timeZone: string
  options: ProfileOptionsType
  minval: null
  minvalLocal: null
  request: number
  command: number
  logo: string
  background: string
  color: string
  created_at: string
  updated_at: string
  queues: {
    bartender: []
  }
  tables: AdmTableType[]
  bartenders: BartenderType[]
  cashiers: CashierType[]
  plans?: any[]
  version: number
  fuso: string
  categories: CategoryType[]
  awaiting_date?: string
}

export interface ProfileOptionsType {
  queues?: {
    bartender: Array<{
      id: number
      commandId: number
      commandName: string
      created_at: string
      openedId: number
      tableId: number
    }>
  }
  hideSecretNumber: boolean
  onlinePix?: boolean
  onlineCard?: boolean
  inventoryControl: boolean
  order: string
  pizza: {
    hideBorderNone: boolean
    higherValue?: boolean
    multipleBorders: boolean
    multipleComplements: boolean
  }
  print: {
    app: boolean
    web: string
    width: string
    active: boolean
    copies: number
    textOnly: boolean
    groupItems: boolean
  }
  delivery?: {
    disableDelivery: boolean
  }
  table: {
    persistBartender: boolean
    callBartender?: boolean
  }
  asaas: {
    walletId: string
  }
  package: {
    week: WeekType
    active: boolean
    label2: boolean
    minValue: number
    maxPackage: number
    distanceDays: {
      end: number
      start: number
    }
    intervalTime: number
    weekDistance: null
    minValueLocal: number
    shippingLocal: {
      active: boolean
    }
    specialsDates: any[]
    maxPackageHour: number
    shippingDelivery: {
      active: boolean
    }
    hoursBlock?: {
      [key: string]: {
        date: string
        hours: PackageHour[]
      }
    }
    cashierDate?: 'nowDate' | 'deliveryDate'
  }
  tracking?: any
  forceClose: null | string
  activeCupom: boolean
  favicon: string
  placeholders?: {
    pizzaObs: string
    productObs: string
    statusSend: string
    statusToRemove: string
    statusProduction: string
    clientText: string
    sendWhatsMessage: string
  }
  disponibility?: any
  blackList?: { whatsapp: string; ip: string }[]
  pdv: {
    cashierManagement: boolean
    clientConfig: {
      birthDate: boolean
      required: boolean
    }
    sendWhatsMessage: boolean
  }
  recipient: {
    id: string
    data: RecipientData
    created_at: any
  }
  expose?: boolean
  legacyPix?: boolean
  store: {
    productModal: {
      infoPosition: 'last' | 'first'
    }
    catalogMode: {
      table: boolean
      delivery: boolean
    }
  }
  linkWhatsapp?: boolean
  whatsappOficial?: boolean
  voucher: Array<{
    percentage: number
    expirationDays: number
    status: boolean
    createdAt: string
  }>

  locale: {
    currency: string
    language: string
  }
}

interface RecipientData {
  id: string
  bank: string
  type: string
  status: string
  created_at: string
  updated_at: string
  holder_name: string
  holder_type: string
  branch_number: string
  account_number: string
  holder_document: string
  account_check_digit: string
}

interface PackageHour {
  hour: string
  quantity: number
}
