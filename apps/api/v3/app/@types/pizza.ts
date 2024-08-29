import { InventoryType } from './inventory.js'

export type PizzaSizeType = {
  code: string
  name: string
  status: boolean
  flavors: number[]
  covers: string[]
}

export type PizzaFlavorType = InventoryType & {
  code: string
  name: string
  image: string
  status: boolean
  values: {
    [k: string]: number
  }
  valuesTable: {
    [k: string]: number
  }
  description: string
}

export type PizzaImplementationType = {
  code: string
  name: string
  value: number
  status: boolean
  index?: number
}
