import { DateTime } from 'luxon'

import { BaseModel, beforeCreate, beforeSave, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BartenderControls } from '#types/bartender'
import hash from '@adonisjs/core/services/hash'
import Cart from '#models/cart'
import Cashier from '#models/cashier'

import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'

export default class Bartender extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column({})
  declare name: string

  @column({ serializeAs: null })
  declare password: string

  @column({})
  declare status: boolean

  @column({})
  declare controls: BartenderControls

  @column.dateTime({ autoCreate: false })
  declare deletedAt: DateTime | null

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
    foreignKey: 'bartenderId',
  })
  declare carts: HasMany<typeof Cart>

  @hasMany(() => Cashier, {
    foreignKey: 'bartenderId',
  })
  declare cashiers: HasMany<typeof Cashier>

  @hasOne(() => Cashier, {
    onQuery: (query) => {
      query.whereNull('closed_at')
    },
    foreignKey: 'bartenderId',
  })
  declare activeCashier: HasOne<typeof Cashier>

  @beforeCreate()
  static createDefaultControls(bartender: Bartender) {
    bartender.controls = {
      type: 'default',
      blockedCategories: [],
      defaultCashier: false,
    }
  }

  @beforeSave()
  static async hashPassword(bartender: Bartender) {
    if (bartender.$dirty.password) {
      bartender.password = await hash.make(bartender.password)
    }
  }
}
