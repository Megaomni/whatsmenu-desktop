'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserPlansSchema extends Schema {
  up() {
    this.create('user_plans', (table) => {
      table.increments()
      table.integer('userId').unsigned().references('id').inTable('users').notNullable()
      table.integer('flexPlanId').unsigned().references('id').inTable('flex_plans').notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('user_plans')
  }
}

module.exports = UserPlansSchema
