'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })

    this.addHook('afterFind', async (user) => {
      user.controls = JSON.parse(user.controls)
    })

    this.addHook('afterFetch', async (users) => {
      users.forEach(user => {
        user.controls = JSON.parse(user.controls)
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
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  plans() {
    return this.belongsToMany('App/Models/FlexPlan', 'userId', 'flexPlanId', 'id', 'id').pivotTable('user_plans')
  }

}

module.exports = User
