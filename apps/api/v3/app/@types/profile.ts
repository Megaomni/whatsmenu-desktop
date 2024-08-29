import { WeekType } from './week.js'

export type KmType = {
  time: string
  value: number | string
  distance: number | string
}
export type NeighborhoodType = {
  city: string
  neighborhoods: Array<{
    code: string
    name: string
    time: string
    value: number
  }>
}

export type ProfileTaxDeliveryType = {
  code: string
} & (KmType | NeighborhoodType)

export interface ProfileAddress {
  city: string
  state: string
  number: string
  street: string
  zipcode: string
  complement: string | null
  neigborhood: string
}

export interface ProfileOptions {
  pdv: {
    clientConfig: {
      required: boolean
      birthDate: boolean
    }
    cashierManagement: boolean
  }
  asaas?: {
    id: string
    apiKey: string
    walletId: string
    loginEmail: string
    mobilePhone: string
    negotiations: Array<{
      pix: Array<{
        fee: number
        expiration_date: string
      }>
    }>
    accountNumber: {
      agency: string
      account: string
      accountDigit: string
    }
  }
  order: string
  pizza: {
    higherValue: boolean
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
  table: {
    callBartender: boolean
    persistBartender: boolean
  }
  queues: {
    bartender: any[]
  }
  favicon: string
  package: {
    week: WeekType
    active: boolean
    label2: boolean
    minValue: number
    hoursBlock: any[]
    maxPackage: number
    distanceDays: {
      end: number
      start: number
    }
    intervalTime: number
    minValueLocal: number
    shippingLocal: {
      active: boolean
    }
    specialsDates: Array<string>
    maxPackageHour: number
    shippingDelivery: {
      active: boolean
    }
  }
  delivery: {
    enableKm: boolean
    disableDelivery: boolean
  }
  tracking: {
    pixel: string
    google: string
  }
  legacyPix: boolean
  onlinePix: boolean
  forceClose: string | null
  onlineCard: boolean
  activeCupom: boolean
  forceLogout?: number
  linkWhatsapp: boolean
  placeholders: {
    pizzaObs: string
    clientText: string
    productObs: string
    statusSend: string
    statusToRemove: string
    statusProduction: string
    welcomeMessage: string
    absenceMessage: string
    cupomFirstMessage: string
  }
  voucher: Array<{
    percentage: number
    expirationDays: number
    status: boolean
    created_at: string
  }>
  disponibility: {
    showProductsWhenPaused: boolean
  }
  inventoryControl: boolean
  integrations: {
    ifood: {
      created_at: string
    }
  }
}
