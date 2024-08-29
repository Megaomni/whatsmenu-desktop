import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateClientsSchema extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.string('name', 250).notNullable()
      table.string('whatsapp', 20).notNullable()
      table.string('secretNumber', 20).nullable()
      table.string('email', 100).nullable()
      table.timestamp('birthday_date').nullable()
      table.json('last_requests').nullable()
      table.json('controls').nullable()
      table.timestamp('date_last_request').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()

      // Índices
      table.unique(['profileId', 'whatsapp'])
      table.unique(['profileId', 'secretNumber'])
      table.unique(['profileId', 'email'])
      table.index('whatsapp')
      table.index(['whatsapp', 'deleted_at'])
      table.index('name')
      table.index(['name', 'profileId'])

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
