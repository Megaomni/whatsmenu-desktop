import Cashier, { CashierType } from './cashier'

export interface BartenderType {
  id: number
  profileId: number
  name: string
  password: string
  status: boolean
  controls: any
  cashiers?: CashierType[]
  deleted_at: null | string
  created_at: string
  updated_at: string
  defaultCashier: boolean
}

export default class Bartender {
  id: number
  profileId?: number
  name: string
  password: string
  status: boolean
  controls: any
  cashiers: Cashier[]
  deleted_at: null | string
  created_at: string
  updated_at: string
  defaultCashier: boolean

  constructor(bartender: BartenderType) {
    ;(this.id = bartender.id),
      (this.profileId = bartender.profileId),
      (this.name = bartender.name),
      (this.password = bartender.password),
      (this.status = bartender.status),
      (this.controls = bartender.controls),
      (this.cashiers = bartender.cashiers ? bartender.cashiers.map((cashier) => new Cashier(cashier)) : []),
      (this.deleted_at = bartender.deleted_at),
      (this.created_at = bartender.created_at),
      (this.updated_at = bartender.updated_at)
    this.defaultCashier = bartender.defaultCashier
  }
}
