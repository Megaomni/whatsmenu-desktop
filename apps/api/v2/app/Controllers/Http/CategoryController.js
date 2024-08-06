'use strict'

const { DateTime } = require('luxon')

const User = use('App/Models/User')
const Category = use('App/Models/Category')
const Product = use('App/Models/Product')
const PizzaProduct = use('App/Models/PizzaProduct')
const Complement = use('App/Models/Complement')
// const PizzaProduct = use('App/Models/PizzaProduct')
const ProductComplement = use('App/Models/ProductComplement')
const PizzaController = use('App/Controllers/Http/PizzaController')
const moment = use('moment')
const Encryption = use('Encryption')

class CategoryController {
  async store({ request, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 15, metodo: 'store' })
      const data = request.except(['_csrf', '_method'])
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()

      data.profileId = profile.id
      data.status = true
      data.order = categories.rows.length + 1

      const newCategory = await Category.create(data)

      if (newCategory.type === 'default') {
        newCategory.products = []
      }
      if (newCategory.type === 'pizza') {
        newCategory.product = await newCategory.product().fetch()
      }

      return response.json(newCategory)
    } catch (error) {
      console.error(error)

      return response.json({
        date: moment().format('DD/MM/yyyy HH:MM'),
        ...error,
      })
    }
  }

  async update({ request, params, auth, response }) {
    try {
      const { name, disponibility, options, product } = request.all()
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const category = await Category.find(params.id)
      let pizza

      if (category.profileId === profile.id) {
        const haveInvalid = Object.values(options.week).some((date) => date.some((day) => day.open >= day.close))

        if (haveInvalid) {
          return response.status(403).json({ message: 'Horário(s) inválido(s)', data: options.week })
        }
        category.name = name;
        category.disponibility = disponibility;
        category.options.week = options.week;

        if (category.type === 'pizza' && product) {
          pizza = await PizzaProduct.find(product.id)
          pizza.amount = product.amount
          pizza.amount_alert = product.amount_alert
          pizza.bypass_amount = product.bypass_amount
          await pizza.save()
        }

        await category.save()
      } else {
        throw {
          message: `Category (catProfileId: ${category.profileId}) does not belong to the profile (profId: ${profile.id})`,
        }
      }

      return response.json({ ...category.toJSON(), product: pizza })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async playAndPause({ params, auth, response }) {
    console.log('Starting: ', { controller: 'CategoryController', linha: 60, metodo: 'playAndPause' })
    try {
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const category = await Category.find(params.id)

      if (category.profileId === profile.id) {
        category.status = !category.status
        await category.save()
      }
      return response.json(category)
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  async duplicate({ request, params, auth, response }) {
    function addCopyName(name) {}

    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 75, metodo: 'duplicate' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()
      const dataCategory = request.except(['_csrf'])

      if (Number(dataCategory.profileId) === Number(profile.id)) {
        const { products, product: productPizza, ...duplicity } = dataCategory

        // if (duplicity.name.includes("- CÓPIA")) {
        //   const newName = duplicity.name.split(" - CÓPIA ");
        //   let quantityCopy = newName[newName.length - 1];
        //   if (Number(quantityCopy)) {
        //     newName[newName.length - 1] = ` - CÓPIA ${++quantityCopy}`;
        //     duplicity.name = newName.join(" ");
        //   } else {
        //     duplicity.name += " 2";
        //   }
        // } else {
        //   duplicity.name += " - CÓPIA ";
        // }

        delete duplicity.id
        delete duplicity.created_at
        delete duplicity.updated_at
        // duplicity.order = categories.rows.length;

        const newCategory = await Category.create(duplicity)
        duplicity.id = newCategory.id
        duplicity.created_at = newCategory.created_at
        duplicity.updated_at = newCategory.updated_at

        for (let i = 0; i < products.length; i++) {
          if (products[i]) {
            const { complements, ...prod } = products[i]
            delete prod.id
            delete prod.created_at
            delete prod.updated_at

            // if (prod.name.includes("- CÓPIA")) {
            //   const newName = prod.name.split(" - CÓPIA ");
            //   let quantityCopy = newName[newName.length - 1];
            //   if (Number(quantityCopy)) {
            //     newName[newName.length - 1] = ` - CÓPIA ${++quantityCopy}`;
            //     prod.name = newName.join(" ");
            //   } else {
            //     prod.name += " 2";
            //   }
            // } else {
            //   prod.name += " - CÓPIA";
            // }

            prod.categoryId = newCategory.id

            const newProduct = await Product.create(prod)
            products[i] = newProduct

            const newComplements = []

            for (let complement of complements) {
              delete complement.id
              delete complement.created_at
              delete complement.updated_at
              delete complement.pivot

              const newComplement = await Complement.create(complement)
              const newComplementPivot = await ProductComplement.create({ productId: newProduct.id, complementId: newComplement.id })

              newComplement.pivot = newComplementPivot
              newComplements.push(newComplement)
            }

            products[i].complements = newComplements
          }
        }

        duplicity.products = products

        return response.json(duplicity)
      } else {
        response.status(403)
        return response.json({ code: 'ct403', message: 'the category not belongs to your user' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async duplicatePizza({ request, auth, params, response }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 148, metodo: 'duplicatePizza' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()
      const dataCategory = request.except(['_csrf'])

      if (profile.id === dataCategory.profileId) {
        const { product, ...category } = dataCategory

        // if (category.name.includes("- CÓPIA")) {
        //   const newName = category.name.split(" - CÓPIA ");
        //   let quantityCopy = newName[newName.length - 1];
        //   if (Number(quantityCopy)) {
        //     newName[newName.length - 1] = ` - CÓPIA ${++quantityCopy}`;
        //     category.name = newName.join(" ");
        //   } else {
        //     category.name += " 2";
        //   }
        // } else {
        //   category.name += " - CÓPIA ";
        // }

        category.order = categories.rows.length

        delete category.id
        delete category.created_at
        delete category.updated_at

        const duplicity = await Category.create(category)

        const newPizza = await PizzaController.duplicateAllProduct(product, duplicity.id)

        duplicity.product = newPizza

        return response.json(duplicity)
      }

      return response.json({
        message: 'this category not available to your user',
      })
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      throw error
    }
  }

  async delete({ params, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 185, metodo: 'delete' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const category = await Category.find(params.id)

      if (category.profileId === profile.id) {
        if (category.type === 'pizza') {
          const pizza = await category.product().fetch()
          pizza.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
          await pizza.save()
        }
        //
        category.deleted_at = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
        await category.save()
      } else {
        throw {
          message: `Category (catProfileId: ${category.profileId}) does not belong to the profile (profId: ${profile.id})`,
        }
      }

      return response.json(category)
    } catch (error) {
      console.log(error)
      // console.error({
      //   date: moment().format(),
      //   params: params,
      //   error: error
      // })
      throw error
    }
  }

  async reorder({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 243, metodo: 'reorder' })
      const { order } = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const categories = await profile.categories().fetch()

      for (let i = 0; i < order.length; i++) {
        const category = categories.rows.find((c) => c.id == order[i])

        category.order = i
        await category.save()
      }

      return response.json({ success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async addHour({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 272, metodo: 'addHour' })
      const data = request.except(['_csrf', '_method'])
      const { categoryId } = data
      const category = await Category.find(categoryId)

      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      data.days.forEach((day) => {
        let checkDay = true
        category.options.week[day.name].forEach((hour) => {
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
          category.options.week[day.name].push({
            code: Encryption.encrypt(day).substring(0, 6),
            open: data.open,
            close: data.close,
            active: JSON.parse(data.active),
            weekDay: parseInt(day.weekDay),
          })

          category.options.week[day.name] = category.options.week[day.name].sort((a, b) => {
            if (a.open < b.open) return -1
            if (a.open > b.open) return 1

            return 0
          })
        }
      })

      await category.save()

      return response.json({
        success: true,
        week: category.options.week,
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
      console.log('Starting: ', { controller: 'CategoryController', linha: 329, metodo: 'updHour' })
      const data = request.except(['_csrf', '_method'])
      const { categoryId, type, weekDay, code, active } = data
      const category = await Category.find(categoryId)
      const item = category.options.week[weekDay].find((h) => h.code === code)
      const convertHour = (text) => parseFloat(text.replace(':', '.'))

      if (type) {
        item[type] = data.hour
      }

      if (active) {
        item.active = JSON.parse(active)
      }

      if (convertHour(item.close) > convertHour(item.open)) {
        category.options.week[weekDay] = category.options.week[weekDay].sort((a, b) => {
          if (a.open < b.open) return -1
          if (a.open > b.open) return 1

          return 0
        })

        await category.save()
      }

      return response.json({
        success: true,
        week: category.options.week,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async removeHour({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'CategoryController', linha: 367, metodo: 'removeHour' })

      const { categoryId, day, code } = params
      const category = await Category.find(categoryId)

      category.options.week[day].splice(
        category.options.week[day].findIndex((h) => h.code === code),
        1
      )

      await category.save()

      response.json({
        success: true,
        hours: category.options.week[day],
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
}

module.exports = CategoryController
