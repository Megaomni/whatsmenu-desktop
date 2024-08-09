import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { OrderAdditionalInfo, OrderDelivery, OrderTotal } from '../@types/orders.js'
import Item from './item.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Payment from './payment.js'
import Customer from './customer.js'
import Merchant from './merchant.js'
import { jsonSerialize } from '../utils/json_serialize.js'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'orderId' })
  declare orderId: string

  @column({ columnName: 'orderStatus' })
  declare orderStatus:
    | 'PLACED'
    | 'CONFIRMED'
    | 'PREPARATION_STARTED'
    | 'DISPATCHED'
    | 'READ_TO_PICKUP'
    | 'CONCLUDED'
    | 'CANCELLED'

  @column({ columnName: 'statusCode' })
  declare statusCode: string

  @column({ columnName: 'merchantId' })
  declare merchantId: string

  @column({ columnName: 'customerId' })
  declare customerId: string

  @column({ columnName: 'paymentId' })
  declare paymentId: string

  @column({ columnName: 'displayId' })
  declare displayId: string

  @column({ columnName: 'orderTiming' })
  declare orderTiming: 'IMMEDIATE' | 'SCHEDULED'

  @column({ columnName: 'orderType' })
  declare orderType: 'DELIVERY' | 'TAKEOUT'

  @column({
    prepare: (value: string) => JSON.stringify(value),
    consume: jsonSerialize,
  })
  declare delivery: OrderDelivery

  @column({
    prepare: (value: string) => JSON.stringify(value),
    consume: jsonSerialize,
  })
  declare total: OrderTotal

  @column({
    columnName: 'additionalInfo',
    prepare: (value: string) => JSON.stringify(value),
    consume: jsonSerialize,
  })
  declare additionalInfo: OrderAdditionalInfo

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Item, {
    foreignKey: 'orderId',
    localKey: 'orderId',
  })
  declare itens: HasMany<typeof Item>

  @hasMany(() => Payment, {
    foreignKey: 'orderId',
    localKey: 'orderId',
  })
  declare payments: HasMany<typeof Payment>

  @belongsTo(() => Customer, {
    foreignKey: 'customerId',
    localKey: 'customerId',
  })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Merchant, {
    foreignKey: 'merchantId',
    localKey: 'merchantId',
  })
  declare merchant: BelongsTo<typeof Merchant>
}
