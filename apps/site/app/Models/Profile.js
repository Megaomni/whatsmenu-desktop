'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Profile extends Model {
  static boot() {
    super.boot()

    this.addHook('afterFind', (profile) => {
      profile.taxDelivery = JSON.parse(profile.taxDelivery)
      profile.address = JSON.parse(profile.address)
      profile.week = JSON.parse(profile.week)
      profile.options = JSON.parse(profile.options)
    })

    this.addHook('afterFetch', (profiles) => {
      profiles.forEach(profile => {
        profile.taxDelivery = JSON.parse(profile.taxDelivery)
        profile.address = JSON.parse(profile.address)
        profile.week = JSON.parse(profile.week)
        profile.options = JSON.parse(profile.options)
      });
    })

    this.addHook('afterPaginate', (profiles) => {
      profiles.forEach(profile => {
        profile.taxDelivery = JSON.parse(profile.taxDelivery)
        profile.address = JSON.parse(profile.address)
        profile.week = JSON.parse(profile.week)
        profile.options = JSON.parse(profile.options)
      });
    })

  }

  categories() {
    return this.hasMany('App/Models/Category', 'id', 'profileId')
  }

  domains() {
    return this.hasMany('App/Models/Domain', 'id', 'profileId')
  }

  tables() {
    return this.hasMany('App/Models/Table', 'id', 'profileId')
  }

  user() {
    return this.belongsTo('App/Models/User', 'userId', 'id')
  }

}

module.exports = Profile
