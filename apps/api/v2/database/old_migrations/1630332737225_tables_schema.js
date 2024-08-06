'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TablesSchema extends Schema {
  up () {
    this.create('tables', (table) => {
      table.increments()
      table.integer('profileId').nullable().unsigned().references('id').inTable('profiles')
      table.string('name')
      table.boolean('status')
      table.unique(['profileId', 'name'])
      table.datetime('deleted_at').nullable().defaultTo(null)
      table.timestamps()
    })
  }

  down () {
    this.drop('tables')
  }
}

module.exports = TablesSchema
