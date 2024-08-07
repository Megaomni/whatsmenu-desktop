'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfileTagsSchema extends Schema {
  static get connection () {
    return 'mysql_v3'
  }

  up () {
    this.create('profile_tags', (table) => {
      table.increments()
      table.integer('tagId').unsigned().references('id').inTable('tags')
      table.integer('profileId').unsigned().references('id').inTable('profiles')
      table.timestamps()
    })
  }

  down () {
    this.drop('profile_tags')
  }
}

module.exports = ProfileTagsSchema
