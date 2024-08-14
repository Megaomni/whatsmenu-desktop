'use strict'

/*
|--------------------------------------------------------------------------
| SetDisponibilitySeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Category = use('App/Models/Category')
const Product = use('App/Models/Product')
const Encryption = use('Encryption')

class SetDisponibilitySeeder {
  async run() {
    let page = 1,
      categories = {},
      products = {}

    // Alterando categorias
    console.log('Alterando categorias...')
    do {
      categories = await Category.query().paginate(page, 10000)
      for (let category of categories.rows) {
        let newWeek = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
        // console.log(category.options, category.name);
        for (let day of category.options.week) {
          // console.log(newWeek[day.name], day.name, category.name, category.id);
          newWeek[day.name].push({
            code: Encryption.encrypt(day).substring(0, 6),
            weekDay: day.id,
            open: day.time.from,
            close: day.time.to,
            active: day.active,
          })
        }
        // console.log(category.name, newWeek)
        category.options.week = newWeek
        category.options = category.options

        try {
          await category.save()
        } catch (error) {
          console.log(error)
        }
      }
      page++
    } while (page <= categories.pages.lastPage)

    page = 1

    /** */
    // Alterando produtos
    console.log('Alterando produtos...')
    do {
      products = await Product.query().paginate(page, 10000)
      for (let product of products.rows) {
        // product.disponibility.week = week
        let newWeek = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
        for (let day of product.disponibility.week) {
          // console.log(newWeek[day.name], day.name, product.name, product.id);
          newWeek[day.name].push({
            code: Encryption.encrypt(day).substring(0, 6),
            weekDay: day.id,
            open: day.time.from,
            close: day.time.to,
            active: day.active,
          })
        }

        product.disponibility.week = newWeek
        try {
          await product.save()
        } catch (error) {
          console.log(error)
        }
      }

      page++
    } while (page <= products.pages.lastPage)
  }
}

module.exports = SetDisponibilitySeeder
