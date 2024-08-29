import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vouchers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('clientId')
      table.integer('profileId')
      table.enum('status', ['avaliable', 'used', 'cancelled']).defaultTo('avaliable')
      table.float('value')
      table.json('controls').defaultTo({})
      table.timestamp('expirationDate')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
