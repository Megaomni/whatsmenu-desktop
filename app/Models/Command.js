'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Command extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', (command) => {
      command.fees = typeof command.fees === 'string' ? JSON.parse(command.fees) : command.fees
      command.formsPayment = typeof command.formsPayment === 'string' ? JSON.parse(command.formsPayment) : command.formsPayment
      if (!command.fees) command.fees = []
      command.fees.forEach(fee => {
        fee.id = JSON.parse(fee.id)
        fee.value = JSON.parse(fee.value)
        fee.status = JSON.parse(fee.status)
        if (fee.quantity) fee.quantity = JSON.parse(fee.quantity)
        fee.automatic = JSON.parse(fee.automatic)
        fee.profileId = JSON.parse(fee.profileId)
      })
      if (!command.formsPayment) command.formsPayment = []
      command.formsPayment.forEach(formPayment => {
        formPayment.value = JSON.parse(formPayment.value)
        if (formPayment.change) {
          formPayment.change = JSON.parse(formPayment.change)
        }
      })
      command.fees = JSON.stringify(command.fees)
      command.formsPayment = JSON.stringify(command.formsPayment)
    })

    this.addHook('afterSave', (command) => {
      command.formsPayment = JSON.parse(command.formsPayment)
    })

    this.addHook('afterFetch', (commands) => {
      for (let command of commands) {
        command.fees = JSON.parse(command.fees)
        command.formsPayment = JSON.parse(command.formsPayment)
      }
    })

    this.addHook('afterFind', (command) => {
        command.fees = typeof command.fees === 'string' && JSON.parse(command.fees)
        command.formsPayment = JSON.parse(command.formsPayment)
    })

  }
  table() {
    return this.belongsTo('App/Models/TableOpened', 'tableOpenedId', 'id')
  }

  // AJUSTE
  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'commandId')
  }

  requests() {
    return this.hasMany('App/Models/Request', 'id', 'commandId')
  }
}

module.exports = Command
