'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Hash = use('Hash')

class Bartender extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeSave', async (bartender) => {
      if (bartender.dirty.password) {
        bartender.password = await Hash.make(bartender.password)
      }
      bartender.controls = JSON.stringify(bartender.controls)
    })

    this.addHook('beforeCreate', async (bartender) => {
      if (!bartender.controls) {
        bartender.controls = {
          type: 'bartender',
          blockedCategories: [],
          defaultCashier: false,
        }
      }
    })

    this.addHook('afterSave', (bartender) => {
      bartender.controls = JSON.parse(bartender.controls)
      // bartender.password = ""
    })

    this.addHook('afterFetch', (bartenders) => {
      bartenders.forEach((bartender) => {
        bartender.controls = JSON.parse(bartender.controls)
        // bartender.password = ""
      })
    })

    this.addHook('afterFind', (bartender) => {
      bartender.controls = JSON.parse(bartender.controls)
    })
  }

  requests() {
    return this.hasMany('App/Models/ReadOnly/Request', 'id', 'bartenderId')
  }

  carts() {
    return this.hasMany('App/Models/ReadOnly/Cart', 'id', 'bartenderId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  cashiers() {
    return this.hasMany('App/Models/ReadOnly/Cashier', 'id', 'bartenderId')
  }
  activeCashier() {
    return this.hasOne('App/Models/ReadOnly/Cashier', 'id', 'bartenderId').where('closed_at', null)
  }
}

module.exports = Bartender
