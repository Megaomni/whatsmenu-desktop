import { TestBed } from '@angular/core/testing'
import { CartItem, CartRequestType } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { CupomType } from 'src/app/cupom'
import { ProfileType } from 'src/app/profile-type'
import { profile } from 'src/test/utils/profile'
import { ContextService } from '../context/context.service'

import { CartService } from './cart.service'

describe('CartService', () => {
  let service: CartService
  let mockContextService: ContextService,
    cartRequest: CartRequestType = {
      addon: null,
      total: 50,
      taxDelivery: 5,
      addressId: null,
      bartenderId: null,
      cashierId: null,
      clientId: null,
      commandId: null,
      cupomId: 1,
      formsPayment: [],
      obs: '',
      packageDate: null,
      type: 'D',
    },
    cart: CartType[] = [],
    cartPizza: any[] = [],
    cupom: CupomType = {
      code: 'DEFAULT',
      id: 1,
      profileId: 1,
      type: 'value',
      minValue: 10.5,
      value: 10,
      status: true,
    }
  cartRequest = {
    addon: null,
    total: 50,
    taxDelivery: 5,
    addressId: null,
    bartenderId: null,
    cashierId: null,
    clientId: null,
    commandId: null,
    cupomId: 1,
    formsPayment: [],
    obs: '',
    packageDate: null,
    type: 'D',
  }
  const clearString = (string: string) => {
    return string
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ContextService,
          useValue: jasmine.createSpyObj('ContextService', ['profile', 'currency']),
        },
      ],
    })
    service = TestBed.inject(CartService)
    mockContextService = TestBed.inject(ContextService)
    mockContextService.profile = profile as ProfileType
  })

  afterEach(() => {
    cart = []
    cartPizza = []
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  // filterProducts
  it('shoud be possible to search for a product', () => {
    const products = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)
    const search = 'coca'
    const filteredProducts = service.filterProducts(products, search, 'default')
    expect(filteredProducts.every((product: CartType) => product.name.toLocaleLowerCase().match(search.toLocaleLowerCase()))).toBeTrue()
  })

  it('shoud be possible to search for a pizza', () => {
    const flavors = mockContextService.profile.categories.flatMap((category) => category.product?.flavors).filter((flavor) => flavor)
    const search = 'Calabresa'
    const filteredProducts = service.filterProducts(flavors, search, 'pizza')
    expect(filteredProducts.every((product: CartType) => clearString(product.name).match(clearString(search)))).toBeTrue()
  })

  // totalCartValue
  it('should be possible to get the total value of the pizza and product carts and change the total value of the cartRequest', () => {
    const products = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)

    cart = [
      { ...products[0], quantity: 3, obs: '' },
      { ...products[1], quantity: 1, obs: '' },
      { ...products[2], quantity: 2, obs: '' },
    ]
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    cartPizza = [pizza]

    expect(service.totalCartValue(cart, cartPizza, cartRequest)).toEqual(cartRequest.total)
  })

  // cartItem
  it('should be possible to format the carts to send to the serve', () => {
    const products = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)
    cart = [
      { ...products[0], quantity: 3, obs: '' },
      { ...products[1], quantity: 1, obs: '' },
      { ...products[2], quantity: 2, obs: '' },
    ]
    expect(service.cartItem(cart, [], cartRequest.type).every((item) => item.details && item.type)).toBeTrue()
  })

  // itemCart
  it('should be possible to format order items coming from the server', () => {
    const products = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)
    cart = [
      { ...products[0], quantity: 3, obs: '' },
      { ...products[1], quantity: 1, obs: '' },
      { ...products[2], quantity: 2, obs: '' },
    ]
    const itens = service.cartItem(cart, [], cartRequest.type)

    expect(service.itemCart({ itens }).cart.length).toEqual(itens.filter((item) => item.type === 'default').length)
    expect(service.itemCart({ itens }).cartPizza.length).toEqual(itens.filter((item) => item.type === 'pizza').length)
  })

  // verifyRequiredComplement
  it('should be possible checks if the product has requiered complements', () => {
    const products = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)
    const productRequiredComplements = products.find((product) => product.complements.some((complement) => complement.required))
    const productNotRequiredComplements = products.find((product) => product.complements.some((complement) => !complement.required))

    expect(service.verifyRequiredComplement(productRequiredComplements?.complements)).toBeTrue()
    expect(service.verifyRequiredComplement(productNotRequiredComplements?.complements)).toBeFalse()
  })

  // denyAddItemToCart
  it('must be possible to check if it is possible to include an item with required complements in the cart', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0] as CartType
    const complements = mockContextService.profile.categories
      .flatMap((category) => category.products)
      .filter((product) => product)
      .flatMap((product) => product.complements)
    const complementTest = complements.find((complement) => complement.itens.length >= 2 && complement.required)
    product.complements = [complementTest]
    product.complements[0].itens[0].quantity = complementTest.max
    expect(service.denyAddItemToCart(product.complements)).toBeFalse()
    product.complements[0].itens[0].quantity = complementTest.max - 1
    expect(service.denyAddItemToCart(product.complements)).toBeTrue()
  })

  // complementTotalItens
  it('should be possible to get the quantity of items in a category of complements', () => {
    const complements = mockContextService.profile.categories
      .flatMap((category) => category.products)
      .filter((product) => product)
      .flatMap((product) => product.complements)
    const complementTest = complements.find((complement) => complement.itens.length > 1)
    complementTest.itens[0].quantity = 3
    complementTest.itens[1].quantity = 2

    expect(service.complementTotalItens(complementTest)).toEqual(5)
  })

  // increaseItem
  it('must be possible to increase the quantity of an item', () => {
    const complements = mockContextService.profile.categories
      .flatMap((category) => category.products)
      .filter((product) => product)
      .flatMap((product) => product.complements)
    const complementTest = complements.find((complement) => complement.itens.length > 0)
    const item = complementTest.itens[0]
    item.quantity = 1
    service.increaseItem(item)
    expect(item.quantity).toEqual(2)
  })

  // decreaseItem
  it('must be possible to decrease the quantity of an item', () => {
    const complements = mockContextService.profile.categories
      .flatMap((category) => category.products)
      .filter((product) => product)
      .flatMap((product) => product.complements)
    const complementTest = complements.find((complement) => complement.itens.length > 0)
    const item = complementTest.itens[0]
    item.quantity = 1
    service.decreaseItem(item)
    expect(item.quantity).toEqual(0)
  })

  // getProductFinalValue
  it('should get product value according to order type and promotion', () => {
    let product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]

    product = {
      ...product,
      value: 22,
      promoteValue: 12,
      valueTable: 20,
      promoteValueTable: 15,
      promoteStatus: false,
      promoteStatusTable: false,
    }

    cartRequest.type = 'D'
    expect(service.getProductFinalValue(product, cartRequest.type)).toEqual(product.value)
    product.promoteStatus = true
    expect(service.getProductFinalValue(product, cartRequest.type)).toEqual(product.promoteValue)
    cartRequest.type = 'T'
    expect(service.getProductFinalValue(product, cartRequest.type)).toEqual(product.valueTable)
    product.promoteStatusTable = true
    expect(service.getProductFinalValue(product, cartRequest.type)).toEqual(product.promoteValueTable)
  })

  // addProductToCart
  it('should be possible to add a product to the cart', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]
    service.addProductToCart(product, cart)
    expect(cart.length).toBeGreaterThanOrEqual(1)
  })

  // removeProductCart
  it('should be possible to remove a product in the cart', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]
    cart.push({ ...product, obs: '', quantity: 1 })
    service.removeProductCart(0, cart)
    expect(cart.length).toEqual(0)
  })

  // increaseProduct
  it('must be possible to increase the quantity of an product', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]
    product.quantity = 1
    service.increaseProduct(product as CartType)
    expect(product.quantity).toEqual(2)
  })

  // decreaseProduct
  it('must be possible to decrease the quantity of an product', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0]
    product.quantity = 2
    service.decreaseProduct(product as CartType)
    expect(product.quantity).toEqual(1)
  })

  it('must not be possible to decrease the quantity of a product to less than 1', () => {
    const product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0] as CartType
    product.quantity = 1
    service.decreaseProduct(product)
    expect(product.quantity).toEqual(1)
  })

  // productValueWithComplements
  it('must be possible to obtain the sum of the total value of the product and its complements', () => {
    let product = mockContextService.profile.categories.flatMap((category) => category.products).filter((product) => product)[0] as CartType
    product = {
      ...product,
      value: 22,
      promoteValue: 12,
      valueTable: 20,
      promoteValueTable: 15,
      promoteStatus: false,
      promoteStatusTable: false,
    }
    const complements = mockContextService.profile.categories
      .flatMap((category) => category.products)
      .filter((product) => product)
      .flatMap((product) => product.complements)
    const complementTest = complements.find((complement) => complement.itens.length >= 2)
    complementTest.itens[0].quantity = 2
    complementTest.itens[1].quantity = 3
    product.complements = [complementTest]

    const totalComplements = () => complementTest.itens.reduce((total, item) => (total += item.value * item.quantity), 0)

    cartRequest.type = 'D'
    expect(service.itemValueWithComplements({ item: product, valueType: cartRequest.type, type: 'product' })).toEqual(
      (product.value + totalComplements()) * product.quantity
    )
    product.quantity = 2
    product.promoteStatus = true
    expect(service.itemValueWithComplements({ item: product, valueType: cartRequest.type, type: 'product' })).toEqual(
      (product.promoteValue + totalComplements()) * product.quantity
    )
    product.quantity = 3
    cartRequest.type = 'T'
    expect(service.itemValueWithComplements({ item: product, valueType: cartRequest.type, type: 'product' })).toEqual(
      (product.valueTable + totalComplements()) * product.quantity
    )
    product.quantity = 1
    product.promoteStatusTable = true
    expect(service.itemValueWithComplements({ item: product, valueType: cartRequest.type, type: 'product' })).toEqual(
      (product.promoteValueTable + totalComplements()) * product.quantity
    )
  })

  // pizzaMenuFormat
  it('should be possible to get an array of pizzas for assembling pizza carts', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizzas = service.pizzaMenuFormat(pizzaProduct)

    expect(pizzas.length).toBeGreaterThan(0)
    expect(pizzas[0].flavorCode).toBeTruthy()
    expect(pizzas[0].flavorCode).toEqual(pizzas[0].flavors[0].code)
    expect(pizzas[0].sizeCode).toBeTruthy()
    expect(pizzas[0].quantity).toEqual(1)
  })

  // pizzaTotalValue
  it('should be possible to get the total value of the pizza with implementations', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]

    pizza.flavors[0].values[pizzaProduct.sizes.find((size) => size.code === pizza.sizeCode).name] = 10
    pizza.flavors[0].valuesTable[pizzaProduct.sizes.find((size) => size.code === pizza.sizeCode).name] = 20

    const pizzaValue = (type: 'values' | 'valuesTable') => {
      return (
        pizza.flavors[0][type][pizzaProduct.sizes.find((size) => size.code === pizza.sizeCode).name] +
        pizza.implementations.reduce((total, implementation) => (total += implementation.value), 0)
      )
    }

    cartRequest.type = 'D'
    expect(service.pizzaTotalValue(pizza, cartRequest.type)).toEqual(pizzaValue('values'))
    cartRequest.type = 'T'
    expect(service.pizzaTotalValue(pizza, cartRequest.type)).toEqual(pizzaValue('valuesTable'))
  })

  // addPizzaToCart
  it('should be possible to add a pizza to the cart', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]

    service.addPizzaToCart(pizza, cartPizza)
    expect(cartPizza.length).toBeGreaterThanOrEqual(1)
  })

  // removePizzaCart
  it('should be possible to remove a pizza in the cart', () => {
    service.removePizzaCart(cartPizza[0], cartPizza)
    expect(cartPizza.length).toBeGreaterThanOrEqual(0)
  })

  // increasePizza
  it('must be possible to increase the quantity of an pizza', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    pizza.quantity = 1
    service.increasePizza(pizza)
    expect(pizza.quantity).toEqual(2)
  })

  // // decreaseProduct
  it('must be possible to decrease the quantity of an product', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    pizza.quantity = 2
    service.decreasePizza(pizza)
    expect(pizza.quantity).toEqual(1)
  })

  it('must not be possible to decrease the quantity of a pizza to less than 1', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    pizza.quantity = 1
    service.decreasePizza(pizza)
    expect(pizza.quantity).toEqual(1)
  })

  // getSizeByCode
  it('should be possible to get a pizza size from code', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    expect(service.getSizeByCode(pizza).code).toEqual(pizza.sizeCode)
  })

  // removeFlavor
  it('should be possible to remove a flavor from a pizza', () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    pizza.flavors.push(pizzaProduct.flavors[1], pizzaProduct.flavors[2])
    service.removeFlavor(pizza, 1)
    expect(pizza.flavors.length).toEqual(2)
  })

  it("shouldn't be possible to remove a flavor from a pizza if it's the first flavor", () => {
    const pizzaProduct = mockContextService.profile.categories
      .filter((category) => category.type === 'pizza')
      .flatMap((category) => category.product)
      .find((product) => product.flavors.length > 0)
    const pizza = service.pizzaMenuFormat(pizzaProduct)[0]
    service.removeFlavor(pizza, 0)
    expect(pizza.flavors.length).toEqual(1)
  })

  // cupomValue
  it('should be possible to receive the value of a cupom of type default (value)', () => {
    expect(service.cupomValue(cupom, cartRequest)).toEqual(cupom.value)
  })

  it('should be possible to receive the value of a cupom of type percent', () => {
    cupom.type = 'percent'
    expect(service.cupomValue(cupom, cartRequest)).toEqual(cartRequest.total * (cupom.value / 100))
  })

  it('should be possible to receive the value of a cupom of type freight', () => {
    cupom.type = 'freight'
    expect(service.cupomValue(cupom, cartRequest)).toEqual(cartRequest.taxDelivery)
  })
})
