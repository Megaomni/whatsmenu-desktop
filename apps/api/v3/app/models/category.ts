import { DateTime } from 'luxon'

import type { CategoryOptions } from '#types/category'
import type { DisponibilityType } from '#types/inventory'
import { BaseModel, afterDelete, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import Product from './product.js'
import PizzaProduct from './pizza_product.js'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { decryptEmoji, encryptEmoji } from '../utils/emoji_formater.js'
import { jsonSerialize } from '#utils/json_serialize'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profileId', serializeAs: 'profileId' })
  declare profileId: number

  @column({
    prepare: (value) => encryptEmoji(value),
    consume: (value) => decryptEmoji(value),
  })
  declare name: string

  @column()
  declare order: number

  @column()
  declare status: boolean

  @column()
  declare type: 'pizza' | 'default'

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value ?? null),
  })
  declare disponibility: DisponibilityType

  @column({
    prepare: (value) => JSON.stringify(value),
    consume: (value) => jsonSerialize(value ?? null),
  })
  declare options: CategoryOptions

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @hasOne(() => PizzaProduct, {
    localKey: 'categoryId',
  })
  declare pizzaProduct: HasOne<typeof PizzaProduct>

  @hasMany(() => Product, {
    foreignKey: 'categoryId',
    onQuery: (query) => {
      query.whereNull('deleted_at')
    },
  })
  declare products: HasMany<typeof Product>

  @hasMany(() => Product, {
    foreignKey: 'categoryId',
  })
  declare allProducts: HasMany<typeof Product>

  @afterDelete()
  static async reorderProfileCategories(category: Category) {
    const categories = await Category.query().where('profileId', category.profileId)

    categories.sort((catA, catB) => catA.order - catB.order)

    for (let indexCat in categories) {
      const cat = categories[indexCat]
      cat.order = Number(indexCat)
      await cat.save()
    }
  }
}
