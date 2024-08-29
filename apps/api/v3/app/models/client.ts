import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { ClientControlsType } from '#types/client'
import Cart from './cart.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'
import ClientAddress from './client_address.js'
import Voucher from './voucher.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column()
  declare name: string

  @column()
  declare whatsapp: string

  @column({ columnName: 'secretNumber', serializeAs: 'secretNumber' })
  declare secretNumber: string

  @column()
  declare email: string

  @column.dateTime({ autoCreate: false })
  declare birthday_date: DateTime | null

  @column({
    columnName: 'last_requests',
    serializeAs: 'last_requests',
    prepare: (value) => JSON.stringify(value ?? []),
    consume: (last_requests) => jsonSerialize(last_requests) ?? [],
  })
  declare last_requests: Cart[]

  @column({
    prepare: (value) =>
      JSON.stringify(
        value ?? {
          requests: {
            quantity: 0,
            total: 0,
          },
        }
      ),
    consume: (controls) => jsonSerialize(controls) ?? {},
  })
  declare controls: ClientControlsType

  @column.dateTime({ autoCreate: false })
  declare date_last_request: DateTime | null

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

  @hasMany(() => ClientAddress, {
    foreignKey: 'clientId',
    onQuery: (query) => {
      query.whereNull('deleted_at')
    },
  })
  declare addresses: HasMany<typeof ClientAddress>

  @hasMany(() => Cart, {
    foreignKey: 'clientId',
  })
  declare carts: HasMany<typeof Cart>

  @hasMany(() => Voucher, {
    foreignKey: 'clientId',
    onQuery: (query) => {
      query.where({ status: 'avaliable' })
    },
  })
  declare vouchers: HasMany<typeof Voucher>

  @beforeCreate()
  static createDefaultControls(client: Client) {
    client.controls = {
      requests: {
        quantity: 0,
        total: 0,
      },
    }
    client.last_requests = []
  }
}
