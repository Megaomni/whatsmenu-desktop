'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Category extends Model {

    products() {
        return this.hasMany('App/Models/Product', 'id', 'categoryId')
      }

      allProducts() {
        return this.hasMany('App/Models/Product', 'id', 'categoryId')
      }

      product() { // pizzaProduct
        return this.hasOne('App/Models/PizzaProduct', 'id', 'categoryId')
      }
}




module.exports = Category
