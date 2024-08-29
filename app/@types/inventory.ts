export type InventoryType = {
  amount: number
  amount_alert: number
  bypass_amount: boolean
}

export type DisponibilityType = {
  store: {
    delivery: boolean
    table: boolean
    package: boolean
  }
}
