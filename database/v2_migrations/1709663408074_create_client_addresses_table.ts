import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateClientAddressesSchema extends BaseSchema {
  protected tableName = 'client_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('clientId').unsigned().notNullable()
      table.string('street', 750).notNullable().collate('utf8mb4_general_ci')
      table.string('number', 50).nullable()
      table.string('zipcode', 20).nullable()
      table.string('complement', 750).nullable()
      table.string('reference', 750).nullable()
      table.string('uf', 20).defaultTo(' ').collate('utf8mb4_general_ci')
      table.string('city', 350).notNullable()
      table.string('neighborhood', 300).nullable()
      table.string('latitude', 255).nullable()
      table.string('longitude', 255).nullable()
      table.integer('distance').nullable()
      table.json('controls').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('clientId').references('id').inTable('clients')

      // Índices
      table.index('clientId', 'client_addresses_clientid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
