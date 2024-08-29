import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('password', 250).alter()
      table.string('security_key', 250).alter()
    })
  }

  async down() {
    // this.schema.alterTable('users', (table) => {
    //   table.string('password', 250).alter()
    //   table.string('security_key', 250).alter()
    // })
  }
}
