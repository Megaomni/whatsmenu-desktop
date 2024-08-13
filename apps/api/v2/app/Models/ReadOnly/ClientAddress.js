'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ClientAddress extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeCreate', async (address) => {
      address.controls = '{}'
    })

    this.addHook('beforeSave', async (address) => {
      address.number = address.number === 'SN' ? null : address.number
      address.controls = address.controls ? JSON.stringify(address.controls) : '{}'
    })

    this.addHook('afterSave', async (address) => {
      address.controls = JSON.parse(address.controls)
    })

    this.addHook('afterFind', async (address) => {
      address.controls = JSON.parse(address.controls)
    })

    this.addHook('afterFetch', async (addresses) => {
      addresses.forEach((address) => {
        address.controls = JSON.parse(address.controls)
      })
    })

    this.addHook('afterPaginate', async (addresses) => {
      addresses.forEach((address) => {
        address.controls = JSON.parse(address.controls)
      })
    })
  }
}

module.exports = ClientAddress
