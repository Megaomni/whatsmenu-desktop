import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTagsSchema extends BaseSchema {
  protected tableName = 'tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.string('name', 255).notNullable()
      table.enu('type', ['gastronomy', 'restrict']).nullable()
      table.tinyint('status').defaultTo(1)
      table.string('image', 255).nullable()
      table.json('controls').nullable()
      table.timestamps()

      table.primary(['id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
