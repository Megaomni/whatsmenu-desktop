import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ClientAddress extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'clientId', serializeAs: 'clientId' })
  declare clientId: number

  @column({})
  declare street: string

  @column({})
  declare number: string | null

  @column({})
  declare zipcode: string | null

  @column({})
  declare complement: string | null

  @column({})
  declare reference: string | null

  @column({})
  declare uf: string | null

  @column({})
  declare city: string

  @column({})
  declare neighborhood: string | null

  @column({})
  declare latitude: string | null

  @column({})
  declare longitude: string | null

  @column({})
  declare distance: number | null

  @column({
    prepare: (value) => JSON.stringify(value ?? {}),
  })
  declare controls: any

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
}
