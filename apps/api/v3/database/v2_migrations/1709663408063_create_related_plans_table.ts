import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRelatedPlansSchema extends BaseSchema {
  protected tableName = 'related_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('plan_id').unsigned().nullable()
      table.integer('plan_associated_id').unsigned().nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('plan_id').references('id').inTable('flex_plans')
      table.foreign('plan_associated_id').references('id').inTable('flex_plans')

      // Índices
      table.index('plan_id', 'related_plans_plan_id_foreign')
      table.index('plan_associated_id', 'related_plans_plan_associated_id_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
