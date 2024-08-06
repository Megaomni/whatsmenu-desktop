import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Profile from './profile.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Cart from './cart.js'

export default class Motoboy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column({})
  declare status: boolean

  @column({})
  declare controls: any

  @column()
  declare whatsapp: string

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
    foreignKey: 'clientId',
  })
  declare carts: HasMany<typeof Cart>
}
