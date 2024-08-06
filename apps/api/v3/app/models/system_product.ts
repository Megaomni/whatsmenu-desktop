import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { SystemProductOperationsType } from '#types/system_products'
import FlexPlan from './flex_plan.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SystemProduct extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare plan_id: number | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare status: boolean

  @column()
  declare service: string | 'plan' | 'printer' | 'menu'

  @column()
  declare default_price: string

  @column({
    prepare: (value) => JSON.stringify(value),
  })
  declare operations: SystemProductOperationsType

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime

  @belongsTo(() => FlexPlan, {
    localKey: 'plan_id',
  })
  declare motoboy: BelongsTo<typeof FlexPlan>
}
