'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTelMotoboySchema extends Schema {
  up() {
    this.alter('motoboys', (table) => {
      table.string('whatsapp', 20).nullable().after('controls')
    })
  }

  down() {
    this.table('motoboys', (table) => {
      table.dropColumn('whatsapp')
    })
  }
}

module.exports = AddTelMotoboySchema
