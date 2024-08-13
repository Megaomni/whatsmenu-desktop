import { Session } from 'next-auth'

interface GatewayStrategy {
  session: Session | null
  addRecipient?: (recipient: RecipientInformation) => Promise<any>
  addSubscriptionDiscount?: (
    discount: AddSubscriptionDiscountContracts
  ) => Promise<any>
  addSubscriptionItem?: (item: AddSubscriptionItemContracts) => Promise<any>
  addSubscriptionIncrement?: (
    increment: AddSubscriptionIncrementContracts
  ) => Promise<any>
  changeChargeCard?: (
    cardId: string,
    data: ChangeChargeCardContracts
  ) => Promise<any>
  changeSubscriptionCard?: (cardId: string) => Promise<any>
  chargeAutomatically?: (checkout: ChargeAutomaticallyContracts) => Promise<any>
  createCustomer?: () => Promise<any>
  createCheckout?: (checkout: CreateCheckoutContracts) => Promise<any>
  createCardToken?: (card: CreateTokenCardContracts) => Promise<any>
  createCard?: (token: string) => Promise<any>
  createSubscription?: (
    subscription: CreateSubscriptionContracts
  ) => Promise<any>
  deleteCard?: (card_id: string) => Promise<any>
}

export type RecipientInformation = {
  default_bank_account: {
    holder_name: string
    bank: string
    branch_number: string
    account_number: string
    account_check_digit: string
    holder_type: 'individual' | 'company'
    holder_document: string
    type: 'checking' | 'savings'
  }
  password: string
}

export type AddSubscriptionDiscountContracts = {
  value: string
  discount_type: 'flat' | 'percentage'
  cycles: number
  item_id?: string
}

export type AddSubscriptionItemContracts = {
  id: string
  quantity: number
  name?: string
  description: string
  cycles?: string
  discount?: {
    cycles: string
    value: string
    discount_type: 'flat' | 'percentage'
  }
  increments?: {
    cycles: string
    value: string
    discount_type: 'flat' | 'percentage'
  }
  metadata?: any
}

export type AddSubscriptionIncrementContracts = {
  value: string
  increment_type: 'flat' | 'percentage'
  cycles: number
  item_id?: string
}

export type ChargeAutomaticallyContracts = {
  payments: {
    credit_card?: {
      card_id: string
      installments: number
    }
    debit_card?: {
      card_id: string
      installments: number
    }
    payment_method: 'debit_card' | 'credit_card'
  }[]
  items: {
    id: string
    value: string
    amount: number
    quantity: number
    name?: string
    description?: string
  }[]
  invoices: string
  installments?: number
}

export type CreateCheckoutContracts = {
  line_items: {
    amount?: number
    id: string
    value: string
    quantity: number
    name?: string
    description?: string
  }[]
  invoices: string
  payments: {
    method: string
    checkout?: {
      expires_in: number
      default_payment_method: string
      accepted_payment_methods: string[]
      billing_address_editable?: boolean
      billing_address_id?: string
      success_url: string
      cancel_url?: string
    }
  }[]
  metadata?: any
}

export type CreateTokenCardContracts = {
  number: string
  exp_month: string
  exp_year: string
  currency: string
  cvc: string
  name: string
}

export type CreateSubscriptionContracts = {
  items: {
    id: string
    quantity: number
    description: string
    name?: string
    status?: boolean
    productId?: string | number
    service?: string
  }[]
  card_id: string
  discounts?: {
    cycles: string
    value: string
    discount_type: 'flat' | 'percentage'
  }[]
  increments?: {
    cycles: string
    value: string
    increment_type: 'flat' | 'percentage'
  }[]
  metadata?: any
  installments?: number
}

export type ChangeChargeOrSubscriptionCardContracts = {
  // chargeId?: string,
  cardId: string
  // subscriptionId?: string
}

export type ChangeChargeCardContracts = {
  line_items: {
    id: string
    value: string
    quantity: number
    name?: string
    description?: string
  }[]
  invoices: string
  installments?: number
}

// export type CustomerData = {
//     id: number | string,
//     name: string,
//     email: string,
//     address?: {
//         country: string,
//         state: string,
//         city: string,
//         zipCode: string,
//         street: string,
//         number: number,
//         neighborhood: string,
//         complements?: string,
//         references?: string
//     },
//     phones: {
//         countryCode: string,
//         areaCode: string,
//         number: string
//     },
//     metadata?: any

// };

// export type CheckoutData = {
//     items: {
//         amount: string,
//         quantity: number,
//         id: string,
//         description?: string,
//         name?: string
//     }[],
//     mode?: "payment" | "setup" | "subscription",
//     successUrl: string,
//     cancelUrl?: string,
//     closed?: boolean,
//     currency?: string,
//     customer: {
//         id: string,
//         email: string
//     },
//     metadata?: any
// }

export default GatewayStrategy
