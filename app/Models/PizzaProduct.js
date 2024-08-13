'use strict'

const WmProvider = use('WmProvider')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PizzaProduct extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeCreate', (pizza) => {
      pizza.sizes = JSON.stringify([])
      pizza.flavors = JSON.stringify([])
      pizza.implementations = JSON.stringify([])
    })

    this.addHook('beforeUpdate', (pizza) => {
      if (pizza.sizes) pizza.sizes = JSON.stringify(pizza.sizes)
      if (pizza.flavors) pizza.flavors = JSON.stringify(pizza.flavors)
      if (pizza.implementations) pizza.implementations = JSON.stringify(pizza.implementations)
      if (pizza.disponibility) pizza.disponibility = JSON.stringify(pizza.disponibility)
    })

    this.addHook('beforeSave', (pizza) => {
      try {
        if (WmProvider.verifyEmojiOnString(pizza.flavors)) {
          pizza.flavors = WmProvider.encryptEmoji(pizza.flavors)
        }

        if (WmProvider.verifyEmojiOnString(pizza.implementations)) {
          pizza.implementations = WmProvider.encryptEmoji(pizza.implementations)
        }
      } catch (error) {
        console.error('Não foi possível converter os emoji para texto, antes de salvar a pizza product')
      }
    })

    this.addHook('afterFind', (pizza) => {
      PizzaProduct.pizzaProductDecryptEmoji(pizza)
      PizzaProduct.jsonAddDefaultStorageValues(pizza, 'flavors')
    })

    this.addHook('afterSave', (pizza) => {
      PizzaProduct.pizzaProductDecryptEmoji(pizza)
    })

    this.addHook('afterFetch', (pizzas) => {
      pizzas.forEach((pizza) => {
        PizzaProduct.pizzaProductDecryptEmoji(pizza)
        PizzaProduct.jsonAddDefaultStorageValues(pizza, 'flavors')
      })
    })

    this.addHook('afterPaginate', (pizzas) => {
      pizzas.forEach((pizza) => {
        PizzaProduct.pizzaProductDecryptEmoji(pizza)
        pizza.disponibility = pizza.disponibility && JSON.parse(pizza.disponibility)
        PizzaProduct.jsonAddDefaultStorageValues(pizza, 'flavors')
      })
    })
  }

  static jsonAddDefaultStorageValues(item, property) {
    item[property].forEach((value) => {
      value.amount = value.amount === undefined ? 0 : value.amount
      value.amount_alert = value.amount_alert === undefined ? 0 : value.amount_alert
      value.bypass_amount = value.bypass_amount === undefined ? true : value.bypass_amount
    })
  }

  static pizzaProductDecryptEmoji(pizza, type = 'decrypt') {
    pizza.sizes = pizza.sizes && JSON.parse(pizza.sizes)
    pizza.flavors = pizza.flavors && JSON.parse(pizza.flavors)
    pizza.implementations = pizza.implementations && JSON.parse(pizza.implementations)

    pizza.flavors.forEach((fl) => {
      fl.name = WmProvider.decryptEmoji(fl.name)
      fl.description = WmProvider.decryptEmoji(fl.description)
    })

    pizza.implementations.forEach((impl) => {
      impl.name = WmProvider.decryptEmoji(impl.name)
    })
  }

  async updateValues() {
    this.flavors.forEach((flavor) => {
      Object.keys(flavor.valuesTable).forEach((valueKey) => {
        const haveSize = this.sizes.some((size) => size.name === valueKey)
        if (!haveSize) {
          delete flavor.valuesTable[valueKey]
        }
      })
      Object.keys(flavor.values).forEach((valueKey) => {
        const haveSize = this.sizes.some((size) => size.name === valueKey)
        if (!haveSize) {
          delete flavor.valuesTable[valueKey]
        }
      })
    })
    this.save()
  }

  category() {
    return this.belongsTo('App/Models/Category', 'categoryId', 'id')
  }

  complements() {
    return this.belongsToMany('App/Models/Complement', 'pizzaId', 'complementId', 'id', 'id').pivotTable('pizza_complements')
  }

  cartItens() {
    return this.hasMany('App/Models/CartIten', 'id', 'pizzaId')
  }
}

module.exports = PizzaProduct
