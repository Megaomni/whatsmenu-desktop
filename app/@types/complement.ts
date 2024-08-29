import { InventoryType } from './inventory.js'

export type ComplementItem = {
  code: string
  name: string
  value: number
  status: boolean
  description: string
} & InventoryType
