'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Fee extends Model {
  static get connection() {
    return 'mysql_r'
  }
  static boot() {
    super.boot()

    this.addHook('beforeSave', (fee) => {
      fee.automatic = JSON.parse(fee.automatic)
      fee.status = JSON.parse(fee.status)
      fee.value = JSON.parse(fee.value)
    })
  }
}

module.exports = Fee
