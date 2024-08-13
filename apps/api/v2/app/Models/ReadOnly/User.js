'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

const QueueController = use('App/Controllers/Http/QueueController')

class User extends Model {
  static get connection() {
    return 'mysql_r'
  }
  static boot() {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      userInstance.controls.attempts = userInstance.controls.attempts ? userInstance.controls.attempts : 0
      userInstance.controls = JSON.stringify(userInstance.controls)
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
      if (userInstance.dirty.security_key) {
        userInstance.security_key = await Hash.make(userInstance.security_key)
      }
    })

    this.addHook('afterCreate', async (user) => {
      user.controls = JSON.parse(user.controls)
      user.controls.attempts = 0
      // if (user.controls.disableInvoice && !user.controls.type) {
      //   await QueueController.setClientSupport(user.id)
      // }
    })

    this.addHook('afterFind', async (user) => {
      user.controls = JSON.parse(user.controls)
      user.controls.attempts = user.controls.attempts ? user.controls.attempts : 0
    })

    this.addHook('afterSave', async (user) => {
      if (typeof user.controls === 'string') {
        user.controls = JSON.parse(user.controls)
        user.controls.attempts = user.controls.attempts ? user.controls.attempts : 0
      }
    })

    this.addHook('afterFetch', async (users) => {
      users.forEach((user) => {
        user.controls = JSON.parse(user.controls)
        user.controls.attempts = user.controls.attempts ? user.controls.attempts : 0
      })
    })

    this.addHook('afterPaginate', async (users) => {
      users.forEach((user) => {
        user.controls = JSON.parse(user.controls)
        user.controls.attempts = user.controls.attempts ? user.controls.attempts : 0
      })
    })
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens() {
    return this.hasMany('App/Models/ReadOnly/Token')
  }

  profile() {
    return this.hasOne('App/Models/ReadOnly/Profile', 'id', 'userId')
  }

  profiles() {
    return this.hasMany('App/Models/ReadOnly/Profile', 'id', 'userId')
  }

  profileAll() {
    return this.hasMany('App/Models/ReadOnly/Profile', 'id', 'userId')
  }

  plan() {
    return this.belongsTo('App/Models/ReadOnly/Plan', 'planId', 'id')
  }

  seller() {
    return this.belongsTo('App/Models/ReadOnly/Seller', 'sellerId', 'id')
  }

  requests() {
    return this.hasMany('App/Models/ReadOnly/SystemRequest', 'id', 'userId')
  }

  support() {
    return this.hasOne('App/Models/ReadOnly/User', 'supportId', 'id')
  }

  bonusSupport() {
    return this.hasOne('App/Models/ReadOnly/BonusSupport', 'id', 'userId')
  }

  plans() {
    return this.belongsToMany('App/Models/ReadOnly/FlexPlan', 'userId', 'flexPlanId', 'id', 'id').pivotTable('user_plans')
  }

  invoices() {
    return this.hasMany('App/Models/ReadOnly/Invoice', 'id', 'userId')
  }
}

module.exports = User
