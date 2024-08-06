import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateSystemRequestsSchema extends BaseSchema {
  protected tableName = 'system_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('invoiceId').unsigned().nullable()
      table.string('transactionId', 250).nullable()
      table
        .enum('status', [
          'paid',
          'pending',
          'canceled',
          'reserved',
          'completed',
          'processing',
          'refunded',
        ])
        .notNullable()
        .defaultTo('pending')
      table.boolean('unlocked').notNullable().defaultTo(false)
      table.enum('type', ['M', 'A']).notNullable().defaultTo('M')
      table.date('expiration').notNullable()
      table.date('limit').nullable()
      table.integer('userId').unsigned().notNullable()
      table.integer('planId').unsigned().notNullable()
      table.json('paghiper').nullable()
      table.timestamp('blocked_at').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('invoiceId').references('id').inTable('invoices')
      table.foreign('userId').references('id').inTable('users')
      table.foreign('planId').references('id').inTable('plans')

      // Índices
      table.unique('transactionId')
      table.index('created_at')
      table.index('updated_at')
      table.index('expiration')
      table.index('status')
      table.index('limit')
      table.index('type')
      table.index('blocked_at')
      table.index(['limit', 'blocked_at'], 'limit_blockedAt_index')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
