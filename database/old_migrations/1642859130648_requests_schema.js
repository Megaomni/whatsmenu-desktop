'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestsSchema extends Schema {
  up () {
    this.table('requests', (table) => {
      table.enum('type', ['D', 'T', 'P']).notNullable().after('typeDelivery').comment('D=DELIVERY T=TABLE P=PACKAGE')
      table.date('packageDate').comment('Campo para requests do tipo encomenda')
    })
  }

  down () {
    this.table('requests', (table) => {
      table.dropColumn('type')
      table.dropColumn('packageDate')
    })
  }
}

module.exports = RequestsSchema
