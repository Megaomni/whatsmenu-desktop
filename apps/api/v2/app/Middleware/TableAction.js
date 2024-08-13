'use strict'

const Table = use('App/Models/Table')
const Command = use('App/Models/Command')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class TableAction {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response }, next, props) {
    try {
      const data = request.except(['_csrf'])
      const table = await Table.query()
        .where('id', data.id || data.tableId || request.params.id)
        .with('tablesOpened', (query) => {
          return query.from('table_openeds').where('status', 1).with('commands.carts')
        })
        .first()

      const tableJSON = table.toJSON()

      if (!props.length) {
        return next()
      } else {
        for (const prop of props) {
          console.log('Middlewere:TableAction:', prop)
          switch (prop) {
            case 'status':
              if (tableJSON.status && tableJSON.tablesOpened.length) {
                return response.status(403).json({
                  table,
                  message: 'Não é possivel realizar alterações em mesas com comandas abertas.',
                })
              }
              return next()
            default:
              return next()
          }
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = TableAction
