import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Item extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'itemId' })
  declare itemId: string

  @column({ columnName: 'orderId' })
  declare orderId: string

  @column()
  declare index: number

  @column({ columnName: 'uniqueId' })
  declare uniqueId: string

  @column()
  declare name: string

  @column()
  declare ean: string

  @column()
  declare quantity: number

  @column()
  declare unit: string

  @column({ columnName: 'unitPrice' })
  declare unitPrice: number

  @column({ columnName: 'optionsPrice' })
  declare optionsPrice: number

  @column({ columnName: 'totalPrice' })
  declare totalPrice: number

  @column()
  declare price: number

  @column()
  declare observations: string

  @column({ columnName: 'imageUrl' })
  declare imageUrl: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare profile: BelongsTo<typeof Order>
}
