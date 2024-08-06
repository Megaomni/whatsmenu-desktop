import { DateTime } from 'luxon'

import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { InventoryType } from '#types/inventory'
import { PizzaFlavorType, PizzaImplementationType, PizzaSizeType } from '#types/pizza'
import Category from './category.js'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import CartIten from './cart_iten.js'
import Complement from './complement.js'

export default class PizzaProduct extends BaseModel implements InventoryType {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'categoryId', serializeAs: 'categoryId' })
  declare categoryId: number

  @column()
  declare status: boolean

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare sizes: PizzaSizeType[]

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare flavors: PizzaFlavorType[]

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare implementations: PizzaImplementationType[]

  @column({})
  declare amount: number

  @column({})
  declare amount_alert: number

  @column({})
  declare bypass_amount: boolean

  @column()
  declare disponibility: null

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => Category, {
    localKey: 'categoryId',
  })
  declare category: BelongsTo<typeof Category>

  @manyToMany(() => Complement, {
    pivotTable: 'pizza_complements',
    pivotForeignKey: 'pizzaId',
    pivotRelatedForeignKey: 'complementId',
  })
  declare complements: ManyToMany<typeof Complement>

  @hasMany(() => CartIten, {
    foreignKey: 'cartId',
  })
  declare cartItens: HasMany<typeof CartIten>
}
