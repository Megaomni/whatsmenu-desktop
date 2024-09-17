'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Encryption = use('Encryption')
const WmProvider = use('WmProvider')
const Env = use('Env')
const { v4: uuidv4 } = require('uuid')

class Profile extends Model {
  static boot() {
    super.boot()

    this.addHook('beforeCreate', (profile) => {
      if (typeof profile.minval === 'string') {
        profile.showTotal = true
        profile.typeDelivery = 'neighborhood'
        profile.minval = profile.minval ? parseFloat(profile.minval.replace(',', '.').replace('R$', '').split(' ').join('')) : 0
        profile.minvalLocal = profile.minvalLocal ? parseFloat(profile.minvalLocal.replace(',', '.').replace('R$', '').split(' ').join('')) : 0
      }

      if (!profile.description) {
        profile.description = 'O melhor da cidade... Peça já o seu!'
      }

      profile.taxDelivery = JSON.stringify([])
      profile.address = JSON.stringify({})
      profile.formsPayment = [
        { flags: [], status: true, payment: 'money' },
        { flags: [], status: true, payment: 'debit' },
        { flags: [], status: true, payment: 'credit' },
      ]

      switch (profile.options.locale.language) {
        case 'en-US':
          profile.formsPayment = profile.formsPayment.concat([
            { flags: [], status: false, payment: 'snack' },
            { flags: [], status: false, payment: 'food' },
          ]);
          break;
        case 'ar-AE':
          profile.timeZone = 'Asia/Dubai'
          break
        default:
          profile.formsPayment = profile.formsPayment.concat([
            { flags: [], status: false, payment: 'snack' },
            { flags: [], status: false, payment: 'food' },
            { key: { type: '', value: '' }, status: false, payment: 'pix' },
            { key: { type: 'email', value: '' }, status: false, payment: 'picpay' },
          ]);
          profile.timeZone = 'America/Sao_Paulo'
          break;
      }

      const addon = { status: false, type: 'fee', valueType: 'fixed', value: 0 }

      profile.formsPayment.forEach((element) => (element.addon = addon))

      profile.week = {
        friday: [{ code: '33e443', open: '00:00', close: '23:59' }],
        monday: [{ code: 'f892c3', open: '00:00', close: '23:59' }],
        sunday: [{ code: '18ea4b', open: '00:00', close: '23:59' }],
        tuesday: [{ code: 'a9dadc', open: '00:00', close: '23:59' }],
        saturday: [{ code: '470782', open: '00:00', close: '23:59' }],
        thursday: [{ code: '215135', open: '00:00', close: '23:59' }],
        wednesday: [{ code: '5dc776', open: '00:00', close: '23:59' }],
      }

      profile.options = {
        queues: {
          bartender: [],
        },
        hideSecretNumber: false,
        pdv: {
          cashierManagement: false,
          clientConfig: {
            birthDate: false,
            required: false,
          },
          sendWhatsMessage: false,
        },
        store: {
          productModal: {
            infoPosition: 'last',
          },
          catalogMode: {
            table: false,
            delivery: false,
          },
        },
        tracking: { pixel: '', google: '' },
        activeCupom: true,
        pizza: { higherValue: true },
        delivery: { enableKm: false, disableDelivery: false },
        table: {
          persistBartender: true,
          callBartender: true,
        },
        order: 'none',
        print: {
          textOnly: true,
          width: '219px',
          copies: 1,
          active: true,
          groupItems: true,
        },
        package: {
          active: false,
          shippingLocal: { active: false },
          shippingDelivery: { active: false },
          week: {
            friday: [
              {
                code: Encryption.encrypt('friday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            monday: [
              {
                code: Encryption.encrypt('monday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            sunday: [
              {
                code: Encryption.encrypt('sunday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            tuesday: [
              {
                code: Encryption.encrypt('tuesday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            saturday: [
              {
                code: Encryption.encrypt('saturday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            thursday: [
              {
                code: Encryption.encrypt('thursday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
            wednesday: [
              {
                code: Encryption.encrypt('wednesday').substring(0, 6),
                open: '00:00',
                close: '23:59',
              },
            ],
          },
          // weekDistance: 3,

          distanceDays: {
            start: 0,
            end: 7,
          },
          intervalTime: 30,
          specialsDates: [],
          maxPackage: 30,
          maxPackageHour: 1,
          minValue: 0.0,
          minValueLocal: 0.0,
          // timePackage: {
          //   active: false,
          //   beforeClose: 15,
          //   intervalTime: 30,
          //   // afterOpen: 0,
          // },
        },
        placeholders: {
          pizzaObs: 'Deixe aqui qualquer observação no produto.',
          productObs: 'Ex.: Sem maionese, sem salada, etc...',
          statusSend: 'Obaaa, [NOME] seu pedido já está a caminho!',
          statusToRemove: 'Obaaa, [NOME] seu pedido já está pronto para retirada!',
          statusProduction: '[NOME] seu pedido já está em produção!',
          clientText: 'Olá [NOME], Tudo bem?',
          sendWhatsMessage: '[NOME] pedido efetuado com sucesso, acompanhe o status do seu pedido abaixo!',
          welcomeMessage: Profile.defaultWelcomeMessage(profile),
          cupomFirstMessage: Profile.defaultCupomFirstMessage(profile),
        },
        disponibility: { showProductsWhenPaused: false },
        legacyPix: false,
        bot: {
          whatsapp: {
            welcomeMessage: {
              status: true,
              alwaysSend: false,
            },
          },
        },
        ...profile.options,
      }


      profile.formsPayment = JSON.stringify(profile.formsPayment)
      profile.week = JSON.stringify(profile.week)
      profile.options = JSON.stringify(profile.options)
    })

    this.addHook('afterCreate', (profile) => {
      profile.formsPayment = JSON.parse(profile.formsPayment)
      profile.formsPayment.forEach((formPayment) => {
        switch (formPayment.payment) {
          case 'money':
            formPayment.label = 'Dinheiro'
            break
          case 'card':
            formPayment.label = 'Cartão'
            break
          case 'credit':
            formPayment.label = 'Crédito'
            break
          case 'debit':
            formPayment.label = 'Débito'
            break
          case 'food':
            formPayment.label = 'Vale Alimentação'
            break
          case 'snack':
            formPayment.label = 'Vale Refeição'
            break
          case 'pix':
            formPayment.label = 'Pix'
            break
          case 'picpay':
            formPayment.label = 'PicPay'
            break
          default:
            break
        }
      })
      profile.formsPayment = JSON.stringify(profile.formsPayment)
    })

    this.addHook('beforeUpdate', (profile) => {
      if (typeof profile.minval === 'string') {
        profile.minval = profile.minval ? parseFloat(profile.minval.replace(',', '.').replace('R$', '').split(' ').join('')) : 0
        profile.minvalLocal = profile.minvalLocal ? parseFloat(profile.minvalLocal.replace(',', '.').replace('R$', '').split(' ').join('')) : 0
      }

      profile.taxDelivery = JSON.stringify(profile.taxDelivery)
      profile.address = JSON.stringify(profile.address)

      const addon = { status: false, type: 'fee', valueType: 'fixed', value: 0 }
      profile.formsPayment.forEach((element) => {
        if (!element.hasOwnProperty('addon')) {
          element.addon = addon
        }
      })

      if (!profile.options.hasOwnProperty('queues')) {
        profile.options.queues = { bartender: [] }
      }

      profile.formsPayment = JSON.stringify(profile.formsPayment)
      profile.week = JSON.stringify(profile.week)
      profile.options = JSON.stringify(profile.options)
    })

    this.addHook('afterFind', (profile) => {
      profile.taxDelivery = JSON.parse(profile.taxDelivery)
      profile.address = JSON.parse(profile.address)
      profile.formsPayment = JSON.parse(profile.formsPayment)
      profile.week = JSON.parse(profile.week)
      profile.options = JSON.parse(profile.options)
      if (!profile.options.hasOwnProperty('queues')) {
        profile.options.queues = { bartender: [] }
      }

      if (!profile.options.hasOwnProperty('hideSecretNumber')) {
        profile.options.hideSecretNumber = false
      }

      if (!profile.options.hasOwnProperty('pdv')) {
        profile.options.pdv = {
          sendWhatsMessage: false,
        }
      }

      if (!profile.options.hasOwnProperty('store')) {
        profile.options.store = {
          productModal: {
            infoPosition: 'last',
          },
          catalogMode: {
            table: false,
            delivery: false,
          },
        }
      } else if (!profile.options.store.productModal.infoPosition) {
        profile.options.store.productModal.infoPosition = 'first'
      } else if (!profile.options.store.catalogMode) {
        profile.options.store.catalogMode = {
          table: false,
          delivery: false,
        }
      }
      //Package Parses
      const { package: packageP } = profile.options
      packageP.active = typeof packageP.active === 'string' ? JSON.parse(packageP.active) : packageP.active
      packageP.shippingDelivery.active = JSON.parse(packageP.shippingDelivery.active)
      packageP.shippingLocal.active = JSON.parse(packageP.shippingLocal.active)
      packageP.intervalTime = Number(packageP.intervalTime) || 30
      packageP.minValue = parseFloat(packageP.minValue)
      packageP.minValueLocal = parseFloat(packageP.minValueLocal)
      packageP.hoursBlock = packageP.hoursBlock ? packageP.hoursBlock : []
      packageP.specialsDates.sort((a, b) => {
        a && (a = new Date(a))
        b && (b = new Date(b))

        if (a < b) {
          return -1
        } else if (a > b) {
          return 1
        } else {
          return 0
        }
      })

      profile.formsPayment.forEach((formPayment) => {
        switch (formPayment.payment) {
          case 'money':
            formPayment.label = 'Dinheiro'
            break
          case 'card':
            formPayment.label = 'Cartão'
            break
          case 'credit':
            formPayment.label = 'Crédito'
            break
          case 'debit':
            formPayment.label = 'Débito'
            break
          case 'food':
            formPayment.label = 'Vale Alimentação'
            break
          case 'snack':
            formPayment.label = 'Vale Refeição'
            break
          case 'pix':
            formPayment.label = 'Pix'
            break
          case 'picpay':
            formPayment.label = 'PicPay'
            break
          default:
            break
        }
      })

      let addon = { status: false, type: 'fee', valueType: 'fixed', value: 0 }
      profile.formsPayment.forEach((element) => {
        if (!element.hasOwnProperty('addon')) {
          element.addon = addon
        }
      })

      if (profile.options.table && !profile.options.table.hasOwnProperty('callBartender')) {
        profile.options.table.callBartender = true
      }

      if (!profile.options.placeholders.hasOwnProperty('welcomeMessage')) {
        profile.options.placeholders.welcomeMessage = Profile.defaultWelcomeMessage(profile)
      }

      if (!profile.options.placeholders.hasOwnProperty('cupomFirstMessage')) {
        profile.options.placeholders.cupomFirstMessage = Profile.defaultCupomFirstMessage(profile)
      }
      if (!profile.options.hasOwnProperty('bot')) {
        profile.options.bot = {
          whatsapp: {
            welcomeMessage: {
              status: true,
              alwaysSend: false,
            },
          },
        }
      }
      Profile.profileEmojis(profile, 'decryptEmoji')
    })

    this.addHook('beforeSave', (profile) => {
      const options = JSON.parse(profile.options)
      profile.options = options
      if (!profile.slug || profile.slug === 'undefined') {
        profile.slug = `slug${uuidv4()}`
      }
      try {
        Profile.profileEmojis(profile, 'decryptEmoji')
      } catch (error) {
        console.error('Não foi possivel converter o emoji para texto, antes de salvar o perfil', error)
      }
      profile.options.minValue = parseFloat(
        profile.options.asaas && profile.options.minValue < Env.get('ASAAS_MIN_VALUE') ? Env.get('ASAAS_MIN_VALUE') : profile.options.minValue
      )
      profile.options.minValueLocal = parseFloat(
        profile.options.asaas && profile.options.minValueLocal < Env.get('ASAAS_MIN_VALUE')
          ? Env.get('ASAAS_MIN_VALUE')
          : profile.options.minValueLocal
      )
      if (options.package) {
        const someActive = options.package.week ? Object.entries(options.package.week).find((el) => !!el[1].length) : null
        const shippingDelivery = JSON.parse(options.package.shippingDelivery.active)
        const shippingLocal = JSON.parse(options.package.shippingLocal.active)

        if (parseInt(options.package.maxPackage) > 1000) {
          options.package.maxPackage = 1000
        }

        if (parseInt(options.package.maxPackageHour > 1000)) {
          options.package.maxPackageHour = 1000
        }

        if (!someActive || (!shippingDelivery && !shippingLocal)) {
          options.package.active = false
        }

        options.package.specialsDates.forEach((specialDate) => {
          specialDate = typeof specialDate === 'object' ? JSON.stringify(specialDate) : specialDate
        })
        profile.options.package.minValue = parseFloat(
          profile.options.asaas && profile.options.package.minValue < Env.get('ASAAS_MIN_VALUE')
            ? Env.get('ASAAS_MIN_VALUE')
            : profile.options.package.minValue
        )
        profile.options.package.minValueLocal = parseFloat(
          profile.options.asaas && profile.options.package.minValueLocal < Env.get('ASAAS_MIN_VALUE')
            ? Env.get('ASAAS_MIN_VALUE')
            : profile.options.package.minValueLocal
        )
      }

      if (!profile.options.hasOwnProperty('legacyPix')) {
        profile.options.legacyPix = true
      }

      if (!profile.options.hasOwnProperty('queues')) {
        profile.options.queues = { bartender: [] }
      }
      if (profile.options.table && !profile.options.table.hasOwnProperty('callBartender')) {
        profile.options.table.callBartender = true
      }
      if (!profile.options.placeholders.hasOwnProperty('welcomeMessage')) {
        profile.options.placeholders.welcomeMessage = Profile.defaultWelcomeMessage(profile)
      }
      if (!profile.options.placeholders.hasOwnProperty('cupomFirstMessage')) {
        profile.options.placeholders.cupomFirstMessage = Profile.defaultCupomFirstMessage(profile)
      }
      if (!profile.options.hasOwnProperty('bot')) {
        profile.options.bot = {
          whatsapp: {
            welcomeMessage: {
              status: true,
              alwaysSend: false,
            },
          },
        }
      }

      if (profile.options.placeholders && profile.options.placeholders.cupomFirstMessage) {
        const splitedCupomFirstMessage = profile.options.placeholders.cupomFirstMessage.split(
          `\n\nhttps://www.whatsmenu.com.br/${profile.slug}?firstOnlyCupom=`
        )
        if (splitedCupomFirstMessage.length) {
          profile.options.placeholders.cupomFirstMessage = splitedCupomFirstMessage[0]
        }
      }
      profile.options = JSON.stringify(options)
    })

    this.addHook('afterSave', (profile) => {
      profile.taxDelivery = JSON.parse(profile.taxDelivery)
      profile.address = JSON.parse(profile.address)
      profile.formsPayment = JSON.parse(profile.formsPayment)
      profile.week = JSON.parse(profile.week)
      profile.options = JSON.parse(profile.options)
      profile.options.minValue = parseFloat(
        profile.options.asaas && profile.options.minValue < Env.get('ASAAS_MIN_VALUE') ? Env.get('ASAAS_MIN_VALUE') : profile.options.minValue
      )
      profile.options.minValueLocal = parseFloat(
        profile.options.asaas && profile.options.minValueLocal < Env.get('ASAAS_MIN_VALUE')
          ? Env.get('ASAAS_MIN_VALUE')
          : profile.options.minValueLocal
      )
      profile.options.package.minValue = parseFloat(
        profile.options.asaas && profile.options.package.minValue < Env.get('ASAAS_MIN_VALUE')
          ? Env.get('ASAAS_MIN_VALUE')
          : profile.options.package.minValue
      )
      profile.options.package.minValueLocal = parseFloat(
        profile.options.asaas && profile.options.package.minValueLocal < Env.get('ASAAS_MIN_VALUE')
          ? Env.get('ASAAS_MIN_VALUE')
          : profile.options.package.minValueLocal
      )
      profile.options.hoursBlock = profile.options.hoursBlock ? profile.options.hoursBlock : []

      if (!profile.options.hasOwnProperty('store')) {
        profile.options.store = {
          productModal: {
            infoPosition: 'last',
          },
          catalogMode: {
            table: false,
            delivery: false,
          },
        }
      } else if (!profile.options.store.productModal.infoPosition) {
        profile.options.store.productModal.infoPosition = 'first'
      } else if (!profile.options.store.catalogMode) {
        profile.options.store.catalogMode = {
          table: false,
          delivery: false,
        }
      }

      if (!profile.options.hasOwnProperty('hideSecretNumber')) {
        profile.options.hideSecretNumber = false
      }

      if (!profile.options.hasOwnProperty('queues')) {
        profile.options.queues = { bartender: [] }
      }

      Profile.profileEmojis(profile, 'decryptEmoji')
    })

    this.addHook('afterFetch', (profiles) => {
      profiles.forEach((profile) => {
        profile.taxDelivery = JSON.parse(profile.taxDelivery)
        profile.address = JSON.parse(profile.address)
        profile.formsPayment = JSON.parse(profile.formsPayment)
        profile.week = JSON.parse(profile.week)
        profile.options = JSON.parse(profile.options)
        profile.options.hoursBlock = profile.options.hoursBlock ? profile.options.hoursBlock : []

        if (!profile.options.hasOwnProperty('store')) {
          profile.options.store = {
            productModal: {
              infoPosition: 'last',
            },
            catalogMode: {
              table: false,
              delivery: false,
            },
          }
        } else if (!profile.options.store.productModal.infoPosition) {
          profile.options.store.productModal.infoPosition = 'first'
        } else if (!profile.options.store.catalogMode) {
          profile.options.store.catalogMode = {
            table: false,
            delivery: false,
          }
        }

        if (!profile.options.hasOwnProperty('hideSecretNumber')) {
          profile.options.hideSecretNumber = false
        }

        if (!profile.options.hasOwnProperty('queues')) {
          profile.options.queues = { bartender: [] }
        }

        if (profile.options.table && !profile.options.table.hasOwnProperty('callBartender')) {
          profile.options.table.callBartender = true
        }

        if (!profile.options.placeholders.hasOwnProperty('welcomeMessage')) {
          profile.options.placeholders.welcomeMessage = Profile.defaultWelcomeMessage(profile)
        }
        if (!profile.options.placeholders.hasOwnProperty('cupomFirstMessage')) {
          profile.options.placeholders.cupomFirstMessage = Profile.defaultCupomFirstMessage(profile)
        }
        if (!profile.options.hasOwnProperty('bot')) {
          profile.options.bot = {
            whatsapp: {
              welcomeMessage: {
                status: true,
                alwaysSend: false,
              },
            },
          }
        }

        Profile.profileEmojis(profile, 'decryptEmoji')
      })
    })

    this.addHook('afterPaginate', (profiles) => {
      profiles.forEach((profile) => {
        const addon = { status: false, type: 'fee', valueType: 'fixed', value: 0 }

        profile.options = JSON.parse(profile.options)
        profile.formsPayment = JSON.parse(profile.formsPayment)

        profile.formsPayment.forEach((element) => {
          if (!element.hasOwnProperty('addon')) {
            element.addon = addon
          }
        })

        if (!profile.options.hasOwnProperty('store')) {
          profile.options.store = {
            productModal: {
              infoPosition: 'last',
            },
            catalogMode: {
              table: false,
              delivery: false,
            },
          }
        } else if (!profile.options.store.productModal.infoPosition) {
          profile.options.store.productModal.infoPosition = 'first'
        } else if (!profile.options.store.catalogMode) {
          profile.options.store.catalogMode = {
            table: false,
            delivery: false,
          }
        }

        if (!profile.options.hasOwnProperty('hideSecretNumber')) {
          profile.options.hideSecretNumber = false
        }

        if (typeof profile.options === 'string') {
          profile.options = JSON.parse(profile.options)
          profile.options.hoursBlock = profile.options.hoursBlock ? profile.options.hoursBlock : []
          if (!profile.options.hasOwnProperty('queues')) {
            profile.options.queues = { bartender: [] }
          }

          if (profile.options.table && !profile.options.table.hasOwnProperty('callBartender')) {
            profile.options.table.callBartender = true
          }

          if (!profile.options.placeholders.hasOwnProperty('welcomeMessage')) {
            profile.options.placeholders.welcomeMessage = Profile.defaultWelcomeMessage(profile)
          }
          if (!profile.options.placeholders.hasOwnProperty('cupomFirstMessage')) {
            profile.options.placeholders.cupomFirstMessage = Profile.defaultCupomFirstMessage(profile)
          }
          if (!profile.options.hasOwnProperty('bot')) {
            profile.options.bot = {
              whatsapp: {
                welcomeMessage: {
                  status: false,
                  alwaysSend: true,
                },
              },
            }
          }
        }

        if (typeof profile.week === 'string') {
          profile.week = JSON.parse(profile.week)
        }

        if (typeof profile.taxDelivery === 'string') {
          profile.taxDelivery = JSON.parse(profile.taxDelivery)
        }

        if (typeof profile.address === 'string') {
          profile.address = JSON.parse(profile.address)
        }

        if (typeof profile.formsPayment === 'string') {
          profile.formsPayment = JSON.parse(profile.formsPayment)
        }

        if (profile.minval === null) {
          profile.minval = 0
        }

        if (profile.minvalLocal === null) {
          profile.minvalLocal = 0
        }
      })
    })
  }

  static profileEmojis(profile, action) {
    if (profile && profile.options) {
      if (action === 'decryptEmoji') {
        profile.name = WmProvider[action](profile.name)
        profile.description = WmProvider[action](profile.description) // 'decryptEmoji' | 'encryptEmoji'
        for (const [key, value] of Object.entries(profile.options.placeholders)) {
          profile.options.placeholders[key] = WmProvider[action](value)
        }
      }
    }
  }

  static defaultWelcomeMessage(profile) {
    return `Olá *[NOME]!*\n\nSeja bem vindo ao ${profile.name}\n\nVeja o nosso cardápio para fazer seu pedido\n\nhttps://www.whatsmenu.com.br/${profile.slug}\n\n*Ofertas exclusivas para pedidos no link* \n\nEquipe ${profile.name}`
  }

  static defaultCupomFirstMessage(profile) {
    return `Olá *[NOME]!*\n\nSeja bem vindo ao ${profile.name}\n\nÉ sua primeira vez aqui, separei um cupom especial para você`
  }

  categories() {
    return this.hasMany('App/Models/Category', 'id', 'profileId').where('deleted_at', null)
  }

  clients() {
    return this.hasMany('App/Models/Client', 'id', 'profileId')
  }

  allCategories() {
    return this.hasMany('App/Models/Category', 'id', 'profileId')
  }

  requests() {
    return this.hasMany('App/Models/Request', 'id', 'profileId')
  }

  carts() {
    return this.hasMany('App/Models/Cart', 'id', 'profileId').whereRaw('(statusPayment in ("offline", "paid") or statusPayment is null)')
  }

  motoboys() {
    return this.hasMany('App/Models/Motoboy', 'id', 'profileId').where('deleted_at', null)
  }

  user() {
    return this.belongsTo('App/Models/User', 'userId', 'id')
  }

  cupons() {
    return this.hasMany('App/Models/Cupom', 'id', 'profileId')
  }

  domains() {
    return this.hasMany('App/Models/Domain', 'id', 'profileId')
  }

  tables() {
    return this.hasMany('App/Models/Table', 'id', 'profileId')
  }

  activeTables() {
    return this.hasMany('App/Models/Table', 'id', 'profileId').where('deleted_at', null)
  }

  bartenders() {
    return this.hasMany('App/Models/Bartender', 'id', 'profileId')
  }

  cashiers() {
    return this.hasMany('App/Models/Cashier', 'id', 'profileId')
  }

  fees() {
    return this.hasMany('App/Models/Fee', 'id', 'profileId')
  }

  clients() {
    return this.hasMany('App/Models/Client', 'id', 'profileId')
  }
}

module.exports = Profile
