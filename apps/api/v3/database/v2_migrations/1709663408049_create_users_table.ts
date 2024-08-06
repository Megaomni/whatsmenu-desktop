import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('secretNumber', 20).notNullable().defaultTo('476.433.454-22')
      table.string('name', 500).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('whatsapp', 254).notNullable()
      table.string('password', 250).nullable()
      table.string('security_key', 250).nullable()
      table.integer('sellerId').unsigned().nullable()
      table.integer('supportId').unsigned().nullable().references('id').inTable('users')
      table.integer('planId').unsigned().nullable()
      table.integer('due').defaultTo(20)
      table
        .json('controls')
        .notNullable()
        .comment('controles que possam existir como recuperar senha por exemplo')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()

      // Chaves estrangeiras
      table.foreign('planId').references('id').inTable('plans')
      table.foreign('sellerId').references('id').inTable('sellers')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
