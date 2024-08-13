'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BonusSupportSchema extends Schema {
  up() {
    this.create('bonus_supports', (table) => {
      table.increments()
      table.integer('userId').unsigned().references('id').inTable('users').notNullable()
      table.integer('supportId').unsigned().references('id').inTable('users').notNullable()
      table.integer('systemRequestId').unsigned().references('id').inTable('system_requests').notNullable()
      table.enu('status', ['paid', 'paidLate', 'canceled'])
      table.integer('month'), table.timestamps()
    })
  }

  down() {
    this.drop('bonus_supports')
  }
}

module.exports = BonusSupportSchema
