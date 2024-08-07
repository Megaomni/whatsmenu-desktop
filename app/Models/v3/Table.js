'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Table extends Model {
  static get connection() {
    return 'mysql_v3'
  }
  
  profile() {
    return this.belongsTo('App/Models/v3/Profile', 'profileId', 'id')
  }

  tablesOpened() {
    return this.hasMany('App/Models/v3/TableOpened', 'id', 'tableId')
  }

  opened() {
    return this.hasOne('App/Models/v3/TableOpened', 'id', 'tableId').where('status', 1)
  }
}

module.exports = Table
