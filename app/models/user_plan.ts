import { DateTime } from 'luxon'

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class UserPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'userId', serializeAs: 'userId' })
  declare userId: number

  @column({ columnName: 'flexPlanId', serializeAs: 'flexPlanId' })
  declare flexPlanId: number

  @column({ columnName: 'systemProductId', serializeAs: 'systemProductId' })
  declare systemProductId: number | null

  @column({ columnName: 'priceId', serializeAs: 'priceId' })
  declare priceId: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at', serializeAs: 'created_at' })
  declare created_at: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    columnName: 'updated_at',
    serializeAs: 'updated_at',
  })
  declare updated_at: DateTime
}
