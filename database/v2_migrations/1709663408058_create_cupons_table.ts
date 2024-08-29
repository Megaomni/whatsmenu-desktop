import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateCuponsSchema extends BaseSchema {
  protected tableName = 'cupons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('profileId').unsigned().notNullable()
      table.string('code', 200).notNullable()
      table.enum('type', ['percent', 'value', 'freight']).notNullable()
      table.float('value', 8, 2).notNullable()
      table.float('minValue', 8, 2).notNullable().defaultTo(0.0)
      table.boolean('status').notNullable().defaultTo(true)
      table.dateTime('deleted_at').nullable()
      table.timestamps()

      // Chave estrangeira
      table.foreign('profileId').references('id').inTable('profiles')

      // Índices
      table.unique(['profileId', 'code'], 'cupons_profileid_code_unique')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
