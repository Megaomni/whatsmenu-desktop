import { FormsPaymentType } from '#types/forms_payment'
import {
  BaseModel,
  beforeFetch,
  beforeFind,
  beforePaginate,
  belongsTo,
  column,
  hasMany,
} from '@adonisjs/lucid/orm'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Bartender from './bartender.js'
import CartIten from './cart_iten.js'
import Cashier from './cashier.js'
import Client from './client.js'
import ClientAddress from './client_address.js'
import Command from './command.js'
import Cupom from './cupom.js'
import Motoboy from './motoboy.js'
import Profile from './profile.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column({ columnName: 'clientId', serializeAs: 'clientId' })
  declare clientId: number | null

  @column({ columnName: 'addressId', serializeAs: 'addressId' })
  declare addressId: number | null

  @column({ columnName: 'cupomId', serializeAs: 'cupomId' })
  declare cupomId: number | null

  @column({ columnName: 'commandId', serializeAs: 'commandId' })
  declare commandId: number | null

  @column({ columnName: 'bartenderId', serializeAs: 'bartenderId' })
  declare bartenderId: number | null

  @column({ columnName: 'cashierId', serializeAs: 'cashierId' })
  declare cashierId: number | null

  @column({ columnName: 'motoboyId', serializeAs: 'motoboyId' })
  declare motoboyId: number | null

  @column({ columnName: 'voucherId', serializeAs: 'voucherId' })
  declare voucherId: number | null

  @column({})
  declare secretNumber: string | null

  @column({})
  declare code: string

  @column({})
  declare status: boolean

  @column({ columnName: 'statusPayment', serializeAs: 'statusPayment' })
  declare statusPayment: 'offline' | 'paid' | 'pending' | 'cancelled' | null

  @column({})
  declare obs: string

  @column({})
  declare type: 'D' | 'T' | 'P'

  @column({ columnName: 'taxDelivery', serializeAs: 'taxDelivery' })
  declare taxDelivery: number | null

  @column({ columnName: 'timeDelivery', serializeAs: 'timeDelivery' })
  declare timeDelivery: string

  @column({ columnName: 'formsPayment', serializeAs: 'formsPayment' })
  declare formsPayment: FormsPaymentType[]

  @column({})
  declare print: boolean

  @column({})
  declare tentatives: number

  @column({})
  declare total: number

  @column({ consume: jsonSerialize })
  declare controls: any

  @column.dateTime({ autoCreate: false, columnName: 'package_date', serializeAs: 'package_date' })
  declare package_date: DateTime

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => Client, {
    foreignKey: 'clientId',
  })
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Bartender, {
    foreignKey: 'bartenderId',
  })
  declare bartender: BelongsTo<typeof Bartender>

  @belongsTo(() => Cashier, {
    foreignKey: 'cashierId',
  })
  declare cashier: BelongsTo<typeof Cashier>

  @belongsTo(() => Profile, {
    foreignKey: 'profileId',
  })
  declare profile: BelongsTo<typeof Profile>

  @belongsTo(() => ClientAddress, {
    foreignKey: 'addressId',
  })
  declare address: BelongsTo<typeof ClientAddress>

  @belongsTo(() => Cupom, {
    foreignKey: 'cupomId',
  })
  declare cupom: BelongsTo<typeof Cupom>

  @belongsTo(() => Command, {
    foreignKey: 'commandId',
  })
  declare command: BelongsTo<typeof Command>

  @belongsTo(() => Motoboy, {
    foreignKey: 'motoboyId',
  })
  declare motoboy: BelongsTo<typeof Motoboy>

  @hasMany(() => CartIten, {
    foreignKey: 'cartId',
  })
  declare itens: HasMany<typeof CartIten>

  @beforeFetch()
  @beforeFind()
  @beforePaginate()
  static findFinishedCarts(query: ModelQueryBuilderContract<typeof Cart>) {
    query.whereRaw("(statusPayment in ('offline', 'paid') or statusPayment is null)")
  }
}
