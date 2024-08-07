import { CategoryType } from './category-type'
import { InventoryPropsType } from './invetory-type'

export interface ProductType extends InventoryPropsType {
  id: number
  code?: string
  categoryId?: number
  name: string
  description: string
  obs?: string
  order?: number
  image: string
  value: number
  promoteStatus: boolean
  promoteValue: number
  valueTable: number
  promoteStatusTable: boolean
  promoteValueTable: number
  complements: ComplementType[]
  isAvaliable?: boolean
  store?: {
    delivery: boolean
    table: boolean
    package: boolean
  }
  disponibility?: any
  status?: any
  category?: CategoryType
  quantity?: number
  countRequests?: number
  created_at?: string
  updated_at?: string
}

export interface ComplementType {
  id: number
  name: string
  min: number
  max: number
  required: boolean | number
  itens: ComplementItemType[]
  type: 'pizza' | 'product'
}

export interface ComplementItemType extends InventoryPropsType {
  code: string
  index?: number
  inventory?: number
  status: boolean
  name: string
  description: string
  value: number
  quantity?: number
  paidForQuantity?: number
  isHigher?: boolean
  complementId?: number
}
