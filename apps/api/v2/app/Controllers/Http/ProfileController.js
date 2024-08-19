'use strict'

const moment = use('moment')

const Drive = use('Drive')
const Helpers = use('Helpers')
const Encryption = use('Encryption')
const Env = use('Env')

const fs = use('fs')

const User = use('App/Models/User')
const UserR = use('App/Models/ReadOnly/User')
const Profile = use('App/Models/Profile')
const Bartender = use('App/Models/Bartender')
const Fee = use('App/Models/Fee')
const Utility = use('Utility')
const axios = require('axios')
const { DateTime } = require('luxon')

class ProfileController {
  async getRegister({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 22, metodo: 'getRegister' })
      const user = await auth.getUser()
      const sysreq = await user.requests().where('status', 'pending').last()

      return response.send(
        view.render('inner.profile.profile_register', {
          profile: null,
          systemRequest: sysreq ? sysreq.toJSON() : null,
        })
      )
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      throw error
    }
  }
  // async index({ response, view, auth }) {
  //   console.log('Starting: ', { controller: 'ProfileController', linha: 41, metodo: 'index' })
  //   const user = await User.find(auth.user.id)
  //   const profile = await user.profile().fetch()
  //   const sysreq = await user.requests().where('status', 'pending').last()
  //   const prof = profile.toJSON()
  //   prof.whatsapp = prof.whatsapp.substring(2, prof.whatsapp.length)

  //   const deliveryAccess = await Utility.ControlAccess(user)

  //   if (deliveryAccess && !prof.address.street) {
  //     return response.send(
  //       view.render('inner.profile.profileAddress', {
  //         profile: prof,
  //         systemRequest: sysreq ? sysreq.toJSON() : null
  //       })
  //     )
  //   }
  //   if (deliveryAccess) {
  //     if (!prof.taxDelivery.length && !prof.options.disableDelivery) {
  //       return response.send(
  //         view.render('inner.profile.profileTax', {
  //           profile: prof,
  //           systemRequest: sysreq ? sysreq.toJSON() : null
  //         })
  //       )
  //     }
  //   }

  //   // return response.json(prof)
  //   response.send(
  //     view.render('inner.profile.profile', {
  //       profile: prof,
  //       systemRequest: sysreq ? sysreq.toJSON() : null
  //     })
  //   )
  // }

  async storeStep1({ request, response, auth }) {
    console.log('Starting: ', { controller: 'ProfileController', linha: 79, metodo: 'storeStep1' })
    const data = request.except(['_csrf'])
    const user = await auth.getUser()
    const invoice = await user.invoices().where('type', 'first').first()

    const alreadyUsesSlug = await Profile.findBy('slug', data.slug)

    const {
      data: { existis: alreadyUsesSlugV2 },
    } = await axios.get(`https://api.whatsmenu.com.br/api/v2/checkProfileExistsBySlug/${data.slug}`)

    if (alreadyUsesSlug || alreadyUsesSlugV2) {
      return response.status(409).json({ message: 'O slug escolhido ja está em uso, por favor escolha outro.' })
    }

    data.whatsapp = `${data.whatsapp.split(' ').join('').split('-').join('')}`
    data.userId = user.id
    data.typeDelivery = 'neighborhood'
    // data.options.tracking = {pixel: ''}
    // data.options.favicon = ''

    // console.log(data);

    if (user.controls.disableInvoice || (invoice && invoice.status === 'paid')) {
      data.status = 1
    }

    const logo = request.file('logo', {
      types: ['image'],
      size: '8mb',
    })

    try {
      if (logo) {
        await logo.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // const logoJimp = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${logo.clientName}`)))

        // const newHeight = 145

        // logoJimp
        //   .cover((logoJimp.getWidth() / logoJimp.getHeight()) * newHeight, newHeight)
        //   .quality(100)

        // await logoJimp.writeAsync(Helpers.tmpPath(`uploads/t${logo.clientName}`))

        await Drive.put(`${Env.get('NODE_ENV')}/${data.slug}/${logo.clientName}`, fs.readFileSync(Helpers.tmpPath(`uploads/${logo.clientName}`)), {
          ContentType: logo.headers['content-type'],
          ACL: 'public-read',
        })
        data.logo = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${logo.clientName}`)
        fs.unlinkSync(Helpers.tmpPath(`uploads/${logo.clientName}`))
      }
    } catch (error) {
      console.error('LOGO: ', error)
    }

    const background = request.file('background', {
      types: ['image'],
      size: '32mb',
    })

    try {
      if (background) {
        await background.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // const backgroundJimp = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${background.clientName}`)))

        // const newHeight = 145

        // backgroundJimp
        //   .cover((logoJimp.getWidth() / logoJimp.getHeight()) * newHeight, newHeight)
        //   .quality(80)

        // await backgroundJimp.writeAsync(Helpers.tmpPath(`uploads/tb${background.clientName}`))

        await Drive.put(
          `${Env.get('NODE_ENV')}/${data.slug}/${background.clientName}`,
          fs.readFileSync(Helpers.tmpPath(`uploads/${background.clientName}`)),
          {
            ContentType: background.headers['content-type'],
            ACL: 'public-read',
          }
        )
        // profile.logo = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/logo.${logo.extname}`)
        data.background = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${background.clientName}`)
        fs.unlinkSync(Helpers.tmpPath(`uploads/${background.clientName}`))
      }
    } catch (error) {
      console.error('BACKGROUND: ', error)
    }

    const favicon = request.file('favicon', {
      types: ['image'],
      size: '2mb',
    })

    try {
      if (favicon) {
        await favicon.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // const faviconJimp = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${favicon.clientName}`)))

        // logoJimp
        //   .cover(16, 16)
        //   .quality(80)

        // await faviconJimp.writeAsync(Helpers.tmpPath(`uploads/t${favicon.clientName}`))

        await Drive.put(
          `${Env.get('NODE_ENV')}/${data.slug}/${favicon.clientName}`,
          fs.readFileSync(Helpers.tmpPath(`uploads/${favicon.clientName}`)),
          {
            ContentType: favicon.headers['content-type'],
            ACL: 'public-read',
          }
        )
        data.options = {
          favicon: Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${favicon.clientName}`),
        }
        fs.unlinkSync(Helpers.tmpPath(`uploads/${favicon.clientName}`))
      }
    } catch (error) {
      console.error('FAVICON: ', error)
    }

    if (!data.options) {
      data.options = {}
    }

    data.options.locale = {
      language: user.controls.language || 'pt-BR',
      currency: String(user.controls.currency).toUpperCase(),
    }

    try {
      const profile = await Profile.create(data)
      await Bartender.create({
        name: user.name,
        profileId: profile.id,
        password: user.password,
        controls: {
          type: 'manager',
          defaultCashier: true,
        },
      })
      profile.not_security_key = true
      return response.json(profile.toJSON())
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async setForceCloseDate({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 196, metodo: 'setForceCloseDate' })
      const data = request.except(['_csrf'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const update = {}

      if (data.options) {
        update.options = profile.options

        // Setando data caso checkbox esteja marcado
        if (JSON.parse(data.options.forceCloseOn)) {
          update.options.forceClose = data.options.forceClose
        } else {
          update.options.forceClose = null
        }
      }

      profile.merge(update)
      await profile.save()
      return response.json(profile)
    } catch (error) {
      console.error(error)
    }
  }

  async updateStep1({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 225, metodo: 'updateStep1' })
      // response.status(403)
      // response.json({
      //   cod: '403-247',
      //   message: 'update not allowed'
      // });

      const data = request.except(['_csrf', '_method'])

      // return response.json(data);
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const alreadyUsesSlug = await Profile.findBy('slug', data.slug)
      const {
        data: { existis: alreadyUsesSlugV2 },
      } = await axios.get(`https://api.whatsmenu.com.br/api/v2/checkProfileExistsBySlug/${data.slug}`)

      if (alreadyUsesSlugV2 || (alreadyUsesSlug && alreadyUsesSlug.id !== profile.id)) {
        return response.status(409).json({ message: 'O slug escolhido ja está em uso, por favor escolha outro.' })
      }
      const update = {}

      profile.name = data.name
      if (data.slug != profile.slug) {
        update.slug = data.slug
        // profile.slug = data.slug
      }
      // profile.whatsapp = `55${data.whatsapp.split(' ').join('').split('-').join('')}`
      profile.description = data.description
      // profile.color = data.color
      // profile.minval = data.minval
      // profile.deliveryLocal = data.deliveryLocal ? true : false

      update.whatsapp = `${data.whatsapp.split(' ').join('').split('-').join('')}`
      // update.description = data.description
      update.color = data.color
      update.minval = data.minval
      update.minvalLocal = data.minvalLocal
      // update.deliveryLocal = data.deliveryLocal ? true : false
      if (data.options) {
        data.options = typeof data.options === 'string' ? JSON.parse(data.options) : data.options
        update.options = data.options
        update.options.favicon = data.options.favicon
        // Setando data caso checkbox esteja marcado
        if (data.options.forceCloseOn == 'on') {
          update.options.forceClose = data.options.forceClose
        } else {
          update.options.forceClose = null
        }

        if (!update.options.tracking) {
          update.options.tracking = { pixel: data.options.tracking.pixel }
        } else {
          update.options.tracking.pixel = data.options.tracking.pixel
        }
      }

      // profile.showTotal = data.showTotal ? true : false
      // console.log(update);
      const logo = request.file('logo', {
        types: ['image'],
        size: '8mb',
      })
      if (logo) {
        // console.log("Aqui - 277:", logo)
        await logo.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // const logoJimp = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${logo.clientName}`)))
        // const newHeight = 145

        // logoJimp
        //   .cover((logoJimp.getWidth() / logoJimp.getHeight()) * newHeight, newHeight)
        //   .quality(80)

        if (logo.moved()) {
          // await logoJimp.writeAsync(Helpers.tmpPath(`uploads/t${logo.clientName}`))

          await Drive.put(`${Env.get('NODE_ENV')}/${data.slug}/${logo.clientName}`, fs.readFileSync(Helpers.tmpPath(`uploads/${logo.clientName}`)), {
            ContentType: logo.headers['content-type'],
            ACL: 'public-read',
          })
          // profile.logo = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/logo.${logo.extname}`)
          update.logo = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${logo.clientName}`)
          fs.unlinkSync(Helpers.tmpPath(`uploads/${logo.clientName}`))
        } else {
          return response.redirect('back')
        }
      }

      const background = request.file('background', {
        types: ['image'],
        size: '32mb',
      })

      if (background) {
        await background.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // tratamento de imagem do background: evita erro "marker was not found" tratando a imagem até 5 vezes
        // async function retryResize(options, retries = 0) {
        //   let { imagePath, width, heigth, quality, maxRetries = 5 } = options;

        //   let image = null;
        //   try {
        //     image = await Jimp.read(imagePath);
        //     image
        //       .cover(width, heigth)
        //       .quality(quality)

        //   } catch (e) {
        //     if (retries >= maxRetries) {
        //       throw e;
        //     }

        //     image = await retryResize(options, retries++);
        //   }

        //   return image;
        // }

        if (background.moved()) {
          // pegando imagem tratada pelo jimp

          // const backgroundJimp = await retryResize({ imagePath: fs.readFileSync(Helpers.tmpPath(`uploads/${background.clientName}`)), width: 768, heigth: 307, quality: 80 })

          // await backgroundJimp.writeAsync(Helpers.tmpPath(`uploads/tb${background.clientName}`))

          await Drive.put(
            `${Env.get('NODE_ENV')}/${data.slug}/${background.clientName}`,
            fs.readFileSync(Helpers.tmpPath(`uploads/${background.clientName}`)),
            {
              ContentType: background.headers['content-type'],
              ACL: 'public-read',
            }
          )

          update.background = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${background.clientName}`)
          fs.unlinkSync(Helpers.tmpPath(`uploads/${background.clientName}`))
        } else {
          return response.json(profile.toJSON())
        }
      }

      const favicon = request.file('favicon', {
        types: ['image'],
        size: '2mb',
      })

      if (favicon) {
        await favicon.move(Helpers.tmpPath('uploads'), {
          overwrite: true,
        })

        // tratamento de imagem do favicon: evita erro "marker was not found" tratando a imagem até 5 vezes
        // async function retryResize(options, retries = 0) {
        //   let { imagePath, width, heigth, quality, maxRetries = 5 } = options;

        //   let image = null;
        //   try {
        //     image = await Jimp.read(imagePath);
        //     image
        //       .cover(width, heigth)
        //       .quality(quality)

        //   } catch (e) {
        //     if (retries >= maxRetries) {
        //       throw e;
        //     }

        //     image = await retryResize(options, retries++);
        //   }

        //   return image;
        // }

        if (favicon.moved()) {
          // pegando imagem tratada pelo jimp
          // const faviconJimp = await retryResize({ imagePath: fs.readFileSync(Helpers.tmpPath(`uploads/${favicon.clientName}`)), width: 16, heigth: 16, quality: 80 })

          // await faviconJimp.writeAsync(Helpers.tmpPath(`uploads/f${favicon.clientName}`))

          await Drive.put(
            `${Env.get('NODE_ENV')}/${data.slug}/${favicon.clientName}`,
            fs.readFileSync(Helpers.tmpPath(`uploads/${favicon.clientName}`)),
            {
              ContentType: favicon.headers['content-type'],
              ACL: 'public-read',
            }
          )

          update.options.favicon = Drive.getUrl(`${Env.get('NODE_ENV')}/${data.slug}/${favicon.clientName}`)
          fs.unlinkSync(Helpers.tmpPath(`uploads/${favicon.clientName}`))
        } else {
          return response.json(profile.toJSON())
        }
      }

      profile.merge(update)
      await profile.save()
      return response.json(profile.toJSON())
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.all(),
        error: error,
      })
      throw error
    }
  }

  async addAddress({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 420, metodo: 'addAddress' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])

      profile.address = data

      await profile.save()

      return response.json({ address: profile.address })
    } catch (error) {
      console.error({
        date: new Date(),
        error: error,
      })
    }
  }

  async updAddress({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 441, metodo: 'updAddress' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])

      profile.address = data

      await profile.save()

      return response.json({ address: profile.address })
    } catch (error) {
      console.error({
        date: new Date(),
        error: error,
      })
    }
  }

  async addTaxDelivery({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 462, metodo: 'addTaxDelivery' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])
      // return response.json(data)
      let newTax

      if (profile.typeDelivery === 'km') {
        newTax = {
          code: Encryption.encrypt(data.distance).substring(0, 6),
          distance: parseFloat(data.distance.replace(',', '.')),
          time: data.time,
          value: data.value ? data.value : 'A consultar',
        }
      } else {
        newTax = {
          code: Encryption.encrypt(data.distance).substring(0, 6),
          city: data.city,
          neighborhoods: [
            {
              code: Encryption.encrypt(data.distance).substring(0, 6),
              name: data.distance,
              time: data.time,
              value: data.value ? parseFloat(data.value.replace(',', '.').replace('R$', '').split(' ').join('')) : null,
            },
          ],
        }
      }

      let exist

      if (profile.typeDelivery === 'km') {
        exist = profile.taxDelivery.find((tax) => tax.distance === parseFloat(data.distance))
      } else {
        exist = profile.taxDelivery.find((tax) => tax.city === data.city)
      }

      if (!exist) {
        profile.taxDelivery.push(newTax)

        if (profile.taxDelivery.length > 1 && profile.typeDelivery === 'km') {
          profile.taxDelivery = profile.taxDelivery.sort((a, b) => a.distance - b.distance)
        }

        if (profile.taxDelivery.length > 1 && profile.typeDelivery === 'neighborhood') {
          // console.log(profile.taxDelivery)
          profile.taxDelivery = profile.taxDelivery.sort((a, b) => {
            if (a.city.toLowerCase() < b.city.toLowerCase()) return -1
            if (a.city.toLowerCase() > b.city.toLowerCase()) return 1

            return 0
          })
        }

        await profile.save()

        return response.json({
          success: true,
          tax: newTax,
        })
      } else if (profile.typeDelivery === 'neighborhood') {
        const existNeighborhood = exist.neighborhoods.find((n) => n.name.toLowerCase() === newTax.neighborhoods[0].name.toLowerCase())

        if (!existNeighborhood) {
          exist.neighborhoods.push(newTax.neighborhoods[0])
          exist.neighborhoods = exist.neighborhoods.sort((a, b) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1

            return 0
          })
          await profile.save()
          return response.json({
            success: true,
            tax: newTax,
          })
        } else {
          response.status(403)

          response.json({
            success: false,
            message: 'O bairro não pode ser repetido!',
          })
        }
      } else {
        response.status(403)

        response.json({
          success: false,
          message: 'O kilometro não pode ser repetido!',
        })
      }
    } catch (error) {
      console.error({
        date: new Date(),
        error: error,
      })
      throw error
    }
  }

  async deleteTaxDelivery({ params, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 567, metodo: 'deleteTaxDelivery' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()

      if (profile.typeDelivery === 'km') {
        const index = profile.taxDelivery.findIndex((t) => t.code === params.code)
        profile.taxDelivery.splice(index, 1)
      } else {
        profile.taxDelivery.forEach((tax, i) => {
          const index = tax.neighborhoods.findIndex((n) => n.code === params.code)
          if (index !== -1) {
            tax.neighborhoods.splice(index, 1)
          }
          if (tax.neighborhoods.length === 0) {
            profile.taxDelivery.splice(i, 1)
          }
        })
      }
      await profile.save()

      return response.json({
        success: true,
      })
    } catch (error) {
      console.error({
        date: new Date(),
        error: error,
      })
    }
  }

  async getToken({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 605, metodo: 'getToken' })
      const user = await UserR.find(auth.user.id)

      response.json(await auth.authenticator('jwt').generate(user))
    } catch (error) {
      console.error(error)
    }
  }

  async updateTaxType({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 616, metodo: 'updateTaxType' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.all()
      // return response.json(data)

      profile.typeDelivery = data.typeDelivery
      profile.taxDelivery = []
      await profile.save()

      response.json({
        success: true,
        typeDelivery: profile.typeDelivery,
        taxDelivery: profile.taxDelivery,
      })
    } catch (error) {
      console.error({
        date: new Date(),
        error: error,
      })
      response.status(500).json({
        success: false,
        error: error,
      })
    }
  }

  async getWeek({ response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 646, metodo: 'getWeek' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      response.json(profile.week)
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })

      response.status(500)
      response.json({
        success: false,
        error: error,
      })
    }
  }

  async addHour({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 667, metodo: 'addHour' })
      const data = request.except(['_csrf', '_method'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      data.days.forEach((day) => {
        let checkDay = true
        profile.week[day.name].forEach((hour) => {
          if (
            convertHour(data.open) >= convertHour(hour.open) &&
            convertHour(data.open) <= convertHour(hour.close) &&
            convertHour(data.close) <= convertHour(hour.close) &&
            convertHour(data.close) >= convertHour(hour.open)
          ) {
            checkDay = false
          }
        })
        // console.log({day: day, checked: checkDay})
        if (checkDay) {
          profile.week[day.name].push({
            code: Encryption.encrypt(day).substring(0, 6),
            open: data.open,
            close: data.close,
          })

          profile.week[day.name] = profile.week[day.name].sort((a, b) => {
            if (a.open < b.open) return -1
            if (a.open > b.open) return 1

            return 0
          })
        }
      })
      // console.log(profile.week)

      await profile.save()
      return response.json({
        success: true,
        week: profile.week,
      })
    } catch (error) {
      console.error({
        // date: moment().format(),
        data: data,
        error: error,
      })

      response.json({
        success: false,
        error: error,
      })
    }
  }

  async updHour({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 725, metodo: 'updHour' })
      const data = request.except(['_csrf', '_method'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const item = profile.week[data.day].find((h) => h.code === data.code)
      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      item[data.type] = data.hour

      if (convertHour(item.close) > convertHour(item.open)) {
        profile.week[data.day] = profile.week[data.day].sort((a, b) => {
          if (a.open < b.open) return -1
          if (a.open > b.open) return 1

          return 0
        })

        await profile.save()
      }

      return response.json({
        success: true,
        week: profile.week,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async saveWeek({ request, response, auth }) {
    try {
      const data = request.except(['_csrf', '_method'])
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const haveInvalid = Object.values(data.week).some((date) => date.some((day) => day.open >= day.close))

      if (haveInvalid) {
        return response.status(403).json({ message: 'Horário(s) inválido(s)', data: data.week })
      }
      profile.week = data.week
      await profile.save()

      return response.json(profile.week)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async removeHour({ auth, params, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 779, metodo: 'removeHour' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      profile.week[params.day].splice(
        profile.week[params.day].findIndex((h) => h.code === params.code),
        1
      )

      await profile.save()

      response.json({
        success: true,
        week: profile.week,
        hours: profile.week[params.day],
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        params: { day: params.day, code: params.code },
        error: error,
      })

      response.json({
        success: false,
        error: error,
      })
    }
  }

  async insertOption({ response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 809, metodo: 'insertOption' })
      const profiles = await Profile.all()

      for (let profile of profiles.rows) {
        profile.options.placeholders = {
          productObs: 'Ex.: Sem maionese, sem salada, etc...',
          pizzaObs: 'Deixe aqui qualquer observação no produto.',
          statusProduction: '[NOME] seu pedido já está em produção!',
          statusSend: 'Obaaa, [NOME] seu pedido já está a caminho!',
          statusToRemove: 'Obaaa, [NOME] seu pedido já está pronto para retirada!',
          clientText: 'Olá [NOME], Tudo bem?',
          welcomeMessage: `Olá! Seja bem vindo ao ${profile.name}

Veja o nosso cardápio e faça seu pedido rapidamente

https://www.whatsmenu.com.br/${profile.slug}

Equipe ${profile.name}`,
          absenceMessage: `Olá [Nome], estamos fechados no momento.

Os horários de funcionamento e o cardápio completo você pode consultar em https://whatsmenu.com.br/${profile.slug}

Até mais`,
        }
        profile.options.print.textOnly = false
        profile.save()
      }

      response.json({
        success: true,
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
    }
  }

  async deleteProfiles({ response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 837, metodo: 'deleteProfiles' })
      const users = await User.all()
      const allDeletes = []

      for (const user of users.rows) {
        const profile = await user.profile().fetch()
        if (profile) {
          const deletes = await Profile.query().where('userId', user.id).where('id', '!=', profile.id).fetch()

          if (deletes && deletes.rows.length > 0) {
            allDeletes.push(...deletes.toJSON())
          }
        }
      }

      return response.json(allDeletes)
    } catch (error) {
      console.error(error)
      return response.send(error)
    }
  }

  async updateFuso({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 861, metodo: 'updateFuso' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      profile.timeZone = request.input('fuso')
      await profile.save()

      return response.json({
        success: true,
        timeZone: request.input('fuso'),
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      return response.json(error)
    }
  }

  async addFormPayment({ response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 883, metodo: 'addFormPayment' })
      const profiles = await Profile.all()
      const forms = [
        {
          flags: [],
          status: true,
          payment: 'credit',
        },
        {
          flags: [],
          status: true,
          payment: 'debit',
        },
        {
          flags: [],
          status: false,
          payment: 'snack',
        },
        {
          flags: [],
          status: false,
          payment: 'food',
        },
      ]

      for (let profile of profiles.rows) {
        for (let form of forms) {
          if (!profile.formsPayment.find((f) => f.payment === form.payment)) {
            profile.formsPayment.push(form)
          }
        }

        await profile.save()
      }

      response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updatePaymentMethod({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 997, metodo: 'updatePaymentMethod' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const body = request.post().data || null

      if (!body) return response.status(422)

      const formPayment = profile.formsPayment.find((f) => f.payment === body.payment)
      formPayment.status = body.status
      formPayment.addon = body.addon

      if ('key' in body) formPayment.key = body.key
      if ('flags' in body) {
        body.flags.forEach((flag) => {
          if (!flag.code) {
            flag.code = Encryption.encrypt(flag.name).substring(0, 6)
          }
        })
        formPayment.flags = body.flags
      }

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error.message)
      response.status(500)
      return response.json(error)
    }
  }

  async updatePix({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 932, metodo: 'updatePix' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const formPayment = profile.formsPayment.find((f) => f.payment === 'pix')
      formPayment.key = request.input('key')
      formPayment.status = request.input('status')

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async addFlagPayment({ request, params, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 950, metodo: 'addFlagPayment' })
      const user = await auth.getUser()
      const paymentId = params.payment
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])

      const formPayment = profile.formsPayment.find((f) => f.payment === paymentId)
      formPayment.flags.push({
        code: Encryption.encrypt(data.name).substring(0, 6),
        name: data.name,
        image: null,
      })

      formPayment.flags = formPayment.flags.sort((a, b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
        return 0
      })

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async setPixOnline({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1014, metodo: 'setPixOnline' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const { onlinePix } = request.all()
      profile.options.onlinePix = onlinePix
      const pix = profile.formsPayment.find((f) => f.payment === 'pix')
      if (pix) {
        pix.status = onlinePix
      }
      await profile.save()
      return response.json({ onlinePix })
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }
  async setCardOnline({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1127, metodo: 'setCardOnline' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const { onlineCard } = request.all()
      profile.options.onlineCard = onlineCard
      await profile.save()
      return response.json({ onlineCard })
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async setFormPayment({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 932, metodo: 'updatePix' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const { formPayment } = request.all()
      formPayment.status = formPayment

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async deleteFlagPayment({ request, params, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 980, metodo: 'deleteFlagPayment' })
      const user = await auth.getUser()
      const paymentId = params.payment
      const flagCode = params.code
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])

      const formPayment = profile.formsPayment.find((f) => f.payment === paymentId)
      if (formPayment) {
        const index = formPayment.flags.findIndex((flag) => flag.code === flagCode)
        if (index > -1) {
          formPayment.flags.splice(index, 1)
        }
      }

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async updatePicPay({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1006, metodo: 'updatePicPay' })
      // response.status(403)
      // return response.json({
      //   erro: 403,
      //   message: "operação não permitida"
      // })

      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const formPayment = profile.formsPayment.find((f) => f.payment === 'picpay')
      formPayment.key = request.input('key')

      await profile.save()
      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      response.status(500)
      return response.json(error)
    }
  }

  async playPausePayment({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1024, metodo: 'playPausePayment' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const { payment } = request.all()

      const formPayment = profile.formsPayment.find((f) => f.payment === payment)
      formPayment.status = !formPayment.status
      await profile.save()

      return response.json(formPayment)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateNeighborhood({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1042, metodo: 'updateNeighborhood' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])
      const tax = profile.taxDelivery.find((tax) => tax.code === data.tax)

      if (tax) {
        const neighborhood = tax.neighborhoods.find((n) => n.code === data.neighborhood.code)
        const neighborname = tax.neighborhoods.find(
          (n) => n.name.toLowerCase() === data.neighborhood.name.toLowerCase() && n.code !== data.neighborhood.code
        )

        if (!neighborname) {
          neighborhood.name = data.neighborhood.name
          neighborhood.time = data.neighborhood.time
          neighborhood.value = data.neighborhood.value ? parseFloat(data.neighborhood.value) : null

          await profile.save()
          return response.json(neighborhood)
        } else {
          response.status(403)
          return response.json({
            error: '403-1018',
            message: 'O Nome do bairro não pode ser repetido!',
          })
        }
      } else {
        return response.status(403).json({ error: '404-800', message: 'neighborhood not found!' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateTaxKM({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1079, metodo: 'updateTaxKM' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf', '_method'])

      const tax = profile.taxDelivery.find((t) => t.code === data.tax.code)
      const taxDistance = profile.taxDelivery.find((t) => t.distance == data.tax.distance && t.code != data.tax.code)

      if (tax) {
        if (!taxDistance) {
          tax.distance = parseFloat(data.tax.distance.replace(',', '.'))
          tax.time = data.tax.time
          tax.value = data.tax.value ? data.tax.value : 'A consultar'

          await profile.save()

          return response.json(tax)
        } else {
          response.status(403)
          return response.json({
            error: '403-1054',
            message: 'O KM não pode ser repetido',
          })
        }
      } else {
        return response.status(403).json({
          error: '404-1061',
          message: 'Tax delivery not found!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async fixTaxValue({ response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1120, metodo: 'fixTaxValue' })
      const users = await User.all()

      for (let user of users.rows) {
        const profile = await user.profile().fetch()

        if (profile) {
          if (profile.typeDelivery === 'km') {
            profile.taxDelivery.forEach((tax) => {
              if (typeof tax.distance == 'string') {
                tax.distance = parseFloat(tax.distance)
              }
            })
          }

          // else {
          //   profile.taxDelivery.forEach(tax => {
          //     tax.neighborhoods.forEach(n => n.value = parseFloat(n.value))
          //   })
          // }

          await profile.save()
        }
      }

      response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getTaxDelivery({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1157, metodo: 'getTaxDelivery' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      if (profile) {
        return response.json(profile.taxDelivery)
      }
      response.status(404)
      return response.json({ code: '404-877', message: 'profile not found' })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getAllProfiles({ response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1174, metodo: 'getAllProfiles' })
      const users = await User.all()
      const all = []

      for (let user of users.rows) {
        const profile = await user.profile().fetch()

        if (!user.controls.type && profile && profile.status == 1) {
          u = user.toJSON()
          u.profile = profile.toJSON()
          all.push(u)
        }
      }

      response.json(all.map((u) => u.profile.id))
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async myProfile({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1197, metodo: 'myProfile' })
      const user = await UserR.find(auth.user.id)
      const profile = await user.profile().fetch()
      const now = moment([])

      if (profile) {
        const fees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()
        profile.fees = fees.toJSON()

        const oldDates = []
        const specialsDates = profile.options.package.specialsDates.filter((datas) => {
          const dateSpecial = moment(new Date(datas)).set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
          now.set({ hour: 0, minutes: 0, seconds: 0, milliseconds: 0 })
          const diff = dateSpecial.diff(now, 'days')

          if (diff >= 0) {
            return datas
          } else {
            oldDates.push(datas)
          }
        })

        if (oldDates.length) {
          profile.options.package.specialsDates = specialsDates
          // await profile.save()
        }
      }

      if (!user.security_key && profile) {
        profile.not_security_key = true
      }

      return response.json(profile)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async myProfile2({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProfileController', linha: 1239, metodo: 'myProfile2' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()

      profile.fees = fees.toJSON()

      return response.json(profile)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async addNewPixNegotiationAsaas({ request, response }) {
    const { profileId, ...negotiations } = request.all()
    try {
      const profile = await Profile.find(profileId)

      if (!profile.options.asaas) {
        return response.status(403).json({ message: 'Este perfil não possui um cadastro na Asaas' })
      }
      if (!profile.options.asaas.negotiations) {
        profile.options.asaas.negotiations = {
          pix: [],
        }
      }

      if (profile.options.asaas.negotiations.pix.length) {
        const previousExpirationDate = DateTime.fromFormat(
          profile.options.asaas.negotiations.pix[profile.options.asaas.negotiations.pix.length - 1].expiration_date,
          'yyyy-MM-dd HH:mm:ss'
        )
        const newExpirationDate = DateTime.fromFormat(negotiations.expiration_date, 'yyyy-MM-dd hh:mm:ss')
        if (newExpirationDate.diff(previousExpirationDate, 'days').days <= 90) {
          return response.status(403).json({ message: 'A renegociação anterior ainda está em vigor' })
        }
      }

      profile.options.asaas.negotiations.pix.push(negotiations)
      await profile.save()
      const pix = profile.options.asaas.negotiations.pix
      return response.json({ pix })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async botConfig({ request, response }) {
    try {
      const { profileId, whatsapp } = request.all()
      const profile = await Profile.find(profileId)
      profile.options.bot.whatsapp = whatsapp
      await profile.save()
      return response.json({ whatsapp })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
module.exports = ProfileController
