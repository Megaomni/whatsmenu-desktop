'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Domain extends Model {
  static get connection() {
    return 'mysql_r'
  }

  profile() {
    return this.belongsTo('App/Models/ReadOnly/Profile', 'profileId', 'id')
  }
}

module.exports = Domain
