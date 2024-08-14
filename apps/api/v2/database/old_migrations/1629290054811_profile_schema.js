'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfileSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      // alter table
      table.float('minvalLocal').nullable().defaultTo(null).comment('valor mínimo de venda para retirada no local').after('minval')
    })
  }

  down() {
    this.table('profiles', (table) => {
      table.dropColumn('minvalLocal')
    })
  }
}

module.exports = ProfileSchema
