import { Injectable } from '@angular/core'
import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { CartItem, CartRequestType } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { CupomType } from 'src/app/cupom'
import { PizzaFlavorType, PizzaImplementationType, PizzaProductType, PizzaSizeType } from 'src/app/pizza-product-type'
import { ComplementItemType, ComplementType, ProductType } from 'src/app/product-type'
import { ContextService } from '../context/context.service'
import { NgbDate } from '@ng-bootstrap/ng-bootstrap'
import { DateTime } from 'luxon'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from '../api/api.service'
import * as moment from 'moment'
import { isEqual } from 'lodash'
import { CartFormPaymentType } from 'src/app/formpayment-type'
import { InventoryPropsType } from 'src/app/invetory-type'

@Injectable({
  providedIn: 'root',
})
export class CartService {
  valueType: 'D' | 'T' | 'P'
  hourFilter = ''
  higherValue = false
  profile: ProfileType
  cartRequest: CartRequestType

  constructor(public context: ContextService, public api: ApiService) {
    this.markDisabled = this.markDisabled.bind(this)
  }

  //Plans
  /** Checa os planos */
  public plansType(): string[] {
    const clientType = this.profile.plans
    return clientType || []
  }

  // Horário de Funcionamento
  /** Checa se o estabelecimento está dentro do horário de funcionamento */
  public checkAvailability(clientData: any): boolean {
    const today = DateTime.fromISO(clientData.fuso, { zone: clientData.timeZone }).toFormat('EEEE').toLowerCase()
    const convert = (text) => parseFloat(text.replace(':', '.'))

    if (!clientData.week[today] && (localStorage.viewContentAlternate === 'D' || localStorage.viewContentAlternate === 'delivery')) {
      return false
    }
    if (localStorage.viewContentAlternate === 'P' || localStorage.viewContentAlternate === 'package') {
      return true
    }
    if (localStorage.viewContentAlternate === 'T' || localStorage.viewContentAlternate === 'table') {
      return true
    }

    const week = clientData.week
    const now = parseFloat(DateTime.local().setZone(clientData.timeZone).toFormat('HH.mm'))
    const filter = week[today].filter((d) => now >= convert(d.open) && now <= convert(d.close))

    if (filter.length) {
      return true
    }
  }

  // SEARCH
  /** Busca de produtos/pizzas no cardápio. Retorna um array de acordo com o filtro passado */
  public filterProducts(data: any[], search: string, type: 'default' | 'pizza'): any[] {
    let result: any[] = data
    const clearString = (string: string) => {
      return string
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
    }
    if (search) {
      if (this.context.activeBartender) {
        if (type === 'default') {
          result = data.filter((p) => !this.context.activeBartender.controls.blockedCategories?.includes(p.categoryId))
        } else {
          result = data.filter((p) => p.pizzaId && !this.context.activeBartender.controls.blockedCategories?.includes(p.categoryId))
        }
      }
      result = result.filter((p) => {
        return clearString(p.name).includes(clearString(search))
      })
    }
    return result
  }

  // ALL
  /** Armazena o carrinho no localStorage */
  public savePDVCart({ cart, cartPizza }: { cart?: CartType[]; cartPizza?: CartPizza[] }): void {
    if (window.location.pathname.includes('/pdv')) {
      let cartStorage = JSON.parse(localStorage.getItem('cart_pdv')) || {}

      if (cart) {
        cartStorage.cart = cart
      }
      if (cartPizza) {
        cartStorage.cartPizza = cartPizza
      }
      localStorage.setItem('cart_pdv', JSON.stringify(cartStorage))
    }
  }

  /** Retorna valor total dos carrinhos de produtos padrão e pizza, se passado um pedido no terceiro argumento esse valor sera atrubuido ao valor total do pedido */
  public totalCartValue(cart: CartType[], cartPizza: CartPizza[], cartRequest: CartRequestType): number {
    let total = 0
    const totalCart = cart.reduce((acc, product) => {
      acc += this.itemValueWithComplements({ item: product, type: 'product', valueType: cartRequest.type, multiplyByQuantity: true })
      return acc
    }, 0)
    const totalCartPizza = cartPizza.reduce((acc, pizza) => {
      if (pizza.details) {
        acc += pizza.details.value * pizza.quantity
      } else {
        acc +=
          (this.pizzaTotalValue(pizza as CartFlavorPizzaType, cartRequest.type) +
            this.sumComplements(pizza.complements) +
            ((this.profile ?? this.context.profile).options.pizza.higherValue && pizza.implementations[0]
              ? pizza.implementations[0]?.value
              : this.sumImplementations(pizza.implementations, pizza.flavors, (this.profile ?? this.context.profile).options.pizza.higherValue)) +
            this.sumFlavors(pizza.flavors)) *
          pizza.quantity
      }

      return acc
    }, 0)

    total = totalCart + totalCartPizza
    cartRequest.total = total
    return total
  }

  /** Retorna valor total do pedido com todas as operações, taxa de entrega, cupom, taxa de pagamento */
  public totalCartFinalValue({
    cartRequest,
    formPayment,
    isOnline = false,
    cupom = true,
  }: {
    cartRequest: CartRequestType
    formPayment?: CartFormPaymentType
    isOnline?: boolean
    cupom?: boolean
  }) {
    if (!formPayment) {
      formPayment = cartRequest.formsPayment.filter((formPayment) => formPayment.payment !== 'cashback')[0]
    }

    const { cart, cartPizza } = this.itemCart({ itens: cartRequest.itens })
    let voucherValue = cartRequest.formsPayment
      .filter((formPayment) => formPayment.payment === 'cashback')
      .reduce((total, formPayment) => (total += formPayment.value), 0)

    return Math.max(
      this.totalCartValue(cart, cartPizza, cartRequest) -
        (cupom ? this.cupomValue(cartRequest.cupom, cartRequest) : 0) +
        (cartRequest.addressId ? cartRequest.taxDelivery ?? 0 : 0) +
        (isOnline ? 0 : this.formPaymentAddonCalcResult(formPayment, cartRequest.total)) -
        voucherValue,
      0
    )
  }

