'use strict'

const WmProvider = use('WmProvider')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Complement extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeSave', async (complement) => {
      if (Array.isArray(complement.itens)) {
        complement.itens.forEach((item, index) => {
          item.name = WmProvider.encryptEmoji(item.name)
          item.description = WmProvider.encryptEmoji(item.description)
          if (!item) {
            complement.itens.splice(index, 1)
          } else {
            if (item.bypass_amount === undefined) {
              item.bypass_amount = true
            }
            if (!item.amount) {
              item.amount = 0
            }
          }
        })
      }

      if (!complement.min) {
        complement.min = 0
      }

      if (!complement.max) {
        complement.max = 0
      }

      if (complement.dirty.itens) {
        complement.itens = JSON.stringify(complement.itens)
      }
    })

    this.addHook('afterSave', async (complement) => {
      complement.itens = JSON.parse(complement.itens)
      complement.itens.forEach((item) => {
        item.name = WmProvider.decryptEmoji(item.name)
        item.description = WmProvider.decryptEmoji(item.description)
      })
    })

    this.addHook('afterFind', async (complement) => {
      complement.itens = JSON.parse(complement.itens)
      complement.itens.forEach((item) => {
        item.name = WmProvider.decryptEmoji(item.name)
        item.description = WmProvider.decryptEmoji(item.description)
        if (item.bypass_amount === undefined) {
          item.bypass_amount = true
        }
        if (!item.amount) {
          item.amount = 0
        }
      })
    })

    this.addHook('afterFetch', async (complements) => {
      complements.forEach((complement) => {
        complement.itens = JSON.parse(complement.itens)
        complement.itens.forEach((item) => {
          item.name = WmProvider.decryptEmoji(item.name)
          item.description = WmProvider.decryptEmoji(item.description)
          if (item.bypass_amount === undefined) {
            item.bypass_amount = true
          }
          if (!item.amount) {
            item.amount = 0
          }
        })
      })
    })

    this.addHook('afterPaginate', async (complements) => {
      complements.forEach((complement) => {
        complement.itens = JSON.parse(complement.itens)
        complement.itens.forEach((item) => {
          item.name = WmProvider.decryptEmoji(item.name)
          item.description = WmProvider.decryptEmoji(item.description)
          if (item.bypass_amount === undefined) {
            item.bypass_amount = true
          }
          if (!item.amount) {
            item.amount = 0
          }
        })
      })
    })
  }
  products() {
    return this.belongsToMany('App/Models/Product', 'complementId', 'productId', 'id', 'id').pivotTable('product_complements')
  }
}

module.exports = Complement
