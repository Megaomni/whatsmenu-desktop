'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProfileTypeSchema extends Schema {
  up () {
    this.table('profiles', (table) => {
      table.string('typeStore', 150).after('slug').nullable()
    })
  }

  down () {
    this.table('profiles', (table) => {
      table.dropColumn('typeStore')
    })
  }
}

module.exports = AddProfileTypeSchema
