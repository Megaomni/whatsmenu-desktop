import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cupons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('firstOnly').defaultTo(false).after('status')
      table.json('controls').defaultTo({}).after('firstOnly')
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('firstOnly')
      table.dropColumn('controls')
    })
  }
}