  /** Formata carrinhos para enviar para o servidor */
  public cartItem(cart: CartType[], cartPizza: CartFlavorPizzaType[], valueType: 'D' | 'T' | 'P'): CartItem[] {
    const cartPizzaMapped: CartItem[] = cartPizza.filter(Boolean).map((pizza) => {
      const sizeCode = pizza.sizes.find((size) => size.name === (pizza.details?.size ?? pizza.size))?.code
      const filteredGeneralComplements = (pizza.complements ?? pizza.details.complements)
        .map((complement) => this.filterEmptyComplements(complement))
        .filter((complement) => complement.itens.length)
      return {
        pizzaId: pizza.id,
        quantity: pizza.quantity,
        obs: pizza.obs,
        details: {
          value: pizza.details?.value ?? this.itemValueWithComplements({ item: pizza, type: 'pizza', valueType, multiplyByQuantity: false }),
          sizeCode,
          complements: filteredGeneralComplements,
          flavors: pizza.flavors.map((flavor) => {
            flavor.complements = flavor.complements ?? []
            return {
              ...flavor,
              implementations: flavor.implementations?.filter(Boolean),
              complements: flavor.complements
                .map((complement) => this.filterEmptyComplements(complement))
                .filter((complement) => complement.itens.length),
            }
          }),
          implementations: pizza.implementations,
        },
        name: pizza.name,
        type: 'pizza',
      }
    })

    const cartMapped: CartItem[] = cart
      .filter((product) => product)
      .map((product) => {
        return {
          productId: product.id,
          quantity: product.quantity,
          obs: product.obs,
          details: {
            value: this.getProductFinalValue(product, valueType),
            isPromote: product.promoteStatus || product.promoteStatusTable,
            complements: product.complements
              .map((complement) => this.filterEmptyComplements(complement))
              .filter((complement) => complement.itens.length),
          },
          name: product.name,
          type: 'default',
        }
      })
    return [...cartPizzaMapped, ...cartMapped]
  }

  /** Formata carrinho vindo do servidor para vizualização */
  public itemCart({ itens }: { itens: CartItem[] }): { cart: CartType[]; cartPizza: CartPizza[] } {
    const cart = []
    const cartPizza = []
    itens.forEach((item) => {
      if (item.type === 'default') {
        const menuItem = this.context.profile.categories
          .flatMap((c) => c.products)
          .filter((p) => p)
          .find((p) => p.id === item.productId)
        cart.push({ ...menuItem, ...item, ...item.details })
      }
      if (item.type === 'pizza') {
        const menuItem = this.context.profile.categories
          .flatMap((c) => c.product)
          .filter((p) => p)
          .find((p) => p.id === item.pizzaId)
        cartPizza.push({ ...menuItem, ...item, ...item.details })
      }
    })
    return { cart, cartPizza }
  }

  // COMPLEMENTS
  /** Verifica se o produto tem complementos obrigatórios */
  public verifyRequiredComplement(complements: ComplementType[]): boolean {
    return complements.some((comp) => !!comp.required)
  }

  /** Verifica se é possível adicionar um produto ou pizza com complementos obrigatórios no carrinho */
  public denyAddItemToCart(complements: ComplementType[]): boolean {
    if (this.verifyRequiredComplement(complements)) {
      return !complements
        .filter((c) => c.required)
        .every((complement) => complement.itens.reduce((totalQuantity, item) => (totalQuantity += item.quantity), 0) >= complement.min)
    }
    return false
  }

  //** Retorna total de itens adicionados no carrinho de uma categoria de complementos */
  public complementTotalItens(complement: ComplementType): number {
    const result = complement.itens.reduce((acc, item) => {
      acc += item.quantity || 0
      return acc
    }, 0)
    return result
  }

  public sumComplementTotalItens(complements: ComplementType[]) {
    return complements.flatMap((complement) => complement.itens)
  }

  public filterEmptyComplements(complement: ComplementType) {
    return { ...complement, itens: complement.itens.filter((item) => item.quantity) }
  }

  /** Aumenta a quantidade do item no produto no carrinho */
  public increaseItem(item: ComplementItemType) {
    if (!item.quantity) {
      item.quantity = 1
    } else {
      ++item.quantity
    }
  }

  /** Diminui a quantidade do item no produto no carrinho */
  public decreaseItem(item: ComplementItemType) {
    if (item.quantity > 0) {
      --item.quantity
    }
  }

  //**  */
  public editComplements(complements: ComplementType[], menuComplements: ComplementType[]): ComplementType[] {
    return menuComplements.map((complement) => {
      const editableComplement = complements.find((c) => c.id === complement.id)
      if (editableComplement) {
        complement.itens = complement.itens.map((item) => {
          const editableItem = editableComplement.itens.find((i) => i.code === item.code)
          if (editableItem) {
            return editableItem
          }
          return item
        })
      }
      return complement
    })
  }

  // PRODUCTS

  /** Retorna o valor do produto de acordo com o tipo de pedido ('D', 'T', 'P') e promoção. Obs: sem valor de complementos  */
  public getProductFinalValue(product: ProductType | CartType, valueType: 'D' | 'T' | 'P'): number {
    const valueMenu = valueType === 'T' ? 'valueTable' : 'value'
    const promoteStatusMenu = valueType === 'T' ? 'promoteStatusTable' : 'promoteStatus'
    const promoteValueMenu = valueType === 'T' ? 'promoteValueTable' : 'promoteValue'

    return product[promoteStatusMenu] ? product[promoteValueMenu] : product[valueMenu]
  }

  /** Adiciona um produto no carrinho */
  public async addProductToCart(product: ProductType, cart: CartType[]): Promise<void> {
    if (this.denyAddItemToCart(product.complements)) {
      return
    }

    const { created_at, updated_at, order, countRequests, ...restProduct } = product
    const newProduct: CartType = this.copyObj(restProduct)

    /* await this.checkProductDisponibility(newProduct, cart, 'D') */

    newProduct.quantity = newProduct.quantity ?? 1
    newProduct.obs = newProduct.obs ?? ''

    newProduct.complements = newProduct.complements.filter((complement) => {
      if (complement.itens.some((item) => item.quantity)) {
        complement.itens = complement.itens.filter((i) => i.quantity)
        return true
      } else {
        return false
      }
    })

    product.quantity = 1
    product.obs = ''

    product.complements.forEach((complement) => {
      complement.itens.forEach((item) => {
        item.quantity = 0
      })
    })
    newProduct.code = this.hash()
    cart.push(newProduct)
    this.savePDVCart({ cart })
  }

