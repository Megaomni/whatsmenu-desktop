'use strict'
const User = use('App/Models/User')
const Product = use('App/Models/Product')
const PizzaProduct = use('App/Models/PizzaProduct')
const Complement = use('App/Models/Complement')
const ProductComplement = use('App/Models/ProductComplement')
const Utility = use('Utility')

class MenuController {
  async index({ view, auth, response }) {
    // return response.json(await PizzaProduct.all())
    console.log('Starting: ', { controller: 'MenuController', linha: 10, metodo: 'index' })
    const user = await User.find(auth.user.id)
    const profile = await user.profile().fetch()

    const deliveryAccess = await Utility.ControlAccess(user)

    if (JSON.parse(deliveryAccess)) {
      if (!profile.address.street || !profile.taxDelivery.length) {
        return response.route('profileIndex')
      }
    }

    const categories = (await profile.categories().orderBy('order').fetch()).toJSON()
    const categoriesDefault = categories.filter((category) => category.type === 'default')
    const categoriesPizza = categories.filter((category) => category.type === 'pizza')
    let allComplements = []

    for (let category of categoriesDefault) {
      switch (profile.options.order) {
        case "alphabetic":
          category.products = (await Product.query().where('categoryId', category.id).orderBy('name').fetch()).toJSON()
          break;

        default:
          category.products = (await Product.query().where('categoryId', category.id).orderBy('order').orderBy('id').fetch()).toJSON()
          break;
      }

      for (let product of category.products) {
        const prod = await Product.find(product.id)
        product.value = parseFloat(product.value).toFixed(2)
        product.complements = (await prod.complements().orderBy('complements.order').fetch()).toJSON()

        allComplements.push(...product.complements)
      }

    }

    allComplements = (await Complement.query().whereIn('id', [... new Set(allComplements.map(com => com.id))]).fetch()).toJSON()

    for (let compleItem of allComplements) {
      const relation = await ProductComplement.query().where('complementId', compleItem.id).first()
      const p = await Product.find(relation.productId)
      compleItem.name += ` - [${p.name}]`
    }

    for (let category of categoriesPizza) {
      category.product = (await PizzaProduct.findBy('categoryId', category.id)).toJSON()
    }

    // return response.json(allComplements)
    // view.global('getAllComplements', () => allComplements)
    const allCategories = [...categoriesDefault, ...categoriesPizza]

    return view.render('inner.menu-react', {
      profile: profile,
      allCategories: allCategories,
      categories: categoriesDefault,
      categoriesPizza: categoriesPizza,
      allComplements: allComplements,
    })
  }

  async menu({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'MenuController', linha: 76, metodo: 'menu' })
      // return response.json(await PizzaProduct.all())
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()

      let productOrderBy = ''
      switch (profile.options.order) {
        case "alphabetic":
          productOrderBy = 'name'
          break;

        default:
          productOrderBy = 'order'
          break;
      }

      const categories = (
        await profile.categories()
        .with('products', (product) => product.with('complements', (complements) => complements.orderBy('order')).orderBy(productOrderBy))
        .with('product', (pizzaProduct) => pizzaProduct.with('complements', (complements) => complements.orderBy('order')))
        .orderBy('order').fetch()).toJSON()
      const categoriesDefault = categories.filter((category) => category.type === 'default')
      const categoriesPizza = categories.filter((category) => category.type === 'pizza')

      const allCategories = [...categoriesDefault, ...categoriesPizza].sort((a, b) => a.order > b.order)

      return response.json({
        categories: allCategories,
        // allComplements: allComplements
      })
    } catch (error) {
      console.error(error);
      throw error
    }
  }
}

module.exports = MenuController
