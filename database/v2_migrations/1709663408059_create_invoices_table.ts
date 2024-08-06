import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateInvoicesSchema extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('userId').unsigned().notNullable()
      table.string('invoice_code', 255).nullable()
      table.string('pdf', 2000).nullable()
      table.integer('installments').nullable()
      table.enum('status', ['pending', 'paid', 'canceled']).nullable()
      table.enum('type', ['first', 'monthly', 'upgrade', 'addon']).nullable()
      table.date('expiration').nullable()
      table.float('value', 8, 2).nullable()
      table.json('itens').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('userId').references('id').inTable('users')

      // Índices
      table.index('status', 'status_index')
      table.index('type', 'type_index')
      table.index('expiration', 'expiration_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
