'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cupom extends Model {
  static get table() {
    return 'cupons'
  }

  static boot() {
    super.boot()

    this.addHook('beforeSave', (cupom) => {
      cupom.code = cupom.code.toUpperCase()
    })
  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'id', 'profileId')
  }

  requests() {
    return this.hasMany('App/Models/Request', 'id', 'cupomId')
  }
  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'cupomId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }
}

module.exports = Cupom
