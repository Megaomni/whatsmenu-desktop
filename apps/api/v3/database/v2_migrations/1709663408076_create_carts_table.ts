import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCartsSchema extends BaseSchema {
  protected tableName = 'carts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.integer('clientId').unsigned().nullable()
      table.integer('addressId').unsigned().nullable()
      table.integer('cupomId').unsigned().nullable()
      table.integer('commandId').unsigned().nullable()
      table.integer('bartenderId').unsigned().nullable()
      table.integer('cashierId').unsigned().nullable()
      table.integer('motoboyId').unsigned().nullable()
      table.string('secretNumber', 20).nullable()
      table.string('code', 20).notNullable()
      table.enum('status', ['production', 'transport', 'delivered', 'canceled']).nullable()
      table.enum('statusPayment', ['offline', 'paid', 'pending', 'cancelled']).nullable()
      table.string('obs', 300).nullable()
      table.enum('type', ['D', 'T', 'P']).notNullable().defaultTo('D')
      table.float('taxDelivery', 8, 2).nullable()
      table.string('timeDelivery', 250).notNullable()
      table.json('formsPayment').nullable()
      table.boolean('print').defaultTo(false)
      table.integer('tentatives').defaultTo(0)
      table.float('total', 8, 2).notNullable()
      table.json('controls').nullable()
      table.timestamp('packageDate').nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('clientId').references('id').inTable('clients')
      table.foreign('addressId').references('id').inTable('client_addresses')
      table.foreign('cupomId').references('id').inTable('cupons')
      table.foreign('commandId').references('id').inTable('commands')
      table.foreign('bartenderId').references('id').inTable('bartenders')
      table.foreign('cashierId').references('id').inTable('cashiers')
      table.foreign('motoboyId').references('id').inTable('motoboys')
      table.foreign('profileId').references('id').inTable('profiles')

      // Índices
      table.unique(['profileId', 'code'], 'profile_code')
      table.index('clientId', 'carts_clientid_foreign')
      table.index('addressId', 'carts_addressid_foreign')
      table.index('cupomId', 'carts_cupomid_foreign')
      table.index('commandId', 'carts_commandid_foreign')
      table.index('bartenderId', 'carts_bartenderid_foreign')
      table.index('cashierId', 'carts_cashierid_foreign')
      table.index('print', 'request_print')
      table.index('tentatives', 'request_tentatives')
      table.index(['print', 'tentatives'], 'requests_print_tentatives')
      table.index('motoboyId', 'carts_motoboyid_foreign')
      table.index(['profileId', 'created_at'], 'profileId_createdAt')
      table.index('created_at', 'createdAt')
      table.index('print', 'printed')
      table.index(['print', 'tentatives'], 'print_tentatives')
      table.index(['statusPayment', 'profileId'], 'profile_statusPayment')
      table.index('statusPayment')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
