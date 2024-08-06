import { DateTime } from 'luxon'

import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import RelatedPlan from './related_plan.js'
import SystemProduct from './system_product.js'

export default class FlexPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: 'register' | 'upgrade' | 'promote'

  @column()
  declare category: 'basic' | 'table' | 'package'

  @column()
  declare status: boolean

  @column()
  declare monthly: number | null

  @column()
  declare semester: number | null

  @column()
  declare yearly: number | null

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

  @manyToMany(() => RelatedPlan, {
    pivotTable: 'related_plans',
    pivotForeignKey: 'plan_id',
    pivotRelatedForeignKey: 'plan_associated_id',
  })
  declare relateds: ManyToMany<typeof RelatedPlan>

  @hasMany(() => SystemProduct, {
    foreignKey: 'plan_id',
  })
  declare systemProducts: HasMany<typeof SystemProduct>
}
