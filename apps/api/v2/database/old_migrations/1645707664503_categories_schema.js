'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Categories = use('App/Models/Category')
const Database = use('Database')

class CategoriesSchema extends Schema {
  async up() {
    await this.table('categories', table => {
      table.renameColumn('disponibility', 'disponibility3')
      table.json('disponibility2').after('type')
    })

    await this.schedule(async trx => {
      let page = 1;
      let categories = {}
      let i = 1;

      do {
        categories = await Categories.query().paginate(page, 1000)
        for (let category of categories.rows) {
          const disponibility = category.disponibility3
          const dispStore = {
            store: {
              delivery: false,
              table: false,
              package: false
            }
          }

          switch (disponibility) {
            case 'all':
              dispStore.store.delivery = true
              dispStore.store.table = true
              dispStore.store.package = true
              break;
            case 'full':
              dispStore.store.delivery = true
              dispStore.store.table = true
              dispStore.store.package = true
              break;
            case 'delivery':
              dispStore.store.delivery = true
              dispStore.store.table = false
              dispStore.store.package = false
              break;
            case 'table':
              dispStore.store.delivery = false
              dispStore.store.table = true
              dispStore.store.package = false
              break;
          }

          if (category.type !== 'default') {
            dispStore.store.package = false
          }

          category.disponibility2 = JSON.stringify(dispStore)
          category.save()
        }

        page++
      } while (page <= categories.pages.lastPage)


    })

    this.table('categories', table => {
      table.dropColumn('disponibility3')
      table.renameColumn('disponibility2', 'disponibility')
    })

  }

  async down() {

    await this.table('categories', async table => {
      table.renameColumn('disponibility', 'disponibility3')
      table.enum('disponibility2', ['all', 'delivery', 'table']).after('type').defaultTo('all').notNullable()
    })

    await this.schedule(async trx => {
      let page = 1;
      let categories = {}

      do {
        categories = await Categories.query().paginate(page, 1000)
        for (let category of categories.rows) {
          const { delivery, table } = JSON.parse(category.disponibility3).store

          if (delivery && !table) {
            category.disponibility2 = 'delivery'
          } else if (table && !delivery) {
            category.disponibility2 = 'table'
          } else {
            category.disponibility2 = 'all'
          }

          category.save()
        }

        page++
      } while (page <= categories.pages.lastPage)

    })

    this.table('categories', table => {
      table.dropColumn('disponibility3')
      table.renameColumn('disponibility2', 'disponibility')
    })

  }

}

module.exports = CategoriesSchema
