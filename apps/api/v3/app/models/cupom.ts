import { DateTime } from 'luxon'

import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Profile from './profile.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Cart from './cart.js'

export default class Cupom extends BaseModel {
  static table = 'cupons'
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare code: string

  @column()
  declare type: 'percent' | 'value' | 'freight'

  @column()
  declare value: number

  @column({ columnName: 'minValue', serializeAs: 'minValue' })
  declare minValue: number

  @column()
  declare status: boolean

  @column({ columnName: 'firstOnly', serializeAs: 'firstOnly' })
  declare firstOnly: boolean

  @column()
  declare controls: {}

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

  @belongsTo(() => Profile, {
    localKey: 'profileId',
  })
  declare profile: BelongsTo<typeof Profile>

  @hasMany(() => Cart, {
    foreignKey: 'cupomId',
  })
  declare carts: HasMany<typeof Cart>
}
