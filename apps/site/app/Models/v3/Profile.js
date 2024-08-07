'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Profile extends Model {
  static get connection() {
    return 'mysql_v3'
  }

  static boot() {
    super.boot()

    this.addHook('afterFind', (profile) => {
      profile.taxDelivery = JSON.parse(profile.taxDelivery)
      profile.address = JSON.parse(profile.address)
      profile.week = JSON.parse(profile.week)
      profile.options = JSON.parse(profile.options)
      if (typeof profile.options === 'string') {
        profile.options = JSON.parse(profile.options)
      }
      profile.options.migrated_at = '1988-04-05 11:05:00'
    })

    this.addHook('afterFetch', (profiles) => {
      profiles.forEach(profile => {
        profile.taxDelivery = JSON.parse(profile.taxDelivery)
        profile.address = JSON.parse(profile.address)
        profile.week = JSON.parse(profile.week)
        profile.options = JSON.parse(profile.options)
        if (typeof profile.options === 'string') {
          profile.options = JSON.parse(profile.options)
        }
        profile.options.migrated_at = '1988-04-05 11:05:00'
      });
    })

    this.addHook('afterPaginate', (profiles) => {
      profiles.forEach(profile => {
        profile.taxDelivery = JSON.parse(profile.taxDelivery)
        profile.address = JSON.parse(profile.address)
        profile.week = JSON.parse(profile.week)
        profile.options = JSON.parse(profile.options)
        if (typeof profile.options === 'string') {
          profile.options = JSON.parse(profile.options)
        }
        profile.options.migrated_at = '1988-04-05 11:05:00'
      });
    })

  }

  categories() {
    return this.hasMany('App/Models/v3/Category', 'id', 'profileId')
  }

  domains() {
    return this.hasMany('App/Models/v3/Domain', 'id', 'profileId')
  }

  tables() {
    return this.hasMany('App/Models/v3/Table', 'id', 'profileId')
  }

  user() {
    return this.belongsTo('App/Models/v3/User', 'userId', 'id')
  }
  cupons() {
    return this.hasMany('App/Models/v3/Cupom', 'id', 'profileId')
  }

  tags() {
    return this.belongsToMany('App/Models/v3/Tag', 'profileId', 'tagId', 'id', 'id').pivotTable('profile_tags')
  }

}

module.exports = Profile
