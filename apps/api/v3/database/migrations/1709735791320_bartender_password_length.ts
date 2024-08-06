import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bartenders', (table) => {
      table.string('password', 250).alter()
    })
  }

  async down() {
    this.schema.alterTable('bartenders', (table) => {
      table.string('password', 60).alter()
    })
  }
}
