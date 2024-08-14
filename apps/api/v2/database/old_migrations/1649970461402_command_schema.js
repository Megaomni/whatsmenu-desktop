'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Command = use('App/Models/Command')

class CommandSchema extends Schema {
  up() {
    this.table('commands', (table) => {
      table.integer('tableOpenedId').unsigned().references('id').inTable('table_openeds').after('id')
    })

    this.schedule(async () => {
      const commands = await Command.all()
      const trx = await Database.beginTransaction()

      try {
        let index = 0

        for (let command of commands.rows) {
          if (command.code === 1) {
            await trx
              .insert({
                tableId: command.tableId,
                status: 0,
                fees: JSON.stringify(command.fees),
                formsPayment: JSON.stringify(command.formsPayment),
                created_at: command.created_at,
                updated_at: command.updated_at,
              })
              .into('table_openeds')
            index++
            command.tableOpenedId = index
            command.save()
          } else {
            if (commands.rows[index]) {
              command.tableOpenedId = index
              command.save()
            }
          }
        }
        await trx.commit()
      } catch (error) {
        await trx.rollback()
        console.error(error)
      }
    })

    this.table('commands', (table) => {
      table.dropForeign('tableId', 'commands_tableid_foreign')
      table.dropColumn('tableId')
    })
  }

  down() {
    this.table('commands', (table) => {
      table.integer('tableId').unsigned().references('id').inTable('tables').after('id')
    })

    this.schedule(async () => {
      const commands = await Command.all()
      const tables = await Database.select('*').from('table_openeds')

      for (let command of commands.rows) {
        const table = tables.find((t) => t.id === command.tableOpenedId)
        if (table) {
          command.tableId = table.tableId
          command.save()
        }
      }
    })

    this.table('commands', (table) => {
      table.dropForeign('tableOpenedId', 'commands_tableopenedid_foreign')
      table.dropColumn('tableOpenedId')
    })
  }
}

module.exports = CommandSchema
