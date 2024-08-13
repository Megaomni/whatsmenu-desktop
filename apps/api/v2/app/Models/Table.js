'use strict'

const WmProvider = use('WmProvider')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Table extends Model {

  static boot() {
    super.boot()

    this.addHook('beforeCreate', (table) => {
      table.status = 1
    })

    this.addHook('beforeSave', (table) => {
      table.status = !!table.status
      if (table.deleted_at) {
        table.status = 0
      }
    })

    this.addHook('afterFetch', (tables) => {
      tables.forEach(table => {
        table.name = WmProvider.decryptEmoji(table.name);
        if (table.deleted_at !== null) {
          table.status = 0
        }
      });
    })

    this.addHook('afterFind', (table) => {
      table.name = WmProvider.decryptEmoji(table.name);
      if (table.deleted_at !== null) {
        table.status = 0
      }

    })

    this.addHook('afterPaginate', (table) => {
      table.name = WmProvider.decryptEmoji(table.name);
    })

    this.addHook('afterSave', (table) => {
      table.name = WmProvider.decryptEmoji(table.name);
    })

  }

  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }

  tablesOpened() {
    return this.hasMany('App/Models/TableOpened', 'id', 'tableId')
  }

  opened() {
    return this.hasOne('App/Models/TableOpened', 'id', 'tableId').where('status', 1)
  }
}

module.exports = Table
