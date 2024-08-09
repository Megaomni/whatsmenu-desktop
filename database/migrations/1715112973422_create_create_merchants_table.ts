import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'merchants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.uuid('merchantId').unique()
      table.string('name')
      table.integer('wm_id')
      table.string('token', 2170)
      table.string('refresh_token', 2170)
      table.json('controls')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
