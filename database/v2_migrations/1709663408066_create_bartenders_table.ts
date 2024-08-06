import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateBartendersSchema extends BaseSchema {
  protected tableName = 'bartenders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().nullable()
      table.string('name', 120).notNullable()
      table.string('password', 250).nullable()
      table.boolean('status').defaultTo(true)
      table.json('controls').nullable()
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índice
      table.index('profileId', 'bartenders_profileid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
