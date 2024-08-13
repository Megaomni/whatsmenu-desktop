'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DomainsSchema extends Schema {
  up() {
    this.create('domains', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.string('name', 240).unique()
      table.string('key', 240).unique()
      table.json('options').nullable()
      table.boolean('default')
      table.timestamps()
    })
  }

  down() {
    this.drop('domains')
  }
}

module.exports = DomainsSchema
