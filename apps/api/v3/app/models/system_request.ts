import { DateTime } from 'luxon'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Invoice from './invoice.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class SystemRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'invoiceId', serializeAs: 'invoiceId' })
  declare invoiceId: number

  @column({ columnName: 'transactionId', serializeAs: 'transactionId' })
  declare transactionId: string

  @column()
  declare status:
    | 'paid'
    | 'pending'
    | 'canceled'
    | 'reserved'
    | 'completed'
    | 'processing'
    | 'refunded'

  @column()
  declare unlocked: boolean

  @column()
  declare type: 'M' | 'A'

  @column()
  declare expiration: string

  @column()
  declare limit: string | null

  @column({ columnName: 'userId', serializeAs: 'userId' })
  declare userId: number

  @column({ columnName: 'planId', serializeAs: 'planId' })
  declare planId: number

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value),
  })
  declare paghiper: any

  @column.dateTime({
    autoCreate: false,
    autoUpdate: false,
    columnName: 'blocked_at',
    serializeAs: 'blocked_at',
  })
  declare blocked_at: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => Invoice, {
    localKey: 'invoiceId',
  })
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => User, {
    localKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
