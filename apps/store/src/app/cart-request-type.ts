import Command from 'src/classes/command'
import { AddressType } from './address-type'
import { CupomType } from './cupom'
import { CartFormPaymentType } from './formpayment-type'
import { PizzaFlavorType, PizzaImplementationType } from './pizza-product-type'
import { ComplementType } from './product-type'
import { AddonFormPaymentType } from './formpayment-type'
import { FiscalNote } from './fiscal-note-type'

export interface CartRequestType {
  code?: string
  id?: number
  paymentType: 'online' | 'local'
  status?: 'production' | 'transport' | 'delivered' | 'canceled' | null
  statusPayment?: 'offline' | 'paid' | 'pending' | 'cancelled' | null
  clientId: number | null
  client?: any
  addressId: number | null
  address?: AddressType | null
  cupomId: number | null
  cupom?: CupomType
  commandId: number | null
  command?: Command
  bartenderId: number | null
  itens?: CartItem[]
  cashierId: number | null
  obs: string | null
  type: 'D' | 'T' | 'P'
  controls?: {
    userAgent: string
    whatsApp: {
      alreadySent: boolean
    }
    grovenfe: {
      fiscal_note: FiscalNote
    }
  }
  taxDelivery: number
  timeDelivery?: string
  formsPayment: CartFormPaymentType[]
  secretNumber?: string
  total: number
  packageDate: string
  created_at?: string
  updated_at?: string
  typeDelivery?: 'delivery' | 'local'
  paidTaxDelivery?: number
  change?: number | null
  tableType?: 'command' | 'table'
}

export interface CartItem {
  pizzaId?: number
  productId?: number
  ncm_code?: string
  quantity: number
  obs: string
  complements?: ComplementType[]
  details?: {
    value: number
    promoteValue?: number
    complements: ComplementType[]
    flavors?: PizzaFlavorType[]
    size?: string
    implementations?: PizzaImplementationType[]
  }
  name?: string
  type: 'default' | 'pizza'
}
