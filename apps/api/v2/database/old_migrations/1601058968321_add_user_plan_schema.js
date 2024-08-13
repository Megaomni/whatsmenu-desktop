'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUserPlanSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.string('secretNumber', 20).notNullable().defaultTo('476.433.454-22').after('id')
      table.integer('planId').unsigned().references('id').inTable('plans').nullable().after('password')
      table.integer('due').defaultTo(20).after('planId')
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropForeign('planId', 'users_planid_foreign')
      table.dropColumn('planId')
      table.dropColumn('due')
      table.dropColumn('secretNumber')
    })
  }
}

module.exports = AddUserPlanSchema