  /** Retorna um hash aleatório **/
  public hash(length = 6) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  /** Remove um produto do carrinho */
  public removeProductCart(index: number, cart: CartType[]) {
    cart.splice(index, 1)
  }

  /** Aumenta a quantidade um produto do carrinho */
  public increaseProduct(product: CartType | CartFlavorPizzaType): void {
    ++product.quantity
  }

  /** Diminui a quantidade um produto do carrinho */
  public decreaseProduct(product: CartType | CartFlavorPizzaType): void {
    if (product.quantity > 1) {
      --product.quantity
    }
  }

  public increaseCartItem(item: CartItem): void {
    ++item.quantity
  }

  public decreaseCartItem(item: CartItem): void {
    if (item.quantity > 1) {
      --item.quantity
    }
  }

  public pizzaComplementsReduce(pizza: CartItem) {
    let result = 0
    if (!pizza || pizza.type !== 'pizza') {
      return result
    }
    result = pizza.details.complements.reduce(
      (complementTotal, complement) =>
        (complementTotal += complement.itens.reduce((itensTotal, item) => (itensTotal += item.value * item.quantity), 0)),
      0
    )
    return result
  }

  public flavorsComplementsReduce(pizza: CartFlavorPizzaType | CartItem): number {
    const flavors = ((pizza as CartFlavorPizzaType).flavors ?? pizza.details.flavors).filter((f) => f)
    let total = 0
    const allItens = flavors.flatMap((flavor) => flavor.complements).flatMap((complement) => complement?.itens ?? [])

    const higherQuantityItens = allItens.reduce((higherQuantityItens: ComplementItemType[], item) => {
      const itemIndex = higherQuantityItens.findIndex((i) => i.code === item.code)
      if (itemIndex !== -1) {
        if (higherQuantityItens[itemIndex].quantity < item.quantity) {
          higherQuantityItens[itemIndex] = { ...item, isHigher: true }
        } else {
        }
      } else {
        higherQuantityItens.push(item)
      }
      return higherQuantityItens
    }, [])

    higherQuantityItens.forEach((item) => {
      item.isHigher = true
    })

    higherQuantityItens.forEach((item) => {
      total += item.value * (item.quantity || 0)
    })
    return total
  }

  public flavorsImplementationsReduce(pizza: CartFlavorPizzaType): number {
    if (pizza.implementations[0]) {
      return pizza.implementations[0].value ?? 0
    }

    const allImplementations = pizza.flavors.flatMap((flavor) => flavor.implementations)
    if (allImplementations[0] == undefined) return 0
    if (!allImplementations.length) return 0

    const higherValue = true

    if (higherValue) {
      return allImplementations.sort((a, b) => b?.value - a?.value)[0]?.value
    }
    return allImplementations.reduce((acc, current) => acc + current.value / 4, 0)
  }

  public totalImplementations(pizza: CartItem) {
    const { multipleBorders, higherValue } = this.profile.options.pizza
    const implementations = multipleBorders ? pizza.details.flavors.flatMap((f) => f?.implementations) : pizza.details.implementations
    return higherValue
      ? Math.max(...implementations.map((i) => i?.value || 0), 0)
      : multipleBorders
      ? implementations.filter((i) => i).reduce((total, i) => (total += i.value / pizza.details.flavors.length), 0)
      : implementations[0]?.value || 0
  }

  /** Retorna o valor total do produto ou pizza com a soma do total de complementos */
  public itemValueWithComplements({
    item,
    valueType,
    type,
    multiplyByQuantity = false,
    itemType = false,
    noImplementations = false,
  }: {
    item: CartType | CartFlavorPizzaType | CartItem
    valueType: 'D' | 'T' | 'P'
    type: 'product' | 'pizza'
    multiplyByQuantity?: boolean
    itemType?: boolean
    noImplementations?: boolean
  }): number {
    let totalComplements = 0
    let totalImplementations = 0
    let result = 0

    switch (type) {
      case 'product': {
        totalComplements = item.complements.reduce((total, complement) => {
          complement.itens.forEach((item) => {
            total += item.value * (item.quantity || 0)
          })
          return total
        }, 0)
        const product = item as CartType
        result = (this.getProductFinalValue(product, valueType) + totalComplements) * (multiplyByQuantity ? product.quantity : 1)
        break
      }
      case 'pizza': {
        const pizza = item as CartFlavorPizzaType
        totalComplements = this.flavorsComplementsReduce(pizza)
        totalImplementations = noImplementations ? 0 : this.flavorsImplementationsReduce(pizza)
        const generalComplements = itemType
          ? 0
          : item.complements.flatMap((complement) => complement.itens).reduce((total, item) => (total += item.value * (item.quantity || 0)), 0)
        const totalPizza = itemType ? this.pizzaItemTotalValue({ pizza: item as CartItem, valueType }) : this.pizzaTotalValue(pizza, valueType)
        result = (totalPizza + totalComplements + totalImplementations + generalComplements) * (multiplyByQuantity ? pizza.quantity : 1)
        break
      }
    }
    return result
  }

  public markDisabled(date: NgbDate): boolean {
    const { day, month, year } = date
    const dateFormated = DateTime.fromObject({ day, month, year })
    return (
      this.context.profile?.options.package.specialsDates.some((specialDate) => {
        const specialDateFormated = DateTime.fromISO(specialDate)
        return specialDateFormated.isValid && specialDateFormated.hasSame(dateFormated, 'day')
      }) || !this.context.profile?.options.package.week[dateFormated.setLocale('en-US').weekdayLong.toLowerCase()].length
    )
  }
  // public markDisabled(date: NgbDate): boolean {
  //   const { day, month, year } = date
  //   const dateFormated = DateTime.fromObject({ day, month, year })
  //   return !this.context.profile?.options.package.week[dateFormated.setLocale('en-US').weekdayLong.toLowerCase()].length
  // }

