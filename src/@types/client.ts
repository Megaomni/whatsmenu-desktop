import { VoucherType } from "./voucher"

export interface ClientType {
  id?: number
  name?: string
  slug?: string
  birthday_date?: string
  date_last_request?: string
  whatsapp?: string
  addresses?: any[]
  email?: string
  secretNumber?: string
  last_requests?: any
  controls?: {
    asaas?: {
      id: string
      cards: ClientCardType[]
    }
    requests?: {
      total: number
      quantity: number
    }
    whatsapp?: {
      contactId: {
        server: string
        user: string
        _serialized: string
      }
    }
  }
  vouchers?: VoucherType[]
}

export interface ClientCardType {
  creditCardBrand: string;
  creditCardNumber: string;
  surname: string
  type: 'credit'
}