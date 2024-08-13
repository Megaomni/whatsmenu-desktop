'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddRequestsPaymentFlagSchema extends Schema {
  up () {
    this.table('requests', (table) => {
      table.string('formPaymentFlag', 200).nullable().defaultTo(null).after('formPayment')
    })
  }

  down () {
    this.table('requests', (table) => {
      table.dropColumn('formPaymentFlag')
    })
  }
}

module.exports = AddRequestsPaymentFlagSchema
