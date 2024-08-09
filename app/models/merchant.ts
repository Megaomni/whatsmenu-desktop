import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { MerchantControls } from '../@types/merchant.js'
import Order from './order.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { jsonSerialize } from '../utils/json_serialize.js'

export default class Merchant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'merchantId' })
  declare merchantId: string

  @column()
  declare name: string

  @column({ columnName: 'wm_id', serializeAs: 'wm_id' })
  declare wm_id: string

  @column({
    prepare: (value: string) => JSON.stringify(value),
    consume: jsonSerialize,
  })
  declare controls: MerchantControls

  @column()
  declare token: string | null

  @column({ columnName: 'refresh_token', serializeAs: 'refresh_token' })
  declare refresh_token: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Order, {
    foreignKey: 'merchantId',
  })
  declare profile: HasMany<typeof Order>

  @beforeCreate()
  static createDefaultControls(merchant: Merchant) {
    merchant.controls = { dateTokenCreated: '' }
  }
}
