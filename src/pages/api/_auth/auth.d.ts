import { JWT } from 'next-auth/jwt'
import { ProfileType } from '../../../types/profile'
import 'next-auth'
import { Plan } from '../../register'
import { Invoice } from '../../dashboard/invoices'

declare module 'next-auth' {
  interface Session {
    user?: UserType
    accessToken: string
    profile: ProfileType
  }

  interface UserType {
    [key: string]: any
    id: number
    secretNumber: string
    name: string
    email: string
    whatsapp: string
    password: string
    security_key?: string
    seller?: Seller
    sellerId: number
    support?: Support
    supportId: number
    planId: number
    plans: Plan[]
    invoices?: Invoice[]
    profile?: ProfileType
    due: number
    controls: {
      attempts?: number | undefined
      bilhetParcelament?: boolean
      canceled?: boolean
      disableInvoice: boolean
      paymentInfo?: {
        gateway: string
        customerId: string
        addressId: string
        subscription: {
          id: string
          status: 'active' | 'canceled'
        }
        default_card: string
        cards: {
          id: string
          type: 'credit' | 'debit'
          brand: string
          status: 'active' | 'expired'
          expYear: number
          expMonth: number
          holderName: string
          lastDigits: string
          firstDigits: string
        }[]
      }
      firstAccess?: string
      obs?: string
      period: 'monthly' | 'semester' | 'yearly'
      print?: any
      recovery?: any
      salePrint: boolean
      salePrintQTD: number
      serviceStart: boolean
      type?: string
      beta?: boolean
      currency: string
      language: string
      migrationMessage?: string
    }
    created_at: string
    updated_at: string
  }

  export interface Seller {
    id: number
    name: string
    contact: string
    status: number
    commission: null | number
    created_at: string
    updated_at: string
    months?: Month[]
  }
  interface Support {
    id: number
    secretNumber: string
    name: string
    email: string
    whatsapp: string
    password: string
    security_key: null
    sellerId: null
    supportId: null
    planId: number
    due: number
    controls: SupportControls
    created_at: string
    updated_at: string
  }

  interface SupportControls {
    type: string
    serviceStart: boolean
    disableInvoice: boolean
  }
}
