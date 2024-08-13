'use strict'
// const { DateTime } = require("luxon")
//
const { randomBytes } = require('crypto')
const axios = use('axios')
const { DateTime } = use('luxon')
const moment = require('moment')
const gatewayGrovePay = require('../../Services/gateways/strategyGrovePay')
const { options } = require('@adonisjs/ace/src/Command')
const { profile } = require('console')
const { type } = require('os')
const { throws } = require('assert')
const Env = use('Env')
const Profile = use('App/Models/Profile')
const ProfileR = use('App/Models/ReadOnly/Profile')
const Table = use('App/Models/Table')
const Command = use('App/Models/Command')
const Cashier = use('App/Models/Cashier')
const CashierR = use('App/Models/ReadOnly/Cashier')
const Category = use('App/Models/Category')
const CategoryR = use('App/Models/ReadOnly/Category')
const Product = use('App/Models/Product')
const ProductR = use('App/Models/ReadOnly/Product')
const PizzaProduct = use('App/Models/PizzaProduct')
const PizzaProductR = use('App/Models/ReadOnly/PizzaProduct')
const Ws = use('Ws')
const InventoryProvider = use('InventoryProvider')

class ApiController {
  async getClient({ params, request, response, session }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 12, metodo: 'getClient' })

      let profile
      if (params.type) {
        profile = await ProfileR.query()
          .where({
            status: true,
            slug: params.slug,
          })
          .orWhere({
            status: 2,
            slug: params.slug,
          })
          .with('tables', (query) => {
            return query
              .where('deleted_at', null)
              .with('opened', (openedQuery) =>
                openedQuery.with('commands', (commandQuery) =>
                  commandQuery.with('carts', (cartsQuery) => cartsQuery.where('type', 'T').with('itens'))
                )
              )
          })
          .with('fees', (query) => query.where('deleted_at', null))
          .first()

        const bartenders = await profile.bartenders().where('deleted_at', null).fetch()
        let defaultCashierId
        if (bartenders.toJSON().length) {
          const defaultCashier = bartenders.toJSON().find((b) => b.controls.defaultCashier)
          if (defaultCashier) {
            defaultCashierId = defaultCashier.id
          }
        }
        const cashiersCondition = {
          profileId: profile.id,
          closed_at: null,
          bartenderId: request.qs.bartenderId ? request.qs.bartenderId : defaultCashierId,
        }

        console.error(cashiersCondition)

        const cashiers = await CashierR.query()
          .where(cashiersCondition)
          .with('carts', (cartsQuery) => cartsQuery.with('client', (cleintQuery) => cleintQuery.setVisible(['name'])))
          .with('openeds')
          .on('query', console.log)
          .fetch()
        profile.bartenders = bartenders
        profile.cashiers = cashiers
      } else {
        profile = await Profile.query()
          .where({
            status: true,
            slug: params.slug,
          })
          .orWhere({
            status: 2,
            slug: params.slug,
          })
          .first()
      }

      if (profile) {
        const user = await profile.user().with('plans').fetch()
        const prof = profile.toJSON()
        prof.plans = user.toJSON().plans
        // if (!prof.options.grovePayKey
        //   || ((DateTime.now().toMillis() - DateTime.fromSeconds(prof.options.grovePayKey.created_on).toMillis()) > 3600000)) {

        //   const token = await gatewayGrovePay.retrieveLoginToken();
        // console.log((DateTime.now().toMillis() - DateTime.fromSeconds(prof.options.grovePayKey.created_on).toMillis()))

        // if (!prof.options.grovePayKey
        //   || ((DateTime.now().toMillis() - DateTime.fromSeconds(prof.options.grovePayKey.created_on).toMillis()) > 1)) {

        //   const token = await gatewayGrovePay.retrieveLoginToken();

        //   prof.options.grovePayKey = token
        //   profile.options.grovePayKey = token
        //   await profile.save()
        // }

        if (user.controls.beta) {
          prof.options.beta = true
        }

        prof.version = parseFloat(Env.get('API_VERSION', 2.0))
        prof.fuso = DateTime.local().setZone(prof.timeZone).toISO()
        const categories = await profile.categories().where('status', true).orderBy('order').fetch()

        const now = DateTime.local().setZone(prof.timeZone)

        const filteredCategories = categories.toJSON().filter((categorie) => {
          if (params.type === 'pdv') return categorie

          let weekDayName = now.setLocale('en-US').weekdayLong.toLowerCase(),
            week = categorie.options.week,
            day = week[weekDayName],
            nowTime = now.toFormat('HH:mm')

          const isAvaliable = day.find((hour) => nowTime >= hour.open && nowTime <= hour.close && hour.active)

          if (categorie.disponibility.store.package && profile.options.package.active) {
            if (!isAvaliable || !categorie.status) {
              categorie.disponibility.store.delivery = false
              categorie.disponibility.store.table = false
            }
            return categorie
          }

          if (isAvaliable && categorie.status === 1) return categorie
        })

        prof.categories = filteredCategories

        for (let category of categories.rows) {
          const profCategory = prof.categories.find((cat) => cat.id === category.id)

          if (category.type === 'default') {
            let products
            switch (profile.options.order) {
              case 'alphabetic':
                products = await category.products().orderBy('name').fetch()
                break

              default:
                products = await category.products().orderBy('order').orderBy('id').fetch()
                break
            }

            let now = DateTime.local().setZone(prof.timeZone)

            const filteredProducts = products.toJSON().filter((product) => {
              let weekDayName = now.setLocale('en-US').weekdayLong.toLowerCase(),
                week = product.disponibility.week,
                day = week[weekDayName],
                nowTime = now.toFormat('HH:mm')

              const isAvaliable = day.find((hour) => nowTime >= hour.open && nowTime <= hour.close && hour.active)

              if (product.disponibility.store.package && profile.options.package.active) {
                if (!isAvaliable) {
                  product.disponibility.store.delivery = false
                  product.disponibility.store.table = false
                }
                return product
              }

              if (isAvaliable) {
                if (product.status === 1) {
                  return product
                } else {
                  if (profile.options.disponibility.showProductsWhenPaused) return product
                }
              }
            })

            if (profCategory) {
              profCategory.products = filteredProducts

              for (let product of products.rows) {
                const prod = profCategory.products.find((p) => p.id === product.id)

                if (prod) {
                  prod.complements = (await product.complements().orderBy('order').fetch()).toJSON()

                  if (prod.complements.length) {
                    prod.complements.forEach((complement) => {
                      if (!profile.options.disponibility.showProductsWhenPaused) complement.itens = complement.itens.filter((item) => item.status)

                      complement.itens.forEach((item) => {
                        if (typeof item.value === 'string') {
                          if (item.value === '') {
                            item.value = 0
                          } else {
                            item.value = parseFloat(item.value.replace(',', '.'))
                          }
                        }

                        if (typeof item.status === 'string') {
                          item.status = JSON.parse(item.status)
                        }

                        item.quantity = 0
                      })
                    })
                  }
                }
              }
            }
          } else {
            // MONTA OBJETO PARA PRODUTO PIZZA
            if (profCategory) {
              profCategory.product = (await category.product().with('complements').where('status', true).fetch()).toJSON()
              profCategory.product.sizes = profCategory.product.sizes.filter((size) => size.status === true)
              // profCategory.product.implementations = profCategory.product.implementations.filter((implementation) => implementation.status === true)
              // profCategory.product.flavors = profCategory.product.flavors.filter((flavor) => flavor.status === true)

              profCategory.product.implementations.forEach((implementation) => {
                if (typeof implementation.value === 'string') {
                  if (implementation.value === '') {
                    implementation.value = 0
                  } else {
                    implementation.value = parseFloat(implementation.value.replace(',', '.'))
                  }
                }
              })

              profCategory.product.flavors.forEach((flavor) => {
                const keys = Object.keys(flavor.values)
                keys.forEach((key) => {
                  if (typeof flavor.values[key] === 'string') {
                    if (flavor.values[key] === '') {
                      flavor.values[key] = 0
                    } else {
                      flavor.values[key] = parseFloat(flavor.values[key].replace(',', '.'))
                    }
                  }
                })
              })

              profCategory.product.implementations = profCategory.product.implementations.filter(
                (implementation) => profile.options.disponibility.showProductsWhenPaused || implementation.status
              )

              profCategory.product.flavors = profCategory.product.flavors.filter(
                (flavor) => profile.options.disponibility.showProductsWhenPaused || !!flavor.status
              )

              profCategory.product.complements.forEach((complement) => {
                complement.itens = complement.itens.filter((item) => {
                  return profile.options.disponibility.showProductsWhenPaused || item.status
                })
              })
            }
          }
        }

        if (profile.options.package.active) {
          let cartsP
          let page = 1
          const carts = []
          const maxProfilePackage = parseInt(profile.options.package.maxPackage)
          const requestsDate = []
          const hoursDate = {}

          do {
            cartsP = await profile
              .carts()
              .where('type', 'P')
              .where('packageDate', '>=', DateTime.local().setZone(profile.timeZone).toFormat('yyyy-MM-dd'))
              .orderBy('packageDate')
              .paginate(page, 30)

            carts.push(...cartsP.rows)
            page++
          } while (page <= cartsP.pages.lastPage)

          carts.forEach((request) => {
            if (request.status !== 'canceled') {
              const idV = DateTime.fromJSDate(request.packageDate).toFormat('MMdd')
              const hourFormatter = DateTime.fromJSDate(request.packageDate).toFormat('HH:mm')
              const hoursSeconds = DateTime.fromJSDate(request.packageDate).toFormat('ss')
              const indexDate = requestsDate.findIndex((el) => el.id === idV)

              //Cria um objeto com as horas que já foram usadas
              const hourToBlocked = { hour: hourFormatter, quantity: 1 }
              if (!hoursDate[idV]) {
                if (hoursSeconds !== '01') {
                  hoursDate[idV] = {
                    hours: [hourToBlocked],
                    date: request.packageDate,
                  }
                }
              } else {
                const foundedHour = hoursDate[idV].hours.find((el) => el.hour === hourFormatter)

                if (foundedHour) {
                  ++foundedHour.quantity
                } else {
                  hoursDate[idV].hours.push(hourToBlocked)
                }
              }

              //Verifica os requests e determina se o dia deve ser bloqueado pela propriedade max
              if (indexDate === -1) {
                requestsDate.push({
                  id: idV, //Id verificador da data no lado cliente
                  date: request.packageDate,
                  max: 1,
                })
              } else {
                requestsDate[indexDate].max += 1
              }
            }
          })

          //adiciona as datas que serão bloqueadas no specialsDate
          requestsDate.forEach((req) => {
            if (req.max >= maxProfilePackage) {
              profile.options.package.specialsDates.push(req.date)
            }
          })

          //Cria uma propriedade ficticia no profile
          if (Object.keys(hoursDate).length) {
            profile.options.package.hoursBlock = hoursDate
          }
        }

        return response.json(prof)
      } else {
        response.status(403)
        return response.json({
          success: false,
          code: 403,
          message: 'Habilite sua loja para visualizar visualiza-la!',
        })
      }
    } catch (error) {
      console.error(error)
      // session.withErrors(error.messages)
      // await session.commit()
      response.redirect('back')
    }
  }

  async getRequest({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 124, metodo: 'getRequest' })
      const profile = await Profile.findBy('slug', params.slug)
      profile.request++
      profile.save()
      response.json({ request: profile.request })
    } catch (error) {
      console.error(error)
    }
  }

  async store({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 136, metodo: 'store' })
      const data = request.all()
      data.origin = encodeURI(data.origin)
      data.destination = encodeURI(data.destination)
      console.log(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${data.origin}&destinations=${data.destination}&key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg`
      )

      const req = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${data.origin}&destinations=${data.destination}&key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg`
      )
      const matrix = req.data

      console.log(matrix)

      response.json({
        distance: matrix.rows[0].elements[0].distance.value,
        google: matrix,
      })
    } catch (error) {
      const data = request.all()
      data.origin = encodeURI(data.origin)
      data.destination = encodeURI(data.destination)

      console.error({
        date: new Date(),
        url: `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${data.origin}&destinations=${data.destination}&key=AIzaSyAQ86CfA1RgY_d_stSABzYkjufYgGuKaTg`,
        error: error,
        data: error.data ? error.data : undefined,
        address: data,
      })
      response.status(404)
      response.json(error)
    }
  }

  async getFusos({ response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 170, metodo: 'getFusos' })
      const fusos = {
        'America/Rio_Branco': DateTime.local().setZone('America/Rio_Branco').toISO(),
        'America/Manaus': DateTime.local().setZone('America/Manaus').toISO(),
        'America/Sao_Paulo': DateTime.local().setZone('America/Sao_Paulo').toISO(),
        'America/Noronha': DateTime.local().setZone('America/Noronha').toISO(),
      }

      return response.json(fusos)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getCupom({ params, request, response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 188, metodo: 'getCupom' })
      const { code } = request.all()
      const profile = await ProfileR.findBy('slug', params.slug)
      if (!profile.options.activeCupom) {
        return response.status(404).json({
          code: '404-1',
          message: 'O cupom não é válido!',
        })
      }
      const cupons = await profile.cupons().where('status', 1).whereNull('deleted_at').fetch()
      const cupom = cupons.rows.find((c) => c.code.toUpperCase() == code.toUpperCase())

      if (cupom) {
        return response.json(cupom)
      } else {
        response.status(404)
        return response.json({
          code: '404-1',
          message: 'O cupom não é válido!',
        })
      }
    } catch (error) {
      console.error({
        date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
        slug: params.slug,
        cupom: request.input('code'),
        error: error,
      })
      throw error
    }
  }

  async getADMDate({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 225, metodo: 'getADMDate' })
      const profile = await ProfileR.query()
        .where({
          status: true,
          slug: params.slug,
        })
        .orWhere({
          status: 2,
          slug: params.slug,
        })
        .first()

      if (profile) {
        const prof = profile.toJSON()
        prof.version = parseFloat(Env.get('API_VERSION', 2.0))
        const profileDate = DateTime.local().setZone(prof.timeZone).toISO()
        const forceClose = prof.options.forceClose

        const delivery = !prof.options.delivery.disableDelivery
        const local = !!prof.deliveryLocal
        const closed = !(delivery || local)

        return response.json({ profileDate, forceClose, closed })
      } else {
        response.status(403)
        return response.json({
          success: false,
          code: 403,
          message: 'Habilite sua loja para visualizar!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async checkProductDisponibility({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'ApiController', linha: 469, metodo: 'checkProductDisponibility' })

      const { type, id, size, flavors, implementations, complements, slug, packageType, packageDate, amount, cart, edit, code } = request.all()

      let product,
        category,
        profile = await ProfileR.query()
          .where({
            status: true,
            slug,
          })
          .orWhere({
            status: 2,
            slug,
          })
          .first()

      if (!profile) {
        return response.status(401).json({
          disponibility: false,
          message: 'Desculpe nos o transtorno, mas esta loja no momento se encontra desativada.',
          profile,
        })
      }

      profile = profile.toJSON()
      const now = DateTime.local().setZone(profile.timeZone)
      const forceCloseDate = DateTime.fromISO(profile.options.forceClose).setZone(profile.timeZone)

      if (forceCloseDate !== null && forceCloseDate > now) {
        return response.status(401).json({
          disponibility: false,
          message: 'Desculpe nos o transtorno, mas esta loja no momento se encontra fechada.',
          profile,
        })
      }

      let newPackageDate

      if (packageType) {
        newPackageDate = DateTime.fromISO(packageDate).setZone(profile.timeZone)
      }

      if (type === 'product') {
        // PRODUTO PADRÃO
        product = await Product.query().where('id', id).with('complements').first()
        product = product.toJSON()

        category = await Category.find(product.categoryId)
        category = category.toJSON()

        /* console.log((packageType ? newPackageDate : now).setLocale('en-US')); */

        let weekDayName = (packageType && newPackageDate ? newPackageDate : now).setLocale('en-US').weekdayLong.toLowerCase(),
          nowTime = (packageType ? newPackageDate : now).toFormat('HH:mm')

        const delivery = !profile.options.delivery.disableDelivery
        const local = !!profile.deliveryLocal
        const closed = !(delivery || local)

        let categoryWeek = category.options.week,
          categoryDay = categoryWeek[weekDayName]

        const categoryIsAvaliable = categoryDay.find((hour) => nowTime >= hour.open && nowTime <= hour.close && hour.active)

        let productWeek = product.disponibility.week,
          productDay = productWeek[weekDayName]
        const amountInCart = cart.filter((item) => item.id === id).reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)

        const inventoryControl = !product.bypass_amount
        const inventoryAvailable = inventoryControl
          ? (!product.amount && product.amount !== 0) ||
            (edit ? amount + amountInCart - cart.find((item) => item.code === code).quantity : amount + amountInCart) <= product.amount
          : true

        const menuComplements = product.complements.reduce((itens, complement) => itens.concat(complement.itens), [])
        const orderComplements = complements
          .reduce((itens, complement) => itens.concat(complement.itens), [])
          .filter((item) => item.quantity * amount)

        const unavailableComplements = !orderComplements.length
          ? []
          : orderComplements.filter((item) => {
              const availableQuantity = menuComplements.find((menuItem) => menuItem.code === item.code).amount
              if (availableQuantity === undefined) return
              if (item.quantity * amount > availableQuantity && !item.bypass_amount) {
                return item
              }
            })

        if (unavailableComplements.length && profile.options.inventoryControl) {
          const names = unavailableComplements
            .map((item) => `<li>${item.name} - ${item.amount || 0} disponíve${item.amount > 1 ? 'is' : 'l'}</li>`)
            .join('')
          return response.json({
            disponibility: false,
            message: `<span>Desculpe, estes complementos não estão disponíveis nesta quantidade:</span> <br/><br/> ${names}`,
            profile,
          })
        }

        const productIsAvaliable = productDay.find((hour) => nowTime >= hour.open && nowTime <= hour.close && hour.active && inventoryAvailable)

        if (!categoryIsAvaliable || !productIsAvaliable || product.status === 0 || category.status === 0) {
          //
          return response.json({
            disponibility: false,
            message: 'Desculpe esse produto se encontra indisponível no momento!',
            closed,
            packageDate,
            newPackageDate,
            weekDayName,
            profile,
          })
        }
        return response.json({
          disponibility: true,
          profile,
        })
      } else {
        // PRODUTO PIZZA
        product = await PizzaProductR.query().where('id', id).with('complements').first()
        product = product.toJSON()

        category = await CategoryR.find(product.categoryId)
        category = category.toJSON()

        let weekDayName = (packageType && newPackageDate ? newPackageDate : now).setLocale('en-US').weekdayLong.toLowerCase(),
          nowTime = (packageType ? newPackageDate : now).toFormat('HH:mm')

        const delivery = !profile.options.delivery.disableDelivery
        const local = !!profile.deliveryLocal
        const closed = !(delivery || local)

        let categoryWeek = category.options.week,
          categoryDay = categoryWeek[weekDayName]

        const categoryIsAvaliable = categoryDay.find((hour) => nowTime >= hour.open && nowTime <= hour.close && hour.active)

        const menuComplements = product.complements.reduce((itens, complement) => itens.concat(complement.itens), [])
        let flavorCount = []
        let flavorComplements = []

        if (profile.options.inventoryControl) {
          for (const flavor of flavors) {
            flavorCount = flavors.reduce((acc, flavor) => {
              const inventoryFlavor = product.flavors.find((f) => f.code === flavor.code)
              const existingFlavor = acc.find((f) => f.code === flavor.code)
              if (existingFlavor) {
                existingFlavor.quantity++
              } else {
                acc.push({
                  code: flavor.code,
                  name: flavor.name,
                  quantity: 1,
                  amount: inventoryFlavor.amount,
                  bypass_amount: inventoryFlavor.bypass_amount,
                })
              }
              return acc
            }, [])

            if (flavor.complements) {
              flavorComplements.push(
                ...flavor.complements.reduce((itens, complement) => itens.concat(complement.itens), []).filter((item) => item.quantity)
              )
            }
          }

          const unavailableFlavors = flavorCount.filter((flavor) => flavor.quantity * cart.quantity > flavor.amount && !flavor.bypass_amount)
          if (unavailableFlavors.length) {
            const unavailableFlavorsMessage = unavailableFlavors
              .map((flavor) => `<li>${flavor.name} - ${flavor.amount} disponíve${flavor.amount > 1 ? 'is' : 'l'}</li>`)
              .join('')
            return response.json({
              disponibility: false,
              message: `Desculpe, os seguintes sabores não estão mais disponíveis na quantidade desejada: <ul>${unavailableFlavorsMessage}</ul>`,
              profile,
            })
          }

          for (const complement of flavorComplements) {
            const totalAmount = flavorComplements
              .filter((comp) => comp.code === complement.code)
              .reduce((accumulator, currentValue) => accumulator + currentValue.quantity * amount, 0)
            const inventory = menuComplements.find((comp) => comp.code === complement.code).amount

            if (totalAmount > inventory && !complement.bypass_amount)
              return response.json({
                disponibility: false,
                message: `O complemento ${complement.name} não está mais disponível na quantidade desejada (apenas ${inventory} disponíveis)`,
                profile,
              })
          }
        }

        /* const orderComplements = complements.reduce((itens, complement) => itens.concat(complement.itens), []).filter(item => item.quantity) */

        /* const unavailableComplements = !orderComplements.length ? [] : orderComplements.filter((item) => {
          const availableQuantity = menuComplements.find(menuItem => menuItem.code === item.code).inventory
          if(availableQuantity === undefined) return
          if(item.quantity > availableQuantity) {
            return item
          }
        }) */

        if (
          (!categoryIsAvaliable || ((product.status === 0 || category.status === 0) && !category.bypass_amount)) &&
          profile.options.inventoryControl
        ) {
          //
          return response.json({
            disponibility: false,
            message: 'Desculpe esse produto se encontra indisponível no momento!',
            closed,
            packageDate,
            profile,
          })
        }

        const haveSize = product.sizes.find((s) => s.name === size)

        // TAMANHO DE PIZZA
        if (!haveSize.status) {
          return response.json({
            disponibility: false,
            message: 'Desculpe esse produto se encontra indisponível no momento!',
            closed: !(!delivery || local),
            packageDate,
            profile,
          })
        }

        // SABORES DE PIZZA
        const haveFlavors = []
        flavors.forEach((flavor) => {
          const haveFlavor = product.flavors.find((f) => f.code === flavor.code)
          haveFlavors.push(haveFlavor)
        })

        if (haveFlavors.some((flavor) => flavor.status === false)) {
          let filteredFlavors = []

          haveFlavors.forEach((f) => {
            let haveName = filteredFlavors.some((name) => name === f.name)
            if (f.status === false && !haveName) {
              filteredFlavors.push(f.name)
            }
          })

          return response.json({
            disponibility: false,
            message:
              filteredFlavors.length > 1
                ? `Desculpe os sabores ${filteredFlavors.join(', ')} se encontram indisponíveis no momento!`
                : `Desculpe o sabor ${filteredFlavors.join(' ')} se encontra indisponível no momento!`,
            closed: !(!delivery || local),
            profile,
          })
        }

        // SABORES DE BORDAS E MASSAS

        const haveImplementation = product.implementations.find(
          (implementation) => implementations.length > 0 && implementation.code === implementations[0].code
        )

        if (haveImplementation && haveImplementation.status === false) {
          return response.json({
            disponibility: false,
            message: `Desculpe o complemento ${haveImplementation.name} se encontra indisponível no momento!`,
            closed: !(!delivery || local),
            profile,
          })
        }
      }

      return response.json({
        disponibility: true,
        profile,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async checkProfileExistsBySlug({ params, response }) {
    try {
      const profile = await ProfileR.findBy('slug', params.slug)
      return response.json({ exists: !!profile })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async joinQueue({ params, request, response }) {
    // adicionar na fila
    const { slug } = params
    const profile = await Profile.findBy('slug', slug)
    const { commandName, commandId, tableId, openedId } = request.post()
    const profileTopic = Ws.getChannel('profile:*').topic(`profile:${slug}`)
    if (profile.options.queues.bartender) {
      let queue
      const existQueue = profile.options.queues.bartender.find((queue) => queue.tableId === tableId)

      if (!existQueue) {
        queue = {
          id: randomBytes(20).toString('hex'),
          commandName,
          commandId,
          tableId,
          openedId,
          created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
        }
        profile.options.queues.bartender.push(queue)
        await profile.save()
      }
      if (profileTopic) {
        profileTopic.broadcast(`profile:${slug}`, { ...queue, type: 'join' })
      }
    }

    return response.json(profile.options.queues)
  }

  async leaveQueue({ params, request, response }) {
    // remover da fila
    const { slug } = params
    const { tableId } = params
    const profile = await Profile.findBy('slug', slug)
    const profileTopic = Ws.getChannel('profile:*').topic(`profile:${slug}`)
    const indexCall = profile.options.queues.bartender.findIndex((queue) => queue.tableId == tableId)

    if (!profile.options.queues) {
      return response.json(profile.options) //aqui
    }

    if (profile.options.queues.bartender.length > 0) {
      const queue = profile.options.queues.bartender
      if (indexCall >= 0) {
        queue.splice(indexCall, 1)
      }
      await profile.save()
      if (profileTopic) {
        profileTopic.broadcast(`profile:${slug}`, { ...profile.options.queues, type: 'leave' })
      }
      return response.json(profile.options)
    } else if (profile.options.queues.bartender.length === 0) {
      return response.json(profile.options) //aqui
    }
  }

  async queueSiteNumber({ response }) {
    try {
      const profile = await Profile.find(1)
      const number = profile.options.queueNumbers.shift()
      profile.options.queueNumbers.push(number)
      await profile.save()
      response.json({ number: number })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = ApiController
