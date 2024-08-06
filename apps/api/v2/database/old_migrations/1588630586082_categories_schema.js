'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategorySchema extends Schema {
  up () {
    this.create('categories', (table) => {
      table.increments()
      table.integer('profileId').notNullable().unsigned().references('id').inTable('profiles')
      table.string('name', 250).notNullable()
      table.integer('order').notNullable().defaultTo(0)
      table.integer('status').notNullable().defaultTo(1)
      table.enum('type', ['default', 'pizza']).notNullable().defaultTo('default')
      table.timestamps()
    })
  }

  down () {
    this.drop('categories')
  }
}

module.exports = CategorySchema
