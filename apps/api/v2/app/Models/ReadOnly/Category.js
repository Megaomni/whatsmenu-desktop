'use strict'

/** @type {typeof import('App/Models/ReadOnly/PizzaProduct')} */
const PizzaProduct = use('App/Models/ReadOnly/PizzaProduct')
const WmProvider = use('WmProvider')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
class Category extends Model {
  static get connection() {
    return 'mysql_r'
  }

  static boot() {
    super.boot()

    this.addHook('beforeCreate', (category) => {
      category = category.toJSON()
      this.parseCategory(category)
    })

    this.addHook('afterCreate', async (category) => {
      try {
        category.name = WmProvider.decryptEmoji(category.name)
        if (category.type === 'pizza') {
          await PizzaProduct.create({
            categoryId: category.id,
          })
        }
      } catch (error) {
        console.error(error)
      }
    })

    this.addHook('afterUpdate', (category) => {
      category.name = WmProvider.decryptEmoji(category.name)
      this.parseCategory(category)
    })

    this.addHook('afterDelete', async (category) => {
      const categories = await Category.query().where('profileId', category.profileId).fetch()

      categories.rows.sort((catA, catB) => catA.order - catB.order)
      for (let indexCat in categories.rows) {
        const cat = categories.rows[indexCat]
        cat.order = indexCat
        await cat.save()
      }
    })

    this.addHook('beforeSave', (category) => {
      try {
        category.name = WmProvider.encryptEmoji(category.name)
      } catch (error) {
        console.error('Não foi possivel converter o emoji para texto, antes de salvar a categoria')
      }
      this.stringifyCategory(category)
    })

    this.addHook('afterSave', (category) => {
      category.name = WmProvider.decryptEmoji(category.name)
      this.parseCategory(category)
    })

    this.addHook('afterFind', (category) => {
      category.name = WmProvider.decryptEmoji(category.name)
      this.parseCategory(category)
    })

    this.addHook('afterFetch', (categories) => {
      categories.forEach((category) => {
        category.name = WmProvider.decryptEmoji(category.name)
        this.parseCategory(category)
      })
    })

    this.addHook('afterPaginate', (categories) => {
      if (categories) {
        categories.forEach((category) => {
          category.name = WmProvider.decryptEmoji(category.name)
          this.parseCategory(category)
        })
      }
    })
  }

  static parseCategory(category) {
    if (typeof category.options === 'string') {
      category.options = JSON.parse(category.options)
    }

    if (typeof category.disponibility === 'string') {
      category.disponibility = JSON.parse(category.disponibility)
    }

    const week = Object.entries(category.options.week)
    week.forEach((day) => {
      day[1].forEach((hour) => {
        if (hour.active && typeof hour.active === 'string') {
          hour.active = JSON.parse(hour.active)
        }
        hour.weekDay = parseInt(hour.weekDay)
      })
    })

    for (let [key, value] of Object.entries(category.disponibility.store)) {
      category.disponibility.store[key] = JSON.parse(value)
    }

    category.id = Number(category.id)
    category.order = Number(category.order)
    category.profileId = Number(category.profileId)
    category.status = JSON.parse(category.status)
  }

  static stringifyCategory(category) {
    if (typeof category.options !== 'string') {
      category.options = JSON.stringify(category.options)
    }

    if (typeof category.disponibility !== 'string') {
      category.disponibility = JSON.stringify(category.disponibility)
    }
  }

  products() {
    return this.hasMany('App/Models/ReadOnly/Product', 'id', 'categoryId').where('deleted_at', null)
  }

  allProducts() {
    return this.hasMany('App/Models/ReadOnly/Product', 'id', 'categoryId')
  }

  product() {
    // pizzaProduct
    return this.hasOne('App/Models/ReadOnly/PizzaProduct', 'id', 'categoryId')
  }
}

module.exports = Category
