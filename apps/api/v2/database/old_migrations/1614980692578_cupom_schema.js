'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CupomSchema extends Schema {
  up() {
    this.create('cupons', (table) => {
      table.increments()
      table.integer('profileId').unsigned().references('id').inTable('profiles').notNullable()
      table.string('code', 200).notNullable()
      table.enu('type', ['percent', 'value', 'freight']).notNullable()
      table.float('value').notNullable()
      table.boolean('status').notNullable().defaultTo(1)
      table.unique(['profileId', 'code'])
      table.timestamp('deleted_at').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('cupons')
  }
}

module.exports = CupomSchema
