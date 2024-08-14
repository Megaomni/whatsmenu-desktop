'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SystemRequestSchema extends Schema {
  up() {
    this.create('system_requests', (table) => {
      table.increments()
      table.string('transactionId', 250).nullable()
      table.enum('status', ['paid', 'pending', 'canceled', 'reserved', 'completed', 'processing', 'refunded']).defaultTo('pending').notNullable()
      table.date('expiration').notNullable()
      table.integer('userId').unsigned().references('id').inTable('users').notNullable()
      table.integer('planId').unsigned().references('id').inTable('plans').notNullable()
      table.json('paghiper').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('system_requests')
  }
}

module.exports = SystemRequestSchema