  public filteredPeriod(hour: { time: string; quantity: number }[]): { time: string; quantity: number }[] {
    return hour.filter((h) => {
      return (
        h.time.includes(this.hourFilter.replace(/(\d{2})(\d{1,2})/, '$1:$2')) && h.time > DateTime.local().plus({ minutes: 30 }).toFormat('HH:mm')
      )
    })
  }

  /** Checa a disponibilidade de um produto e complemento  */
  async checkProductDisponibility(cartItem: any, cart, contentAlternate: string, edit?: boolean, code?: string) {
    try {
      if (!this.context.profile.options.inventoryControl) {
        return { disponibility: true }
      }
      if (cartItem.amount === null) {
        cartItem.bypass_amount = true
      }
      const checkProductDisponibility = await this.api.checkProductDisponibility(
        this.context.profile.slug,
        cartItem.flavors ? 'pizza' : 'product',
        cartItem.id,
        {
          packageType: false,
          // packageDate: localStorage.getItem(`${this.context.profile.slug}_packageDate`)
          //   ? moment(localStorage.getItem(`${this.context.profile.slug}_packageDate`)).toISOString()
          //   : null,
          packageDate: this.cartRequest?.packageDate,
          amount: cartItem.quantity,
          cart: cart,
          product: cartItem,
          edit: edit,
          code: code,
        },
        cartItem.sizes?.find((size) => size.code === cartItem.sizeCode)?.name || '',
        cartItem.flavors || [],
        cartItem.implementations || [],
        cartItem.complements
      )
      return checkProductDisponibility
    } catch (error) {
      console.error(error)
      return error.error
    }
  }

  // PIZZAS

  /** Retorna um array de pizzas pra montagem de carrinhos do tipo pizza */
  public pizzaMenuFormat(pizza: PizzaProductType): CartFlavorPizzaType[] {
    let pizzas: CartFlavorPizzaType[] = []
    if (pizza.sizes.length) {
      pizzas = pizza.flavors.map((flavor) => ({
        id: pizza.id,
        name: flavor.name,
        quantity: 1,
        amount: flavor.amount,
        bypass_amount: flavor.bypass_amount,
        amount_alert: flavor.amount_alert,
        obs: '',
        status: !!pizza.status,
        sizeCode: pizza.sizes[0].code,
        flavorCode: flavor.code,
        sizes: pizza.sizes,
        flavors: [flavor],
        complements: [],
        implementations: [],
      }))
    }
    return pizzas
  }

  /** getSizeNameByCode   */
  public getSizeNameByPizza({ size = '', pizza }: { size?: string; pizza: CartFlavorPizzaType }) {
    const pizzaMenu = this.profile.categories
      .filter((c) => c.type === 'pizza')
      .flatMap((c) => c.product)
      .find((p) => p.id === pizza.pizzaId ?? pizza.id)
    if (pizzaMenu) {
      const sizeInMenu = pizzaMenu.sizes.find((s) => s.code === (pizza.details?.sizeCode ?? pizza.sizeCode))
      if (sizeInMenu) {
        size = sizeInMenu.name
      }
    }
    return size
  }

  /** Retorna o valor total da pizza de acordo com o tipo de pedido ('D', 'T', 'P') e promoção. Obs: sem valor de complementos  */
  public pizzaTotalValue(pizza: CartFlavorPizzaType, valueType: CartRequestType['type'], size?: string): number {
    if (!size) {
      size = this.getSizeNameByPizza({ pizza, size })
    }
    const pizzaValues = valueType === 'T' ? 'valuesTable' : 'values'
    let result = pizza.value ?? 0
    if (this.profile?.options.pizza.higherValue) {
      const allFlavorsHighValue = Math.max(
        ...pizza.flavors.map((flavor) => {
          return flavor[pizzaValues][pizza.size ?? size]
        }),
        0
      )

      // --- NÃO DEIXAVA TROCAR TAMANHO PIZZA PDV ---

      // const sizeByName = pizza.sizes.find((s) => s.name === size)
      // if (sizeByName) {
      //   pizza.sizeCode = sizeByName.code
      // }

      result = Number(
        pizza.flavors.reduce((acc, f) => {
          acc = acc < Number(f[pizzaValues][size ?? pizza.sizeCode]) ? Number(f[pizzaValues][size ?? this.getSizeByCode(pizza).name]) : Number(acc)
          return acc
        }, Number(allFlavorsHighValue))
      )

      if (!result) {
        const pizzaFinded = pizza.sizes?.find((s) => s.code === pizza.sizeCode)
        if (pizzaFinded) {
          const { name } = pizzaFinded
          return pizza.flavors[0].values[name]
        }
        return 0
      }
    } else {
      result = Number(
        pizza.flavors.reduce((acc, f) => {
          acc += Number(f[pizzaValues][(size || pizza.size) ?? this.getSizeByCode(pizza)?.name]) / pizza.flavors.length
          return acc
        }, 0)
      ) /* + Number(pizza.implementations?.reduce(
          (total, imp) => (total += imp.value),
          0
        )); */
    }
    return result
  }

  /** Retorna o valor total da pizza de acordo com o tipo de pedido ('D', 'T', 'P') e promoção. Obs: sem valor de complementos | Versão CartItem */
  public pizzaItemTotalValue({ pizza, valueType }: { pizza: CartItem; valueType: CartRequestType['type'] }) {
    const flavors = pizza.details.flavors.filter(Boolean)
    const pizzaValues = valueType === 'T' ? 'valuesTable' : 'values'
    let result = 0
    if (this.profile?.options.pizza.higherValue) {
      const allFlavorsHighValue = Math.max(
        ...flavors.map((flavor) => {
          return flavor[pizzaValues][pizza.details.size]
        }),
        0
      )

      // --- NÃO DEIXAVA TROCAR TAMANHO PIZZA PDV ---

      // const sizeByName = pizza.sizes.find((s) => s.name === size)
      // if (sizeByName) {
      //   pizza.sizeCode = sizeByName.code
      // }

      result = Number(
        flavors.reduce((acc, f) => {
          acc = acc < Number(f[pizzaValues][pizza.details.size]) ? Number(f[pizzaValues][pizza.details.size]) : Number(acc)
          return acc
        }, Number(allFlavorsHighValue))
      )
    } else {
      result = Number(
        flavors.reduce((acc, f) => {
          acc += Number(f[pizzaValues][pizza.details.size]) / flavors.length
          return acc
        }, 0)
      ) /* + Number(pizza.implementations?.reduce(
          (total, imp) => (total += imp.value),
          0
        )); */
    }
    return isNaN(result) ? pizza.details.value : result
  }

