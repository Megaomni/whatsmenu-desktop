'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FeesSchema extends Schema {
  up () {
    this.create('fees', (table) => {
      table.increments()
      table.integer('profileId').nullable().unsigned().references('id').inTable('profiles')
      table.string('code', 200).notNullable()
      table.enu('type', ['percent', 'fixed']).notNullable()
      table.float('value').notNullable()
      table.boolean('status').notNullable().defaultTo(1)
      table.boolean('automatic').notNullable().defaultTo(1)
      table.unique(['profileId', 'code'])
      table.timestamp('deleted_at').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('fees')
  }
}

module.exports = FeesSchema
