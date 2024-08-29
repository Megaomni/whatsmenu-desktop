import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTableOpenedsSchema extends BaseSchema {
  protected tableName = 'table_openeds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('tableId').unsigned().notNullable()
      table.integer('cashierId').unsigned().nullable()
      table.tinyint('status').nullable()
      table.json('fees').nullable()
      table.json('formsPayment').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('tableId').references('id').inTable('tables')
      table.foreign('cashierId').references('id').inTable('cashiers')

      // Índices
      table.index('tableId', 'table_openeds_tableid_foreign')
      table.index('cashierId', 'table_openeds_cashierid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
