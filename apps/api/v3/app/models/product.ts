import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { InventoryType } from '#types/inventory'
import type { ProductDisponibility } from '#types/product'
import Category from './category.js'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Complement from './complement.js'
import CartIten from './cart_iten.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Product extends BaseModel implements InventoryType {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'categoryId', serializeAs: 'categoryId' })
  declare categoryId: number

  @column()
  declare status: boolean

  @column()
  declare order: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare bypass_amount: boolean

  @column()
  declare amount_alert: number

  @column()
  declare amount: number

  @column()
  declare value: number

  @column()
  declare promoteValue: number

  @column()
  declare promoteStatus: boolean

  @column()
  declare valueTable: number

  @column()
  declare promoteValueTable: number

  @column()
  declare promoteStatusTable: boolean

  @column()
  declare countRequests: number

  @column()
  declare image: string

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value),
  })
  declare disponibility: ProductDisponibility

  @column.dateTime({ autoCreate: false, columnName: 'deleted_at', serializeAs: 'deleted_at' })
  declare deleted_at: DateTime | null

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
    pivotTable: 'product_complements',
    pivotForeignKey: 'productId',
    pivotRelatedForeignKey: 'complementId',
  })
  declare complements: ManyToMany<typeof Complement>

  @hasMany(() => CartIten, {
    foreignKey: 'cartId',
  })
  declare cartItens: HasMany<typeof CartIten>
}
