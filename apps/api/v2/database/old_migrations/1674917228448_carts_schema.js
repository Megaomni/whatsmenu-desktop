'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CartsSchema extends Schema {
  up () {
    this.create('carts', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.integer('clientId').nullable().unsigned().references('id').inTable('clients')
      table.integer('addressId').nullable().unsigned().references('id').inTable('client_addresses')
      table.integer('cupomId').nullable().unsigned().references('id').inTable('cupons')
      table.integer('commandId').nullable().unsigned().references('id').inTable('commands')
      table.integer('bartenderId').nullable().unsigned().references('id').inTable('bartenders')
      table.integer('cashierId').nullable().unsigned().references('id').inTable('cashiers')
      table.string('secretNumber', 20).nullable()
      table.string('code', 20).notNullable()
      table.unique(['profileId', 'code'], 'profile_code')
      table.enum('status', ['production', 'transport', 'delivered', 'canceled']).nullable().defaultTo(null)
      table.string('obs', 300).nullable()
      table.enum('type', ['D', 'T', 'P']).notNullable().defaultTo('D')
      table.float('taxDelivery').nullable()
      table.string('timeDelivery', 250).notNullable()
      table.json('formsPayment').nullable()
      table.boolean('print').defaultTo(false).index('request_print')
      table.integer('tentatives').defaultTo(0).index('request_tentatives')
      table.index(['print', 'tentatives'], 'requests_print_tentatives')
      table.float('total').notNullable()
      table.json('controls').nullable()
      table.timestamp('packageDate').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('carts')
  }
}

module.exports = CartsSchema
