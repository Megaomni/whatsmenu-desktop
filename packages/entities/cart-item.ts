import { ComplementType } from './complements'
import { PizzaFlavorType, PizzaImplementationType } from './pizza-product'

export interface CartItemType {
  id: number
  cartId: number
  productId: number | null
  pizzaId: number | null
  type: 'pizza' | 'default'
  quantity: number
  obs: string
  details: Details
  name: string
  controls: Controls
  deleted_at?: any
  created_at: string
  updated_at: string
}

interface Details {
  value: number
  isPromote?: boolean
  complements: ComplementType[]
  ncm_code?: string
  cfop?: string
  csosn?: string
  implementations: PizzaImplementationType[]
  flavors: PizzaFlavorType[]
  sizeCode?: string
}

interface Controls { }

export default class CartItem {
  id: number
  cartId: number
  cartCode?: string
  productId: number | null
  pizzaId: number | null
  type: 'pizza' | 'default'
  quantity: number
  obs: string
  details: Details
  name: string
  controls: Controls
  deleted_at?: any
  created_at: string
  updated_at: string
  constructor(
    { id, cartId, productId, pizzaId, type, quantity, obs, details, name, controls, deleted_at, created_at, updated_at }: CartItemType,
    cartCode?: string
  ) {
    ; (this.id = id),
      (this.cartId = cartId),
      (this.cartCode = cartCode),
      (this.productId = productId),
      (this.pizzaId = pizzaId),
      (this.type = type),
      (this.quantity = quantity),
      (this.obs = obs),
      (this.details = details),
      (this.name = name),
      (this.controls = controls),
      (this.deleted_at = deleted_at),
      (this.created_at = created_at),
      (this.updated_at = updated_at)
  }

  public getTotal(withComplements?: boolean): number {
    if (withComplements && this.details.complements) {
      const totalComplements = this.details.complements.reduce((total, complement) => {
        complement.itens?.forEach((item) => {
          if (item.quantity) {
            total += item.value * item.quantity
          }
        })
        return total
      }, 0)

      return (this.details.value + totalComplements) * (this.type === 'default' ? this.quantity : 1)
    } else {
      return this.details.value * (this.type === 'default' ? this.quantity : 1)
    }
  }
}
