'use strict'
const Hash = use('Hash')
const Mail = use('Mail')
const User = use('App/Models/User')

const { DateTime } = require("luxon")

class AccountController {

  async recovery({ response, auth, request }) {
    console.log('Starting: ', { controller: 'AccountController', linha: 10, metodo: 'index' })
    const user = await auth.getUser()

    let expired = true
    const token = request.qs.token && request.qs.token.replace(/( )+/g, '+')

    if (user.controls.recovery && user.controls.recovery.token) {

      const expirationDate = DateTime.fromISO(user.controls.recovery.date).plus({ minutes: 10 })
      const now = DateTime.local()

      if (token === user.controls.recovery.token && expirationDate >= now) {
        expired = false
      }
    } else {
      response.status(403)
    }

    return response.json({
      expired,
      token,
    })
  }

  async saveSecurityKey({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AccountController', linha: 53, metodo: 'saveSecurityKey' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const update = {}

      if (!data.security_key || data.security_key !== data.security_key_confirm) return response.status(403)

      update.security_key = data.security_key
      if (user.controls.recovery) {
        user.controls.recovery.token = null
      }

      user.merge(update)

      user.controls.recovery = {}

      await user.save()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateSecurityKey({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AccountController', linha: 76, metodo: 'updateSecurityKey' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const userJSON = user.toJSON()
      const update = {}

      const isSame = await Hash.verify(data.old_security_key, userJSON.security_key)

      if (isSame || data.recovery) {
        update.security_key = data.security_key
      } else {
        if (!data.security_key || data.old_security_key !== user.security_key) return response.status(403)
        update.security_key = data.security_key
      }

      user.merge(update)
      await user.save()
      return response.json(user)
    } catch (error) {
      response.status(500)
      console.error(error)
      throw error
    }
  }

  async resetSecurityKey({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AccountController', linha: 103, metodo: 'resetSecurityKey' })
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)

      user.security_key = null
      await user.save()

      user.merge()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async recoverySecurityPassword({ response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AccountController', linha: 119, metodo: 'recoverySecurityPassword' })
      const user = await auth.getUser()

      if (!user) {
        return response.status(403).send('Por favor verifique se o email está correto')
      }

      if (!user.controls.recovery) {
        user.controls.recovery = {}
      }

      const tokenValid = user.controls.recovery.token ? Number(DateTime.fromISO(user.controls.recovery.date).plus({ minutes: 10 }).diffNow().toFormat('mm')) >= 0 : false

      if (!tokenValid) {
        user.controls.recovery = {
          token: await Hash.make(JSON.stringify(user.id)),
          date: DateTime.local().toISO()
        }

        await Mail.send('email.passwords.recoverysecuritypassword', { user: user.toJSON() }, message => {
          message
            .from('whatsmenu@grovecompany.com.br')
            .to(user.email)
            .subject('"Recuperação de Senha | WhatsMenu"')
        })
      }

      await user.save()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async forceChangePassword({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AccountController', linha: 103, metodo: 'resetSecurityKey' })
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)

      user.controls.forceChangePassword = DateTime.local().toISO()
      await user.save()

      user.merge()
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = AccountController
