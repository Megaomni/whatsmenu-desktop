'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Cupom extends Model {
  static get connection() {
    return 'mysql_v3'
  }

  static get table () {
    return 'cupons'
  }

  static boot() {
    super.boot();

    this.addHook('beforeSave', (cupom) => {
      cupom.code = cupom.code.toUpperCase();
    })
  }

  profile() {
    return this.belongsTo('App/Models/v3/Profile', 'id', 'profileId')
  }

  carts() {
    return this.hasMany('App/Models/v3/Cart', 'id', 'cupomId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }
}

module.exports = Cupom
