'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RelatedPlansSchema extends Schema {
  up () {
    this.create('related_plans', (table) => {
      table.increments()
      table.integer("plan_id").unsigned().references("id").inTable("flex_plans");
      table.integer("plan_associated_id").unsigned().references("id").inTable("flex_plans");
      table.timestamps()
    })
  }

  down () {
    this.drop('related_plans')
  }
}

module.exports = RelatedPlansSchema
