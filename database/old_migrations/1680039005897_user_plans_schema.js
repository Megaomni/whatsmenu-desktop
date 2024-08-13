'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserPlansSchema extends Schema {
  up () {
    this.table('user_plans', (table) => {
      table.integer('systemProductId').after("flexPlanId");  
      table.string('priceId').after('systemProductId');
    })
  }

  down () {
    this.table('user_plans', (table) => {
      table.dropColumn('systemProductId');  
      table.dropColumn('priceId');
    })
  }
}

module.exports = UserPlansSchema
