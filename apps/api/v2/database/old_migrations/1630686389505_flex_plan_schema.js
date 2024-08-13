'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlexPlanSchema extends Schema {
  up () {
    this.create('flex_plans', (table) => {
      table.increments()
      table.string('name')
      table.string('category')
      table.boolean('status')
      table.float('monthly')
      table.float('semester')
      table.float('yearly')
      table.datetime('deleted_at')
      table.timestamps()
    })
  }

  down () {
    this.drop('flex_plans')
  }
}

module.exports = FlexPlanSchema
