'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClientAddressSchema extends Schema {
  up () {
    this.create('client_addresses', (table) => {
      table.increments()
      table.integer('clientId').notNullable().unsigned().references('id').inTable('clients')
      table.string('street', 750).notNullable()
      table.integer('number').nullable()
      table.string('zipcode', 20).nullable()
      table.string('complement', 750).nullable()
      table.string('reference', 750).nullable()
      table.string('uf', 20).notNullable()
      table.string('city', 350).notNullable()
      table.string('neighborhood', 300).nullable()
      table.string('latitude').nullable()
      table.string('longitude').nullable()
      table.integer('distance').nullable()
      table.json('controls').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('client_addresses')
  }
}

module.exports = ClientAddressSchema
