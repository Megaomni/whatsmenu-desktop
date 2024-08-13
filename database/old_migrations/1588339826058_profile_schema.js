'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfileSchema extends Schema {
  up () {
    this.create('profiles', (table) => {
      table.increments()
      table.integer('userId').unsigned().references('id').inTable('users').notNullable()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.boolean('status').notNullable().defaultTo(false)
      table.boolean('showTotal').notNullable().defaultTo(false).comment('exibe a toma total do carrinho na mensagem do whatsapp')
      table.string('description', 5000).nullable().defaultTo(null)
      table.string('whatsapp').notNullable()
      table.json('taxDelivery').nullable().defaultTo(null)
      table.json('address').nullable().defaultTo(null)
      table.json('week').nullable().comment('controle de dias e horários em que o restaurante vai estar aberto')
      // table.json('week').nullable().defaultTo(JSON.stringify({
      //     sun: null,
      //     mon: null,
      //     tue: null,
      //     wed: null,
      //     thu: null,
      //     fri: null,
      //     sat: null
      //   })
      // )
      table.float('minval').nullable().defaultTo(null).comment('valor mínimo de venda')
      table.integer('request').notNullable().defaultTo(1).comment('número gerado para a comanda na mensagem')
      table.string('logo').nullable()
      table.string('background').nullable()
      table.string('color').nullable().defaultTo('#f90')
      table.timestamps()
    })
  }

  down () {
    this.drop('profiles')
  }
}

module.exports = ProfileSchema
