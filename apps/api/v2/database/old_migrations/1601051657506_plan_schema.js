'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PlanSchema extends Schema {
  up() {
    this.create('plans', (table) => {
      table.increments()
      table.string('name', 500).notNullable()
      table.string('description', 1500).notNullable()
      table.json('controls')
      table.float('value').defaultTo(0)
      table.timestamp('deleted_at').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('plans')
  }
}

module.exports = PlanSchema
