'use strict'

const { clear } = require('@adonisjs/framework/src/Exception')
const { DateTime } = require('luxon')
const InventoryProvider = use('InventoryProvider')
const WmProvider = use('WmProvider')
const moment = use('moment')

const User = use('App/Models/User')
const Product = use('App/Models/Product')
const Category = use('App/Models/Category')
const Complement = use('App/Models/Complement')
const ProductComplement = use('App/Models/ProductComplement')

const Encryption = use('Encryption')
/** @type {import('@adonisjs/framework/src/Exception')} */
// const Exception = use('Exception')
const Helpers = use('Helpers')
const Drive = use('Drive')
const Env = use('Env')

const fs = use('fs')
const child_process = use('child_process')

class ProductController {
  async store({ request, response, auth }) {
    console.log('Starting: ', { controller: 'ProductController', linha: 25, metodo: 'store' })
    const data = request.except(['_csrf'])
    const user = await auth.getUser()
    const profile = await user.profile().fetch()

    if (data.complements) {
      data.complements = JSON.parse(data.complements)
    }

    if (data.recicle) {
      data.recicle = JSON.parse(data.recicle)
    }

    if (data.disponibility) {
      data.disponibility = JSON.parse(data.disponibility)
    }

    const image = request.file('image', {
      types: ['image'],
      size: '8mb',
    })

    try {
      const product = await Product.create({
        name: data.name,
        order: data.order,
        categoryId: data.categoryId,
        description: data.description,
        promoteStatus: JSON.parse(data.promoteStatus),
        promoteStatusTable: JSON.parse(data.promoteStatusTable),
        value: Number(data.value) || 0,
        promoteValue: Number(data.promoteValue) || 0,
        valueTable: Number(data.valueTable) || 0,
        promoteValueTable: Number(data.promoteValueTable) || 0,
        disponibility: data.disponibility,
        status: true,
      })

      if (image) {
        await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
          overwrite: true,
        })

        // const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

        // const newHeight = 450

        // imageJ.cover((imageJ.getWidth() / imageJ.getHeight()) * newHeight, newHeight)
        //   .quality(80)

        // await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

        await Drive.put(
          `${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`,
          fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
          {
            ContentType: image.headers['content-type'],
            ACL: 'public-read',
          }
        )

        product.image = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`)
        child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)

        await product.save()
      }

      let allComplements = []

      if (data.complements) {
        const comple = []

        for (const compl of data.complements) {
          const { id, created_at, updated_at, ...complement } = compl
          complement.required = JSON.parse(complement.required)

          if (complement.itens) {
            complement.itens.forEach((item) => {
              item.code = Encryption.encrypt(item.name).substring(0, 6)
              item.value = Number(item.value) || 0
              item.status = JSON.parse(item.status)
            })
          }
          comple.push(complement)
        }

        const complements = await Complement.createMany(comple)

        for (let complement of complements) {
          const pivot = await ProductComplement.create({ productId: product.id, complementId: complement.id })
          complement.pivot = pivot
        }

        allComplements = allComplements.concat(complements)
      }

      if (data.recicle) {
        const complementsRecicleds = []
        // recicle.forEach(async item => await ProductComplement.create({productId: product.id, complementId: item}))

        for (let item of data.recicle) {
          if (item.link) {
            const pivot = await ProductComplement.create({ productId: product.id, complementId: item.id })
            const newRecicledComplement = await Complement.find(item.id)
            newRecicledComplement.pivot = pivot
            complementsRecicleds.push(newRecicledComplement)
          } else {
            const complement = await Complement.find(item.id)
            const duplicate = new Complement()
            duplicate.name = complement.name
            duplicate.order = complement.order
            duplicate.min = complement.min
            duplicate.max = complement.max
            duplicate.required = complement.required
            duplicate.itens = complement.itens

            duplicate.itens.forEach((item) => {
              item.code = Encryption.encrypt(item.name).substring(0, 6)
            })

            await duplicate.save()

            const newRecicledComplement = await ProductComplement.create({ productId: product.id, complementId: duplicate.id })
            duplicate.pivot = newRecicledComplement
            complementsRecicleds.push(duplicate)
          }
        }

        allComplements = allComplements.concat(complementsRecicleds)
      }

      product.complements = allComplements

      return response.json(product)
    } catch (error) {
      console.error({
        date: moment().format(),
        data: data,
        error: error,
      })
      throw error
    }
  }

  async storeMassive({ request, response, auth }) {
    console.log('Starting: ', { controller: 'ProductController', linha: 157, metodo: 'storeMassive' })
    const data = request.except(['_csrf'])
    const user = await auth.getUser()
    const profile = await user.profile().fetch()

    if (data.complements) {
      data.complements = JSON.parse(data.complements)
    }

    if (data.recicle) {
      data.recicle = JSON.parse(data.recicle)
    }

    try {
      const disponibility = {
        store: JSON.parse(data.store),
        week: JSON.parse(data.week),
      }

      const products = JSON.parse(data.products)
      const productsToReturn = []

      if (products.length) {
        /** Array de {id: number, code: string} id = id do complemento que foi criado no banco e code = code do complemento que veio do painel */
        const idComplementsViculates = []

        for (let productCreate of products) {
          const id = productCreate.id
          delete productCreate.id

          const product = await Product.create({
            name: productCreate.name,
            order: productCreate.order,
            categoryId: productCreate.categoryId,
            description: productCreate.description,
            value: productCreate.value,
            promoteStatus: productCreate.promoteStatus ? true : false,
            promoteValue: productCreate.promoteValue || 0,
            valueTable: productCreate.valueTable,
            promoteStatusTable: productCreate.promoteStatusTable ? true : false,
            promoteValueTable: productCreate.promoteValueTable || 0,
            disponibility: disponibility,
            status: true,
          })

          const image = request.file(`image_${id}`, {
            types: ['image'],
            size: '8mb',
          })

          if (image) {
            await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
              overwrite: true,
            })
            // const imageJ = await Jimp.read(fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)))

            // const newHeight = 450

            // imageJ.cover((imageJ.getWidth() / imageJ.getHeight()) * newHeight, newHeight)
            //   .quality(80)

            // await imageJ.writeAsync(Helpers.tmpPath(`uploads/${profile.slug}/t${image.clientName}`))

            await Drive.put(
              `${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`,
              fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
              {
                ContentType: image.headers['content-type'],
                ACL: 'public-read',
              }
            )

            product.image = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`)
            child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)

