import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { CustomerPhone, MerchantCustomers } from '../@types/customer.js'
import Order from './order.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'customerId' })
  declare customerId: string

  @column()
  declare name: string

  @column({
    prepare: (value: string) => JSON.stringify(value),
    consume: (phone) => phone as CustomerPhone,
  })
  declare phone: CustomerPhone

  @column({ columnName: 'ordersCountOnMerchant' })
  declare ordersCountOnMerchant: number

  @column()
  declare segmentation: string

  @column({
    columnName: 'merchant_customers',
    prepare: (value: string) => JSON.stringify(value),
    consume: (merchant_customer) => merchant_customer as MerchantCustomers,
  })
  declare merchant_customers: MerchantCustomers

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Order, {
    foreignKey: 'customerId',
  })
  declare payments: HasMany<typeof Order>
}
