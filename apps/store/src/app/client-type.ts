import { TaxDeliveryType } from './tax-delivery-type'
import { CustonProductType } from './custon-product-type'
import { CategoryType } from './category-type'
import { DeliveryType } from './delivery-type'
import { Moment } from 'moment'

export interface ClientType {
  id: number
  name: string
  slug: string
  status: boolean
  description: string
  fuso: string
  whatsapp: string
  minval: number
  minvalLocal: number
  typeDelivery: string
  address: DeliveryType
  taxDelivery: any[]
  formsPayment: FormPaymentType[]
  week: WeekType
  timeZone: string
  showTotal: boolean
  deliveryLocal: boolean
  logo: string
  background: string
  color: string
  categories: CategoryType[]
  options?: ProfileOptionsType
  version: number
}

export interface WeekType {
  sunday: DayType[]
  monday: DayType[]
  tuesday: DayType[]
  wednesday: DayType[]
  thursday: DayType[]
  friday: DayType[]
  saturday: DayType[]
}

export interface DayType {
  active: boolean
  code: string
  open: string
  close: string
  weekDay: number
}

export interface ProfileOptionsType {
  queues: {
    bartender: []
  }
  expose: boolean
  activeCupom?: boolean
  beta?: boolean
  order?: string
  pizza?: {
    higherValue?: boolean
    multipleBorders?: boolean
    multipleComplements?: boolean
  }
  delivery?: {
    disableDelivery?: boolean
  }
  placeholders: {
    productObs: string
    pizzaObs: string
  }
  forceClose: string
  tracking: { pixel: string }
  package?: Package
  disponibility?: {
    showProductsWhenPaused: boolean
  }
  print: {
    groupItems: boolean
  }
  blackList?: { whatsapp: string; ip: string }[]
  pdv: {
    cashierManagement: boolean
    clientConfig: {
      birthDate: boolean
      required: boolean
    }
  }
}

export interface FormPaymentType {
  payment: string
  status: boolean
  flags?: { code: string; image: string; name: string }[]
  key?: { type: string; value: string }
}

export interface Package {
  specialsDates?: Array<Moment | string>
  week: WeekType
  weekDays?: Array<object>
  active: string
  shipping: string
  weekDistance: number
  intervalTime: number
  shippingDelivery: {
    active: string
  }
  shippingLocal: {
    active: string
  }
  maxPackage: number
  maxPackageHour: number
  minValueLocal: number
  minValue: number
  distanceDays: {
    start: number
    end: number
  }
  // timePackage: TimePackage;
  // allowPackageDay: boolean;
  label2: string
  hoursBlock?: {
    [key: string]: {
      hours: { hour: string; quantity: number }[]
      date: string
    }
  }
}

// export interface TimePackage {
//   active: boolean,
//   afterOpen?: number,
//   beforeClose: number,
//   intervalTime: number,
//   hoursBlock?: {
//     date: string,
//     id: string,
//     hours: string[]
//     [key: string] : {
//       hours: string[],
//       date: string
//     }
//   },
// }
