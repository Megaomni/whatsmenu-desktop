'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('name', 500).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('whatsapp', 254).notNullable()
      table.string('password', 60).notNullable()
      table.string('security_key', 60)
      table.json('controls').notNullable().comment('controles que possam existir como recuperar senha por exemplo')
      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema
