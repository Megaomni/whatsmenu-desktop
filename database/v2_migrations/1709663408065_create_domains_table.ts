import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateDomainsSchema extends BaseSchema {
  protected tableName = 'domains'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.string('name', 240).nullable()
      table.string('key', 240).nullable()
      table.json('options').nullable()
      table.tinyint('default').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índices
      table.unique('name', 'domains_name_unique')
      table.unique('key', 'domains_key_unique')
      table.index('profileId', 'domains_profileid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
