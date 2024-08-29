import { DateTime } from 'luxon'

import { FormsPaymentType } from '#types/forms_payment'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Fee from '#models/fee'
import Cart from './cart.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import TableOpened from './table_opened.js'

export default class Command extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tableOpenedId', serializeAs: 'tableOpenedId' })
  declare tableOpenedId: number

  @column()
  declare name: string

  @column()
  declare code: number

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

  @hasMany(() => Cart, {
    foreignKey: 'cashierId',
  })
  declare carts: HasMany<typeof Cart>

  @belongsTo(() => TableOpened, {
    localKey: 'tableOpenedId',
  })
  declare opened: BelongsTo<typeof TableOpened>
}
