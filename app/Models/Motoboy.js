'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Motoboy extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', async (motoboy) => {
      motoboy.controls = JSON.stringify(motoboy.controls || {})
    })

    this.addHook('afterSave', async (motoboy) => {
      motoboy.controls = JSON.parse(motoboy.controls)
    })

    this.addHook('afterFind', async (motoboy) => {
      motoboy.controls = JSON.parse(motoboy.controls)
    })

    this.addHook('afterFetch', async (motoboys) => {
      motoboys.forEach((motoboy) => {
        motoboy.controls = JSON.parse(motoboy.controls)
      })
    })

    this.addHook('afterPaginate', async (motoboys) => {
      motoboys.data.forEach((motoboy) => {
        motoboy.controls = JSON.parse(motoboy.controls)
      })
    })
  }

  static get table() {
    return 'motoboys'
  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }

  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'motoboyId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }
}

module.exports = Motoboy
