import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { PaymentAdditionalFees, PaymentsMethods } from '../@types/payments.js'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'paymentId' })
  declare paymentId: string

  @column({ columnName: 'orderId' })
  declare orderId: string

  @column()
  declare prepaid: number

  @column()
  declare pending: number

  @column({
    columnName: 'methods',
    serializeAs: 'methods',
    prepare: (methods: PaymentsMethods[]) => JSON.stringify(methods),
  })
  declare methods: PaymentsMethods[]

  @column({
    columnName: 'additionalFees',
    serializeAs: 'additionalFees',
    prepare: (additionalFees: PaymentAdditionalFees[]) => JSON.stringify(additionalFees),
  })
  declare additionalFees: PaymentAdditionalFees[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order, {
    foreignKey: 'paymentId',
  })
  declare profile: BelongsTo<typeof Order>
}
