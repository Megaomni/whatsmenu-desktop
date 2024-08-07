'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TagSchema extends Schema {
  static get connection () {
    return 'mysql_v3'
  }

  up () {
    this.create('tags', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.enu('type', ['gastronomy', 'restrict'])
      table.boolean('status').defaultTo(1)
      table.string('image').nullable().defaultTo(null)
      table.json('controls')
      table.datetime('deleted_at').nullable().defaultTo(null)
      table.timestamps()
    })
  }

  down () {
    this.drop('tags')
  }
}

module.exports = TagSchema
