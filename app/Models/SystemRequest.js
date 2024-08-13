'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SystemRequest extends Model {
  static boot () {
    super.boot()

    this.addHook('beforeSave', (request) => {
      request.paghiper = JSON.stringify(request.paghiper)
    })

    this.addHook('afterSave', (request) => {
      request.paghiper = JSON.parse(request.paghiper)
    })

    /* this.addHook('afterCreate', (request) => {
      request.paghiper = JSON.parse(request.paghiper)
    })

    this.addHook('afterUpdate', (request) => {
      request.paghiper = JSON.parse(request.paghiper)
    }) */

    this.addHook('afterFind', (request) => {
      request.paghiper = JSON.parse(request.paghiper)
    })

    this.addHook('afterFetch', (requests) => {
      requests.forEach(request => {
        request.paghiper = JSON.parse(request.paghiper)
      });
    })
  }

  user () {
    return this.belongsTo('App/Models/User', 'userId', 'id')
  }

  invoice () {
    return this.belongsTo('App/Models/Invoice', 'invoiceId', 'id')
  }
}

module.exports = SystemRequest
