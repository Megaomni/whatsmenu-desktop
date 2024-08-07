import Cart, { CartType } from './cart'
import { TableOpened, TableOpenedType } from './table'

export interface CashierType {
  id: number
  profileId: number
  bartenderId: number
  initialValue: number
  transactions: TransactionType[]
  carts: CartType[]
  openeds: TableOpenedType[]
  closedValues_user: any
  closedValues_system: any
  closed_at: null
  created_at: string
  updated_at: string
}

export interface TransactionType {
  obs: string
  type: 'income' | 'outcome'
  value: number
  finality?: string
  finalityLabel?: string
  created_at: string
  formatedDate?: string
}

export default class Cashier {
  id: number
  profileId: number
  bartenderId: number
  initialValue: number
  transactions: TransactionType[]
  carts: Cart[]
  openeds: TableOpened[]
  closedValues_user: any[]
  closedValues_system: any[]
  closed_at: null
  created_at: string
  updated_at: string

  constructor(cashier: CashierType) {
    this.id = cashier.id
    this.profileId = cashier.profileId
    this.bartenderId = cashier.bartenderId
    this.initialValue = cashier.initialValue
    this.transactions = cashier.transactions
    this.carts = cashier.carts ? cashier.carts.map((cart) => new Cart(cart)) : []
    this.openeds = cashier.openeds ? cashier.openeds.map((opened) => new TableOpened(opened)) : []
    this.closedValues_user = cashier.closedValues_user
    this.closedValues_system = cashier.closedValues_system
    this.closed_at = cashier.closed_at
    this.created_at = cashier.created_at
    this.updated_at = cashier.updated_at
  }

  public getTotalTransactions({
    withInitialValue = true,
    type,
    onlyTransactions = false,
  }: {
    type: 'income' | 'outcome'
    withInitialValue?: boolean
    onlyTransactions?: boolean
  }): number {
    let result = 0

    if (type === 'income') {

      result = this.transactions
        .filter((transaction) => {
          if (transaction.type === 'income') {
            const obs = transaction.obs || '' // Definindo uma string vazia se obs for undefined
            return onlyTransactions ? !obs.includes('Encerramento mesa') : true
          }
          return false
        })
        .reduce((total, transaction) => (total += transaction.value), 0)

      result += withInitialValue ? this.initialValue : 0
    }

    if (type === 'outcome') {
      result = this.transactions
        .filter((transaction) => transaction.type === 'outcome')
        .reduce((total, transaction) => (total += Math.abs(transaction.value)), 0)
    }
    return result
  }

  public getOnlyTableClousres() {
    return this.transactions
      .filter((transaction) => transaction.obs && transaction.obs.includes('Encerramento mesa'))
      .reduce((total, transaction) => (total += transaction.value), 0)
  }

  public getTotalCartsValue({ type, withPayments = true, addressId }: { type: 'P' | 'D'; withPayments?: boolean; addressId?: number }) {
    if (addressId) {
      return this.carts.filter((cart) => cart.addressId && cart.type === type).reduce((total, cart) => (total += cart.getTotalValue('total')), 0)
    }

    if (!addressId) {
      return this.carts.filter((cart) => !cart.addressId && cart.type === type).reduce((total, cart) => (total += cart.getTotalValue('total')), 0)
    }

    if (withPayments) {
      return this.carts
        .filter((cart) => cart.type === type)
        .flatMap((cart) => cart.formsPayment)
        .reduce((total, formPayment) => (total += formPayment.value), 0)
    } else {
      return this.carts
        .filter((cart) => cart.type === type)
        .flatMap((cart) => cart.total)
        .reduce((total, value) => (total += value), 0)
    }
  }
}
