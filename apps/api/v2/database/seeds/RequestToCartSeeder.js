'use strict'

/*
|--------------------------------------------------------------------------
| RequestToCartSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Cart = use('App/Models/Cart')
const CartIten = use('App/Models/CartIten')
const Client = use('App/Models/Client')
const ClientAddress = use('App/Models/ClientAddress')
const Profile = use('App/Models/Profile')
const Bartender = use('App/Models/Bartender')

const { randomBytes } = require('crypto')

class RequestToCartSeeder {
  async run() {
    let profilePage = 1
    let profiles = {}
    do {
      profiles = await Profile.query()
        .with('user')
        .with('categories', (query) => query.with('products').with('product'))
        .paginate(profilePage, 1)
      for (const profile of profiles.rows) {
        profile.options = {
          ...profile.options,
          pizza: { ...profile.options.pizza, multipleBorders: false, multipleComplements: true },
          pdv: {
            cashierManagement: false,
            clientConfig: {
              birthDate: false,
              required: false,
            },
          },
        }
        await Bartender.create({
          name: profile.toJSON().user.name,
          profileId: profile.id,
          password: profile.toJSON().user.password,
          controls: {
            type: 'manager',
          },
        })
        profile.save()
        let requestPage = 1
        let requests = {}
        let duplicateRequests = []
        let allCodes = []
        let totalRequests = 0
        do {
          requests = await profile.requests().paginate(requestPage, 100)
          for (const req of requests.rows) {
            const request = req.toJSON()
            let requestDuplicate = duplicateRequests.find((r) => r && r.code === req.code)
            if (allCodes.some((code) => code === req.code)) {
              if (!requestDuplicate) {
                requestDuplicate = { code: request.code, times: 1 }
                request.code += `*${requestDuplicate.times}`
                duplicateRequests.push(requestDuplicate)
              } else {
                requestDuplicate.times++
                request.code += `*${requestDuplicate.times}`
              }
            }
            const cart = await this.generateCart(request, profile)
            if (cart) {
              totalRequests++
              allCodes.push(cart.code)
              this.generateCartItens({ cart: request.cart, cartPizza: request.cartPizza, cartId: cart.id, valueType: request.type, profile })
            }
          }
          requestPage++
        } while (requestPage <= requests.pages.lastPage)
        if (totalRequests > 0) {
          console.log(`${totalRequests} - Pedidos Atualizados - Perfil ${profile.slug}`)
        }
      }
      profilePage++
    } while (profilePage <= profiles.pages.lastPage)
  }

  async generateCart(request, profile) {
    try {
      const alreadyExistisCart = await Cart.find(request.id)
      if (alreadyExistisCart) {
        return false
      }
      let cart = { controls: {} }
      for (const [key, value] of Object.entries(request)) {
        switch (key) {
          case 'id':
          case 'profileId':
          case 'cupomId':
          case 'commandId':
          case 'bartenderId':
          case 'code':
          case 'status':
          case 'type':
          case 'taxDelivery':
          case 'timeDelivery':
          case 'total':
          case 'print':
          case 'tentatives':
          case 'packageDate':
          case 'created_at':
          case 'updated_at':
            cart[key] = request[key]
            break
          case 'name':
            cart.clientId = await this.generateClient({
              clientSearchData: {
                profileId: request.profileId,
                whatsapp: request.contact,
              },
              name: request.name,
              date_last_request: request.created_at,
              profile,
            })
            break
          case 'deliveryAddress':
            cart.controls.ip = value.ip
            delete request[key].ip
            if (request.typeDelivery === 0) {
              cart.addressId = await this.generateClientAddress({
                deliveryAddress: request.deliveryAddress,
                clientId: cart.clientId,
                uf: profile.address.state,
              })
            }
            break
          case 'formPayment':
            const formPayment = await this.generateFormPayment({
              label: request.formPayment,
              flag: request.formPaymentFlag,
              value: request.total,
              change: request.transshipment,
              profileFormsPayment: profile.formsPayment,
            })
            cart.formsPayment = [formPayment]
            break
          default:
            break
        }
      }
      cart = await Cart.create(cart)
      return cart
    } catch (error) {
      console.error(error)
    }
  }

  async generateCartItens({ cart, cartPizza, cartId, valueType, profile }) {
    try {
      const categories = profile.toJSON().categories
      const products = categories.reduce((products, category) => [...products, ...category.products], [])
      cart = cart.map((product) => {
        const profileProduct = products.find((p) => p.id === product.id)
        return {
          productId: profileProduct ? profileProduct.id : null,
          cartId,
          quantity: product.quantity ? product.quantity : 1,
          obs: product.obs,
          details: {
            value: this.getProductFinalValue(product, valueType),
            isPromote: !!(product.promoteStatus || product.promoteStatusTable),
            complements: product.complements,
          },
          name: product.name,
          type: 'default',
        }
      })

      const pizzas = categories.map((category) => category.product).filter((pizza) => pizza)

      cartPizza = cartPizza.map((pizza) => {
        const pizzaProfile = pizzas.find((pizzaProfile) => {
          return (
            pizza.flavors.some((flavor) => pizzaProfile.flavors.some((f) => f.code === flavor.code)) ||
            pizzaProfile.sizes.some((size) => size.name === pizza.size)
          )
        })

        const flavors = pizza.flavors.map((flavor) => flavor.name).join()

        const pizzaId = pizzaProfile ? pizzaProfile.id : null
        return {
          cartId,
          pizzaId,
          quantity: pizza.quantity ? pizza.quantity : 1,
          obs: pizza.obs,
          details: {
            value: pizza.value,
            size: pizza.size,
            complements: pizza.complements,
            flavors: pizza.flavors,
            implementations: pizza.implementations,
          },
          name: pizzaProfile
            ? `Pizza ${pizza.size} ${pizza.flavors.length} Sabor${pizza.flavors.length > 1 ? 'es' : ''} ${flavors} ${pizza.implementations.length ? 'com ' + pizza.implementations[0].name : ''}`
            : '-',
          type: 'pizza',
        }
      })
      const itens = [...cartPizza, ...cart]
      await CartIten.createMany(itens)
    } catch (error) {
      console.error(error)
    }
  }

  async generateClient({ clientSearchData, name, date_last_request }) {
    try {
      let client = await Client.query().where(clientSearchData).first()
      if (!client) {
        client = await Client.create({
          ...clientSearchData,
          name,
          date_last_request,
        })
      } else {
        client.date_last_request = date_last_request
        client.name = name
        await client.save()
      }
      return client.id
    } catch (error) {
      console.error(error)
    }
  }

  async generateClientAddress({ deliveryAddress, clientId, uf }) {
    try {
      deliveryAddress.clientId = clientId
      deliveryAddress.uf = uf ? uf : ''
      deliveryAddress.number = typeof deliveryAddress === 'number' ? deliveryAddress : null
      deliveryAddress.city = deliveryAddress.city ? deliveryAddress.city : ''
      delete deliveryAddress.ip
      let address = await ClientAddress.query().where(deliveryAddress).first()
      if (!address) {
        address = await ClientAddress.create(deliveryAddress)
      }
      return address.id
    } catch (error) {
      console.error(error)
    }
  }

  async generateFormPayment({ label, flag, value, change, profileFormsPayment }) {
    try {
      const formPayment = {
        label,
        flag,
        value,
      }
      if (label === 'Dinheiro' && change) {
        formPayment.change = change
      }

      const profileFormPayment = profileFormsPayment.find((f) => f.label === label)
      if (profileFormPayment) {
        formPayment.payment = profileFormPayment.payment
        formPayment.code = randomBytes(3).toString('hex')
      }
      return formPayment
    } catch (error) {
      console.error(error)
    }
  }

  getProductFinalValue(product, valueType) {
    const valueMenu = valueType === 'T' ? 'valueTable' : 'value'
    const promoteStatusMenu = valueType === 'T' ? 'promoteStatusTable' : 'promoteStatus'
    const promoteValueMenu = valueType === 'T' ? 'promoteValueTable' : 'promoteValue'

    return product[promoteStatusMenu] ? product[promoteValueMenu] : product[valueMenu]
  }
}

module.exports = RequestToCartSeeder
