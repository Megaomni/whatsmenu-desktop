'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CartIten extends Model {
  static get connection() {
    return 'mysql_v3'
  }
  
  static boot() {
    super.boot();
    this.addHook("beforeSave", async (item) => {
      item.details = item.details ? JSON.stringify(item.details) : '{}'
      item.controls = item.controls ? JSON.stringify(item.controls) : '{}'
    })
    this.addHook("afterSave", async (item) => {
      item.details = JSON.parse(item.details)
      item.controls = JSON.parse(item.controls)
    })

    this.addHook("afterFind", async (item) => {
      item.details = JSON.parse(item.details)
      item.controls = JSON.parse(item.controls)
    })

    this.addHook("afterFetch", async (items) => {
      items.forEach(item => {
        item.details = JSON.parse(item.details)
        item.controls = JSON.parse(item.controls)
      });
    })

    this.addHook("afterPaginate", async (items) => {
      items.forEach(item => {
        item.details = JSON.parse(item.details)
        item.controls = JSON.parse(item.controls)
      });
    })
  }

  product() {
    return this.belongsTo("App/Models/Product", 'productId', 'id')
  }
}

module.exports = CartIten