  public sumFlavors(flavors: PizzaFlavorType[] = []) {
    const allImplementationsHighValue = Math.max(
      ...flavors.flatMap((flavor) => flavor.implementations?.flatMap((implementation) => implementation.value) ?? []),
      0
    )
    const allComplementsFromFlavors = flavors.flatMap((flavor) => flavor.complements?.flatMap((complement) => complement.itens) ?? [])

    const highestQuantityItems = allComplementsFromFlavors.reduce((acc, item) => {
      if (!acc[item.name] || (item?.quantity || 0) > (acc[item.name]?.quantity || 0)) {
        acc[item.name] = item
      }
      return acc
    }, {})

    return (
      flavors.reduce((accumulator, flavor) => {
        return (
          accumulator +
          (!this.context.profile?.options.pizza.higherValue &&
            this.sumImplementations(flavor.implementations, flavors, this.context.profile?.options.pizza.higherValue))
        )
      }, 0) +
      this.sumComplementItems(Object.values(highestQuantityItems)) +
      (this.context.profile?.options.pizza.higherValue && allImplementationsHighValue)
    )
  }

  public highestComplements(flavors: PizzaFlavorType[], item: ComplementItemType) {
    const allComplementsFromFlavors = flavors.flatMap((flavor) => flavor.complements?.flatMap((complement) => complement.itens) ?? [])

    const complementList: any = allComplementsFromFlavors.reduce((acc, item) => {
      if (!acc[item.name] || (item?.quantity || 0) > (acc[item.name]?.quantity || 0)) {
        acc[item.name] = item
      }
      return acc
    }, {})

    console.log(complementList[item.name]?.quantity)

    return complementList[item.name]?.quantity
  }

  public mostExpensiveImplementationPrice(
    pizza: CartFlavorPizzaType,
    flavorIndex: number
  ): { maxPrice: number; occurrences: PizzaImplementationType[] } {
    const maxPrice = Math.max(
      ...pizza.flavors.flatMap((flavor) => flavor.implementations?.flatMap((implementation) => implementation.value) ?? []),
      0
    )
    const implementations = pizza.flavors.flatMap((flavor, index) => flavor.implementations?.map((implementation) => ({ ...implementation, index })))
    const occurrences = implementations.filter((obj, index) => implementations.findIndex((item) => item.code === obj.code) === index)

    return { maxPrice, occurrences }
  }

  public mostExpensiveComplement(pizza: CartFlavorPizzaType, complement: ComplementItemType, flavorIndex: number) {
    const allComplementsFromFlavors = pizza.flavors.flatMap((flavor, index) =>
      flavor.complements?.flatMap((complement) => complement.itens).map((item) => ({ ...item, index }))
    )

    let complements = {}

    allComplementsFromFlavors.forEach((complement) => {
      if (!complements[complement.name]) {
        complements[complement.name] = { quantity: complement.quantity || 0, index: complement.index }
      } else {
        if (complements[complement.name].quantity < complement.quantity) complements[complement.name].index = complement.index
      }
    })

    if (complements.hasOwnProperty(complement.name) && complements[complement.name].index === flavorIndex) {
      return true
    } else return false
  }

  public sumItems(itens: any[]) {
    return itens.reduce((accumulator, item) => {
      accumulator + item.value
    })
  }

  public sumImplementations(implementations: PizzaImplementationType[] = [], flavors: PizzaFlavorType[] = [], higherValue) {
    return implementations.reduce((accumulator, implementation) => {
      return accumulator + implementation.value / (higherValue ? flavors.length : 1)
    }, 0)
  }

  public sumFlavorComplements(flavor: PizzaFlavorType): number {
    return this.sumComplements(flavor.complements)
  }

  public sumComplements(complements: ComplementType[] = []): number {
    return complements.reduce((accumulator, complement) => {
      return this.complementTotalValue(complement) + accumulator
    }, 0)
  }

  public sumComplementItems(complementItems: ComplementItemType[] = []): number {
    return complementItems.reduce((accumulator, item) => {
      return item.value * (item.quantity || 0) + accumulator
    }, 0)
  }

  public findPizzaById(id: number): PizzaProductType {
    return this.context.profile.categories
      .filter((c) => c.type === 'pizza')
      .flatMap((c) => c.product)
      .find((p) => p.id === id)
  }

  //** Retorna valor total de itens adicionados no carrinho de uma categoria de complementos */
  public complementTotalValue(complement: ComplementType): number {
    return complement.itens.reduce((acc, item) => {
      acc += (item.quantity ?? 0) * item.value
      return acc
    }, 0)
  }

  public complementItemsTotalValue(itens: ComplementItemType[]): number {
    return itens.reduce((acc, item) => {
      acc += (item.quantity ?? 0) * item.value
      return acc
    }, 0)
  }

  public editPizzaName(pizza: CartFlavorPizzaType) {
    const flavors = (pizza.details ?? pizza).flavors.map((f, index) => f?.name).join()
    return `Pizza ${(pizza.details ?? pizza).size} ${
      (pizza.details ?? pizza).flavors.length > 1 ? (pizza.details ?? pizza).flavors.length + ' Sabores' : ''
    } ${flavors} ${(pizza.details ?? pizza).implementations.length ? 'com ' + (pizza.details ?? pizza).implementations[0].name : ''}`
  }

