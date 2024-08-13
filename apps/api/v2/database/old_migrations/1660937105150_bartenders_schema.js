'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BartendersSchema extends Schema {
  up() {
    this.create('bartenders', (table) => {
      table.increments()
      table.integer('profileId').nullable().unsigned().references('id').inTable('profiles')
      table.string('name', 120).notNullable()
      table.string('password', 60).notNullable()
      table.boolean('status').defaultTo(true)
      table.json('controls')
      table.datetime('deleted_at').nullable().defaultTo(null)
      table.timestamps()
    })
  }

  down() {
    this.drop('bartenders')
  }
}

module.exports = BartendersSchema
