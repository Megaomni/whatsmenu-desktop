import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { CartItenDetails } from '#types/cart_iten'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import PizzaProduct from './pizza_product.js'
import Cart from './cart.js'

export default class CartIten extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'cartId', serializeAs: 'cartId' })
  declare cartId: number

  @column({ columnName: 'productId', serializeAs: 'productId' })
  declare productId: number | null

  @column({ columnName: 'pizzaId', serializeAs: 'pizzaId' })
  declare pizzaId: number | null

  @column({})
  declare type: 'default' | 'pizza'

  @column({})
  declare quantity: number

  @column({})
  declare obs: string

  @column()
  declare details: CartItenDetails

  @column({})
  declare name: string

  @column({})
  declare controls: any

  @column.dateTime({ autoCreate: false })
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => Product, {
    localKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => PizzaProduct, {
    localKey: 'pizzaId',
  })
  declare pizza: BelongsTo<typeof PizzaProduct>

  @belongsTo(() => Cart, {
    localKey: 'cartId',
  })
  declare cart: BelongsTo<typeof Cart>
}
