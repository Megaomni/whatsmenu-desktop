import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateMotoboysSchema extends BaseSchema {
  protected tableName = 'motoboys'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 300).notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.tinyint('status').defaultTo(0)
      table.json('controls').nullable()
      table.string('whatsapp', 20).nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índice
      table.index('profileId', 'motoboys_profileid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
