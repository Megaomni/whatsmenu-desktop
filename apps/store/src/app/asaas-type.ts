import { CustomerCardType } from "./customer-type"

export interface CreateAsaasCustomerType {
  code: number
  email: string
  name: string
  secretNumber: string
  whatsapp: string
  address?: {
    state: string
    city: string
    zip_code: string
    line_1: string
    line_2: string
  }
}

export interface CreateCardTokenType {
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    addressComplement?: string
    mobilePhone: string
  }
  surname?: string,
  type: 'credit'
  // remoteIp: string
}

export interface CardTokenType extends CustomerCardType {
  creditCardToken: string
  uuid?: string
}
