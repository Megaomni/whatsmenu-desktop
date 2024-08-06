'use strict'
const User = use('App/Models/User')
const Bartender = use('App/Models/Bartender')
const Seller = use('App/Models/Seller')
const FlexPlan = use('App/Models/FlexPlan')
const UserPlan = use('App/Models/UserPlan')
const SystemProduct = use('App/Models/SystemProduct')
const PaymentController = use('App/Controllers/Http/PaymentController')
const View = use('View')
const Env = use('Env')
const Encryption = use('Encryption')
const Mail = use('Mail')
const moment = use('moment')
const Hash = use('Hash')

const { DateTime } = require('luxon')
const gatewayPagarme = require('../../Services/gateways/strategyPagarme')
const gatewayStripe = require('../../Services/gateways/strategyStripe')
const axios = require('axios')

// const gatewayPagarme = require("../../Services/strategyPagarme")
// const gatewayStripe = require("../../Services/strategyStripe")

class AuthController {
  async getRegister({ response, view }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 18, metodo: 'getRegister' })
      const seller = await Seller.query().where('status', 1).fetch()
      const plans = await FlexPlan.query().where({ status: 1, deleted_at: null }).with('relateds').fetch()
      const systemProducts = await SystemProduct.query().where({ status: 1 }).fetch()

      View.global('isProduction', () => {
        return Env.get('NODE_ENV', false) === 'production'
      })

      return response.json({
        sellers: seller.toJSON(),
        plans: plans.toJSON(),
        systemProducts: systemProducts.toJSON(),
      })
    } catch (error) {
      console.error(error)
    }
  }

  async postRegister({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 41, metodo: 'postRegister' })
      const data = request.except(['_csrf'])
      // return response.json(data)
      const user = new User()

      user.name = data.name
      user.email = data.email
      user.secretNumber = data.secretNumber
      user.whatsapp = data.whatsapp
        .replace(/[^\w\s]/gi, '')
        .split(' ')
        .join('')
        .trim()
      user.sellerId = data.sellerId

      user.password = data.password

      user.due = data.controls.disableInvoice ? moment().format('DD') : moment().add(1, 'days').format('DD')

      user.controls = data.controls
      user.controls.attempts = 0

      if (data.controls.disableInvoice) {
        user.controls.paymentInfo = {
          gateway: data.gateway,
        }
      }

      user.controls.nextInvoice = data.bilhetParcelament ? DateTime.local().plus({ year: 1 }).toFormat('yyyy-MM-dd') : null
      await user.save()

      if (data.cart) {
        const items = data.cart.filter((item) => item.service === 'plan')

        for (const item of items) {
          await UserPlan.create({
            userId: user.id,
            flexPlanId: item.plan_id,
            systemProductId: item.id,
            priceId: item.price_id,
          })
        }
      }
      const payment = new PaymentController()
      const sysreq = await payment.createFirstRequest(user.id, data.cart, data.installments)

      // await this.createFirstRequest(user.id)

      if (user.controls.paymentInfo) {
        switch (user.controls.paymentInfo.gateway) {
          case 'pagarme':
            const { data: customerPagarme } = await gatewayPagarme.createCustomer(user.toJSON())

            user.controls.paymentInfo = {
              ...user.controls.paymentInfo,
              customerId: customerPagarme.id,
              addressId: customerPagarme.address.id,
            }

            await user.save()
            break
          case 'stripe':
            const customerStripe = await gatewayStripe.createCustomer({
              email: user.email,
              name: user.name,
              phone: user.whatsapp,
              metadata: {
                userId: user.id,
              },
            })
            user.controls.paymentInfo = {
              ...user.controls.paymentInfo,
              customerId: customerStripe.id,
            }

            await user.save()
            break
        }
      }

      if (user.id) {
        await auth.attempt(data.email, data.password)
      }

      return response.json({ username: data.email, password: data.password })
    } catch (error) {
      console.error(error)

      if (error.response) {
        throw error.response
      }

      throw error
    }
  }

  // async login ({request, auth, response}) {
  //   try {
  //     console.log('Starting: ', { controller: 'AuthController', linha: 94, metodo: 'login' })
  //     await auth.check()

  //     const user = await auth.getUser()
  //     const profile = await user.profile().fetch()

  //     if (user.controls.type) {
  //       return response.route('adm.user.index')
  //     }

  //     if (profile) {
  //       return response.route('request.index')
  //     } else {
  //       return response.route('profileRegister')
  //     }

  //   } catch (error) {
  //     const {email, password} = request.all()
  //     await auth.attempt(email, password)

  //     const user = await auth.getUser()
  //     const profile = await user.profile().fetch()

  //     if (user.controls.type) {
  //       return response.route('adm.user.index')
  //     }

  //     if (profile) {
  //       return response.route('request.index')
  //     } else {
  //       return response.route('profileRegister')
  //     }

  //     console.error({erro_login: error});
  //     throw error
  //   }
  // }

  async login({ request, auth, response }) {
    const { email, password, userAgent, ip } = request.all()
    let user
    try {
      user = await User.findBy('email', email)
      if (!user) {
        return response.status(404).json({ message: 'Email inválido!' })
      }
      if (user.controls.forceSecurity) {
        return response.status(403).json({
          message: `Sua senha não é alterada há alguns meses, por motivo de segurança, crie uma nova senha clicando no link enviado para o email\n ${user.email}`,
          title: 'Sua senha do painel expirou',
          code: '403-F',
        })
      }
      if (user.controls.attempts < 5) {
        const authtentication = await auth.attempt(email, password)
        if (authtentication) {
          authtentication.user = user
          user.controls.attempts = 0
          user.controls.lastAccess = { ip, userAgent, date: DateTime.local().toISO() }
        }
        await user.save()
        return response.json(authtentication)
      } else {
        return response.status(403).json({ message: 'Limite de tentativas de login excedido!' })
      }
    } catch (error) {
      console.error(error)
      user.controls.attempts++
      if (user.controls.attempts >= 5) {
        user.controls.lastBlock = { ip, userAgent, date: DateTime.local().toISO() }
      }
      await user.save()
      throw error
    }
  }

  async logout({ auth, response, session }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 134, metodo: 'logout' })
      await auth.logout()
      session.forget('isAdmin')
      response.route('login')
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async authApp({ request, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 145, metodo: 'authApp' })
      // console.log(auth);
      const { email, password } = request.all()
      let user = await User.findBy('email', email)

      // if (!user) {
      //   const { data } = await axios.post("https://api2.whatsmenu.com.br/api/v2/auth/app/print", {
      //       email,
      //       password
      //     })

      //     return response.json({ ...data, next: true })
      // }

      let profile = await user.profile().fetch()
      let token

      if (profile) {
        if (typeof profile.options === 'string') {
          profile.options = JSON.parse(profile.options)
        }

        // if (profile.options.migrated_at) {
        //   const { data } = await axios.post("https://api2.whatsmenu.com.br/api/v2/auth/app/print", {
        //     email,
        //     password
        //   })

        //   return response.json({ ...data, next: true })
        // }

        // await auth.attempt(email, password)
        const { data } = await axios.post("http://localhost:3339/login/app", {
          email,
          password
        })
        if (!data.authenticated) {
          return response.status(401).json({ success: false, message: 'Email ou senha inválidos.' })
        }
        token = await auth.generate(user)
        if (!profile.options.print.app) {
          profile.options.print.app = true
          await profile.save()

          const toProfile = profile.toJSON()
          user.profile = toProfile

          return response.json({
            ...token,
            user: user,
            title: 'Primeiro Acesso',
            message: 'Se o seu painel estiver aberto, por favor é necessário recarregar a página para sincronizar com o aplicativo de impressão.',
          })
        }

        const toProfile = profile.toJSON()
        user.profile = toProfile
      } else {
        if (!profile) {
          return response.status(404).json({
            success: false,
            message: 'Este usuário ainda não possui um perfil cadastrado.',
          })
        }
      }

      return response.json({ ...token, user: user })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUserToken({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 171, metodo: 'getUserToken' })
      const user = await auth.getUser()
      const token = await auth.generate(user)

      return response.json(token)
    } catch (error) {
      throw error
    }
  }

  async switchLogin({ auth, params, request, response, session }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 184, metodo: 'switchLogin' })
      // await auth.logout()
      const { admId } = request.all()
      const user = await User.find(params.userId)
      if (!user.controls.lastAdmAccess || !Array.isArray(user.controls.lastAdmAccess)) {
        user.controls.lastAdmAccess = []
      }

      if (user.controls.lastAdmAccess.length === 10) {
        user.controls.lastAdmAccess.pop()
      }

      user.controls.lastAdmAccess.unshift({ admId, date: DateTime.local().toISO() })

      await user.save()
      const generated = await auth.generate(user, true)
      generated.user = user
      generated.user.admMode = true
      response.json(generated)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async recoveryPassword({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 196, metodo: 'recoveryPassword' })
      const data = request.except(['_crsf'])
      const user = await User.findBy('email', data.recovery_email)

      if (!user) {
        return response.status(403).send('Por favor verifique se o email está correto')
      }

      if (!user.controls.recovery) {
        user.controls.recovery = {}
      }
      const tokenValid = user.controls.recovery.token
        ? Number(DateTime.fromISO(user.controls.recovery.date).plus({ minutes: 10 }).diffNow().toFormat('mm')) >= 0
        : false

      if (!tokenValid) {
        user.controls.recovery = {
          token: await Encryption.encrypt(user.email),
          date: DateTime.local().toISO(),
        }

        await Mail.send('email.passwords.recoverypassword', { user: user.toJSON() }, (message) => {
          message.from('whatsmenu@grovecompany.com.br').to(user.email).subject('Recuperação de Senha de Acesso')
        })
      }

      await user.save()
      return response.json(user)
    } catch (error) {
      console.error({
        date: DateTime.local().toISO(),
        error: error,
      })
      throw error
    }
  }

  async forgot({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 227, metodo: 'forgot' })
      const token = request.qs.token.replace(/( )+/g, '+')
      const user = await User.findBy('email', Encryption.decrypt(token))
      let expired = true

      if (user.controls.recovery.token) {
        const expirationDate = DateTime.fromISO(user.controls.recovery.date).plus({ minutes: 10 })
        const now = DateTime.local()

        if (token === user.controls.recovery.token && expirationDate >= now) {
          expired = false
        }
      }

      return response.json({
        user: user.toJSON(),
        token: token,
        expired: expired,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async authSecurityKey({ response }) {
    try {
      console.log('Starting: ', { controller: 'AuthController', linha: 361, metodo: 'authSecurityKey' })
      return response.json({ auth: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getInsecurityPassword({ auth, response }) {
    console.log('getInsecurityPassword')
    const users = await User.all()
    const insecuries = []
    let a = 0

    console.log(users.rows.length)

    const test = async (user) => {
      try {
        const authtentication = await auth.attempt(user.email, '123456')
        console.log(user.id)
        insecuries.push(user.toJSON())
      } catch (error) {
        a = 0
        console.error(user.id)
      }
    }

    for (const user of users.rows) {
      test(user)
    }

    try {
      const interval = setInterval(() => {
        if (a === insecuries.length) {
          Mail.send('email.insecuries', { users: insecuries }, (message) => {
            message
              .from('whatsmenu@grovecompany.com.br')
              .to('jasonaries@gmail.com')
              .subject('usuários inseguros ' + moment().format())
          })

          clearInterval(interval)
          console.log('terminou')
          response.json({ success: true })
        } else {
          a = insecuries.length
        }
      }, 20000)
    } catch (error) {
      throw error
    }
  }

  async getTokenToV3({ auth, request, response }) {
    const { userId, key, email, password, admMode } = request.all()
    let user
    try {
      if (key !== '@WhatsMenu*2024') {
        return response.status(401).json({ message: 'Senha inválida' })
      }
      user = await User.find(userId)
      if (!user) {
        return response.status(404).json({ message: 'Usuário não encontrado' })
      }

      if (user.controls.attempts < 5) {
        let userWithToken
        if (user.password.startsWith('$scrypt')) {
          userWithToken = await auth.generate(user)
          return response.json(userWithToken)
        }
  
        if (admMode) {
          userWithToken = await auth.generate(user)
        } else {
          userWithToken = await auth.attempt(email, password)
        }
        return response.json(userWithToken)
      } else {
        return response.status(403).json({ message: 'Limite de tentativas de login excedido!' })
      }
    } catch (error) {
      user.controls.attempts++
      console.error(error)
      user.save()
      throw error
    }
  }

  async validateSecurityKey({ request, response }) {
    const { userId, security_key, key } = request.all()
    try {
      if (key !== '@WhatsMenu*2024') {
        return response.status(401).json({ message: 'Senha inválida' })
      }
      const user = await User.find(userId)
      const isValid = await Hash.verify(security_key, user.security_key)
      return response.json({ isValid })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = AuthController
