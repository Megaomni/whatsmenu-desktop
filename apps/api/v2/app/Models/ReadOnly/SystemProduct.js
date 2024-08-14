'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SystemProduct extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeCreate', (product) => {
      if (product.operations && typeof product.operations !== 'string') {
        product.operations = JSON.stringify(product.operations)
      }
    })

    this.addHook('beforeUpdate', (product) => {
      if (product.operations && typeof product.operations !== 'string') {
        product.operations = JSON.stringify(product.operations)
      }
    })

    this.addHook('afterSave', (product) => {
      if (typeof product.operations === 'string') {
        product.operations = JSON.parse(product.operations)
      }
    })

    this.addHook('afterFind', (product) => {
      if (typeof product.operations === 'string') {
        product.operations = JSON.parse(product.operations)
      }
    })

    this.addHook('afterFetch', (products) => {
      for (const prod of products) {
        if (typeof prod.operations === 'string') {
          prod.operations = JSON.parse(prod.operations)
        }
      }
    })
  }

  flexPlan() {
    this.belongsTo('App/Models/ReadOnly/FlexPlan', 'id', 'plan_id')
  }
}

module.exports = SystemProduct
