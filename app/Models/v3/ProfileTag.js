'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ProfileTag extends Model {
  static get connection() {
    return 'mysql_v3'
  }
}

module.exports = ProfileTag
