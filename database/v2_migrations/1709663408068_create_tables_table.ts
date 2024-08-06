import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTablesSchema extends BaseSchema {
  protected tableName = 'tables'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().nullable()
      table.string('name', 255).nullable()
      table.boolean('status').nullable()
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índice único
      table.unique(['profileId', 'name'], 'tables_profileid_name_unique')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