  /** Adiciona um pizza no carrinho */
  public async addPizzaToCart(pizza: CartFlavorPizzaType, cartPizza: CartPizza[]) {
    /* await this.checkProductDisponibility(pizza, cartPizza, 'D') */
    const menuPizza = this.findPizzaById(pizza.id)
    const newPizza: CartPizza = {
      ...pizza,
      id: menuPizza.id,
      amount: menuPizza.amount,
      amount_alert: menuPizza.amount_alert,
      bypass_amount: menuPizza.bypass_amount,
      size: this.getSizeByCode(pizza)?.name || pizza.size,
    }
    const flavors = newPizza.flavors.map((f, index) => f?.name).join()
    newPizza.name = `Pizza ${(this.getSizeByCode(pizza)?.name || pizza.size).toLowerCase().replace(/(^pizza?[\w]+)/, '')} ${
      newPizza.flavors.length > 1 ? newPizza.flavors.length + ' Sabores' : ''
    } ${flavors} ${newPizza.implementations.length ? 'com ' + newPizza.implementations[0].name : ''}`

    const inputs = document.querySelectorAll('#none')
    if (inputs) {
      inputs.forEach((i: any) => {
        i.checked = true
      })
    }

    const alreadyInCartPizza = cartPizza.find((p) => p.name === newPizza.name && p.obs === newPizza.obs && p.id === newPizza.id)
    if (
      alreadyInCartPizza &&
      isEqual(alreadyInCartPizza.flavors, newPizza.flavors) &&
      isEqual(alreadyInCartPizza.complements, newPizza.complements) &&
      isEqual(alreadyInCartPizza.implementations, newPizza.implementations)
    ) {
      alreadyInCartPizza.quantity += newPizza.quantity
    } else {
      cartPizza.push(newPizza)
      this.savePDVCart({ cartPizza })
    }
    pizza.quantity = 1
    pizza.obs = ''
    pizza.flavors = [pizza.flavors[0]]
  }

  /** Adiciona um pizza no carrinho */
  public async addPizzaItemToCart(pizza: CartItem, cartPizza: CartPizza[]) {
    /* await this.checkProductDisponibility(pizza, cartPizza, 'D') */
    const menuPizza = this.findPizzaById(pizza.pizzaId)
    const newPizza: CartPizza = {
      ...pizza,
      sizes: menuPizza.sizes,
      status: menuPizza.status,
      implementations: pizza.details.implementations,
      flavors: pizza.details.flavors,
      id: menuPizza.id,
      amount: menuPizza.amount,
      amount_alert: menuPizza.amount_alert,
      bypass_amount: menuPizza.bypass_amount,
      size: pizza.details.size,
    }
    const flavors = newPizza.flavors.map((f, index) => f?.name).join()
    newPizza.name = `Pizza ${pizza.details.size.toLowerCase().replace(/(^pizza?[\w]+)/, '')} ${
      newPizza.flavors.length > 1 ? newPizza.flavors.length + ' Sabores' : ''
    } ${flavors} ${newPizza.implementations.length ? 'com ' + newPizza.implementations[0].name : ''}`

    const inputs = document.querySelectorAll('#none')
    if (inputs) {
      inputs.forEach((i: any) => {
        i.checked = true
      })
    }

    const alreadyInCartPizza = cartPizza.find(
      (p) =>
        p.name === newPizza.name && p.obs === newPizza.obs && p.id === newPizza.id && p.details.flavors.length === newPizza.details.flavors.length
    )

    if (
      alreadyInCartPizza &&
      isEqual(alreadyInCartPizza.flavors, newPizza.flavors) &&
      isEqual(alreadyInCartPizza.complements, newPizza.complements) &&
      isEqual(alreadyInCartPizza.implementations, newPizza.implementations)
    ) {
      alreadyInCartPizza.quantity += newPizza.quantity
    } else {
      cartPizza.push(newPizza)
      this.savePDVCart({ cartPizza })
    }
    pizza.quantity = 1
    pizza.obs = ''
    pizza.details.flavors = [pizza.details.flavors[0]]
  }

  /** Remove um pizza do carrinho */
  public removePizzaCart(index: number, cartPizza: CartPizza[]) {
    cartPizza.splice(index, 1)
  }

  /** Aumenta a quantidade uma pizza do carrinho */
  public increasePizza(flavor: any) {
    ++flavor.quantity
  }

  /** Diminui a quantidade uma pizza do carrinho */
  public decreasePizza(flavor: any) {
    if (flavor.quantity > 1) {
      --flavor.quantity
    }
  }

  /** Retorna o tamanho da pizza selecionado na sabor  */
  public getSizeByCode(pizza: CartFlavorPizzaType): PizzaSizeType {
    return pizza.sizes.find((size) => size.code === pizza.sizeCode)
  }

  /** Remove sabores adicionais da pizza */
  public removeFlavor(pizza: CartFlavorPizzaType, index: number): void {
    if (index !== 0) {
      pizza.flavors.splice(index, 1)
    }
  }

  // CUPOM
  /** Retorna o valor do cupom de acordo com o carrinho */
  public cupomValue(cupom: CupomType, cartRequest: CartRequestType): number {
    if (!cupom) {
      return 0
    }
    switch (cupom.type) {
      case 'freight':
        return !!cartRequest.addressId ? Number(cartRequest.taxDelivery) : 0
      case 'percent':
        return cartRequest.total * (cupom.value / 100)
      case 'value':
        return cupom.value
      default:
        return 0
    }
  }

  // UTILS

  /** Retorna um clone do objeto sem referenciar o objeto original */
  public copyObj(obj: any) {
    const copy = JSON.parse(JSON.stringify(obj))
    return copy
  }

  // ESTOQUE

