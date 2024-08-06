'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ComplementSchema extends Schema {
  up () {
    this.create('complements', (table) => {
      table.increments()
      table.string('name', 500).notNullable()
      table.integer('min').nullable()
      table.integer('max').nullable()
      table.boolean('required').notNullable().defaultTo(false)
      table.json('itens').notNullable().comment(JSON.stringify({
        name: 'nome',
        description: 'descrição',
        value: 5,
        status: true
      }))
      table.timestamps()
    })
  }

  down () {
    this.drop('complements')
  }
}

module.exports = ComplementSchema
