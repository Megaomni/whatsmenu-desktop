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

  @column({ serializeAs: 'bypass_amount' })
  declare bypass_amount: boolean

  @column({ serializeAs: 'amount_alert' })
  declare amount_alert: number

  @column({ serializeAs: 'amount' })
  declare amount: number

  @column()
  declare value: number

  @column({ columnName: 'promoteValue' })
  declare promoteValue: number

  @column({ columnName: 'promoteStatus' })
  declare promoteStatus: boolean

  @column({ columnName: 'valueTable' })
  declare valueTable: number

  @column({ columnName: 'promoteValueTable' })
  declare promoteValueTable: number

  @column({ columnName: 'promoteStatusTable' })
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

  @column({ columnName: 'ncm_code', serializeAs: 'ncm_code' })
  declare ncm_code: string

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
    localKey: 'id',
    pivotTable: 'product_complements',
    relatedKey: 'id',
    pivotForeignKey: 'productId',
    pivotRelatedForeignKey: 'complementId',
  })
  declare complements: ManyToMany<typeof Complement>

  @hasMany(() => CartIten, {
    foreignKey: 'cartId',
  })
  declare cartItens: HasMany<typeof CartIten>
}
