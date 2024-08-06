import { DateTime } from 'luxon'

import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ProductComplement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'productId', serializeAs: 'productId' })
  declare productId: number

  @column({ columnName: 'complementId', serializeAs: 'complementId' })
  declare complementId: number

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
