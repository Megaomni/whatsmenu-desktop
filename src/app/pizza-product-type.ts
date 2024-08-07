import { CategoryType } from './category-type'
import { InventoryPropsType } from './invetory-type'
import { ComplementItemType, ComplementType } from './product-type'

export interface PizzaProductType extends InventoryPropsType {
  id: number
  categoryId?: number
  status: boolean | number
  sizes: PizzaSizeType[]
  implementations: PizzaImplementationType[]
  flavors: PizzaFlavorType[]
  complements?: ComplementType[]
}

export interface PizzaSizeType {
  code: string
  name: string
  status: boolean
  flavors: number[]
  covers: string[]
}

export interface PizzaImplementationType {
  code: string
  name: string
  value: number
  status: boolean
  index?: number
}

export interface PizzaFlavorType extends InventoryPropsType {
  code: string
  name: string
  description: string
  image: string
  status: boolean
  values: any
  valuesTable: any
  blocked?: boolean
  category?: CategoryType
  complements?: ComplementType[]
  implementations?: PizzaImplementationType[]
}
