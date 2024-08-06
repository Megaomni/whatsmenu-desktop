import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTokensSchema extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('user_id').unsigned().nullable()
      table.string('token', 255).notNullable().unique()
      table.string('type', 80).notNullable()
      table.boolean('is_revoked').defaultTo(false)
      table.timestamps()

      // Chave estrangeira
      table.foreign('user_id').references('id').inTable('users')

      // Índices
      table.index('user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
