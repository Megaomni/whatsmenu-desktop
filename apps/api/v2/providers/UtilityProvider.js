'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const moment = require('moment')
const { DateTime } = use('luxon')

class UtilityProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register() {
    this.app.singleton('Utility', () => {
      return {
        ControlAccess: async (user) => {
          try {
            const user_plans = await user.plans().whereIn('category', ['basic', 'package']).fetch()
            return user_plans.rows.length > 0 ? true : false
          } catch (error) {
            console.error(error)
            throw error
          }
        },
      }
    })
    //
  }

  /**
   * Attach context getter when all providers have
   * been registered
   *
   * @method boot
   *
   * @return {void}
   */
  boot() {
    const View = this.app.use('Adonis/Src/View')
    const Env = this.app.use('Adonis/Src/Env')
    // const SystemRequest = this.app.use('App/Models/SystemRequest')
    // const PaymentController = this.app.use('App/Controllers/Http/PaymentController')

    View.global('formatCurrency', (number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
    })

    View.global('isArray', (obj) => {
      return Array.isArray(obj)
    })

    View.global('formatCurrencyCents', (number = '0000') => {
      const num = `${number.substring(0, number.length - 2)}.${number.substring(number.length, 2)}`
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
    })

    View.global('parseFloatFixed', (num) => {
      return parseFloat(num).toFixed(2)
    })

    View.global('stringify', (object) => {
      return JSON.stringify(object)
    })

    View.global('stringify2', (object) => {
      return JSON.stringify(object).split('"').join('\\"')
    })

    View.global('encodeURI', (text) => {
      return encodeURI(text)
    })

    View.global('replace', (text, find, repl) => {
      return text.split(find).join(repl)
    })

    View.global('showMessage', () => {
      return JSON.parse(Env.get('SHOW_MESSAGE', false))
    })

    View.global('isProduction', () => {
      return Env.get('NODE_ENV', false) === 'production'
    })

    View.global('deliveryAccess', () => {
      return false
    })

    View.global('tableAccess', () => {
      return false
    })

    View.global('scheduleAccess', () => {
      return false
    })

    View.global('hash', (length = 6) => {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
    })

    View.global('generateIdCategory', (categoryName) => {
      return categoryName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f \ ]/g, '')
        .replace(/[^a-z0-9]/gi, '')
    })

    View.global('dateFormat', (date) => {
      return moment(date).format('DD/MM/YYYY')
    })

    View.global('dateHourFormat', (date) => {
      return moment(date).format('DD/MM/YYYY HH:mm:SS')
    })

    View.global('now', () => {
      return moment().format()
    })

    View.global('nextDate', (profile) => {
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const tomorrow = DateTime.local().plus({ days: 1 }).toFormat('cccc').toLowerCase()

      const indexOfDay = weekDays.findIndex((item, index) => item === tomorrow)

      let nextOpen = null

      for (let item of weekDays.filter((item, index) => index >= indexOfDay)) {
        if (profile.week[item].length > 0) {
          let x = 1
          while (DateTime.local().plus({ days: x }).toFormat('cccc').toLowerCase() !== item) {
            x++
          }
          nextOpen = DateTime.local().plus({ days: x }).toFormat('yyyy-MM-dd') + `T${profile.week[item][0].open}`
          break
        }
      }

      if (!nextOpen) {
        for (let item of weekDays) {
          if (profile.week[item].length > 0) {
            let x = 1
            while (DateTime.local().plus({ days: x }).toFormat('cccc').toLowerCase() !== item) {
              x++
            }
            nextOpen = DateTime.local().plus({ days: x }).toFormat('yyyy-MM-dd') + `T${profile.week[item][0].open}`
            break
          }
        }
      }

      if (!nextOpen) {
        nextOpen = DateTime.local().plus({ days: 1 }).toFormat('yyyy-MM-dd') + `T00:00`
      }

      return nextOpen
    })

    View.global('SiteUrl', () => Env.get('SITE_URL', 'https://whatsmenu.com.br'))
    View.global('AdmUrl', () => Env.get('DOMAIN', 'https://whatsmenu.com.br'))

    View.global('toBRL', (val) => {
      let result

      if (typeof val === 'number') {
        result = new Intl.NumberFormat('pt-br', { style: 'currency', currency: 'BRL' }).format(val)
      } else if (typeof val === 'string') {
        const value = val.replace('R$', '').replace(',', '.').split(' ').join('')
        result = new Intl.NumberFormat('pt-br', { style: 'currency', currency: 'BRL' }).format(value)
      }

      return result
    })
  }
}

module.exports = UtilityProvider
