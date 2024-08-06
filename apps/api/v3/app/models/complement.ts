import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import { ComplementItem } from '#types/complement'
import Product from './product.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Complement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: 'default' | 'pizza' | 'hibrid'

  @column()
  declare order: number

  @column()
  declare min: number

  @column()
  declare max: number

  @column()
  declare required: boolean

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare itens: ComplementItem[]

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @manyToMany(() => Product, {
    pivotTable: 'product_complements',
    pivotForeignKey: 'complementId',
    pivotRelatedForeignKey: 'productId',
  })
  declare products: ManyToMany<typeof Product>
}
