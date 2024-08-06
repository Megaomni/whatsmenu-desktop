import { DateTime } from 'luxon'

import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import User from '#models/user'
import SystemRequest from '#models/system_request'

import type { HasOne } from '@adonisjs/lucid/types/relations'

export default class BonusSupport extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'userId', serializeAs: 'userId' })
  declare userId: number

  @column({ columnName: 'supportId', serializeAs: 'supportId' })
  declare supportId: number

  @column({ columnName: 'invoiceId', serializeAs: 'invoiceId' })
  declare invoiceId: number | null

  @column()
  declare status: 'paid' | 'paidLate' | 'canceled' | null

  @column()
  declare month: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @hasOne(() => User, {
    foreignKey: 'userId',
  })
  declare user: HasOne<typeof User>

  @hasOne(() => User, {
    foreignKey: 'supportId',
  })
  declare support: HasOne<typeof User>

  @hasOne(() => SystemRequest)
  declare invoice: HasOne<typeof SystemRequest>
}
