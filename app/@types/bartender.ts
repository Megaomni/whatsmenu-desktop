export type BartenderControls = {
  type: 'default' | 'manager' | 'cashier'
  defaultCashier: boolean
  blockedCategories: number[]
}
