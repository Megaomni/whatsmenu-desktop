import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import Cupom from './cupom'
import { apiRoute, copy, encodeTextURL } from '../utils/wm-functions'
import PizzaProduct, { PizzaFlavorType, PizzaImplementationType, PizzaSizeType } from './pizza-product'
import Product from './product'
import { ProfileOptions } from './profile'
import React, { Dispatch, SetStateAction } from 'react'
import Complement from './complements'

type ProfilePlaceholders = {
  pizzaObs: string
  productObs: string
  statusSend: string
  statusToRemove: string
  statusProduction: string
  sendWhatsMessage: string
}

type ProductCartType = {
  id: number
  name: string
  obs: string
  complements: Complement[]
  value: number
  valueTable: number
  promoteValue: number
  promoteValueTable: number
  promoteStatus: number
  promoteStatusTable: Number
  quantity: number
  typeDelivery?: number
}

type PizzaCartType = {
  [key: string]: any
  size: string
  value: number
  status: boolean
  sizes: PizzaSizeType[]
  flavors: PizzaFlavorType[]
  implementations: PizzaImplementationType[]
  quantity: number
  obs: string
  typeDelivery?: number
}

interface DeliveryType {
  formPayment?: string
  formPaymentFlag?: string
  transshipment?: string
  name?: string
  contact?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  reference?: string
  city?: string
  latitude?: number
  longitude?: number
  distance?: number
}

interface DefaultConfig {
  filterTypeDelivery?: {
    active: boolean
    numberDelivery: number
  }
  typeDelivery?: boolean
  obs?: boolean
  table?: boolean
  resume?: boolean
}

export interface CartPizza extends PizzaProduct {
  quantity: number
  value: number
  obs: string
  typeDelivery?: number
}

export interface RequestType {
  id: number
  profileId: number
  cupomId: number | null
  cupom?: Cupom | null
  commandId: number | null
  bartenderId: number | null
  code: number
  status: 'production' | 'transport' | 'delivered' | 'canceled' | null
  name: string
  contact: string
  formPayment: string
  formPaymentFlag: string
  typeDelivery: number
  type: 'D' | 'P' | 'T'
  taxDelivery: number
  timeDelivery: string | number
  transshipment: number
  total: number
  print: number
  tentatives: number
  deliveryAddress: DeliveryType
  cart: ProductCart[]
  cartPizza: PizzaCart[]
  created_at: string
  update_at: string
  slug: string
  packageDate: string
  activeTab: 'counter' | 'table' | 'tables' | 'resume'
}

export class PizzaCart {
  [key: string]: any
  size: string
  value: number
  status: boolean
  sizes: PizzaSizeType[]
  flavors: PizzaFlavorType[]
  implementations: PizzaImplementationType[]
  quantity: number
  obs: string
  typeDelivery?: number

  constructor(pizza: PizzaCartType) {
    this.size = pizza.size
    this.value = pizza.value
    this.status = pizza.status
    this.sizes = pizza.sizes
    this.flavors = pizza.flavors
    this.implementations = pizza.implementations
    this.quantity = pizza.quantity
    this.obs = pizza.obs
  }

  public getTotal(onlyPizza: boolean = false) {
    const total = this.implementations.reduce((total, impl) => {
      total += impl.value
      return total
    }, 0)

    return onlyPizza ? this.value - total : this.value * this.quantity
  }
}

export class ProductCart {
  [key: string]: any
  id: number
  name: string
  obs: string
  complements: Complement[]
  value: number
  valueTable: number
  promoteValue: number
  promoteValueTable: number
  promoteStatus: number
  promoteStatusTable: Number
  quantity: number
  typeDelivery?: number

