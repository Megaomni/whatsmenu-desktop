import { jsonSerialize } from '#utils/json_serialize'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value),
  })
  declare controls: any

  @column()
  declare value: number

  @column.dateTime({
    autoCreate: false,
    autoUpdate: false,
    columnName: 'deleted_at',
    serializeAs: 'deleted_at',
  })
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
}
