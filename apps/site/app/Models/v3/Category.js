'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Category extends Model {
    static get connection() {
        return 'mysql_v3'
    }

    products() {
        return this.hasMany('App/Models/v3/Product', 'id', 'categoryId').where('deleted_at', null)
    }

    allProducts() {
        return this.hasMany('App/Models/v3/Product', 'id', 'categoryId')
    }

    product() { // pizzaProduct
        return this.hasOne('App/Models/v3/PizzaProduct', 'id', 'categoryId')
    }
}




module.exports = Category
