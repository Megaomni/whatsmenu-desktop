'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RequestSchema extends Schema {
  up () {
    this.create('requests', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.integer('code').notNullable()
      table.enum('status', ['production', 'transport']).nullable().defaultTo(null)
      table.string('name', 400).notNullable()
      table.string('contact', 20).notNullable()
      table.string('formPayment', 30).notNullable()
      table.integer('typeDelivery').notNullable().comment('0 = entrega, 1 = retirar no local')
      table.float('taxDelivery').notNullable()
      table.string('timeDelivery', 250).notNullable()
      table.float('transshipment').notNullable().defaultTo(0)
      table.float('total').notNullable()
      table.json('deliveryAddress').notNullable()
      table.json('cart').notNullable()
      table.json('cartPizza').notNullable()
      table.timestamps()
      // table.unique('code', 'profileId')
    })
  }

  down () {
    this.drop('requests')
  }
}

module.exports = RequestSchema
