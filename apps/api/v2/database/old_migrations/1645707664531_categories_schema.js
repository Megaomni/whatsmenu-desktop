'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Categories = use('App/Models/Category')
const Database = use('Database')

class CategoriesSchema extends Schema {
  async up() {
    let alterTable = false

    await this.table('categories', (table) => {
      table.renameColumn('disponibility', 'disponibility3')
      table.json('disponibility2').after('type')
    })

    await this.schedule(async (trx) => {
      let page = 1
      let categories = {}

      let i = 1

      do {
        categories = await Categories.query().paginate(page, 1000)
        categories.rows.forEach((elRow, index) => {
          let disponibility = elRow.disponibility3

          try {
            disponibility = JSON.parse(disponibility)
          } catch (e) {
            index === 1 && console.log(`Não foi possivel converter o objeto (i = ${index}), isso era esperado!!!`)
          }

          if (typeof disponibility === 'string') {
            alterTable = true
            const dispStore = {
              store: {
                delivery: true,
                table: true,
                package: true,
              },
            }

            switch (disponibility) {
              case 'all':
                dispStore.store.delivery = true
                dispStore.store.table = true
                dispStore.store.package = true
                break
              case 'full':
                dispStore.store.delivery = true
                dispStore.store.table = true
                dispStore.store.package = true
                break
              case 'delivery':
                dispStore.store.delivery = true
                dispStore.store.table = false
                dispStore.store.package = false
                break
              case 'table':
                dispStore.store.delivery = false
                dispStore.store.table = true
                dispStore.store.package = false
                break
            }
            elRow.disponibility2 = JSON.stringify(dispStore)
            elRow.save()
          }
        })

        page++
      } while (page <= categories.pages.lastPage)

      if (alterTable) {
        this.table('categories', (table) => {
          table.dropColumn('disponibility3')
          table.renameColumn('disponibility2', 'disponibility')
        })
      } else {
        this.table('categories', (table) => {
          table.dropColumn('disponibility2')
          table.renameColumn('disponibility3', 'disponibility')
        })
      }
    })
  }

  async down() {
    await this.table('categories', async (table) => {
      table.renameColumn('disponibility', 'disponibility3')
      table.enum('disponibility2', ['all', 'delivery', 'table']).after('type').defaultTo('all').notNullable()
    })

    await this.schedule(async (trx) => {
      let page = 1
      let categories = {}

      do {
        categories = await Categories.query().paginate(page, 1000)
        for (let elRow of categories.rows) {
          const { delivery, table } = JSON.parse(elRow.disponibility3).store

          if (delivery && !table) {
            elRow.disponibility2 = 'delivery'
          } else if (table && !delivery) {
            elRow.disponibility2 = 'table'
          } else {
            elRow.disponibility2 = 'all'
          }

          elRow.save()
        }

        page++
      } while (page <= categories.pages.lastPage)
    })

    this.table('categories', (table) => {
      table.dropColumn('disponibility3')
      table.renameColumn('disponibility2', 'disponibility')
    })
  }
}

module.exports = CategoriesSchema
