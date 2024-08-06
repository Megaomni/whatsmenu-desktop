import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateProfilesSchema extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('userId').unsigned().notNullable()
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.string('typeStore', 150).nullable()
      table.boolean('status').notNullable().defaultTo(false)
      table.boolean('deliveryLocal').notNullable().defaultTo(true)
      table
        .boolean('showTotal')
        .notNullable()
        .defaultTo(true)
        .comment('exibe a toma total do carrinho na mensagem do whatsapp')
      table.string('description', 5000).nullable()
      table.string('whatsapp', 255).notNullable()
      table.enum('typeDelivery', ['km', 'neighborhood']).notNullable().defaultTo('km')
      table.json('taxDelivery').nullable()
      table.json('address').nullable()
      table.json('formsPayment').nullable()
      table
        .json('week')
        .nullable()
        .comment('controle de dias e horários em que o restaurante vai estar aberto')
      table.string('timeZone', 255).notNullable().defaultTo('America/Buenos_Aires')
      table.json('options').nullable()
      table.float('minval', 8, 2).nullable().comment('valor mínimo de venda')
      table
        .float('minvalLocal', 8, 2)
        .nullable()
        .comment('valor mínimo de venda para retirada no local')
      table
        .integer('request')
        .notNullable()
        .defaultTo(1)
        .comment('número gerado para a comanda na mensagem')
      table.integer('command').defaultTo(0)
      table.string('logo').nullable()
      table.string('background').nullable()
      table.string('color', 255).defaultTo('#f90')
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()

      // Chave estrangeira
      table.foreign('userId').references('id').inTable('users')

      // Índices
      table.unique('slug')
      table.index('userId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
