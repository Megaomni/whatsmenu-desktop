'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeDeliveryProfileSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      table.enum('typeDelivery', ['km', 'neighborhood']).notNullable().defaultTo('km').after('whatsapp')
    })
  }

  down() {
    this.table('profiles', (table) => {
      table.dropColumn('typeDelivery')
    })
  }
}

module.exports = AddTypeDeliveryProfileSchema
