'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Domain extends Model {
  profile() {
    return this.belongsTo('App/Models/Profile', 'profileId', 'id')
  }
}

module.exports = Domain
