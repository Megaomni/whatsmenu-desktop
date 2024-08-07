'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Product extends Model {
    static get connection() {
        return 'mysql_v3'
    }

    category() {
        return this.belongsTo('App/Models/v3/Category', 'categoryId', 'id')
    }
}

module.exports = Product
