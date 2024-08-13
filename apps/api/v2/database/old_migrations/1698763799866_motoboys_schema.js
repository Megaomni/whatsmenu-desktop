'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MotoboysSchema extends Schema {
  up() {
    this.create('motoboys', (table) => {
      table.increments()
      table.string('name', 300).notNullable()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.boolean('status').defaultTo(false)
      table.json('controls').nullable()
      table.datetime('deleted_at').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('motoboys')
  }
}

module.exports = MotoboysSchema
