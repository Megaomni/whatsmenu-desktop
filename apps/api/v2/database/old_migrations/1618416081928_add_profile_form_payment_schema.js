'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProfileFormPaymentSchema extends Schema {
  up() {
    this.table('profiles', (table) => {
      table.json('formsPayment').nullable().after('address')
    })
  }

  down() {
    this.table('profiles', (table) => {
      table.dropColumn('formsPayment')
    })
  }
}

module.exports = AddProfileFormPaymentSchema