  /** Verifica se o estoque de sabores pode suprir as quantidades desejadas no carrinho */
  public verifyCartFlavorAvailability(
    cartOriginal: CartPizza[],
    cart: CartFlavorPizzaType,
    method: 'greater' | 'greaterOrEqual',
    location?: 'cart' | undefined
  ) {
    if (!this.profile?.options?.inventoryControl) return { availability: true, status: 'global inventory bypass' }

    if (!cart.flavors) return { availability: true, status: 'no flavors' }

    const cartFlavors = cartOriginal
      .filter((cartItem) => cartItem.flavors)
      .reduce((array, item) => {
        const flavorsWithMultiplier = item.flavors.map((flavor) => ({ ...flavor, quantity: item.quantity }))
        return array.concat(flavorsWithMultiplier)
      }, [])

    const itemFlavors = cart?.flavors?.length ? cart.flavors.map((flavor) => ({ ...flavor, quantity: cart.quantity })) : [cart]
    location !== 'cart' && cartFlavors.push(...itemFlavors)

    const groupedFlavors = cartFlavors.reduce((grouped, flavor) => {
      const existingFlavor = grouped.find((f) => f.code === flavor.code)
      if (existingFlavor) {
        existingFlavor.quantity += flavor.quantity
      } else {
        grouped.push({
          name: flavor?.name,
          code: flavor?.code,
          quantity: flavor?.quantity,
          amount: flavor?.amount,
          bypass_amount: flavor?.bypass_amount,
        })
      }
      return grouped
    }, [])

    const item = groupedFlavors.find((product) => product.code == cart.flavorCode)
    if (item?.bypass_amount) return { availability: true, status: 'item inventory bypass' }

    if (this.checkQuantity(item?.quantity || 0, item?.amount || 0, method)) {
      return {
        availability: false,
        message: `Esses sabores nao estao disponiveis na quantidade desejada: <br/> <ul>${groupedFlavors
          .filter((flavor) => flavor.quantity > flavor.amount)
          .map((flavor) => `<li>${flavor.name} - apenas ${flavor.amount} disponiveis</li>`)}</ul>`,
        buttonMessage: `Sabor ${
          groupedFlavors.findIndex((flavor) => flavor.quantity >= flavor.amount && typeof flavor.amount === 'number') + 1
        } indisponível `,
      }
    }
    return { availability: true }
  }

  /** Verifica se o estoque de complementos pode suprir as quantidades desejadas no carrinho */
  public verifyAvailableComplements(item: ComplementItemType, cartOriginal: { default?: CartType[]; pizza?: CartPizza[] }, method) {
    if (!this.profile?.options?.inventoryControl) return true
    if (item.amount === 0) return true

    if (item.amount === 0) {
      item.bypass_amount = true
    }

    if (cartOriginal.pizza.length) {
      const cart: CartPizza[] = cartOriginal.pizza as CartPizza[]
      const menuItems = this.retrieveCartComplements(cartOriginal)
      const index = menuItems.findIndex((menuItem) => menuItem.code === item.code)

      if (item.amount === undefined) return true

      if (!menuItems[index]) {
        return item.quantity < item.amount
      }
      if (menuItems[index].amount === 0) return false

      return !this.checkQuantity(item.quantity + menuItems[index]?.quantity, menuItems[index]?.amount, method)
    } else {
      const menuItems = this.retrieveCartComplements(cartOriginal)
      const index = menuItems.findIndex((menuItem) => menuItem.code === item.code)

      if (item.amount === undefined) return true

      if (!menuItems[index]) {
        return item.quantity < item.amount
      }
      if (menuItems[index].amount === 0) return false

      return !this.checkQuantity(item.quantity + menuItems[index]?.quantity, menuItems[index]?.amount, method)
    }
  }

  /** Verifica se o estoque de produtos pode suprir as quantidades desejadas no carrinho */
  public verifyProductAvailability(cartOriginal, cart, method: 'greater' | 'greaterOrEqual', location?: 'menu' | 'cart') {
    if (!this.profile?.options?.inventoryControl) {
      return { availability: true }
    }

    if (cart?.bypass_amount) return { availability: true }

    const cartProducts = cartOriginal.reduce((array, item) => {
      return array.concat({ ...item, quantity: item.quantity })
    }, [])

    const itemProducts = cart?.quantity && { ...cart, quantity: cart.quantity }
    cartProducts.push(itemProducts)

    const groupedProducts = cartProducts.reduce((grouped, product) => {
      const existingProduct = grouped.find((p) => p.id === product.id)
      if (existingProduct) {
        existingProduct.quantity += product.quantity
      } else {
        const bypassAmount = product?.amount === null || !this.profile?.options?.inventoryControl ? true : product?.bypass_amount ?? false
        grouped.push({
          name: product?.name || 'Pizza',
          id: product?.id || product?.pizzaId,
          quantity: product?.quantity,
          amount: product?.amount,
          bypass_amount: bypassAmount,
        })
      }
      return grouped
    }, [])

    const item = groupedProducts.find((product) => product.id === cart.id || product.id === cart.pizzaId)

    if (this.checkQuantity(location === 'cart' && item.quantity > 0 ? item.quantity - 1 : item.quantity, item.amount, method)) {
      const response = {
        availability: false,
        message: `Esses produtos nao estao disponiveis na quantidade desejada: <br/> <ul>${groupedProducts
          .filter((product) => product.quantity > product.amount)
          .map((product) => `<li>${product.name} - apenas ${product.amount} disponiveis</li>`)}</ul>`,
      }
      return response
    }
    return { availability: true }
  }

  /** Verifica se o estoque de produtos pode suprir as quantidades desejadas no carrinho */
  public verifyPizzaProductAvailability(cartOriginal, cart, pizza?, method?, location?: 'menu' | 'cart') {
    if (!this.profile?.options?.inventoryControl) return { availability: true }

    if (!pizza) {
      pizza = this.findPizzaById(cart.id)
    }

    if (pizza?.bypass_amount) return { availability: true }

    if (pizza.amount === 0 || cart.amount === 0) return { availability: false }

    const groupedProducts = cartOriginal.reduce((grouped, product) => {
      const existingProduct = grouped.find((p) => p.id === product.id)
      if (existingProduct) {
        existingProduct.quantity += product.quantity
      } else {
        const bypassAmount = product.amount === null || !this.profile?.options?.inventoryControl ? true : product?.bypass_amount ?? false

        grouped.push({
          name: 'Pizza' + product.flavorCode,
          id: product?.id,
          quantity: product?.quantity,
          amount: product?.amount,
          bypass_amount: bypassAmount,
        })
      }
      return grouped
    }, [])

    const cartProducts = groupedProducts.find((item) => item.id === cart.id)

    if (
      this.checkQuantity((location === 'cart' ? 0 : cart?.quantity) + (cartProducts?.quantity || 0), cartProducts?.amount || pizza?.amount, method)
    ) {
      return { availability: false }
    }

    return { availability: true }
  }

