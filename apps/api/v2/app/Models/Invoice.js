'use strict'

const GoogleProvider = use('GoogleProvider')
const QueueController = use('App/Controllers/Http/QueueController')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Invoice extends Model {

  static boot() {
    super.boot()

    this.addHook('beforeSave', (invoice) => {
      invoice.itens = JSON.stringify(invoice.itens)
    })



    this.addHook('afterSave', async (invoice) => {
      invoice.itens = JSON.parse(invoice.itens)
      const user = await invoice.user().with("profile").fetch()

      if (invoice.status === 'paid'){
        const profile = await user.profile().fetch()
        if (profile) {
          profile.status = 1
          await profile.save()
        }

        if(user.controls.canceled){
          user.controls.canceled = false
          await user.save()
        }
      }

      if (invoice.status === 'paid' && invoice.type === 'first') {
        await QueueController.setClientSupport(invoice.userId)

        /*
        const filterUser = await invoice.user().fetch()
        const spreadSheetId = '1aLFUGESuS0TgigRetK1MA9vnf8zYyZ0cFJ0Npkr2VOA'

        const rows = await GoogleProvider.sheets.getRowsPlan(spreadSheetId, 'Página1')
        let range = ''

        const valueFind = rows.values.find((lead, index) => lead.some(value => {
          range = `!A${index + 1}:J${index + 1}`
          return value.replace(/\D/g, '') === filterUser.whatsapp.replace(/\D/g, '')
        }))

        await GoogleProvider.sheets.getRowsPlan(spreadSheetId, 'Página1'.concat(range))

        const invoiceValue = invoice.value

        if (valueFind) {
          valueFind[9] = invoiceValue.toFixed(2)
        }

        await GoogleProvider.sheets.addPaidPlan(spreadSheetId, range, valueFind);
        */


      }
    })


    this.addHook('afterFind', (invoice) => {
      invoice.itens = JSON.parse(invoice.itens)
    })

    this.addHook('afterFetch', (invoices) => {
      invoices.forEach(invoice => {
        invoice.itens = JSON.parse(invoice.itens)
      })
    })
  }

  user() {
    return this.belongsTo('App/Models/User', 'userId', 'id')
  }

  requests() {
    return this.hasMany('App/Models/SystemRequest', 'id', 'invoiceId')
  }

  firstRequest(invoice_code = null) {
    return this.hasMany('App/Models/SystemRequest', 'id', 'invoiceId').where({ invoice_code }).first();
  }
}

module.exports = Invoice
