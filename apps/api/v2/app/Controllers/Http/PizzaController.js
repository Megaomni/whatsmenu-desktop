'use strict'

const Jimp = require('jimp')
const WmProvider = use('WmProvider')

const User = use('App/Models/User')
const PizzaProduct = use('App/Models/PizzaProduct')
const PizzaComplement = use('App/Models/PizzaComplement')
const Complement = use('App/Models/Complement')
const Category = use('App/Models/Category')
const Encryption = use('Encryption')
const Helpers = use('Helpers')
const Drive = use('Drive')
const Env = use('Env')
const Database = use('Database')

const fs = use('fs')
const child_process = use('child_process')
const moment = use('moment')

class PizzaController {
  async updateImplementations({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 21, metodo: 'updateImplementations' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id).fetch()
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const data = request.except(['_csrf'])
        pizza.implementations = data.implementations
        await pizza.save()

        response.redirect('back')
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  async addSize({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 48, metodo: 'addSize' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const data = request.except(['_csrf'])
        // return response.json(data)
        const size = {
          code: Encryption.encrypt(data.name).substring(0, 6),
          name: data.name,
          flavors: [],
          covers: [],
          status: true,
        }

        if (JSON.parse(data['1'])) {
          size.flavors.push(1)
        }
        if (JSON.parse(data['2'])) {
          size.flavors.push(2)
        }
        if (JSON.parse(data['3'])) {
          size.flavors.push(3)
        }
        if (JSON.parse(data['4'])) {
          size.flavors.push(4)
        }

        if (!JSON.parse(data['1']) && !JSON.parse(data['2']) && !JSON.parse(data['3']) && !JSON.parse(data['4'])) {
          size.flavors.push(1)
        }

        const image1 = request.file('image1', {
          types: ['image'],
          size: '8mb',
        })
        const image2 = request.file('image2', {
          types: ['image'],
          size: '8mb',
        })
        const image3 = request.file('image3', {
          types: ['image'],
          size: '8mb',
        })
        const image4 = request.file('image4', {
          types: ['image'],
          size: '8mb',
        })

        const images = [image1, image2, image3, image4]

        // return response.json(size)
        const exist = pizza.sizes.find((size) => size.name.toLowerCase() === data.name.toLowerCase())

        if (!exist) {
          for (let i = 0; i < images.length; i++) {
            await this.uploadCover(images[i], size, profile, i)

            if (!images[i]) {
              size.covers[i] = `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/${i + 1}.jpg`
            }
          }

          pizza.sizes.push(size)
          pizza.flavors.forEach((flavor) => {
            flavor.values[size.name] = 0
            flavor.valuesTable[size.name] = 0
          })

          await pizza.save()
        } else {
          return response.status(418).json({
            message: 'This pizza size already exists.',
          })
        }

        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.all(),
        error: error,
      })

      throw error
    }
  }

  async updSize({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 123, metodo: 'updSize' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const data = request.except(['_csrf', '_method'])
        console.log(data)
        // return response.json(data)
        const size = pizza.sizes.find((size) => size.code === params.code)

        if (size.name !== data.name) {
          pizza.flavors.forEach((flavor) => {
            let vals = JSON.stringify(flavor.values)
            vals = vals.replace(size.name, data.name)
            flavor.values = JSON.parse(vals)

            let valsTable = JSON.stringify(flavor.valuesTable)
            valsTable = valsTable.replace(size.name, data.name)
            flavor.valuesTable = JSON.parse(valsTable)
          })
        }

        size.name = data.name

        if (data['1'] || data['2'] || data['3'] || data['4']) {
          size.flavors = []

          if (JSON.parse(data['1'])) {
            size.flavors.push(1)
          }
          if (JSON.parse(data['2'])) {
            size.flavors.push(2)
          }
          if (JSON.parse(data['3'])) {
            size.flavors.push(3)
          }
          if (JSON.parse(data['4'])) {
            size.flavors.push(4)
          }
        }

        if (!data['1'] && !data['2'] && !data['3'] && !data['4']) {
          size.flavors = [1]
        }

        size.flavors.forEach((flavor, index) => {
          if (!size.covers[index]) {
            size.covers[index] = `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/${index + 1}.jpg`
          }
        })

        // return response.json(size)

        const image1 = request.file('image1', {
          types: ['image'],
          size: '8mb',
        })
        const image2 = request.file('image2', {
          types: ['image'],
          size: '8mb',
        })
        const image3 = request.file('image3', {
          types: ['image'],
          size: '8mb',
        })
        const image4 = request.file('image4', {
          types: ['image'],
          size: '8mb',
        })

        const images = [image1, image2, image3, image4]

        for (let i = 0; i < images.length; i++) {
          await this.uploadCover(images[i], size, profile, i)
        }

        await pizza.save()

        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async uploadCover(image, size, profile, index) {
    if (image) {
      // return console.log(image)
      await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
        overwrite: true,
      })

      // const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

      // imageJ.cover(200, 150)
      //   .quality(80)

      // await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

      await Drive.put(
        `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${size.code}/${image.clientName.replace(/\W/g, '')}`,
        fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
        {
          ContentType: image.headers['content-type'],
          ACL: 'public-read',
        }
      )

      const img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${size.code}/${image.clientName.replace(/\W/g, '')}`)

      // await Drive.put(`${Env.get('NODE_ENV')}/${profile.slug}/covers/${params.code}/${image.clientName.replace(/\ /g, '-')}`,
      // fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)), {
      //   ContentType: image.headers['content-type'],
      //   ACL: 'public-read'
      // })
      // const img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/covers/${params.code}/${image.clientName.replace(/\ /g, '-')}`)
      // console.log(img)
      child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName.replace(/\W/g, '')}`)}`)
      size.covers[index] = img

      return img
    }
  }

  // async changeCovers({ request, params, auth, response }) {
  //   try {
  //     console.log('Starting: ', { controller: 'PizzaController', linha: 191, metodo: 'changeCovers' })
  //     const user = await auth.getUser()
  //     const profile = await user.profile().fetch()
  //     const pizza = await PizzaProduct.find(params.id)
  //     const category = await pizza.category().fetch()
  //     // return response.json(pizza)
  //     if (category.profileId === profile.id) {
  //       const data = request.except(['_csrf', '_method'])
  //       // console.log(data)

  //       const image1 = request.file('image1', {
  //         types: ['image'],
  //         size: '8mb'
  //       })
  //       const image2 = request.file('image2', {
  //         types: ['image'],
  //         size: '8mb'
  //       })
  //       const image3 = request.file('image3', {
  //         types: ['image'],
  //         size: '8mb'
  //       })
  //       const image4 = request.file('image4', {
  //         types: ['image'],
  //         size: '8mb'
  //       })

  //       // console.log(image1)
  //       // console.log(image2)
  //       // console.log(image3)
  //       // console.log(image4)

  //       await uploadCover(image1, 0, params.id, params.code)
  //       await uploadCover(image2, 1, params.id, params.code)
  //       await uploadCover(image3, 2, params.id, params.code)
  //       await uploadCover(image4, 3, params.id, params.code)

  //       await pizza.save()

  //       return response.json(pizza)
  //     }

  //     response.status('403')
  //     response.json({
  //       status: 403,
  //       message: 'This product not belongs to your profile'
  //     })

  //     async function uploadCover(image, index, id, code) {
  //       if (image) {
  //         // return console.log(image)
  //         await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
  //           overwrite: true
  //         })

  //         const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

  //         imageJ.cover(200, 150)
  //           .quality(80)

  //         await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

  //         await Drive.put(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/t${image.clientName.replace(/\W/g, '')}`,
  //           fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`)), {
  //           ContentType: image.headers['content-type'],
  //           ACL: 'public-read'
  //         })

  //         const img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/t${image.clientName.replace(/\W/g, '')}`)

  //         // await Drive.put(`${Env.get('NODE_ENV')}/${profile.slug}/covers/${params.code}/${image.clientName.replace(/\ /g, '-')}`,
  //         // fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)), {
  //         //   ContentType: image.headers['content-type'],
  //         //   ACL: 'public-read'
  //         // })
  //         // const img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/covers/${params.code}/${image.clientName.replace(/\ /g, '-')}`)
  //         // console.log(img)
  //         child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName.replace(/\W/g, '')}`)}`)
  //         const size = pizza.sizes.find(size => size.code === code)
  //         size.covers[index] = img
  //       }
  //     }
  //   } catch (error) {
  //     console.error({
  //       date: moment().format(),
  //       data: request.all(),
  //       error: error
  //     })
  //   }
  // }

  async addImplementation({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 284, metodo: 'addImplementation' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const data = request.except(['_csrf'])
        // return response.json(data)
        const implementation = {
          code: Encryption.encrypt(data.name).substring(0, 6),
          name: data.name,
          value: data.value.replace(',', '.'),
          status: true,
        }

        // return response.json(implementation)
        const exist = pizza.implementations.find(
          (implementation) => implementation.name.toLowerCase().split(' ').join('') === data.name.toLowerCase().split(' ').join('')
        )

        if (!exist) {
          pizza.implementations.push(implementation)
          await pizza.save()
        }

        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updImplementation({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 325, metodo: 'updImplementation' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (parseInt(profile.id) === parseInt(category.profileId)) {
        const data = request.except(['_csrf', '_method'])
        // return response.json(data)
        const implementation = pizza.implementations.find((implementation) => implementation.code === params.code)

        implementation.name = data.name
        implementation.value = Number(data.value) || 0

        // return response.json(implementation)
        await pizza.save()

        response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  async addFlavor({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 358, metodo: 'addFlavor' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const normalizeFileName = (txt) => {
          if (!txt) return undefined
          if (typeof txt != 'string') txt = txt.toString()

          txt = txt.split(' ').join('\\ ')
          txt = txt.split('(').join('\\(')
          txt = txt.split(')').join('\\)')
          txt = txt.split(',').join('\\,')
          txt = txt.split(';').join('\\;')
          txt = txt.split("'").join("\\'")
          txt = txt.split('"').join('\\"')
          return txt
        }

        let img = null
        const data = request.except(['_csrf'])
        // data.values = JSON.parse(data.values);
        // data.valuesTable = JSON.parse(data.valuesTable);

        // const keyValues = Object.keys(data.values);

        // keyValues.forEach(key => {
        //   data.values[key] = parseFloat(data.values[key].replace(',', '.'));
        // });

        // const keyValuesTable = Object.keys(data.valuesTable)
        // keyValuesTable.forEach(key => {
        //   data.valuesTable[key] = parseFloat(data.valuesTable[key].replace(',', '.'));
        // });

        // return response.json(data)
        const code = Encryption.encrypt(data.name).substring(0, 6)

        const image = request.file('image', {
          types: ['image'],
          size: '8mb',
        })

        if (image) {
          await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
            overwrite: true,
          })

          // const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

          // imageJ.cover(600, 450)
          //   .quality(80)

          // await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

          await Drive.put(
            `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/${image.clientName.replace(/\ /g, '-')}`,
            fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
            {
              ContentType: image.headers['content-type'],
              ACL: 'public-read',
            }
          )

          img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/${image.clientName.replace(/\ /g, '-')}`)
          child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)

          // await Drive.put(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/${image.clientName.replace(/\ /g, '-')}`,
          // fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)), {
          //   ContentType: image.headers['content-type'],
          //   ACL: 'public-read'
          // })
          // img = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${code}/${image.clientName.replace(/\ /g, '-')}`)
        }

        // return response.json(data)
        const flavor = {
          code: code,
          name: data.name,
          description: data.description,
          values: JSON.parse(data.values) || {},
          valuesTable: JSON.parse(data.valuesTable) || {},
          status: true,
          image: img,
        }

        // return response.json(flavor)
        const exist = pizza.flavors.find((flavor) => flavor.name.toLowerCase().split(' ').join('') === data.name.toLowerCase().split(' ').join(''))

        if (!exist) {
          pizza.flavors.push(flavor)
          await pizza.save()
        }

        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      return response.json(error)
    }
  }

  async flavorReorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 470, metodo: 'flavorReorder' })
      const { categoryId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const category = await Category.find(categoryId)
      const pizza = await category.product().fetch()
      const flavors = []

      if (category.profileId === profile.id) {
        order.forEach((code) => flavors.push(pizza.flavors.find((f) => f.code == code)))

        pizza.flavors = flavors
        await pizza.save()

        return response.json({
          success: true,
        })
      } else {
        return response.json({
          message: 'Esta categoria pertence a outro usuário.',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async sizeReorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 495, metodo: 'sizeReorder' })
      const { categoryId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const category = await Category.find(categoryId)
      const pizza = await category.product().fetch()
      const sizes = []

      if (category.profileId === profile.id) {
        order.forEach((code) => sizes.push(pizza.sizes.find((s) => s.code == code)))

        pizza.sizes = sizes
        await pizza.save()

        return response.json({
          success: true,
        })
      } else {
        return response.json({
          message: 'Está categoria pertece a outro usuário',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async implementationReorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 520, metodo: 'implementationReorder' })
      const { categoryId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const category = await Category.find(categoryId)
      const pizza = await category.product().fetch()
      const implementations = []

      if (category.profileId === profile.id) {
        order.forEach((code) => implementations.push(pizza.implementations.find((i) => i.code == code)))

        pizza.implementations = implementations
        await pizza.save()

        return response.json({
          success: true,
        })
      } else {
        return response.json({
          message: 'Esta categoria pertence a outro usuário.',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updFlavor({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 658, metodo: 'updFlavor' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const normalizeFileName = (txt) => {
          if (!txt) return undefined
          if (typeof txt != 'string') txt = txt.toString()

          txt = txt.split(' ').join('\\ ')
          txt = txt.split('(').join('\\(')
          txt = txt.split(')').join('\\)')
          txt = txt.split(',').join('\\,')
          txt = txt.split(';').join('\\;')
          txt = txt.split("'").join("\\'")
          txt = txt.split('"').join('\\"')
          txt = txt.split('+').join('-')
          return txt
        }

        const flavor = pizza.flavors.find((flavor) => flavor.code == params.code)
        let img = null
        const data = request.except(['_csrf', '_method'])
        // data.values = JSON.parse(data.values);
        // data.valuesTable = JSON.parse(data.valuesTable);

        // const keyValues = Object.keys(data.values)
        // const keyValuesTable = Object.keys(data.valuesTable)

        // keyValues.forEach(key => {
        //   if (typeof data.values[key] === 'string') {
        //     data.values[key] = data.values[key] !== '' ? parseFloat(data.values[key].replace(',', '.').replace('R$', '').split(' ').join('')) : 0
        //   }
        // })

        // keyValuesTable.forEach(key => {
        //   if (typeof data.valuesTable[key] === 'string') {
        //     data.valuesTable[key] = data.valuesTable[key] !== '' ? parseFloat(data.valuesTable[key].replace(',', '.').replace('R$', '').split(' ').join('')) : 0
        //   }
        // })

        const image = request.file('image', {
          types: ['image'],
          size: '8mb',
        })

        if (image) {
          image.clientName = normalizeFileName(image.clientName)
          await image.move(Helpers.tmpPath(`uploads/${normalizeFileName(profile.slug)}`), {
            overwrite: true,
          })
          // const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

          // imageJ
          //   .cover(200, 150)
          //   .quality(80)

          // await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

          await Drive.put(
            `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${pizza.id}/${flavor.code}/${image.clientName.replace(/\W/g, '').split(' ').join('-')}}`,
            fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
            {
              ContentType: image.headers['content-type'],
              ACL: 'public-read',
            }
          )
          img = Drive.getUrl(
            `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${pizza.id}/${flavor.code}/${image.clientName.replace(/\W/g, '').split(' ').join('-')}}`
          )
          child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)

          // await Drive.delete(flavor.imabvmyyge)
        }

        // return response.json(data)
        flavor.name = data.name
        flavor.description = data.description
        flavor.amount = Number(data.amount)
        flavor.amount_alert = Number(data.amount_alert)
        flavor.values = JSON.parse(data.values) || {}
        flavor.valuesTable = JSON.parse(data.valuesTable) || {}
        flavor.bypass_amount = !!data.bypass_amount

        if (img) {
          flavor.image = img
        }

        // return response.json(flavor)
        await pizza.save()

        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updAmount({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 762, metodo: 'updAmount' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()
      const data = request.except(['_csrf', '_method'])

      if (profile.id === category.profileId) {
        pizza.amount = data.amount
        pizza.amount_alert = data.amount_alert
        await pizza.save()
        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updFlavorMassive({ request, params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 545, metodo: 'updFlavor' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])
      const pizza = await PizzaProduct.find(data.pizzaId)
      const category = await pizza.category().fetch()

      console.log(data)

      const normalizeFileName = (txt) => {
        if (!txt) return undefined
        if (typeof txt != 'string') txt = txt.toString()

        txt = txt.split(' ').join('\\ ')
        txt = txt.split('(').join('\\(')
        txt = txt.split(')').join('\\)')
        txt = txt.split(',').join('\\,')
        txt = txt.split(';').join('\\;')
        txt = txt.split("'").join("\\'")
        txt = txt.split('"').join('\\"')
        txt = txt.split('+').join('-')
        return txt
      }

      if (typeof data.flavors === 'string') {
        data.flavors = JSON.parse(data.flavors)
      }

      if (profile.id === category.profileId) {
        for (let flavor of pizza.flavors) {
          const newFlavor = data.flavors.find((flv) => flv.code === flavor.code)

          if (newFlavor) {
            for (const [key, value] of Object.entries(newFlavor)) {
              if (key === 'values' || key === 'valuesTable') {
                for (const [sizeKey, sizeValue] of Object.entries(newFlavor[key])) {
                  flavor[key][sizeKey] = Number(sizeValue) || 0
                }
              } else {
                flavor[key] = newFlavor[key]
              }
            }

            // flavor.name = newFlavor.name
            // flavor.values = newFlavor.values;
            // flavor.valuesTable = newFlavor.valuesTable;

            const image = request.file(`image_${flavor.code}`, {
              types: ['image'],
              size: '8mb',
            })

            if (image) {
              image.clientName = normalizeFileName(image.clientName)
              await image.move(Helpers.tmpPath(`uploads/${normalizeFileName(profile.slug)}`), {
                overwrite: true,
              })

              await Drive.put(
                `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${pizza.id}/${flavor.code}/${image.clientName.replace(/\W/g, '').split(' ').join('-')}}`,
                fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
                {
                  ContentType: image.headers['content-type'],
                  ACL: 'public-read',
                }
              )
              const img = Drive.getUrl(
                `${Env.get('NODE_ENV')}/${profile.slug}/pizza-products/${pizza.id}/${flavor.code}/${image.clientName.replace(/\W/g, '').split(' ').join('-')}}`
              )
              child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)

              if (img) {
                flavor.image = img
              }
              // await Drive.delete(flavor.imabvmyyge)
            }

            flavor.description = WmProvider.encryptEmoji(flavor.description)
          }
        }

        await pizza.save()
        return response.json(pizza)
      } else {
        response.status(403)
        response.json({
          erro: 403,
          message: 'This product not belongs to your user',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async sizePlayPause({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 654, metodo: 'sizePlayPause' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        // const data = request.except(['_csrf'])

        const size = pizza.sizes.find((size) => size.code === params.code)
        size.status = !size.status
        await pizza.save()
        response.json(pizza)
      } else {
        response.status(403)
        reponse.json({
          error: 403,
          message: 'This product not belongs to your user!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async flavorPlayPause({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 681, metodo: 'flavorPlayPause' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const flavor = pizza.flavors.find((flavor) => flavor.code === params.code)
        flavor.status = !flavor.status
        await pizza.save()
        response.json(pizza)
      } else {
        response.status(403)
        reponse.json({
          error: 403,
          message: 'This product not belongs to your user!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async implementationPlayPause({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 708, metodo: 'implementationPlayPause' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        // const data = request.except(['_csrf'])

        const implementation = pizza.implementations.find((implementation) => implementation.code === params.code)
        implementation.status = !implementation.status
        await pizza.save()
        return response.json(pizza)
      } else {
        response.status(403)
        return response.json({
          error: 403,
          message: 'This product not belongs to your user!',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deleteSize({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 735, metodo: 'deleteSize' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        let sizeIndex = null

        const size = pizza.sizes.find((size, index) => {
          if (size.code === params.code) {
            sizeIndex = index
            return size
          }
        })

        pizza.flavors.forEach((flavor) => {
          delete flavor.values[size.name]
          delete flavor.valuesTable[size.name]
        })

        if (sizeIndex !== null) {
          pizza.sizes.splice(sizeIndex, 1)
        }

        pizza.save()
      }

      return response.json(pizza)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deleteImplementation({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 761, metodo: 'deleteImplementation' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const implementation = pizza.implementations.findIndex((implementation) => implementation.code === params.code)

        pizza.implementations.splice(implementation, 1)

        pizza.save()
      }

      return response.json(pizza)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deleteFlavor({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 783, metodo: 'deleteFlavor' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(params.id)
      const category = await pizza.category().fetch()

      if (profile.id === category.profileId) {
        const flavor = pizza.flavors.findIndex((flavor) => flavor.code === params.code)

        pizza.flavors.splice(flavor, 1)

        pizza.save()
      }

      return response.json(pizza)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateJSON({ response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 805, metodo: 'updateJSON' })
      const pizzas = await PizzaProduct.all()
      pizzas.rows.forEach((pizza) => {
        pizza.sizes.forEach((size) => {
          if (!size.covers) {
            size.covers = [
              `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/1.jpg`,
              `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/2.jpg`,
              `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/3.jpg`,
              `${Env.get('SCHEME', 'https')}://${Env.get('DOMAIN', 'localhost')}/pizzas/4.jpg`,
            ]
          }
        })
        pizza.save()
      })
      response.json(pizzas)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async flavorsReorder({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 829, metodo: 'flavorsReorder' })
      const data = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const pizza = await PizzaProduct.find(data.pizza)
      const category = await pizza.category().fetch()

      if (category.profileId === profile.id) {
        pizza.flavors = pizza.flavors.sort((a, b) => {
          if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
          if (a.name.toLowerCase() > b.name.toLowerCase()) return 1

          return 0
        })

        await pizza.save()

        return response.json(pizza)
      }

      response.status(403)
      return response.json({
        success: false,
        error: 403 - 664,
        message: 'this pizza not available to your user!',
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.all(),
        error: error,
      })
      throw error
    }
  }

  static async duplicateAllProduct(oldProduct, categoryId) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 870, metodo: 'duplicateAllProduct' })
      const pizza = await PizzaProduct.findBy('categoryId', categoryId)
      const original = oldProduct

      pizza.status = original.status
      pizza.sizes = original.sizes
      pizza.flavors = original.flavors
      pizza.implementations = original.implementations

      pizza.sizes.forEach((size) => {
        size.code = Encryption.encrypt(size.name).substring(0, 6)
      })

      pizza.flavors.forEach((flavor) => {
        flavor.code = Encryption.encrypt(flavor.name).substring(0, 6)
      })

      pizza.implementations.forEach((implementation) => {
        implementation.code = Encryption.encrypt(implementation.name).substring(0, 6)
      })

      await pizza.save()

      return pizza
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      throw error
    }
  }

  async updateAllFlavors({ response }) {
    try {
      console.log('Starting: ', { controller: 'PizzaController', linha: 907, metodo: 'updateAllFlavors' })
      let page = 1
      let pizza = {}
      do {
        pizza = await PizzaProduct.query().paginate(page, 1000)
        for (let elRow of pizza.rows) {
          // elRow.sizes = JSON.parse(elRow.sizes)
          //ATUALIZA DISPONIBILITY
          elRow.disponibility = {
            week: [
              {
                id: '1',
                name: 'monday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '2',
                name: 'tuesday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '3',
                name: 'wednesday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '4',
                name: 'thrusday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '5',
                name: 'friday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '6',
                name: 'saturday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
              {
                id: '7',
                name: 'sunday',
                time: {
                  to: '23:59',
                  from: '00:00',
                },
                active: true,
              },
            ],
            // "store": {
            //   "delivery": true,
            //   "table": true,
            //   "package": false
            // }
          }

          //ATUALIZA FLAVORS
          elRow.flavors.forEach((flavors) => {
            if (flavors.values !== undefined) {
              flavors.valuesTable = flavors.values
            }
            flavors.disponibility = {}
            flavors.disponibility.store = {
              delivery: true,
              table: true,
              package: false,
            }
            // flavors.disponibility.week = [
            //   {
            //     "id": "1",
            //     "name": "monday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "2",
            //     "name": "tuesday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "3",
            //     "name": "wednesday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "4",
            //     "name": "thrusday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "5",
            //     "name": "friday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "6",
            //     "name": "saturday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   },
            //   {
            //     "id": "7",
            //     "name": "sunday",
            //     "time": {
            //       "from": "00:00",
            //       "to": "23:59"
            //     },
            //     "active": "true"
            //   }
            // ]
          })
          await elRow.save()
        }
        page++
      } while (page <= pizza.pages.lastPage)

      return response.send('sucesso')
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateComplements({ params, request, response }) {
    const data = request.except(['_csrf'])

    let { pizzaId } = params

    let { removeComplements, recicle, complements } = data

    pizzaId = Number(pizzaId)
    removeComplements = JSON.parse(removeComplements)
    recicle = JSON.parse(recicle)
    complements = JSON.parse(complements)

    try {
      const complementsRecicleds = []
      const pizza = await PizzaProduct.find(pizzaId)

      if (removeComplements) {
        for (let complId of removeComplements) {
          const complToDelete = await Complement.find(complId)

          if (complToDelete) {
            let relation = await PizzaComplement.query().where({ complementId: complToDelete.id }).fetch()

            const productRelation = relation.rows.find((r) => r.pizzaId === pizzaId)

            if (productRelation) {
              await productRelation.delete()
            }

            if (!relation.rows.filter((r) => r.pizzaId !== pizzaId).length) {
              await complToDelete.delete()
            }
          }
        }
      }

      if (recicle) {
        for (let complement of recicle) {
          complement.id = Number(complement.id)
          let oldComplement = await Complement.find(complement.id)

          if (oldComplement) {
            oldComplement = oldComplement.toJSON()
            if (!complement.link) {
              delete oldComplement.id
              delete oldComplement.created_at
              delete oldComplement.updated_at

              const newComplement = await Complement.create(oldComplement)

              const relation = await PizzaComplement.query().where({ pizzaId, complementId: newComplement.id }).first()

              if (!relation) {
                const rcPivot = await PizzaComplement.create({ pizzaId, complementId: newComplement.id })
                newComplement.pivot = rcPivot
              }
              complementsRecicleds.push(newComplement)
            } else {
              const relation = await PizzaComplement.query().where({ pizzaId, complementId: complement.id }).first()

              if (!relation) {
                const oldPivot = await PizzaComplement.create({ pizzaId, complementId: complement.id })
                oldComplement.pivot = oldPivot
              }
              complementsRecicleds.push(oldComplement)
            }
          }
        }
      }

      if (complements) {
        const newComplements = []

        let comp
        for (let complement of complements) {
          comp = complement.pivot ? await Complement.find(complement.id) : new Complement()

          if (comp && complement) {
            comp.name = complement.name
            comp.type = 'pizza'
            comp.min = complement.min
            comp.max = complement.max
            comp.required = complement.required ? true : false
            comp.itens = complement.itens
            comp.itens.forEach((item) => {
              if (item.code) {
                item.value = Number(item.value) || 0
              } else {
                item.code = Encryption.encrypt(item.name).substring(0, 6)
              }

              item.status = JSON.parse(item.status)
            })
          }

          await comp.save()

          if (!complement.pivot) {
            const pivot = await PizzaComplement.create({
              pizzaId,
              complementId: comp.id,
            })

            comp.pivot = pivot
          } else {
            comp.pivot = complement.pivot
          }

          newComplements.push(comp)
        }

        pizza.complements = [...newComplements, ...complementsRecicleds]
      }

      return response.json(pizza)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = PizzaController
