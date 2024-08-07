'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Table extends Model {
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
