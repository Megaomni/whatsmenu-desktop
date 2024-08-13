'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TableOpened extends Model {

  static boot() {
    super.boot()

    this.addHook('beforeCreate', (tableOpened) => {
      tableOpened.fees = JSON.stringify(tableOpened.fees)
      tableOpened.formsPayment = '[]'
    })

    this.addHook('beforeSave', (tableOpened) => {
      tableOpened.fees = typeof tableOpened.fees === 'object' ? JSON.stringify(tableOpened.fees) : tableOpened.fees
      tableOpened.formsPayment = typeof tableOpened.formsPayment === 'object' ? JSON.stringify(tableOpened.formsPayment) : tableOpened.formsPayment
    })

    this.addHook('afterSave', (tableOpened) => {
      tableOpened.fees = typeof tableOpened.fees === 'string' ? JSON.parse(tableOpened.fees) : tableOpened.fees
      tableOpened.formsPayment = typeof tableOpened.formsPayment === 'string' ? JSON.parse(tableOpened.formsPayment) : tableOpened.formsPayment
    })

    this.addHook('afterFetch', (tableOpeneds) => {
      for (let tableOpened of tableOpeneds) {
        tableOpened.fees = JSON.parse(tableOpened.fees)
        tableOpened.formsPayment = JSON.parse(tableOpened.formsPayment)
        tableOpened.formsPayment.forEach(formPayment => {
          formPayment.value = Number(formPayment.value)
            formPayment.change = formPayment.change && Number(formPayment.change)
        });
      }
    })

    this.addHook('afterFind', (tableOpened) => {
      tableOpened.fees = JSON.parse(tableOpened.fees)
      tableOpened.formsPayment = JSON.parse(tableOpened.formsPayment)
      tableOpened.formsPayment.forEach(formPayment => {
        formPayment.value = Number(formPayment.value)
        formPayment.change = formPayment.change && Number(formPayment.change)
      });
    })
  }
  
  table() {
    return this.belongsTo('App/Models/Table', 'tableId', 'id')
  }

  commands() {
    return this.hasMany('App/Models/Command', 'id', 'tableOpenedId')
  }
}

module.exports = TableOpened
