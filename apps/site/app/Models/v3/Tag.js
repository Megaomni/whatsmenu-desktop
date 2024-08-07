'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Tag extends Model {

  static get connection() {
    return 'mysql_v3'
  }
  static boot () {
    super.boot()
    this.addHook('beforeCreate', tag => {
      tag.controls = '{}'
    })
    this.addHook('afterFetch', tags => {
      tags.forEach(tag => {
        tag.controls = JSON.parse(tag.controls)
      });
    })
  }

  profiles() {
    return this.belongsToMany('App/Models/v3/Profile', 'tagId', 'profileId', 'id', 'id').pivotTable('profile_tags')
  }
}

module.exports = Tag
