import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Profile from './profile.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { jsonSerialize } from '#utils/json_serialize'

export default class Domain extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare name: string | null

  @column()
  declare key: string | null

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value),
  })
  declare options: any

  @column()
  declare default: boolean

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
}