  constructor(product: ProductCartType) {
    this.id = product.id
    this.name = product.name
    this.obs = product.obs
    this.quantity = product.quantity
    this.typeDelivery = product.typeDelivery
    this.complements = product.complements.map((compl) => new Complement(compl))
    this.value = product.value
    this.valueTable = Number(product.valueTable) || 0
    this.promoteValue = Number(product.promoteValue) || 0
    this.promoteValueTable = Number(product.promoteValueTable) || 0
    this.promoteStatus = product.promoteStatus
    this.promoteStatusTable = product.promoteStatusTable
  }

  public getTotal(type: 'T' | 'D' | 'P' = 'D', onlyProd: boolean = false) {
    const table = type === 'T' ? 'Table' : ''
    const productTotal = this[`promoteStatus${table}`] ? this[`promoteValue${table}`] : this[`value${table}`]

    return onlyProd ? productTotal : (productTotal + this.getTotalComplements()) * this.quantity
  }

  public getTotalComplements() {
    return this.complements.reduce((total, compl) => {
      total += compl.getTotal()
      return total
    }, 0)
  }
}

export default class Request {
  id: number
  profileId: number
  cupomId: number | null
  cupom?: Cupom | null
  commandId: number | null
  bartenderId: number | null
  code: number
  status: 'production' | 'transport' | 'delivered' | 'canceled' | null
  name: string
  contact: string
  formPayment: string
  formPaymentFlag: string
  typeDelivery: number
  type: 'D' | 'P' | 'T'
  timeDelivery: string | number
  transshipment: number
  taxDelivery: number
  total: number
  print: number
  tentatives: number
  deliveryAddress: DeliveryType
  cart: ProductCart[]
  cartPizza: PizzaCart[]
  created_at: string
  update_at: string
  slug: string
  packageDate: string

  activeTab: 'counter' | 'table' | 'tables' | 'resume'

  public defaultStatusProductionPackage = 'Olá [NOME], seu pedido foi recebido.'
  public defaultStatusProductionMessage = 'Olá [NOME], seu pedido está em produção.'
  public defaultStatusToRemoveMessage = 'Obaaa [NOME], seu pedido está pronto para retirada.'
  public defaultStatusTransportMessage = 'Obaaa [NOME], seu pedido está a caminho.'
  public defaultCanceledMessage = 'Olá [NOME], seu pedido foi cancelado.'
  public defaultSendWhatsMessage = '[NOME] pedido efetuado com sucesso, acompanhe o status do seu pedido abaixo!'

  constructor({
    id,
    profileId,
    cupomId,
    cupom,
    commandId,
    bartenderId,
    code,
    status,
    name,
    contact,
    taxDelivery,
    formPayment,
    formPaymentFlag,
    typeDelivery,
    type,
    timeDelivery,
    transshipment,
    total,
    print,
    tentatives,
    deliveryAddress,
    cart,
    cartPizza,
    created_at,
    update_at,
    slug,
    packageDate,
    activeTab,
  }: RequestType) {
    this.id = id
    this.profileId = profileId
    this.cupomId = cupomId
    this.cupom = cupom ?? null
    this.commandId = commandId
    this.bartenderId = bartenderId
    this.code = code
    this.status = status
    this.name = name
    this.contact = contact
    this.formPayment = formPayment
    this.formPaymentFlag = formPaymentFlag
    this.typeDelivery = typeDelivery
    this.type = type
    this.timeDelivery = timeDelivery
    this.transshipment = transshipment
    this.total = total
    this.print = print
    this.tentatives = tentatives
    this.deliveryAddress = deliveryAddress
    this.cart = cart.map((prod) => new ProductCart(prod))
    this.cartPizza = cartPizza.map((pizza) => new PizzaCart(pizza))
    this.created_at = created_at
    this.update_at = update_at
    this.slug = slug
    this.packageDate = packageDate
    this.taxDelivery = taxDelivery
    this.activeTab = activeTab
  }

