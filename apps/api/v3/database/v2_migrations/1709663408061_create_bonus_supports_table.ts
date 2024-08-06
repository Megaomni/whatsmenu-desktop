import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateBonusSupportsSchema extends BaseSchema {
  protected tableName = 'bonus_supports'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('userId').unsigned().notNullable()
      table.integer('supportId').unsigned().notNullable()
      table.integer('invoiceId').unsigned().nullable()
      table.enum('status', ['paid', 'paidLate', 'canceled']).nullable()
      table.integer('month').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('userId').references('id').inTable('users')
      table.foreign('supportId').references('id').inTable('users')
      table.foreign('invoiceId').references('id').inTable('invoices')

      // Índices
      table.index('userId')
      table.index('supportId')
      table.index('invoiceId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
