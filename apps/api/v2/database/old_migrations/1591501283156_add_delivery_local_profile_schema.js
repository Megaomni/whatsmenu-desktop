'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDeliveryLocalProfileSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      table.boolean('deliveryLocal').notNullable().defaultTo(true).after('status')
    })
  }

  down() {
    this.table('profiles', (table) => {
      table.dropColumn('deliveryLocal')
    })
  }
}

module.exports = AddDeliveryLocalProfileSchema
