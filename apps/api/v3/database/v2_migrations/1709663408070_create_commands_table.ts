import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCommandsSchema extends BaseSchema {
  protected tableName = 'commands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('tableOpenedId').unsigned().nullable()
      table.string('name', 255).nullable()
      table.integer('code').nullable()
      table.tinyint('status').nullable()
      table.json('fees').nullable()
      table.json('formsPayment').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('tableOpenedId').references('id').inTable('table_openeds')

      // Índice
      table.index('tableOpenedId', 'commands_tableopenedid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