  public checkQuantity(quantity: number, inventory: number | undefined, method: string) {
    switch (method) {
      case 'greater':
        return quantity > inventory && typeof inventory === 'number'
      case 'greaterOrEqual':
        return quantity >= inventory && typeof inventory === 'number'
      default:
        return quantity >= inventory && typeof inventory === 'number'
    }
  }

  public complementItensCount(complement: ComplementType) {
    return complement.itens.reduce((total, item) => (total += item.quantity), 0)
  }

  public checkInventoryDisponibility({
    item,
    typeCheck = 'greater',
  }: {
    item: InventoryPropsType & { quantity: number; status: boolean }
    typeCheck?: 'greater' | 'greaterOrEqual'
  }) {
    const { inventoryControl } = this.profile.options
    if (!inventoryControl) {
      return item.status
    }
    if (!item.bypass_amount) {
      if (item.amount === 0) {
        return false
      }
      if (typeCheck === 'greater' ? item.quantity > item.amount : item.quantity >= item.amount) {
        return false
      }
    }
    return item.status
  }

  public complementIsAvailable(complement: ComplementType): { available: boolean; messageType: 'required' | 'soldOut' } {
    let available = true
    let messageType: 'required' | 'soldOut' = 'required'
    const itensCount = this.complementItensCount(complement)
    if (this.profile.options.inventoryControl && complement.itens.some((item) => !item.bypass_amount && item.quantity > item.amount)) {
      available = false
      messageType = 'soldOut'
    }

    if (complement.required && !(itensCount >= complement.min && itensCount <= complement.max)) {
      available = false
    }

    return {
      available,
      messageType,
    }
  }

  /** Retorna uma lista atualizada de complementos do carrinho.
   * @param cart Carrinho de produtos
   */
  public retrieveCartComplements(cart: { default?: CartType[]; pizza?: CartPizza[] }) {
    if (cart.pizza?.length) {
      const cartPizza = cart.pizza as CartPizza[]
      return this.profile.options.pizza.multipleComplements
        ? cartPizza
            .flatMap((cartItem) =>
              cartItem.flavors.flatMap((flavor) => {
                if (!flavor.complements?.length) return []
                else {
                  flavor.complements.flatMap((complement) =>
                    complement.itens.map((itm) => ({
                      ...itm,
                      quantity: itm.quantity * cartItem.quantity,
                    }))
                  )
                }
              })
            )
            .filter((item) => item?.quantity)
            .reduce((acc, curr) => {
              const existingItem = acc.find((item) => item.code === curr.code)
              if (existingItem) {
                existingItem.quantity += curr.quantity
              } else {
                acc.push({ ...curr })
              }

              return acc
            }, [])
        : cartPizza
            .flatMap((item) =>
              item.complements.flatMap((complement) => {
                return complement.itens.map((itm) => ({
                  ...itm,
                  quantity: itm.quantity * item.quantity,
                }))
              })
            )
            .filter((item) => item.quantity)
            .reduce((acc, curr) => {
              const existingItem = acc.find((item) => item.code === curr.code)
              if (existingItem) {
                existingItem.quantity += curr.quantity
              } else {
                acc.push({ ...curr })
              }

              return acc
            }, [])
    } else {
      return cart.default
        .flatMap((item) =>
          item.complements.flatMap((complement) => {
            return complement.itens.map((itm) => ({
              ...itm,
              quantity: itm.quantity * item.quantity,
            }))
          })
        )
        .filter((item) => item.quantity)
        .reduce((acc, curr) => {
          const existingItem = acc.find((item) => item.code === curr.code)
          if (existingItem) {
            existingItem.quantity += curr.quantity
          } else {
            acc.push({ ...curr })
          }

          return acc
        }, [])
    }
  }

  public verifyCartComplementsAvailability(cart: { default?: CartType[]; pizza?: CartPizza[] }) {
    if (!this.profile?.options?.inventoryControl) return true
    const menuItems = this.retrieveCartComplements(cart)
    if (menuItems.some((item) => item.quantity >= item.amount && !item.bypass_amount)) return false
    return true
  }

  public formPaymentAddonCalcResult(formPayment: Partial<CartFormPaymentType>, total: number) {
    let result = 0
    if (!formPayment) {
      return result
    }
    if (formPayment.addon?.status) {
      result = formPayment.addon.valueType === 'percentage' ? total * (formPayment.addon.value / 100) : formPayment.addon.value
      if (formPayment.addon.type === 'discount') {
        result = result * -1
      }
    }

    return Number(result.toFixed(2))
  }

  public getComplementItem(complements: ComplementType[], item: ComplementItemType) {
    return complements.flatMap((complement) => complement.itens).find((i) => i.code === item.code)
  }

  public dayDisponiblity({ profile, cartRequest }: { profile: ProfileType; cartRequest: CartRequestType }): boolean {
    const day = DateTime.fromISO(
      cartRequest.type === 'P' ? DateTime.fromFormat(cartRequest.packageDate, 'yyyy-MM-dd HH:mm:ss').toISO() : profile.fuso,
      {
        zone: profile.timeZone,
      }
    )
      .toFormat('EEEE')
      .toLowerCase()
    const convert = (text: string) => parseFloat(text.replace(':', '.'))

    const week = cartRequest.type === 'P' && profile.options.package.active ? profile.options.package.week : profile.week

    if (!week[day]) {
      return false
    }

    if (cartRequest.type === 'P' && week[day]) {
      return true
    }

    const now = parseFloat(DateTime.local().setZone(profile.timeZone).toFormat('HH.mm'))
    const filter = week[day].filter((d) => now >= convert(d.open) && now <= convert(d.close))

    if (filter.length) {
      return true
    }

    return false
  }
}
