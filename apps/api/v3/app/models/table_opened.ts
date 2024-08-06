import { DateTime } from 'luxon'

import Fee from '#models/fee'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { FormsPaymentType } from '#types/forms_payment'
import Table from './table.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Command from './command.js'

export default class TableOpened extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tableId', serializeAs: 'tableId' })
  declare tableId: number

  @column()
  declare status: boolean

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare fees: Fee[]

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare formsPayment: FormsPaymentType[]

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => Table, {
    localKey: 'tableId',
  })
  declare table: BelongsTo<typeof Table>

  @hasMany(() => Command, {
    foreignKey: 'tableOpenedId',
  })
  declare commands: HasMany<typeof Command>
}
