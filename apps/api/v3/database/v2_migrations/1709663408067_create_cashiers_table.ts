import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCashiersSchema extends BaseSchema {
  protected tableName = 'cashiers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.integer('bartenderId').unsigned().nullable()
      table.float('initialValue', 8, 2).notNullable().defaultTo(0)
      table.json('transactions').nullable()
      table.json('closedValues_user').nullable()
      table.json('closedValues_system').nullable()
      table.json('controls').nullable()
      table.timestamp('closed_at').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('profileId').references('id').inTable('profiles')
      table.foreign('bartenderId').references('id').inTable('bartenders')

      // Índices
      table.index('profileId', 'cashiers_profileid_foreign')
      table.index(['bartenderId', 'closed_at'], 'barteenders_closed')
      table.index('closed_at', 'closed')
      table.index(['closed_at', 'profileId'], 'closed_profile')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
