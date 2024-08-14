'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SystemProductsSchema extends Schema {
  up() {
    this.create('system_products', (table) => {
      table.increments()
      table.integer('plan_id')
      table.string('name', 255).notNullable()
      table.string('description', 500)
      table.boolean('status').notNullable().default(1)
      table.string('service').notNullable()
      table.string('default_price').notNullable()
      table.json('operations').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('system_products')
  }
}

module.exports = SystemProductsSchema
