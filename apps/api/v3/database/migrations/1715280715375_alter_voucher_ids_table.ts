import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'carts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('voucherId')
        .after('motoboyId')
        .unsigned()
        .references('id')
        .inTable('vouchers')
        .nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('voucherid')
      table.dropColumn('voucherId')
    })
  }
}