  public returnMaskedContact() {
    if (this.contact.length > 10) {
      return this.contact.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }

    return this.contact.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  public returnResumeCart(config: DefaultConfig) {
    const defaultConfig = {
      filterTypeDelivery: {
        active: false,
        numberDelivery: 0,
      },
      typeDelivery: false, // se false não verifica diferença dos itens pelo typeDelivery
      obs: true, // Se false não verifica diferença dos itens mesmo que tenha obs
      table: false, // se table usa verifica os itens pelo valueTable
      resume: true, // Se false retorna o carrinho sem agrupar
    }

    //Configuração da função para diferenciar os itens
    config = { ...defaultConfig, ...config }

    const verifyEqualsComplements = (complements: Complement[], complementsVerify: Complement[]) => {
      return complements.every((compl) => {
        return complementsVerify.some((complV) => {
          if (complV.id === compl.id && compl.itens.length === complV.itens.length) {
            return complV.itens.every((cvItem) => compl.itens.some((cItem) => cItem.code === cvItem.code && cItem.quantity === cvItem.quantity))
          }
        })
      })
    }

    const cart = copy(this.cart || []) as ProductCart[]
    const cartPizza = copy(this.cartPizza || []) as PizzaCart[]

    config.resume &&
      cart.forEach((prod, index, selfArr) => {
        if (Object.keys(prod).length) {
          const complements = copy(prod.complements) as Complement[]
          const table = this.type === 'T' ? 'Table' : ''
          const valueZero = (prod[`promoteStatus${table}`] ? prod[`promoteValue${table}`] : prod[`value${table}`]) === 0

          const products = selfArr.filter(
            (p, indexP) =>
              p.id === prod.id &&
              p.obs === prod.obs &&
              complements.length === p.complements.length &&
              (config.filterTypeDelivery?.active ? prod.typeDelivery === p.typeDelivery : true) &&
              indexP !== index
          )
          for (const product of products) {
            if (verifyEqualsComplements(complements, product.complements)) {
              // const allComplements = complements.every((compl, index) => {
              //   return product.complements.some(productCompl => {
              //     return productCompl.itens.every(item => compl.itens.some((complItem, complItemIndex) => {
              //       if (compl.id == productCompl.id) {
              //         if ((complItem.code === item.code && complItem.quantity === item.quantity) && productCompl.itens.length === compl.itens.length && compl.id === productCompl.id) {
              //           const getCompl = prod.complements[index].itens[complItemIndex]
              //           if (valueZero && item.quantity && getCompl.quantity && product.quantity === prod.quantity) {
              //             getCompl.quantity += (item.quantity * product.quantity);
              //           }

              //           if (valueZero && product.quantity !== prod.quantity) {
              //             return false;
              //           }

              //           return true
              //         }
              //       }
              //       return
              //     }));
              //   })
              // });

              prod.quantity += product.quantity

              for (let key of Object.keys(product)) {
                delete product[key]
              }
            }
          }
        }
      })

    config.resume &&
      cartPizza.forEach((pizza, index, arr) => {
        if (Object.keys(pizza) && Object.keys(pizza).length) {
          const pizzas = arr.filter((p, pIndex) => {
            return (
              p.size === pizza.size &&
              index !== pIndex &&
              pizza.flavors.length === p.flavors.length &&
              pizza.implementations.length === p.implementations.length &&
              !pizza.obs === !p.obs
            )
          })

          pizzas.forEach((elPizza, pIndex) => {
            const verificationOne = pizza.flavors?.every((pizzaFlavor) =>
              elPizza.flavors.some((elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code)
            )
            const verificationTwo = elPizza.flavors?.every((pizzaFlavor) =>
              pizza.flavors.some((elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code)
            )

            const implementations = pizza.implementations?.every((pizzaImplementation) =>
              elPizza.implementations.some((elPizzaImplementation) => elPizzaImplementation.code === pizzaImplementation.code)
            )
            if (verificationOne && verificationTwo && implementations) {
              pizza.quantity += elPizza.quantity
              for (let key of Object.keys(elPizza)) {
                delete elPizza[key]
              }
            }
          })
        }
      })

    const cartReturned = cart.filter((item: ProductCart) => {
      if (config.filterTypeDelivery?.active && Object.keys(item).length) {
        return item.typeDelivery === config.filterTypeDelivery.numberDelivery
      }

      return Object.keys(item).length
    })

    const cartPizzaReturned = cartPizza.filter((item: PizzaCart) => {
      if (config.filterTypeDelivery?.active && Object.keys(item).length) {
        return item.typeDelivery === config.filterTypeDelivery.numberDelivery
      }

      return Object.keys(item).length
    })

    return {
      cart: cartReturned.map((prod) => new ProductCart(prod)),
      cartPizza: cartPizzaReturned.map((pizza) => new PizzaCart(pizza)),
    }
  }

  public getTotalComplements() {
    return this.cart.reduce((total, product) => (total += product.getTotalComplements()), 0)
  }

  public date(timeZone?: string) {
    const packageDate = DateTime.fromSQL(this.packageDate, { setZone: true })
    const formatted = `${packageDate.toFormat('dd/MM/yyyy')} ${packageDate.toFormat('ss').includes('01') ? '(SH)' : packageDate.toFormat('HH:mm')}`

    return {
      date: this.packageDate,
      onlyDate: packageDate.toFormat('dd/MM/yyyy'),
      zero: packageDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
      formatted,
    }
  }

  public getSumTotal(param?: 'subtotal' | 'taxDelivery') {
    if (param === 'subtotal') {
      return this.total
    }

    if (param === 'taxDelivery') {
      return this.taxDelivery
    }

    if (this.cupom) {
      const cupomValue =
        this.cupom?.type === 'percent'
          ? (this.total / 100) * Number(this.cupom?.value)
          : this.cupom?.type === 'freight'
          ? this.taxDelivery
          : Number(this.cupom?.value)
      return this.total + this.taxDelivery - cupomValue
    }
    return this.total + this.taxDelivery
  }
  //Request Api

  private async statusType(status: null | 'production' | 'transport' | 'delivered' | 'canceled', session: Session | null) {
    try {
      const { data } = await apiRoute('/dashboard/request/status/update', session, 'PATCH', { status, id: this.id })
      return data.request.status
    } catch (error) {
      console.error(error)
    }
  }

  public async alterDate(session: Session | null, packageDate: string) {
    if (this.type === 'P') {
      try {
        const { data } = await apiRoute('/dashboard/request/status/update', session, 'PATCH', {
          package: DateTime.fromJSDate(
            new Date(`${packageDate} ${DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('HH:mm:ss')}`)
          ).toISO(),
          id: this.id,
        })
        this.packageDate = DateTime.fromISO(data.request.packageDate, { setZone: true }).toSQL()
      } catch (error) {
        console.error(error)
        throw error
      }
    } else {
      throw 'É Necessário que o tipo do requests seja P'
    }
  }

  public async cancelOrUncancel(session: Session | null, options?: ProfileOptions) {
    try {
      if (this.status !== 'canceled') {
        const status = await this.statusType('canceled', session)
        this.status = status
        return
      } else {
        const status = await this.statusType(null, session)
        this.status = status
        return
      }
    } catch (error) {
      console.error(error)
      return error
    }
  }

  public async production(session: Session | null, placeholders?: ProfilePlaceholders, options?: ProfileOptions) {
    let textEnconded
    if (this.status === null) {
      textEnconded = placeholders?.statusProduction || (this.type === 'P' ? this.defaultStatusProductionPackage : this.defaultStatusProductionMessage)

      try {
        const status = await this.statusType('production', session)
        this.status = status
      } catch (error) {
        console.error(error)
        return error
      }
    }
  }

  public async sendWhatsMessage(session: Session | null, placeholders?: ProfilePlaceholders, options?: ProfileOptions) {
    let textEnconded
    if (this.activeTab === 'counter') {
      textEnconded = placeholders?.sendWhatsMessage || this.defaultSendWhatsMessage
      try {
        const status = await this.statusType(null, session)
        this.status = status
      } catch (error) {
        console.error(error)
        return error
      }
    }
  }

  public async transport(session: Session | null, placeholders?: ProfilePlaceholders, options?: ProfileOptions) {
    let textEnconded: string = ''
    if (this.status !== 'transport') {
      if (this.typeDelivery === 1) {
        textEnconded = placeholders?.statusToRemove || this.defaultStatusToRemoveMessage
      } else if (this.typeDelivery === 0) {
        textEnconded = placeholders?.statusSend || this.defaultStatusTransportMessage
      }
      try {
        const status = await this.statusType('transport', session)
        this.status = status
      } catch (error) {
        console.error(error)
        return error
      }
    }
  }

  public async setPrinted(session: Session) {
    try {
      const { data } = await apiRoute(`/dashboard/request/${this.id}/print/confirm`, session, 'PATCH')
      this.print = JSON.parse(data.print) ? 1 : 0
    } catch (error) {
      console.error(error)
    }
  }

  public buttonName(type: 'production' | 'transport') {
    if (type === 'transport') {
      if (this.typeDelivery === 1) {
        return 'Pronto Retirar'
      } else if (this.typeDelivery === 0) {
        return 'Entregando'
      }
    }
  }

  public getLinkClick(text: string, options?: ProfileOptions) {
    const possibleMobile = !localStorage.getItem('mobile')

    const seconds = Number(localStorage.getItem('seconds')) || 1500
    const textLink = `&text=${encodeTextURL(this.name, text)}`
    const targetLink = options?.linkWhatsapp && !possibleMobile ? 'iframeWhatsapp' : '_blank'
    const messageLink = document.createElement('a')

    const hrefLink = (envText: string) =>
      `${options?.linkWhatsapp ? 'whatsapp://' : possibleMobile ? 'https://api.whatsapp.com/' : 'https://web.whatsapp.com/'}send/?phone=55${
        this.contact
      }${envText}`
    messageLink.href = hrefLink(possibleMobile || !options?.linkWhatsapp ? textLink : options?.twoSend ? '&text=' : textLink)
    messageLink.target = targetLink
    messageLink.setAttribute('data-action', 'share/whatsapp/share')
    messageLink.click()

    if (!possibleMobile && options?.twoSend) {
      setTimeout(() => {
        const iframeReq = document.getElementById('iframeWhatsapp') as HTMLIFrameElement

        if (iframeReq) {
          iframeReq.src = hrefLink(textLink)
        }
        setTimeout(() => {
          iframeReq.src = '#'
        }, 1000)
      }, seconds)
    }
  }

  public typeDeliveryText(textPackage: 'Encomendas' | 'Agendamentos' = 'Encomendas', textOnly = false) {
    let textDelivery = ''
    switch (this.typeDelivery) {
      case 0:
        textDelivery = this.type === 'P' && !textOnly ? `**${textPackage}**\r\n**Delivery**` : '**Delivery**'
        break
      case 1:
        textDelivery = `${this.type === 'P' && !textOnly ? `**${textPackage}**\r\n` : ''}**Vou Retirar no Local**`
        break
      case 2:
        textDelivery = '**Pedido Mesa**'
        break
    }

    return textDelivery
  }

  public getTextTypeReq() {
    return this.type
  }

  static calcValuePizza(pizza: CartPizza, onlyPizza = false) {
    if (onlyPizza) {
      const totalImplementations = pizza.implementations.reduce((total, implementation) => (total += implementation.value), 0)
      return pizza.value - totalImplementations
    }

    return pizza.value * pizza.quantity
  }

  static groupAllCartsReturnRequest(requests: Request[]) {
    const request = new Request({
      id: 999999,
      profileId: 19,
      cupomId: null,
      commandId: null,
      bartenderId: null,
      code: 99999,
      status: null,
      name: 'Whatsmenu',
      contact: '13997989898',
      formPayment: 'Money',
      formPaymentFlag: '-',
      typeDelivery: 0,
      type: 'D',
      taxDelivery: 0,
      timeDelivery: '0',
      transshipment: 12,
      total: 0,
      print: 0,
      tentatives: 0,
      deliveryAddress: {} as DeliveryType,
      cart: [] as ProductCart[],
      cartPizza: [] as PizzaCart[],
      created_at: '2022-06-04',
      update_at: '2022-06-04',
      slug: 'WhatsMenu',
      packageDate: '2022-06-04',
      activeTab: 'counter',
    })

    const allCarts = requests
      .map((req) => {
        req.cart.forEach((prod) => (prod.typeDelivery = req.typeDelivery))
        return req.cart
      })
      .flat()

    const allPizzas = requests
      .map((req) => {
        req.cartPizza.forEach((prod) => (prod.typeDelivery = req.typeDelivery))
        return req.cartPizza
      })
      .flat()

    request.cart = allCarts
    request.cartPizza = allPizzas

    return new Request(request)
  }

  static requestPrint() {
    const requestPrintTeste = {
      id: 0,
      profileId: 1,
      cupomId: null,
      commandId: null,
      code: 999,
      status: null,
      name: 'WhatsMenu',
      contact: '00000000000',
      formPayment: 'Debito',
      formPaymentFlag: 'Visa',
      typeDelivery: 1,
      type: 'D',
      taxDelivery: 0,
      timeDelivery: '0',
      transshipment: 0,
      total: 154,
      print: 0,
      tentatives: 0,
      deliveryAddress: {
        city: 'Santos',
        number: '',
        street: '',
        zipCode: '',
        distance: null,
        latitude: null,
        longitude: null,
        reference: '',
        complement: '',
        neighborhood: '',
      },
      cart: [
        {
          id: 528774,
          obs: '',
          name: 'Esfiha de atum',
          image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/development/aguanaboca/products/528774/aguanabocaIla98Bc6gfMl5Irjpeg',
          value: 2.5,
          status: 1,
          quantity: 1,
          valueTable: 2.5,
          complements: [],
          description: null,
          promoteValue: 0,
          disponibility: {
            week: {
              friday: [
                {
                  code: 'Hfigcs',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 5,
                },
              ],
              monday: [
                {
                  code: 'RYkiCv',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 1,
                },
              ],
              sunday: [
                {
                  code: 'z7RwuZ',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 7,
                },
              ],
              tuesday: [
                {
                  code: 'cus01H',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 2,
                },
              ],
              saturday: [
                {
                  code: 'Fx1zTb',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 6,
                },
              ],
              thursday: [
                {
                  code: 'vSjW4z',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 4,
                },
              ],
              wednesday: [
                {
                  code: 'iFAIlx',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 3,
                },
              ],
            },
            store: {
              table: true,
              package: true,
              delivery: true,
            },
          },
          promoteStatus: 0,
          promoteValueTable: 0,
          promoteStatusTable: 0,
        },
        {
          id: 528774,
          obs: '',
          name: 'Esfiha de atum',
          image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/development/aguanaboca/products/528774/aguanabocaIla98Bc6gfMl5Irjpeg',
          value: 2.5,
          status: 1,
          quantity: 1,
          valueTable: 2.5,
          complements: [],
          description: null,
          promoteValue: 0,
          disponibility: {
            week: {
              friday: [
                {
                  code: 'Hfigcs',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 5,
                },
              ],
              monday: [
                {
                  code: 'RYkiCv',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 1,
                },
              ],
              sunday: [
                {
                  code: 'z7RwuZ',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 7,
                },
              ],
              tuesday: [
                {
                  code: 'cus01H',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 2,
                },
              ],
              saturday: [
                {
                  code: 'Fx1zTb',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 6,
                },
              ],
              thursday: [
                {
                  code: 'vSjW4z',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 4,
                },
              ],
              wednesday: [
                {
                  code: 'iFAIlx',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 3,
                },
              ],
            },
            store: {
              table: true,
              package: true,
              delivery: true,
            },
          },
          promoteStatus: 0,
          promoteValueTable: 0,
          promoteStatusTable: 0,
        },
        {
          id: 528779,
          obs: '',
          name: 'Refrigerante 2L',
          image: null,
          value: 0,
          status: 1,
          quantity: 1,
          valueTable: 0,
          complements: [
            {
              id: 246466,
              max: 1,
              min: 0,
              name: 'Escolha um item',
              itens: [
                {
                  code: 'eb2032',
                  name: 'Coca-Cola',
                  value: 18,
                  status: true,
                  quantity: 1,
                  description: '',
                },
              ],
              required: 1,
            },
          ],
          description: '',
          promoteValue: 0,
          disponibility: {
            week: {
              friday: [
                {
                  code: 'bKogQP',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 5,
                },
              ],
              monday: [
                {
                  code: 'cFaFGa',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 1,
                },
              ],
              sunday: [
                {
                  code: 'QhSz0S',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 7,
                },
              ],
              tuesday: [
                {
                  code: 'tPin17',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 2,
                },
              ],
              saturday: [
                {
                  code: 'qZVOIO',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 6,
                },
              ],
              thursday: [
                {
                  code: 'PmoK8l',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 4,
                },
              ],
              wednesday: [
                {
                  code: 'nZH86m',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 3,
                },
              ],
            },
            store: {
              table: true,
              package: true,
              delivery: true,
            },
          },
          promoteStatus: 0,
          promoteValueTable: 0,
          promoteStatusTable: 0,
        },
        {
          id: 528779,
          obs: '',
          name: 'Refrigerante 2L',
          image: null,
          value: 0,
          status: 1,
          quantity: 1,
          valueTable: 0,
          complements: [
            {
              id: 246466,
              max: 1,
              min: 0,
              name: 'Escolha um item',
              itens: [
                {
                  code: 'eb2032',
                  name: 'Coca-Cola',
                  value: 18,
                  status: true,
                  quantity: 1,
                  description: '',
                },
              ],
              required: 1,
            },
          ],
          description: '',
          promoteValue: 0,
          disponibility: {
            week: {
              friday: [
                {
                  code: 'bKogQP',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 5,
                },
              ],
              monday: [
                {
                  code: 'cFaFGa',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 1,
                },
              ],
              sunday: [
                {
                  code: 'QhSz0S',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 7,
                },
              ],
              tuesday: [
                {
                  code: 'tPin17',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 2,
                },
              ],
              saturday: [
                {
                  code: 'qZVOIO',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 6,
                },
              ],
              thursday: [
                {
                  code: 'PmoK8l',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 4,
                },
              ],
              wednesday: [
                {
                  code: 'nZH86m',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 3,
                },
              ],
            },
            store: {
              table: true,
              package: true,
              delivery: true,
            },
          },
          promoteStatus: 0,
          promoteValueTable: 0,
          promoteStatusTable: 0,
        },
        {
          id: 528779,
          obs: '',
          name: 'Refrigerante 2L',
          image: null,
          value: 0,
          status: 1,
          quantity: 1,
          valueTable: 0,
          complements: [
            {
              id: 246466,
              max: 1,
              min: 0,
              name: 'Escolha um item',
              itens: [
                {
                  code: 'cafb0e',
                  name: 'Sprite',
                  value: 15,
                  status: true,
                  quantity: 1,
                  description: '',
                },
              ],
              required: 1,
            },
          ],
          description: '',
          promoteValue: 0,
          disponibility: {
            week: {
              friday: [
                {
                  code: 'bKogQP',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 5,
                },
              ],
              monday: [
                {
                  code: 'cFaFGa',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 1,
                },
              ],
              sunday: [
                {
                  code: 'QhSz0S',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 7,
                },
              ],
              tuesday: [
                {
                  code: 'tPin17',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 2,
                },
              ],
              saturday: [
                {
                  code: 'qZVOIO',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 6,
                },
              ],
              thursday: [
                {
                  code: 'PmoK8l',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 4,
                },
              ],
              wednesday: [
                {
                  code: 'nZH86m',
                  open: '00:00',
                  close: '23:59',
                  active: true,
                  weekDay: 3,
                },
              ],
            },
            store: {
              table: true,
              package: true,
              delivery: true,
            },
          },
          promoteStatus: 0,
          promoteValueTable: 0,
          promoteStatusTable: 0,
        },
      ],
      cartPizza: [
        {
          obs: '',
          size: 'Grande',
          sizes: [],
          value: 30,
          status: true,
          flavors: [
            {
              code: '9f9aa2',
              name: 'Calabresa',
              image: null,
              status: true,
              values: {
                Grande: 30,
                Médio: 25,
              },
              description: null,
              valuesTable: {
                'Teste': 13,
                'Grande': 30,
                'Médio': 25,
                'Pequeno': 33,
                'teste 2': 13,
                'teste 3': 13,
                'teste 4': 13,
                'teste 5': 13,
                'teste 6': 13,
              },
            },
            {
              code: 'a21828',
              name: 'Muçarela',
              image: null,
              status: true,
              values: {
                Grande: 29,
                Médio: 23,
              },
              description: null,
              valuesTable: {
                Grande: 29,
                Médio: 23,
              },
            },
          ],
          quantity: 1,
          implementations: [],
        },
        {
          obs: '',
          size: 'Grande',
          sizes: [],
          value: 34,
          status: true,
          flavors: [
            {
              code: '9f9aa2',
              name: 'Calabresa',
              image: null,
              status: true,
              values: {
                Grande: 30,
                Médio: 25,
              },
              description: null,
              valuesTable: {
                'Teste': 13,
                'Grande': 30,
                'Médio': 25,
                'Pequeno': 33,
                'teste 2': 13,
                'teste 3': 13,
                'teste 4': 13,
                'teste 5': 13,
                'teste 6': 13,
              },
            },
            {
              code: 'a21828',
              name: 'Muçarela',
              image: null,
              status: true,
              values: {
                Grande: 29,
                Médio: 23,
              },
              description: null,
              valuesTable: {
                Grande: 29,
                Médio: 23,
              },
            },
          ],
          quantity: 1,
          implementations: [
            {
              code: '4ac87d',
              name: 'Borda de Catupiry',
              value: 4,
              status: true,
            },
          ],
        },
        {
          obs: '',
          size: 'Grande',
          sizes: [],
          value: 34,
          status: true,
          flavors: [
            {
              code: '9f9aa2',
              name: 'Calabresa',
              image: null,
              status: true,
              values: {
                Grande: 30,
                Médio: 25,
              },
              description: null,
              valuesTable: {
                'Teste': 13,
                'Grande': 30,
                'Médio': 25,
                'Pequeno': 33,
                'teste 2': 13,
                'teste 3': 13,
                'teste 4': 13,
                'teste 5': 13,
                'teste 6': 13,
              },
            },
            {
              code: 'a21828',
              name: 'Muçarela',
              image: null,
              status: true,
              values: {
                Grande: 29,
                Médio: 23,
              },
              description: null,
              valuesTable: {
                Grande: 29,
                Médio: 23,
              },
            },
          ],
          quantity: 1,
          implementations: [
            {
              code: '4ac87d',
              name: 'Borda de Catupiry',
              value: 4,
              status: true,
            },
          ],
        },
      ],
      created_at: '2022-09-16 14:36:30',
      updated_at: '2022-09-16 14:36:30',
      packageDate: null,
      cupom: null,
    }

    return new Request(JSON.parse(JSON.stringify(requestPrintTeste)))
  }
}
