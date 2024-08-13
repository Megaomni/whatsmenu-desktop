'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFexPlanTypeSchema extends Schema {
  up() {
    this.table('flex_plans', (table) => {
      table.enu('type', ['register', 'upgrade', 'promote']).after('name').notNullable().defaultTo('register')
    })
  }

  down() {
    this.table('flex_plans', (table) => {
      table.dropColumn('type')
    })
  }
}

module.exports = AddFexPlanTypeSchema
