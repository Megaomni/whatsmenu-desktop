import { DateTime } from 'luxon'

import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SystemRequest from './system_request.js'
import User from './user.js'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'userId', serializeAs: 'userId' })
  declare userId: number

  @column()
  declare invoce_code: string

  @column()
  declare pdf: string

  @column()
  declare installments: number

  @column()
  declare status: 'pending' | 'paid' | 'canceled'

  @column()
  declare type: 'first' | 'monthly' | 'upgrade' | 'addon'

  @column.dateTime({ autoCreate: false })
  declare expiration: DateTime

  @column()
  declare value: number

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare itens: Array<{ id: number; name: string; value: number }>

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => User, {
    localKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => SystemRequest, {
    foreignKey: 'invoiceId',
  })
  declare requests: HasMany<typeof SystemRequest>

  @hasMany(() => SystemRequest, {
    foreignKey: 'invoiceId',
    onQuery: (query) => {
      query.whereNotNull('invoice_code')
    },
  })
  declare firstRequest: HasMany<typeof SystemRequest>
}
