'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TableOpened extends Model {

  static boot() {
    super.boot()

    this.addHook('afterFetch', (tableOpeneds) => {
      for (let tableOpened of tableOpeneds) {
        tableOpened.fees = JSON.parse(tableOpened.fees)
        tableOpened.formsPayment = JSON.parse(tableOpened.formsPayment)
      }
    })

    this.addHook('afterFind', (tableOpened) => {
      tableOpened.fees = JSON.parse(tableOpened.fees)
      tableOpened.formsPayment = JSON.parse(tableOpened.formsPayment)
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
