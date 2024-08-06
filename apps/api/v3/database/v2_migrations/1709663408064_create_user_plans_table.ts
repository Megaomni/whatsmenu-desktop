import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateUserPlansSchema extends BaseSchema {
  protected tableName = 'user_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('userId').unsigned().notNullable()
      table.integer('flexPlanId').unsigned().notNullable()
      table.integer('systemProductId').nullable()
      table.string('priceId', 255).nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('userId').references('id').inTable('users')
      table.foreign('flexPlanId').references('id').inTable('flex_plans')

      // Índices
      table.index('userId')
      table.index('flexPlanId')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
