import { AddressType } from './address-type'
import { VoucherType } from './voucher-type'

export interface CustomerType {
  id?: number
  name?: string
  slug?: string
  birthday_date?: string
  date_last_request?: string
  whatsapp?: string
  addresses?: AddressType[]
  email?: string
  secretNumber?: string
  last_requests?: any[]
  vouchers?: VoucherType[]
  controls?: {
    asaas?: {
      id: string
      cards: CustomerCardType[]
    }
    requests?: {
      total: number
      quantity: number
    }
  }
}

export interface CustomerCardType {
  creditCardBrand: string;
  creditCardNumber: string;
  surname: string
  type: 'credit'
}