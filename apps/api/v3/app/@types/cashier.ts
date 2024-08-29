import { FormsPaymentType } from './forms_payment.js'

export type CashierTransactionsType = {
  obs: string
  type: 'income' | 'outcome'
  value: number
  created_at: string
  formsPayment: FormsPaymentType[]
}

export type ClosedValuesSystem = {
  flag: string | null
  total: number
  payment: FormsPaymentType['label']
}

export type ClosedValuesUser = {
  flag?: string
  value: number
  payment: FormsPaymentType['payment']
  label: FormsPaymentType['label']
}
