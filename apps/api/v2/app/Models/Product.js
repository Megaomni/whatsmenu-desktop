'use strict'

const WmProvider = use('WmProvider')

const Category = use('App/Models/Category')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Product extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeCreate', (product) => {
      product = product.toJSON()
      const week = Object.entries(product.disponibility.week)
      week.forEach((day) => {
        day[1].forEach((hour) => {
          hour.active = JSON.parse(hour.active)
          hour.weekDay = parseInt(hour.weekDay)
        })
      })
    })

    this.addHook('beforeSave', (product) => {
      try {
        product.name = WmProvider.encryptEmoji(product.name)
        product.description = WmProvider.encryptEmoji(product.description)
      } catch (error) {
        console.error('Não foi possível converter o emoji para texto, antes de salvar o produto.')
      }
      product.disponibility = typeof product.disponibility !== 'string' ? JSON.stringify(product.disponibility) : product.disponibility
    })

    this.addHook('afterFind', (product) => {
      product.toJSON()
      product.disponibility = JSON.parse(product.disponibility)
      Product.decryptEmojiProducts(product)
    })

    this.addHook('afterFetch', (products) => {
      products.forEach((product) => {
        product.toJSON()
        product.disponibility = JSON.parse(product.disponibility)
        Product.decryptEmojiProducts(product)
        // if(typeof product.disponibility.store === 'string') {
        //   product.disponibility.store = JSON.parse(product.disponibility.store)
        // }
      })
    })

    this.addHook('afterSave', (product) => {
      product.disponibility = JSON.parse(product.disponibility)
      Product.decryptEmojiProducts(product)
    })

    this.addHook('afterPaginate', (products) => {
      products.forEach((product) => {
        product.disponibility = JSON.parse(product.disponibility)
        Product.decryptEmojiProducts(product)
        try {
          product.disponibility.store = JSON.parse(product.disponibility.store)
        } catch (e) {
          e.messageT = 'Este erro foi esperado'
          // console.log(e)
        }
      })
    })
  }

  static decryptEmojiProducts(product) {
    product.name = WmProvider.decryptEmoji(product.name)
    product.description = WmProvider.decryptEmoji(product.description || '')
  }

  complements() {
    return this.belongsToMany('App/Models/Complement', 'productId', 'complementId', 'id', 'id').pivotTable('product_complements')
  }

  category() {
    return this.belongsTo('App/Models/Category', 'categoryId', 'id')
  }

  cartItens() {
    return this.hasMany('App/Models/CartIten', 'id', 'productId')
  }
}

module.exports = Product
