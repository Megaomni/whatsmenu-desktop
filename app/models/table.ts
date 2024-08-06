import { DateTime } from 'luxon'

import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import TableOpened from './table_opened.js'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'

export default class Table extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare name: string

  @column()
  declare status: boolean

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

  @hasMany(() => TableOpened, {
    foreignKey: 'tableId',
  })
  declare tablesOpened: HasMany<typeof TableOpened>

  @hasOne(() => TableOpened, {
    foreignKey: 'tableId',
    onQuery: (query) => {
      query.where('status', true)
    },
  })
  declare opened: HasOne<typeof TableOpened>
}
