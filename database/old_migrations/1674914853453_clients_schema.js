'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClientsSchema extends Schema {
  up () {
    this.create('clients', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.string('name', 250).notNullable()
      table.string('whatsapp', 20).notNullable()
      table.string('secretNumber', 20).nullable()
      table.string('email', 100).nullable()
      table.timestamp('birthday_date').nullable()
      table.json('last_requests').nullable()
      table.json('controls').nullable()
      table.timestamp('date_last_request').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamps()
      table.unique(['profileId', 'whatsapp'], 'profile_client_whatsapp')
      table.unique(['profileId', 'secretnumber'], 'profile_client_secretnumber')
      table.unique(['profileId', 'email'], 'profile_client_email')
    })
  }

  down () {
    this.drop('clients')
  }
}

module.exports = ClientsSchema
