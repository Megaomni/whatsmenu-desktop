import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import { CashierTransactionsType, ClosedValuesSystem, ClosedValuesUser } from '#types/cashier'
import Cart from './cart.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import TableOpened from './table_opened.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Cashier extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column({ columnName: 'bartenderId', serializeAs: 'bartenderId' })
  declare bartenderId: number | null

  @column({})
  declare initialValue: number

  @column({})
  declare transactions: CashierTransactionsType[]

  @column({
    columnName: 'closedValues_user',
    serializeAs: 'closedValues_system',
    prepare: (value) => (value ? JSON.stringify(value) : null),
    consume: (value) => jsonSerialize(value ?? null),
  })
  declare closedValues_user: ClosedValuesUser[]

  @column({
    columnName: 'closedValues_system',
    serializeAs: 'closedValues_system',
    prepare: (value) => (value ? JSON.stringify(value) : null),
    consume: (value) => jsonSerialize(value ?? null),
  })
  declare closedValues_system: ClosedValuesSystem[]

  @column({})
  declare controls: any

  @column.dateTime({ autoCreate: false, columnName: 'closed_at', serializeAs: 'closed_at' })
  declare closed_at: DateTime | null

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
    onQuery: (query) => {
      query.whereNot('type', 'T')
    },
  })
  declare carts: HasMany<typeof Cart>

  @hasMany(() => Cart, {
    foreignKey: 'cashierId',
  })
  declare allCarts: HasMany<typeof Cart>

  @hasMany(() => TableOpened, {
    foreignKey: 'cashierId',
    onQuery: (query) => {
      query.where('status', false)
    },
  })
  declare openeds: HasMany<typeof TableOpened>

  @beforeCreate()
  static createDefaultControls(cashier: Cashier) {
    cashier.controls = {}
    cashier.transactions = []
  }
}
