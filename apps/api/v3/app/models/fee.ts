import { DateTime } from 'luxon'

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Fee extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare code: string

  @column()
  declare type: 'percent' | 'fixed'

  @column()
  declare value: number

  @column()
  declare status: boolean

  @column()
  declare automatic: boolean

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
