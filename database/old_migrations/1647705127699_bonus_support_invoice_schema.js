'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class BonusSupportInvoiceSchema extends Schema {
  up () {
    this.table('bonus_supports', (table) => {
      table.integer('invoiceId').unsigned().references('id').inTable('invoices').after('systemRequestId')
    })

    this.schedule(async (trx) => {
      const query = await Database
                            .table('system_requests')
                            .select('bonus_supports.id', 'system_requests.invoiceId', 'bonus_supports.supportId')
                            .innerJoin('bonus_supports', 'system_requests.id', 'bonus_supports.systemRequestId')
                            .whereNotNull('system_requests.invoiceId')
                            .transacting(trx)

      console.log(query);

      for (const item of query) {
        console.log(item.id);
        await Database.table('bonus_supports').where('id', item.id).update('invoiceId', item.invoiceId)
      }
    })

    this.table('bonus_supports', (table) => {
      table.dropForeign('systemRequestId', 'bonus_supports_systemrequestid_foreign')
      table.dropColumn('systemRequestId')
    })

  }

  down () {
    this.table('bonus_supports', (table) => {
      table.dropForeign('invoiceId', 'bonus_supports_invoiceid_foreign')
      table.dropColumn('invoiceId')
    })
  }
}

module.exports = BonusSupportInvoiceSchema
