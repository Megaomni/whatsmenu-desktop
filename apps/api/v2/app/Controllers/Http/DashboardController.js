'use strict'
const User = use('App/Models/ReadOnly/User')

const InventoryProvider = use('InventoryProvider')

class DashboardController {

  async index ({auth, view, response}) {
    try {
      console.log('Starting: ', { controller: 'DashboardController', linha: 8, metodo: 'index' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      if (profile) {
        return response.route('request.index')
      }else if (!profile && !user.controls.type) {
        return response.route('profileRegister')
      }

      if (user.controls.type) {
        return response.route('adm.user.index')
      } else {
        return view.render('inner.index', {
          profile: profile,
          user: user.toJSON()
        })
      }
    } catch (error) {
      throw(error)
    }
  }

  async checkLowInventory({auth, request, response}) {
    const user = await User.find(auth.user.id)
    const profile = await user.profile().fetch()
    try {
      return response.json(await InventoryProvider.identifyLowInventory(profile.id))
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = DashboardController
