'use strict'

const { updateLocale } = require('moment')

const User = use('App/Models/User')
const UserPlan = use('App/Models/UserPlan')
const moment = require('moment')

class SettingsController {
  async index({ response, view, auth }) {
    console.log('Starting: ', { controller: 'SettingsController', linha: 9, metodo: 'index' })
    const user = await User.find(auth.user.id)
    const profile = await user.profile().fetch()
    const sysreq = await user.requests().where('status', 'pending').last()
    const prof = profile.toJSON()

    return response.send(
      view.render('inner.settings.index', {
        profile: prof,
        systemRequest: sysreq ? sysreq.toJSON() : null,
      })
    )
  }

  // async package({ response, view, auth }) {
  //   console.log('Starting: ', { controller: 'SettingsController', linha: 23, metodo: 'package' })
  //   const user = await User.find(auth.user.id)
  //   // const userPlans = await UserPlan.query().where('userId', user.id).fetch()
  //   const profile = await user.profile().fetch()
  //   const sysreq = await user.requests().where('status', 'pending').last()

  //   // const now = moment([])
  //   // const oldDates = []
  //   // const specialsDates = profile.options.package.specialsDates.filter(datas => {
  //   //   const dateSpecial = moment(new Date(datas)).set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
  //   //   now.set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
  //   //   const diff = dateSpecial.diff(now, 'days')

  //   //   if (diff >= 0) {
  //   //     return datas
  //   //   } else {
  //   //     oldDates.push(datas)
  //   //   }
  //   // })

  //   // if (oldDates.length) {
  //   //   profile.options.package.specialsDates = specialsDates
  //   //   await profile.save()
  //   // }

  //   return response.send(profile.JSON())
  // }

  async basicConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 25, metodo: 'basicConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}

      update.options = profile.options

      if (data.deliveryLocal) update.deliveryLocal = data.deliveryLocal == 1 ? true : false
      if (update.deliveryLocal === undefined) update.deliveryLocal = profile.deliveryLocal
      if (data.disableDelivery) update.options.delivery.disableDelivery = JSON.parse(data.disableDelivery)

      if (data.package) {
        if (!data.package.maxPackage) {
          data.package.maxPackage = 30
        }

        if (!data.package.specialsDates) {
          data.package.specialsDates = []
        }

        data.package.minValue = isNaN(data.package.minValue) ? (data.package.minValue = 0) : data.package.minValue
        data.package.minValue = isNaN(data.package.minValueLocal) ? (data.package.minValueLocal = 0) : data.package.minValue
        update.options.package = data.package
      }

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async generalBasicSettings({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 98, metodo: 'generalBasicSettings' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      if (data.options) {
        if (!data.options.package.maxPackage) {
          data.package.maxPackage = 30
        }

        if (!data.options.package.specialsDates) {
          data.package.specialsDates = []
        }

        data.options.package.minValue = data.options.package.minValue ? parseFloat(data.options.package.minValue) : 0
        data.options.package.minValueLocal = data.options.package.minValueLocal ? parseFloat(data.options.package.minValueLocal) : 0
        profile.options.package = data.options.package
      }

      profile.merge(data)
      await profile.save()

      return response.json(profile)
    } catch (e) {
      console.error(e)
    }
  }

  async textConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 128, metodo: 'textConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}

      update.options = profile.options

      if (data.options.placeholders.productObs) update.options.placeholders.productObs = data.options.placeholders.productObs // .split('\r').join('\\r').split('\n').join('\\n')
      if (data.options.placeholders.pizzaObs) update.options.placeholders.pizzaObs = data.options.placeholders.pizzaObs // .split('\r').join('\\r').split('\n').join('\\n')
      if (data.options.placeholders.statusProduction) update.options.placeholders.statusProduction = data.options.placeholders.statusProduction // .split('\r').join('\\r').split('\n').join('\\n')
      if (data.options.placeholders.statusSend) update.options.placeholders.statusSend = data.options.placeholders.statusSend // .split('\r').join('\\r').split('\n').join('\\n')
      if (data.options.placeholders.statusToRemove) update.options.placeholders.statusToRemove = data.options.placeholders.statusToRemove // .split('\r').join('\\r').split('\n').join('\\n')

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async printConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 154, metodo: 'printConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}
      update.options = profile.options

      if (data.width) update.options.print.width = data.width
      if (data.copies) update.options.print.copies = parseInt(data.copies)
      if (data.textOnly) update.options.print.textOnly = JSON.parse(data.textOnly)
      if (data.active) update.options.print.active = JSON.parse(data.active)
      if (data.groupItems) update.options.print.groupItems = JSON.parse(data.groupItems)

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async pizzaConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 179, metodo: 'pizzaConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}
      update.options = profile.options
      update.options.pizza.higherValue = JSON.parse(data.higherValue)

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async disponibilityConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 199, metodo: 'disponibilityConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      console.log(data)

      const update = {}
      update.options = profile.options
      update.options.disponibility.showProductsWhenPaused = JSON.parse(data.showProductsWhenPaused)

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async whatsConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 220, metodo: 'whatsConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}
      update.options = profile.options
      update.options.linkWhatsapp = JSON.parse(data.whatsappWeb)

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async facebookConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 241, metodo: 'facebookConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}
      update.options = profile.options

      if (!update.options.tracking) {
        update.options.tracking = {}
      }

      update.options.tracking.pixel = data.tracking.pixel

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async googleConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 267, metodo: 'facebookConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}
      update.options = profile.options

      if (!update.options.tracking) {
        update.options.tracking = {}
      }

      update.options.tracking.google = data.tracking.google

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async tableConfigUpdate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'SettingsController', linha: 293, metodo: 'tableConfigUpdate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      profile.options.table = data.table

      await profile.save()

      return response.json(profile.options.table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = SettingsController
