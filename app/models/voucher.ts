import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Profile from './profile.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Client from './client.js'

export default class Voucher extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'clientId', serializeAs: 'clientId' })
  declare clientId: number | null

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare status: 'avaliable' | 'used' | 'cancelled'

  @column({ columnName: 'value' })
  declare value: number

  @column({})
  declare controls: any

  @column.dateTime({ columnName: 'expirationDate' })
  declare expirationDate: DateTime

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
    foreignKey: 'profileId',
  })
  declare profile: BelongsTo<typeof Profile>

  @belongsTo(() => Client, {
    foreignKey: 'clientId',
  })
  declare client: BelongsTo<typeof Client>
}
