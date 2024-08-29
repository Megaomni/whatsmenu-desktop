import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateProfileTagsSchema extends BaseSchema {
  protected tableName = 'profile_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().notNullable()
      table.integer('tagId').unsigned().nullable()
      table.integer('profileId').unsigned().nullable()
      table.timestamps()

      // Chaves estrangeiras
      table.foreign('tagId').references('id').inTable('tags')
      table.foreign('profileId').references('id').inTable('profiles')

      // Índices
      table.index('tagId', 'profile_tags_tagid_foreign')
      table.index('profileId', 'profile_tags_profileid_foreign')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
