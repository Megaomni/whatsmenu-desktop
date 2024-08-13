'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const TableOpened = use('App/Models/ReadOnly/TableOpened')

class Command extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeSave', (command) => {
      command.fees = typeof command.fees === 'string' ? JSON.parse(command.fees) : command.fees
      command.formsPayment = typeof command.formsPayment === 'string' ? JSON.parse(command.formsPayment) : command.formsPayment
      if (!command.fees) command.fees = []
      command.fees.forEach((fee) => {
        fee.id = JSON.parse(fee.id)
        fee.value = JSON.parse(fee.value)
        fee.status = JSON.parse(fee.status)
        if (fee.quantity) fee.quantity = JSON.parse(fee.quantity)
        fee.automatic = JSON.parse(fee.automatic)
        fee.profileId = JSON.parse(fee.profileId)
      })
      if (!command.formsPayment) command.formsPayment = []
      command.formsPayment.forEach((formPayment) => {
        console.log('FORMPAYMENT: ==>', formPayment)
        formPayment.value = JSON.parse(formPayment.value)
        if (formPayment.change) {
          formPayment.change = JSON.parse(formPayment.change)
        }
      })
      command.fees = JSON.stringify(command.fees)
      command.formsPayment = JSON.stringify(command.formsPayment)
    })

    this.addHook('afterSave', async (command) => {
      command.formsPayment = JSON.parse(command.formsPayment)
      command.fees = JSON.parse(command.fees)
      let table = await TableOpened.query()
        .where('id', command.tableOpenedId)
        .with('commands', (query) => {
          return query.from('commands').where('status', 1).with('carts')
        })
        .first()

      table.fees.forEach((fee) => {
        const allNotAutomatic = table.toJSON().commands.every((command) => {
          if (command.carts.filter((c) => c.status !== 'canceled').length) {
            const haveFee = command.fees.find((f) => f.code === fee.code)
            if (haveFee) {
              return haveFee.automatic ? false : true
            }
          } else {
            return true
          }
        })

        fee.automatic = allNotAutomatic ? 0 : 1
      })
      command.tableId = table.tableId
      await table.save()
    })

    this.addHook('afterFetch', (commands) => {
      for (let command of commands) {
        command.fees = JSON.parse(command.fees)
        command.formsPayment = JSON.parse(command.formsPayment)
        command.formsPayment.forEach((formPayment) => {
          formPayment.value = Number(formPayment.value)
          formPayment.change = formPayment.change && Number(formPayment.change)
        })
      }
    })

    this.addHook('afterFind', (command) => {
      command.fees = typeof command.fees === 'string' && JSON.parse(command.fees)
      command.formsPayment = JSON.parse(command.formsPayment)
      if (command.formsPayment) {
        command.formsPayment.forEach((formPayment) => {
          formPayment.value = Number(formPayment.value)
          formPayment.change = formPayment.change && Number(formPayment.change)
        })
      }
    })
  }

  opened() {
    return this.belongsTo('App/Models/ReadOnly/TableOpened', 'tableOpenedId', 'id')
  }

  requests() {
    return this.hasMany('App/Models/ReadOnly/Request', 'id', 'commandId')
  }

  carts() {
    return this.hasMany('App/Models/ReadOnly/Cart', 'id', 'commandId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }
}

module.exports = Command