            await product.save()
          }

          const comple = []
          const complementsVinculates = []
          const complementsRecicleds = []

          if (data.recicle && data.recicle.length) {
            for (let item of data.recicle) {
              if (item.link) {
                const pivot = await ProductComplement.create({ productId: product.id, complementId: item.id })
                const newRecicledComplement = await Complement.find(item.id)
                newRecicledComplement.pivot = pivot
                complementsRecicleds.push(newRecicledComplement)
              } else {
                const complement = await Complement.find(item.id)
                const duplicate = new Complement()
                duplicate.name = complement.name
                duplicate.order = complement.order
                duplicate.min = complement.min
                duplicate.max = complement.max
                duplicate.required = complement.required
                duplicate.itens = complement.itens

                await duplicate.save()

                const newRecicledComplement = await ProductComplement.create({ productId: product.id, complementId: duplicate.id })
                duplicate.pivot = newRecicledComplement
                complementsRecicleds.push(duplicate)
              }
            }
          }

          if (data.complements && data.complements.length) {
            for (let complement of data.complements) {
              complement.required = JSON.parse(complement.required)
              complement.max = Number(complement.max) || 0
              complement.min = Number(complement.min) || 0
              complement.itens.forEach((item) => {
                item.code = Encryption.encrypt(item.name).substring(0, 6)
                item.value = Number(item.value) || 0
                item.status = JSON.parse(item.status)
              })

              const { id, created_at, updated_at, vinculate, ...complementToCreate } = complement

              if (vinculate && vinculate.link) {
                const getVinculate = idComplementsViculates.find((el) => el.code === vinculate.code)

                if (getVinculate) {
                  const complementVinculate = await Complement.find(getVinculate.id)
                  if (complementVinculate) {
                    const pivot = await ProductComplement.create({ productId: product.id, complementId: complementVinculate.id })
                    complementVinculate.pivot = pivot
                    complementsVinculates.push(complementVinculate)
                  }
                } else {
                  const complementCreate = await Complement.create(complementToCreate)
                  const pivot = await ProductComplement.create({ productId: product.id, complementId: complementCreate.id })

                  complementCreate.pivot = pivot
                  complementsVinculates.push(complementCreate)
                  idComplementsViculates.push({ id: complementCreate.id, code: vinculate.code })
                }
              } else {
                comple.push(complementToCreate)
              }
            }

            const newComplements = comple.length ? await Complement.createMany(comple) : []

            for (let complement of newComplements) {
              const pivot = await ProductComplement.create({ productId: product.id, complementId: complement.id })
              complement.pivot = pivot
            }

            product.complements = [...newComplements, ...complementsRecicleds, ...complementsVinculates]
          } else {
            product.complements = [...complementsRecicleds]
          }

          if (typeof product.disponibility === 'string') {
            product.disponibility = JSON.parse(product.disponibility)
          }

          productsToReturn.push(product)
        }

        return response.json(productsToReturn)
      }
    } catch (error) {
      console.error({
        date: moment().format(),
        data: data,
        error: error,
      })

      throw error
    }
  }

  async update({ request, params, response, auth, session }) {
    console.log('Starting: ', { controller: 'ProductController', linha: 350, metodo: 'update', date: DateTime.local().toISO() })

    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const product = await Product.find(params.id)
    const data = request.except(['_csrf', '_method'])

    // data.disponibility = { week: data.week, store: data.store }
    try {
      product.name = data.name || product.name
      product.categoryId = data.categoryId || product.categodyId
      product.description = data.description || ''
      product.disponibility = data.disponibility || product.disponibility
      product.amount = Number(data.amount || 0)
      product.amount_alert = Number(data.amount_alert || 0)
      if (data.bypass_amount === undefined || data.bypass_amount === 'undefined') {
        product.bypass_amount = true
      } else {
        product.bypass_amount = !!JSON.parse(data.bypass_amount ? data.bypass_amount : null)
      }
      product.value = parseFloat(data.value || product.value)
      product.valueTable = parseFloat(data.valueTable || product.valueTable)
      product.promoteValue = Number(data.promoteValue || product.promoteValue)
      product.promoteValueTable = Number(data.promoteValueTable || product.promoteValueTable)
      product.promoteStatus = data.promoteStatus ? (JSON.parse(data.promoteStatus) ? true : false) : product.promoteStatus
      product.promoteStatusTable = data.promoteStatusTable ? (JSON.parse(data.promoteStatusTable) ? true : false) : product.promoteStatusTable

      if (data.complements) {
        data.complements = JSON.parse(data.complements)
      }

      if (data.recicle) {
        data.recicle = JSON.parse(data.recicle)
      }

      if (data.removeComplements) {
        data.removeComplements = JSON.parse(data.removeComplements)
      }
    } catch (error) {
      console.error(error)
    }

    try {
      const image = request.file('image', {
        types: ['image'],
        size: '8mb',
      })

      if (image) {
        image.clientName = this.normalizeString(image.clientName, 390)

        await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
          overwrite: true,
        })

        await Drive.put(
          `${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`,
          fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
          {
            ContentType: image.headers['content-type'],
            ACL: 'public-read',
          }
        )

        if (product.image) {
          await Drive.delete(product.image)
        }
        product.image = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`)
        await product.save()
        child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)
      }

      await product.save()

      const complementsRecicleds = []

      if (data.removeComplements) {
        for (let complId of data.removeComplements) {
          const complToDelete = await Complement.find(complId)

          if (complToDelete) {
            let relation = await ProductComplement.query().where({ complementId: complToDelete.id }).fetch()

            const productRelation = relation.rows.find((r) => r.productId === product.id)

            if (productRelation) {
              await productRelation.delete()
            }

            if (!relation.rows.filter((r) => r.productId !== product.id).length) {
              await complToDelete.delete()
            }
          }
        }
      }
      if (typeof data.recicle === 'string') {
        data.recicle = JSON.parse(data.recicle)
      }
      if (data.recicle) {
        for (let complement of data.recicle) {
          complement.id = Number(complement.id)
          let oldComplement = await Complement.find(complement.id)
          oldComplement = oldComplement ? oldComplement.toJSON() : null

          if (oldComplement) {
            if (!complement.link) {
              delete oldComplement.id
              delete oldComplement.created_at
              delete oldComplement.updated_at

              const newComplement = await Complement.create(oldComplement)

              const relation = await ProductComplement.query().where({ productId: product.id, complementId: newComplement.id }).first()

              if (!relation) {
                const rcPivot = await ProductComplement.create({ productId: product.id, complementId: newComplement.id })
                newComplement.pivot = rcPivot
              }
              complementsRecicleds.push(newComplement)
            } else {
              const relation = await ProductComplement.query().where({ productId: product.id, complementId: complement.id }).first()

              if (!relation) {
                const oldPivot = await ProductComplement.create({ productId: product.id, complementId: complement.id })
                oldComplement.pivot = oldPivot
              }
              complementsRecicleds.push(oldComplement)
            }
          }
        }
      }

      if (typeof data.complements === 'string') {
        data.complements = JSON.parse(data.complements)
      }
      const newComplements = []
      if (data.complements) {
        let comp
        for (let complement of data.complements) {
          comp = complement.pivot ? await Complement.find(complement.id) : new Complement()

          if (comp && complement) {
            comp.name = complement.name
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
            const pivot = await ProductComplement.create({
              productId: product.id,
              complementId: comp.id,
            })

            comp.pivot = pivot
          } else {
            comp.pivot = complement.pivot
          }

          newComplements.push(comp)
        }
      }
      product.complements = [...newComplements, ...complementsRecicleds]

      let inventory = { low: [], soldOut: [] }
      if (profile.options.inventoryControl) {
        inventory = await InventoryProvider.identifyLowInventory(profile.id)
      }

      return response.json({ product, inventory })
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.except(['_csrf', '_method']),
        complements: data.complements,
        error: error,
      })
      throw error
    }
  }

  async updateMassive({ request, response, auth }) {
    console.log('Starting: ', { controller: 'ProductController', linha: 517, metodo: 'updateMassive' })
    const user = await auth.getUser()
    const profile = await user.profile().fetch()
    const data = request.except(['_csrf', '_method'])
    const category = await Category.find(data.categoryId)

    try {
      const productsToReturn = []

      if (typeof data.products === 'string') {
        data.products = JSON.parse(data.products)
      }

      for (let prod of data.products) {
        if (parseInt(category.profileId) === parseInt(profile.id)) {
          const product = await Product.find(prod.id)
          if (product) {
            for (const [key, value] of Object.entries(prod)) {
              if (key !== 'id') {
                if (key === 'name') {
                  product[key] = value
                } else {
                  product[key] = Number(value)
                }
              }
            }
            // product.name = prod.name;
            // product.value = Number(prod.value);
            // product.valueTable = Number(prod.valueTable);
            // product.promoteValue = Number(prod.promoteValue);
            // product.promoteValueTable = Number(prod.promoteValueTable);

            const image = request.file(`image_${product.id}`, {
              types: ['image'],
              size: '8mb',
            })

            //
            if (image) {
              // image.clientName = image.clientName

              await image.move(Helpers.tmpPath(`uploads/${profile.slug}`), {
                overwrite: true,
              })

              await Drive.put(
                `${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`,
                fs.readFileSync(Helpers.tmpPath(`uploads/${profile.slug}/${image.clientName}`)),
                {
                  ContentType: image.headers['content-type'],
                  ACL: 'public-read',
                }
              )

              if (product.image) {
                await Drive.delete(product.image)
              }
              product.image = Drive.getUrl(`${Env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`)
              await product.save()
              child_process.execSync(`rm -fr ${Helpers.tmpPath(`uploads/${profile.slug}`)}`)
            }

            product.description = WmProvider.encryptEmoji(product.description)
            await product.save()
            productsToReturn.push(product.toJSON())
          }
        }
      }

      return response.json(productsToReturn)
    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.except(['_csrf', '_method']),
        error: error,
      })

      throw error
    }
  }

  async productDefaultPlayPause({ request, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 432, metodo: 'productDefaultPlayPause' })
      const user = await User.find(auth.user.id)
      // const profile = await user.profile().fetch();
      const data = request.except(['_csrf'])
      const product = await Product.query().where('id', data.id).with('complements').first()

      if (product.categoryId == data.categoryId) {
        product.status = !product.status
        data.status = product.status
        await product.save()
        return response.json(product)
      } else {
        throw {
          status: 403,
          message: `O produto ${data.name}, não coincide com o produto encontrado.`,
        }
      }
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      throw error
    }
  }

  async duplicate({ params, auth, response, request }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 454, metodo: 'duplicate' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      // const product = await Product.find(params.id)
      const product = request.except(['_csrf'])
      const category = await Category.find(product.categoryId)

      // const products = await category.products().fetch()
      // const product = products.rows.find(p => p.id == params.id)

      if (profile.id === category.profileId && product.categoryId == category.id) {
        const { complements, ...productCopy } = product
        productCopy.order = product.order

        delete productCopy.id
        delete productCopy.created_at
        delete productCopy.updated_at

        const newProduct = await Product.create(productCopy)
        const newComplements = []

        for (let complement of complements) {
          complement.itens.forEach((item) => {
            item.code = Encryption.encrypt(item.name).substring(0, 6)
          })

          const newComplement = await Complement.create(complement)

          const newPivot = await ProductComplement.create({
            productId: newProduct.id,
            complementId: newComplement.id,
          })

          newComplement.pivot = newPivot
          newComplements.push(newComplement)
        }

        newProduct.complements = newComplements
        return response.json(newProduct)
      } else {
        return response.json({
          success: false,
          message: 'Este produto não pertence a este usuário',
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async removeComplement({ auth, params, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 714, metodo: 'removeComplement' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const product = await Product.find(params.product)
      const complement = await Complement.find(params.complement)
      const category = await product.category().fetch()

      if (category.profileId === profile.id) {
        let relation = await ProductComplement.query().where({ productId: product.id, complementId: complement.id }).first()
        if (relation) {
          await relation.delete()
        }

        relation = await ProductComplement.query().where('complementId', complement.id).fetch()
        // return response.json(relation)
        if (!relation) {
          await complement.delete()
        }
      }
      return response.json({
        success: true,
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      return response.json({
        success: false,
        messages: error,
      })
    }
  }

  async delete({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 751, metodo: 'delete' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const product = await Product.find(params.id)
      const category = await product.category().fetch()

      if (category.profileId === profile.id && product) {
        const complements = await product.complements().fetch()
        // const relations = await ProductComplement.query().whereIn("complementId", complements.rows.map(compl => compl.id)).fetch();

        for (const complement of complements.rows) {
          const relations = await ProductComplement.query()
            .whereIn(
              'complementId',
              complements.rows.map((compl) => compl.id)
            )
            .fetch()
          const relationToDelete = relations.rows.find((rel) => rel.productId === product.id)
          if (relationToDelete) {
            await relationToDelete.delete()

            if (relations.rows.filter((rel) => rel.complementId === complement.id).length === 1) {
              await complement.delete()
            }
          }
        }

        product.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
        await product.save()

        const updateProductsOrder = await category.products().where('order', '>', product.order).fetch()

        let foundIndex = 0
        for (const foundedProduct of updateProductsOrder.rows) {
          foundedProduct.order = Number(product.order) + foundIndex
          await foundedProduct.save()

          ++foundIndex
        }
      }

      if (!product) {
        return response.status(404).json({
          message: 'Produto não encontrado.',
          productId: params.id,
        })
      }

      return response.json(product)
    } catch (error) {
      console.error({
        date: moment().format(),
        params: params,
        error: error,
      })

      throw error
    }
  }

  async reorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 809, metodo: 'reorder' })
      const { categoryId, order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const category = await profile.categories().where('id', categoryId).first()
      const products = await category.products().fetch()

      order.forEach((id, index) => {
        const prod = products.rows.find((product) => product.id == id)
        if (prod) {
          prod.order = index
        }
      })

      for (let product of products.rows) {
        await product.save()
      }

      return response.json({
        success: true,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async addHour({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 839, metodo: 'addHour' })
      const data = request.except(['_csrf', '_method'])
      const { productId } = data
      const product = await Product.find(productId)

      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      data.days.forEach((day) => {
        let checkDay = true
        product.disponibility.week[day.name].forEach((hour) => {
          if (
            convertHour(data.open) >= convertHour(hour.open) &&
            convertHour(data.open) <= convertHour(hour.close) &&
            convertHour(data.close) <= convertHour(hour.close) &&
            convertHour(data.close) >= convertHour(hour.open)
          ) {
            checkDay = false
          }
        })
        if (checkDay) {
          product.disponibility.week[day.name].push({
            code: Encryption.encrypt(day).substring(0, 6),
            open: data.open,
            close: data.close,
            active: JSON.parse(data.active),
            weekDay: parseInt(day.weekDay),
          })

          product.disponibility.week[day.name] = product.disponibility.week[day.name].sort((a, b) => {
            if (a.open < b.open) return -1
            if (a.open > b.open) return 1

            return 0
          })
        }
      })

      await product.save()

      return response.json({
        success: true,
        week: product.disponibility.week,
      })
    } catch (error) {
      console.error({
        error: error,
      })

      response.json({
        success: false,
        error: error,
      })
    }
  }

  async updHour({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 896, metodo: 'updHour' })
      const data = request.except(['_csrf', '_method'])
      const { productId, type, weekDay, code, active } = data
      const product = await Product.find(productId)
      const item = product.disponibility.week[weekDay].find((h) => h.code === code)
      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      if (type) {
        item[type] = data.hour
      }

      if (active) {
        item.active = JSON.parse(active)
      }

      if (convertHour(item.close) > convertHour(item.open)) {
        product.disponibility.week[weekDay] = product.disponibility.week[weekDay].sort((a, b) => {
          if (a.open < b.open) return -1
          if (a.open > b.open) return 1

          return 0
        })

        await product.save()
      }

      return response.json({
        success: true,
        week: product.disponibility.week,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async removeHour({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'ProductController', linha: 936, metodo: 'removeHour' })

      const { productId, day, code } = params
      const product = await Product.find(productId)

      product.disponibility.week[day].splice(
        product.disponibility.week[day].findIndex((h) => h.code === code),
        1
      )

      await product.save()

      response.json({
        success: true,
        hours: product.disponibility.week[day],
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

  normalizeString(stng, line) {
    console.log('Starting: ', { controller: 'ProductController', linha: line || 966, metodo: 'normalizeString' })
    if (typeof stng !== 'string') {
      return undefined
    }

    stng.split(' ').join('-')

    return stng
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f \ ]/g, '')
      .replace(/[^a-z0-9]/gi, '')
  }

  normalizeFileName(str, line) {
    console.log('Starting: ', { controller: 'ProductController', linha: line || 977, metodo: 'normalizeFileName' })
    let text = str
    if (typeof text !== 'string') {
    }

    text = text.split(' ').join('\\ ')
    text = text.split('(').join('\\(')
    text = text.split(')').join('\\)')
    text = text.split("'").join("\\'")
    text = text.split('"').join('\\"')
    text = text.split('+').join('-')

    return text
  }
}

module.exports = ProductController
