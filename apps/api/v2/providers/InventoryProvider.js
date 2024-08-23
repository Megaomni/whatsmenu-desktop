'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class InventoryProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register() {
    async function verifyProductDisponibility(item, cart) {
      const Product = use('App/Models/Product')
      const PizzaProduct = use('App/Models/PizzaProduct')
      let productUpdate
      if (item.productId) {
        productUpdate = await Product.query().where('id', item.productId).with('complements').first()
      }
      if (item.pizzaId) {
        productUpdate = await PizzaProduct.query().where('id', item.pizzaId).with('complements').first()
      }

      const amountInCart = cart.reduce((accumulator, currentValue) => {
        const total = accumulator + (item.productId === currentValue.productId ? currentValue.quantity : 0)
        return total
      }, 0)

      if (amountInCart > productUpdate.amount && !productUpdate.bypass_amount) {
        return {
          code: '400',
          status: 'inventory',
          message: `O produto <b>${item.name}</b> não está mais disponível na quantidade escolhida (apenas ${productUpdate.amount} restantes).`,
        }
      }
      return {}
    }

    async function verifyCartComplementsAvailability(data) {
      const Complement = use('App/Models/Complement')
      const allOrderComplements = data.itens
        .reduce((array, item) => {
          const complementsWithMultiplier = item.details.complements.map((comp) => ({
            ...comp,
            multiplier: item.quantity,
          }))
          return array.concat(complementsWithMultiplier)
        }, [])
        .reduce((array, item, currentIndex, originalArray) => {
          const complementsWithMultiplier = item.itens.map((comp) => ({
            ...comp,
            quantity: comp.quantity * (item.multiplier || 1),
          }))
          return array.concat({ items: complementsWithMultiplier, compId: originalArray[currentIndex].id })
        }, [])

      if (data.itens.some((item) => item.type === 'pizza')) {
        const pizzaComplements = data.itens
          .filter((item) => item.type === 'pizza')
          .reduce((array, item) => {
            const complementsWithMultiplier = item.details.flavors.map((comp) => ({
              ...comp,
              multiplier: item.quantity,
            }))

            return array.concat(complementsWithMultiplier)
          }, [])
          .reduce((array, item) => {
            const complementsWithMultiplier = item.complements.map((comp) => ({
              ...comp,
              multiplier: item.multiplier,
            }))
            return array.concat(complementsWithMultiplier)
          }, [])
          .reduce((array, item, currentIndex, originalArray) => {
            const complementsWithMultiplier = item.itens.map((i) => ({ ...i, quantity: (item.multiplier || 1) * i.quantity }))
            return array.concat({ items: complementsWithMultiplier, compId: originalArray[currentIndex].id })
          }, [])

        allOrderComplements.push(...pizzaComplements)
      }

      const mergeOrderComplements = allOrderComplements.reduce((acc, curr) => {
        if (acc[curr.compId]) {
          acc[curr.compId].items = [...acc[curr.compId].items, ...curr.items]
        } else {
          acc[curr.compId] = { ...curr }
        }
        return acc
      }, {})

      const mergedObject = Object.values(mergeOrderComplements)
      const mergedItems = {}
      mergedObject.forEach((obj) => {
        obj.items.forEach((item) => {
          if (mergedItems[item.code]) {
            mergedItems[item.code].quantity += item.quantity
          } else {
            mergedItems[item.code] = { ...item, compCode: obj.compId }
          }
        })
      })
      const resultComplementItems = Object.values(mergedItems)

      const uniqueComplements = resultComplementItems
        .filter((item, index, self) => index === self.findIndex((t) => t.compCode === item.compCode))
        .map((item) => item.compCode)

      const complementInventory = (await Complement.query().whereIn('id', uniqueComplements).fetch()).toJSON()

      const complementInventoryMerged = complementInventory.reduce((array, item) => array.concat(item.itens), [])

      let unavailableComplements = []
      let availableComplements = []
      for (const item of resultComplementItems) {
        const inventory = complementInventoryMerged.find((inventoryItem) => inventoryItem.code === item.code).amount
        if (item.quantity > inventory && !item.bypass_amount) {
          unavailableComplements.push({ ...item, amount: inventory })
        } else availableComplements.push({ ...item, amount: inventory })
      }

      if (unavailableComplements.length) {
        const formattedMessage = unavailableComplements
          .map((item) => `<li>${item.name}${item.amount ? ` - apenas ${item.amount} restante${item.amount > 1 ? 's' : ''}` : ' - esgotado'}</li>`)
          .join('')
        return {
          code: '400',
          status: 'inventory',
          message: `${unavailableComplements.length > 1
            ? 'Os complementos abaixo não estão mais disponíveis:' + `<ul>${formattedMessage}</ul>`
            : `O complemento ${unavailableComplements[0].name} não está mais disponível${unavailableComplements[0].amount ? `. Apenas ${unavailableComplements[0].amount} disponíveis.` : '.'
            }`
            }`,
        }
      }
      return availableComplements
    }

    async function verifyPizzaFlavorsAvailability(data) {
      const PizzaProduct = use('App/Models/PizzaProduct')

      const pizzaUpdate = await PizzaProduct.query().where('id', data.pizzaId).first()
      const itemFlavors = data.details.flavors.map((flavor) => ({
        ...flavor,
        multiplier: data.quantity,
      }))
      const flavorSet = this.generateFlavorsArray(itemFlavors)

      let flavorInventory = []
      let unavailableFlavor = []
      flavorSet.forEach((flavor) => {
        const totalAmount = flavor.quantity * flavor.multiplier
        flavorInventory = pizzaUpdate.toJSON().flavors

        if (
          (totalAmount > flavorInventory.find((flavorInv) => flavorInv.code === flavor.code).amount ||
            totalAmount > flavorInventory.find((flavorInv) => flavorInv.code === flavor.code).amount === null) &&
          !flavorInventory.find((flavorInv) => flavorInv.code === flavor.code).bypass_amount
        ) {
          unavailableFlavor.push(flavor)
        }
      })
      if (unavailableFlavor.length) {
        return {
          code: '400',
          status: 'inventory',
          message: `O sabor <b>${unavailableFlavor[0].name}</b> não está mais disponível na quantidade escolhida (apenas ${unavailableFlavor[0].amount} restantes).`,
        }
      }
      return {}
    }

    async function updateProductDisponibility(item) {
      const Product = use('App/Models/Product')
      const PizzaProduct = use('App/Models/PizzaProduct')
      let productUpdate
      if (item.productId) {
        productUpdate = await Product.query().where('id', item.productId).with('complements').first()
      }
      if (item.pizzaId) {
        productUpdate = await PizzaProduct.query().where('id', item.pizzaId).with('complements').first()
      }
      if (!productUpdate.bypass_amount) productUpdate.amount -= item.quantity
      return await productUpdate.save()
    }

    async function updatePizzaFlavors(data) {
      const PizzaProduct = use('App/Models/PizzaProduct')
      const pizzaUpdate = await PizzaProduct.query().where('id', data.pizzaId).first()
      const itemFlavors = data.details.flavors.map((flavor) => ({
        ...flavor,
        multiplier: data.quantity,
      }))

      const flavorSet = this.generateFlavorsArray(itemFlavors)

      let flavorInventory = []
      flavorSet.forEach((flavor) => {
        const totalAmount = flavor.quantity * flavor.multiplier
        flavorInventory = pizzaUpdate.toJSON().flavors
        if (!flavorInventory.find((flavorInv) => flavorInv.code === flavor.code).bypass_amount)
          flavorInventory.find((flavorInv) => flavorInv.code === flavor.code).amount -= totalAmount
      })
      pizzaUpdate.flavors = flavorInventory
      await pizzaUpdate.save()
    }

    async function updateComplementAvailability(data) {
      console.log('Starting: ', { provider: 'InventoryProvider', linha: 90, metodo: 'updateComplementAvailability' })
      const Complement = use('App/Models/Complement')
      try {
        let complementToUpdate
        for (const item of data) {
          complementToUpdate = await Complement.query().where('id', item.compCode).first()
          const items = complementToUpdate.toJSON().itens
          const itemIndex = items.findIndex((itemToUpdate) => itemToUpdate.code === item.code)
          if (!items[itemIndex].bypass_amount) items[itemIndex].amount -= item.quantity
          complementToUpdate.itens = items
          await complementToUpdate.save()
        }
        return
      } catch (error) {
        console.log(error)
      }
    }

    async function identifyLowInventory(profileId) {
      console.log('Starting: ', { provider: 'InventoryProvider', linha: 231, metodo: 'identifyLowInventory' })
      try {
        const Category = use('App/Models/ReadOnly/Category')
        const Product = use('App/Models/ReadOnly/Product')
        const categories = (await Category.query().where('profileId', profileId).with('products').with('product').fetch()).toJSON()

        const products = categories.reduce((array, category) => {
          const productsArray = category.products.map((product) => product)
          return array.concat(productsArray)
        }, [])
        const pizzaProducts = categories.filter((category) => category.type === 'pizza').map((category) => category.product)

        const productIDs = products.map((product) => product.id).filter((product) => !product.bypass_amount)
        const complements = await Product.query().whereIn('id', productIDs).with('complements').fetch()
        const allComplements = []

        complements.rows.forEach((product) => {
          const complements = product.getRelated('complements').rows
          complements.forEach((complement) => {
            if (!allComplements.find((comp) => comp.id === complement.id)) {
              allComplements.push(complement.toJSON())
            }
          })
        })

        const pizzaFlavors = pizzaProducts.reduce((array, pizzaProduct) => {
          if (pizzaProduct.flavors) {
            const complements = pizzaProduct.flavors.map((complement) => complement)
            return array.concat(complements)
          }
        }, [])

        const productComplements = allComplements.reduce((array, product) => {
          if (product.itens) {
            const complements = product.itens.map((complement) => complement)
            return array.concat(complements)
          }
        }, [])

        const lowComplements = productComplements.filter(
          (product) => product.amount <= product.amount_alert && product.amount > 0 && !product.bypass_amount
        )
        const soldOutComplements = productComplements.filter((product) => product.amount === 0 && !product.bypass_amount)

        const lowProducts = products.filter((product) => product.amount <= product.amount_alert && product.amount > 0 && !product.bypass_amount)
        const soldOutProducts = products.filter((product) => product.amount === 0 && !product.bypass_amount)

        const lowPizzaProducts = pizzaProducts.filter(
          (product) => product.amount <= product.amount_alert && product.amount > 0 && !product.bypass_amount
        )
        const soldOutPizzaProducts = pizzaProducts.filter((product) => product.amount === 0 && !product.bypass_amount)

        const lowPizzaFlavors = pizzaFlavors.filter(
          (product) => product.amount <= product.amount_alert && product.amount > 0 && !product.bypass_amount
        )
        const soldOutPizzaFlavors = pizzaFlavors.filter((product) => product.amount === 0 && !product.bypass_amount)

        return {
          low: { products: lowProducts, pizzaProducts: lowPizzaProducts, complements: lowComplements, pizzaFlavors: lowPizzaFlavors },
          soldOut: {
            products: soldOutProducts,
            pizzaProducts: soldOutPizzaProducts,
            complements: soldOutComplements,
            pizzaFlavors: soldOutPizzaFlavors,
          },
        }
      } catch (error) {
        console.log(error)
      }
    }

    function generateFlavorsArray(pizzaFlavors) {
      let uniqueFlavors = {}

      for (let flavor of pizzaFlavors) {
        const flavorId = flavor.code
        if (uniqueFlavors[flavorId]) {
          uniqueFlavors[flavorId].quantity++
        } else {
          uniqueFlavors[flavorId] = {
            ...flavor,
            quantity: 1,
          }
        }
      }
      return Object.values(uniqueFlavors)
    }

    async function restoreProductDisponibility(item) {
      const Product = use('App/Models/Product')
      const PizzaProduct = use('App/Models/PizzaProduct')
      const CartIten = use('App/Models/CartIten')
      const Complement = use('App/Models/Complement')
      let productUpdate
      const itemToUpdate = (await CartIten.query().where('id', item.id).first()).toJSON()

      if (!itemToUpdate) {
        throw new Error(`Cart item with id ${item.id} not found.`)
      }

      if (item.productId) {
        productUpdate = await Product.query().where('id', item.productId).with('complements').first()
        productUpdate.amount += item.quantity
        const complements = (await productUpdate.complements().fetch()).toJSON()

        for (const complement of complements) {
          const id = complement.id
          const complementToUpdate = item.details.complements.find((comp) => comp.id === id)

          if (complementToUpdate) {
            for (const complementItem of complement.itens) {
              const itemToUpdate = complementToUpdate.itens.find((itemToUpdate) => itemToUpdate.code === complementItem.code)
              if (itemToUpdate && itemToUpdate.quantity) complementItem.amount += itemToUpdate.quantity
              else complementItem.amount = 0
            }
          }
        }
        productUpdate.save()
      }

      if (item.pizzaId) {
        productUpdate = await PizzaProduct.query().where('id', item.pizzaId).with('complements').first()
        productUpdate.amount += item.quantity
        const complements = (await productUpdate.complements().fetch()).toJSON()
        const flavors = productUpdate.toJSON().flavors

        for (const complement of complements) {
          const id = complement.id
          const complementToUpdate = item.details.complements.find((comp) => comp.id === id)

          if (!complementToUpdate) continue

          for (const complementItem of complement.itens) {
            const itemToUpdate = complementToUpdate.itens.find((itemToUpdate) => itemToUpdate.code === complementItem.code)
            if (itemToUpdate && itemToUpdate.quantity) complementItem.amount += itemToUpdate.quantity
            else complementItem.amount = 0
          }
        }
        for (const flavor of flavors) {
          const code = flavor.code
          const flavorToUpdate = item.details.flavors.find((flavor) => flavor.code === code)
          if (!flavorToUpdate) continue

          flavor.amount += item.quantity
          if (flavorToUpdate.complements) {
            for (const complement of flavorToUpdate.complements) {
              const originalComplement = await Complement.query().where('id', complement.id).first()
              for (const complementItem of originalComplement.itens) {
                const itemToUpdate = complement.itens.find((itemToUpdate) => itemToUpdate.code === complementItem.code)
                if (itemToUpdate && itemToUpdate.quantity) complementItem.amount += itemToUpdate.quantity
              }
              await originalComplement.save()
            }
          }
        }
        productUpdate.save()
      }
    }

    this.app.singleton('InventoryProvider', () => {
      return {
        verifyCartComplementsAvailability,
        updateComplementAvailability,
        generateFlavorsArray,
        verifyProductDisponibility,
        updateProductDisponibility,
        verifyPizzaFlavorsAvailability,
        updatePizzaFlavors,
        identifyLowInventory,
        restoreProductDisponibility,
      }

      // console.log(addRows);
    })
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
    //
  }
}

module.exports = InventoryProvider
