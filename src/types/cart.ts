import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import { apiRoute, verifyEqualsComplements } from '../utils/wm-functions'
import Bartender from './bartender'
import CartItem, { CartItemType } from './cart-item'
import Command from './command'
import Cupom, { CupomType } from './cupom'
import { ProfileFormPayment, ProfileOptions } from './profile'

export interface CartType {
  id: number
  profileId: number
  clientId: number
  client?: any
  addressId?: number
  address?: any
  cupomId?: number
  cupom?: Cupom
  commandId?: number
  command?: Command
  bartenderId?: number
  bartender?: Bartender
  cashierId?: number
  cashier?: any
  motoboyId?: number
  motoboy?: any
  secretNumber?: string
  code: string
  status: null | 'transport' | 'production' | 'canceled'
  obs?: any
  type: 'D' | 'T' | 'P'
  taxDelivery: number
  timeDelivery: string
  formsPayment: CartFormPayment[]
  print: number
  tentatives: number
  total: number
  controls: Controls
  statusPayment: 'paid' | 'pending' | 'canceled' | 'offline'
  packageDate?: any
  created_at: string
  updated_at: string
  itens: CartItemType[]
}

export interface CartFormPayment extends ProfileFormPayment {
  value: number
  label: string
  change?: number
  code?: string
  flag?: { code: string; image: string; name: string }
  paid?: boolean
  paymentId?: string
  online?: boolean
}

interface Controls {}

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
export default class Cart {
  id: number
  profileId: number
  clientId: number
  client?: any
  addressId?: number
  address?: any
  cupomId?: number
  cupom?: Cupom
  commandId?: number
  command?: Command
  bartenderId?: number
  bartender?: Bartender
  cashierId?: number
  cashier?: any
  motoboyId?: number
  motoboy?: any
  secretNumber?: string
  code: string
  status: null | 'transport' | 'production' | 'canceled'
  obs?: any
  type: 'D' | 'T' | 'P'
  taxDelivery: number
  timeDelivery: string
  formsPayment: CartFormPayment[]
  statusPayment: 'paid' | 'pending' | 'canceled' | 'offline'
  print: number
  tentatives: number
  total: number
  controls: Controls
  packageDate?: any
  created_at: string
  updated_at: string
  itens: CartItem[]

  public defaultStatusProductionPackage = 'Olá [NOME], seu pedido foi recebido.'
  public defaultStatusProductionMessage = 'Olá [NOME], seu pedido está em produção.'
  public defaultStatusToRemoveMessage = 'Obaaa [NOME], seu pedido está pronto para retirada.'
  public defaultStatusTransportMessage = 'Obaaa [NOME], seu pedido está a caminho.'
  public defaultCanceledMessage = 'Olá [NOME], seu pedido foi cancelado.'

  constructor({
    id,
    addressId,
    address,
    bartenderId,
    bartender,
    cashierId,
    cashier,
    clientId,
    client,
    motoboyId,
    motoboy,
    commandId,
    command,
    cupomId,
    profileId,
    controls,
    formsPayment = [],
    itens,
    obs,
    secretNumber,
    code,
    status,
    taxDelivery,
    type,
    statusPayment,
    timeDelivery,
    total,
    print,
    tentatives,
    created_at,
    updated_at,
    packageDate,
    cupom,
  }: CartType) {
    this.id = id
    this.addressId = addressId
    this.address = address
    this.bartenderId = bartenderId
    this.bartender = bartender
    this.cashierId = cashierId
    this.cashier = cashier
    this.clientId = clientId
    this.client = client
    this.motoboyId = motoboyId
    this.motoboy = motoboy
    this.commandId = commandId
    this.command = command ? new Command(command) : undefined
    this.cupomId = cupomId
    this.cupom = cupom
    this.profileId = profileId
    this.controls = controls
    this.formsPayment = formsPayment.map((formPayment) => {
      if (formPayment.change) {
        formPayment.change = Number(formPayment.change)
      }
      return formPayment
    })
    this.itens = itens ? itens.map((item) => new CartItem(item, code)) : []
    this.obs = obs
    this.secretNumber = secretNumber
    this.code = code
    this.status = status
    this.taxDelivery = taxDelivery
    this.type = type
    this.timeDelivery = timeDelivery
    this.total = total
    this.print = print
    this.tentatives = tentatives
    this.statusPayment = statusPayment
    this.created_at = created_at
    this.updated_at = updated_at
    this.packageDate = packageDate
  }

  public returnMaskedContact() {
    if (this.type === 'T') {
      return '-'
    }
    if (this.client) {
      if (this.client.whatsapp.length > 10) {
        return this.client.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }

      return this.client.whatsapp.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
  }

  public getTotalComplements() {
    return this.itens
      .filter((i) => i.type === 'pizza')
      .flatMap((i) => i.details.complements.flatMap((c) => c.itens))
      .reduce((total, item) => (total += item.value * (item.quantity || 1)), 0)
  }

  public date() {
    const formatted = `${DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('dd/MM/yyyy')} ${
      DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('ss').includes('01')
        ? '(SH)'
        : DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('HH:mm')
    }`

    return {
      date: this.packageDate,
      onlyDate: DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('dd/MM/yyyy'),
      zero: DateTime.fromSQL(this.packageDate, { setZone: true }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
      formatted,
    }
  }

  public transshipment() {
    return this.formsPayment.reduce((total, formPayment) => (total += formPayment.payment === 'money' ? formPayment.change ?? 0 : 0), 0)
  }

  //Cart Api

  public async updateStatus(status: null | 'production' | 'transport' | 'delivered' | 'canceled', session: Session | null) {
    try {
      const { data } = await apiRoute(`/dashboard/carts/${this.id}/status`, session, 'PATCH', { status, id: this.id })

      this.status = data.cart.status

      return data.cart.status
    } catch (error) {
      console.error(error)
    }
  }

  public async alterDate(session: Session | null, packageDate: string) {
    if (this.type === 'P') {
      try {
        const { data } = await apiRoute(`/dashboard/carts/${this.id}/package/date`, session, 'PATCH', {
          package: DateTime.fromJSDate(
            new Date(`${packageDate} ${DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('HH:mm:ss')}`)
          ).toISO(),
          id: this.id,
        })
        this.packageDate = DateTime.fromISO(data.cart.packageDate, { setZone: true }).toSQL()
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
        const status = await this.updateStatus('canceled', session)
        this.status = status
        return
      } else {
        const status = await this.updateStatus(null, session)
        this.status = status
        return
      }
    } catch (error) {
      console.error(error)
      return error
    }
  }

  public async production(session: Session | null) {
    if (this.status === null) {
      try {
        const status = await this.updateStatus('production', session)
        this.status = status
      } catch (error) {
        console.error(error)
        return error
      }
    }
  }

  public async transport(session: Session | null) {
    if (this.status !== 'transport') {
      try {
        const status = await this.updateStatus('transport', session)
        this.status = status
      } catch (error) {
        console.error(error)
        return error
      }
    }
  }

  public async setPrinted(session: Session) {
    try {
      const { data } = await apiRoute(`/dashboard/carts/${this.id}/print`, session, 'PATCH')
      this.print = JSON.parse(data.cart.print) ? 1 : 0
    } catch (error) {
      console.error(error)
    }
  }

  public typeDeliveryText(textPackage: 'Encomendas' | 'Agendamentos' = 'Encomendas', textOnly = false) {
    let textDelivery = ''
    switch (this.type) {
      case 'D':
        textDelivery = this.address && !textOnly ? `**Delivery**\n\r` : '**Vou retirar no local**'
        break
      case 'P':
        textDelivery = this.address && !textOnly ? `**${textPackage}**\r\n` : '**Vou Retirar no Local**'
        break
      case 'T':
        textDelivery = '**Pedido Mesa**'
        break
    }

    return textDelivery
  }

  public getTextTypeReq() {
    return this.type
  }

  public getTotalValue(sumWith: 'subtotal' | 'total' | 'lack' | 'addon' | 'paid' | 'cashback') {
    const total = this.total
    let addonTotal = 0
    if (this.formsPayment && this.formsPayment[0] && this.formsPayment[0].addon && this.formsPayment[0].addon.status) {
      const { type: addonType, value: addonValue, valueType: addonValueType } = this.formsPayment[0].addon
      addonTotal = addonValueType === 'percentage' ? (addonValue / 100) * this.total : addonValue
      if (addonType === 'discount') {
        addonTotal *= -1
      }
    }
    const totalResult = total + this.taxDelivery - this.calcCupomValue() + addonTotal

    const cashbackValue = Math.min(
      totalResult,
      this.formsPayment
        ?.filter((formPayment) => formPayment.payment === 'cashback')
        .reduce((total, formPayment) => (total += formPayment.value), 0) || 0
    )

    switch (sumWith) {
      case 'subtotal':
        return total

      case 'total':
        if (cashbackValue > totalResult) {
          return totalResult
        }

        return totalResult - cashbackValue
      case 'lack':
        return Number(
          Math.fround(
            total +
              this.taxDelivery -
              Math.max(
                this.formsPayment.reduce((total, formPayment) => (total += formPayment.value), 0),
                0
              ) +
              addonTotal
          ).toFixed(2)
        )
      case 'addon':
        return addonTotal
      case 'paid':
        return this.formsPayment?.reduce((total, formPayment) => (total += formPayment.value), 0) || 0
      case 'cashback':
        return cashbackValue
    }
  }

  /**
   * Calcula o valor do cupom com base em seu tipo.
   *
   * @return {number}
   */
  private calcCupomValue(): number {
    let cupomValue = 0
    if (this.cupom) {
      switch (this.cupom.type) {
        case 'percent':
          cupomValue = this.total * (Number(this.cupom.value) / 100)
          break
        case 'value':
          cupomValue = Number(this.cupom.value)
          break
        case 'freight':
          cupomValue = this.taxDelivery
      }
    }
    return cupomValue
  }

  static calcValuePizza(pizza: CartItemType, onlyPizza = false) {
    if (onlyPizza) {
      const totalImplementations = pizza.details.implementations.reduce((total, implementation) => (total += implementation.value), 0)
      return pizza.details.value - totalImplementations
    }

    return pizza.details.value * pizza.quantity
  }

  public permenance(report: boolean, opened = this.command?.opened): string | undefined {
    let permenance
    if (!opened) {
      return permenance
    }

    const tableOpenDate = DateTime.fromSQL(opened.created_at as string).toFormat('HH:mm')
    const tableCloseDate = report ? DateTime.fromSQL(opened.updated_at as string).toFormat('HH:mm') : DateTime.local().toFormat('HH:mm')
    const perm =
      opened.perm ??
      DateTime.local()
        .diff(DateTime.fromSQL(opened.created_at as string), 'seconds')
        .toFormat("hh'h'mm")
    return (permenance = `${tableOpenDate}/${tableCloseDate} ${perm}`)
  }

  public groupItens = (groupItems?: boolean) => {
    return this.itens.reduce((newItems: CartItem[], cartItem) => {
      if (groupItems) {
        switch (cartItem.type) {
          case 'default':
            const newItem = newItems.find(
              (item) =>
                item.productId === cartItem.productId &&
                item.obs === cartItem.obs &&
                item.details.value === cartItem.details.value &&
                item.details.complements.length === cartItem.details.complements.length
            )
            if (newItem) {
              const allComplements = verifyEqualsComplements(newItem.details.complements, cartItem.details.complements)

              if (allComplements) {
                newItem.quantity += cartItem.quantity
              } else {
                newItems.push(new CartItem(cartItem, this.code))
              }
            } else {
              newItems.push(new CartItem(cartItem, this.code))
            }
            break
          case 'pizza':
            const pizza = newItems.find(
              (item) =>
                item.pizzaId === cartItem.pizzaId &&
                item.details.value === cartItem.details.value &&
                item.details.sizeCode === cartItem.details.sizeCode &&
                item.details.flavors.length === cartItem.details.flavors.length &&
                item.details.implementations.length === cartItem.details.implementations.length &&
                item.details.complements.length === cartItem.details.complements.length
            )

            const verificationOne = pizza?.details.flavors.every((pizzaFlavor) =>
              cartItem.details.flavors?.some((elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code)
            )
            const verificationTwo = cartItem.details.flavors?.every((pizzaFlavor) =>
              pizza?.details.flavors?.some((elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code)
            )

            const implementations = pizza?.details.implementations?.every((pizzaImplementation) =>
              cartItem.details?.implementations.some((elPizzaImplementation) => elPizzaImplementation.code === pizzaImplementation.code)
            )
            if (verificationOne && verificationTwo && implementations && pizza) {
              pizza.quantity += cartItem.quantity
            } else {
              newItems.push(new CartItem(cartItem, this.code))
            }
            break
        }
      } else {
        newItems.push(new CartItem(cartItem, this.code))
      }

      return newItems
    }, [])
  }

  public async setMotoboyId(id: number, callback: () => void) {
    this.motoboyId = id
    callback()
  }

  static cartPrint() {
    const cartPrintTest: CartType = {
      id: 7054262,
      profileId: 1,
      clientId: 56,
      statusPayment: 'paid',
      addressId: 616476,
      code: '999',
      status: null,
      obs: null,
      type: 'D',
      taxDelivery: 5,
      timeDelivery: '10',
      formsPayment: [
        {
          flags: [],
          label: 'Dinheiro',
          value: 169.5,
          status: true,
          payment: 'money',
          addon: { status: true, type: 'fee', valueType: 'percentage', value: 10 },
        },
      ],
      print: 1,
      tentatives: 0,
      total: 164.5,
      controls: {},
      packageDate: null,
      created_at: '2023-07-19 14:58:54',
      updated_at: '2023-07-19 15:08:03',
      itens: [
        {
          id: 1864844,
          cartId: 7054262,
          productId: null,
          pizzaId: 1679,
          type: 'pizza',
          quantity: 1,
          obs: '',
          details: {
            value: 44,
            flavors: [
              {
                code: '53e5e0',
                name: 'Atum',
                image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                status: true,
                values: {
                  Broto: 15,
                  Grande: 30,
                },
                complements: [],
                description: 'Molho, mussarela, atum, orégano e azeitonas',
                valuesTable: {
                  Broto: 15,
                  Grande: 30,
                },
                implementations: [],
              },
              {
                code: 'a0b3c5',
                name: 'Frango com Catupiry',
                image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                status: true,
                values: {
                  Broto: 22,
                  Grande: 44,
                },
                complements: [],
                description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                valuesTable: {
                  Broto: 22,
                  Grande: 44,
                },
                implementations: [],
              },
            ],
            complements: [],
            implementations: [
              {
                code: 'cf2e08',
                name: 'Borda de Catupiry',
                value: 5,
                status: true,
              },
            ],
          },
          name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry com Borda de Catupiry',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
        {
          id: 1864845,
          cartId: 7054262,
          productId: null,
          pizzaId: 1679,
          type: 'pizza',
          quantity: 1,
          obs: '',
          details: {
            value: 44,
            flavors: [
              {
                code: 'a0b3c5',
                name: 'Frango com Catupiry',
                image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                status: true,
                values: {
                  Broto: 22,
                  Grande: 44,
                },
                complements: [],
                description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                valuesTable: {
                  Broto: 22,
                  Grande: 44,
                },
                implementations: [],
              },
              {
                code: '53e5e0',
                name: 'Atum',
                image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                status: true,
                values: {
                  Broto: 15,
                  Grande: 30,
                },
                complements: [],
                description: 'Molho, mussarela, atum, orégano e azeitonas',
                valuesTable: {
                  Broto: 15,
                  Grande: 30,
                },
                implementations: [],
              },
            ],
            complements: [],
            implementations: [
              {
                code: 'cf2e08',
                name: 'Borda de Catupiry',
                value: 5,
                status: true,
              },
            ],
          },
          name: 'Pizza Grande 2 Sabores Frango com Catupiry,Atum com Borda de Catupiry',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
        {
          id: 1864846,
          cartId: 7054262,
          productId: 120101,
          pizzaId: null,
          type: 'default',
          quantity: 1,
          obs: '',
          details: {
            value: 11.9,
            isPromote: true,
            complements: [],
            implementations: [],
            flavors: [],
          },
          name: 'X-Salada',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
        {
          id: 1864847,
          cartId: 7054262,
          productId: 120101,
          pizzaId: null,
          type: 'default',
          quantity: 2,
          obs: '',
          details: {
            value: 11.9,
            isPromote: true,
            complements: [],
            implementations: [],
            flavors: [],
          },
          name: 'X-Salada',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
        {
          id: 1864848,
          cartId: 7054262,
          productId: 120101,
          pizzaId: null,
          type: 'default',
          quantity: 1,
          obs: '',
          details: {
            value: 11.9,
            isPromote: true,
            complements: [
              {
                id: 1,
                max: 10,
                min: 0,
                name: 'Turbine seu Lanche',
                itens: [
                  {
                    code: '40df65',
                    name: 'carne extra',
                    value: 5,
                    status: true,
                    quantity: 1,
                    description: '',
                  },
                  {
                    code: 'ce5251',
                    name: 'bacon',
                    value: 2,
                    status: true,
                    quantity: 1,
                    description: '',
                  },
                ],
                required: false,
                type: 'default',
                order: 0,
              },
            ],
            flavors: [],
            implementations: [],
          },
          name: 'X-Salada',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
        {
          id: 1864849,
          cartId: 7054262,
          productId: 120101,
          pizzaId: null,
          type: 'default',
          quantity: 1,
          obs: 'Sem tomate, por favor',
          details: {
            value: 11.9,
            isPromote: true,
            complements: [],
            implementations: [],
            flavors: [],
          },
          name: 'X-Salada',
          controls: {},
          deleted_at: null,
          created_at: '2023-07-19 14:58:54',
          updated_at: '2023-07-19 14:58:54',
        },
      ],
      address: {
        id: 616476,
        clientId: 56,
        street: 'Rua Teste',
        number: 100,
        zipcode: null,
        complement: 'AP 101',
        reference: '',
        uf: 'SP',
        city: 'Teste',
        neighborhood: 'Bairro Teste 1',
        latitude: null,
        longitude: null,
        distance: 199288,
        controls: {},
        deleted_at: null,
        created_at: '2023-07-19 14:08:31',
        updated_at: '2023-07-19 14:08:31',
      },
      client: {
        id: 56,
        profileId: 1,
        name: 'WhatsMenu',
        whatsapp: '99999999999',
        secretNumber: null,
        email: null,
        birthday_date: null,
        last_requests: [
          {
            id: 7054262,
            cart: [
              {
                obs: '',
                name: 'X-Salada',
                type: 'default',
                details: {
                  value: 11.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 120101,
              },
              {
                obs: '',
                name: 'X-Salada',
                type: 'default',
                details: {
                  value: 11.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 2,
                productId: 120101,
              },
              {
                obs: '',
                name: 'X-Salada',
                type: 'default',
                details: {
                  value: 11.9,
                  isPromote: true,
                  complements: [
                    {
                      id: 1,
                      max: 10,
                      min: 0,
                      name: 'Turbine seu Lanche',
                      itens: [
                        {
                          code: '40df65',
                          name: 'carne extra',
                          value: 5,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                        {
                          code: 'ce5251',
                          name: 'bacon',
                          value: 2,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                      ],
                      required: 0,
                    },
                  ],
                },
                quantity: 1,
                productId: 120101,
              },
              {
                obs: 'Sem tomate, por favor',
                name: 'X-Salada',
                type: 'default',
                details: {
                  value: 11.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 120101,
              },
            ],
            code: 7095,
            type: 'D',
            total: 164.5,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: 616476,
            cartPizza: [
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Frango com Catupiry,Atum com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
            ],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:58:54',
            updated_at: '2023-07-19 14:58:54',
            packageDate: null,
            taxDelivery: 5,
            timeDelivery: '10',
          },
          {
            id: 7054261,
            cart: [
              {
                obs: '',
                name: 'X-Bacon',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 3,
                productId: 23267,
              },
              {
                obs: '',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7094,
            type: 'D',
            total: 39.6,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:49:00',
            updated_at: '2023-07-19 14:49:00',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
          {
            id: 7054260,
            cart: [
              {
                obs: '',
                name: 'X-Bacon',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 3,
                productId: 23267,
              },
              {
                obs: '',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7093,
            type: 'D',
            total: 39.6,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: 616476,
            cartPizza: [],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:35:30',
            updated_at: '2023-07-19 14:35:30',
            packageDate: null,
            taxDelivery: 5,
            timeDelivery: '10',
          },
          {
            id: 7054259,
            cart: [
              {
                obs: '',
                name: 'X-Bacon',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 3,
                productId: 23267,
              },
              {
                obs: '',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7092,
            type: 'D',
            total: 39.6,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:34:57',
            updated_at: '2023-07-19 14:34:57',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
          {
            id: 7054258,
            cart: [
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [
                    {
                      id: 1,
                      max: 10,
                      min: 0,
                      name: 'Turbine seu Lanche',
                      itens: [
                        {
                          code: '40df65',
                          name: 'carne extra',
                          value: 5,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                        {
                          code: 'ce5251',
                          name: 'bacon',
                          value: 2,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                      ],
                      required: 0,
                    },
                  ],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 2,
                productId: 92880,
              },
              {
                obs: 'Sem tomate por favor',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7091,
            type: 'D',
            total: 0,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry ',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [],
                },
                pizzaId: 1679,
                quantity: 1,
              },
              {
                obs: '',
                name: 'Pizza Broto 1 Sabor Quatro Queijos com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 22,
                  flavors: [
                    {
                      code: 'a0dbd2',
                      name: 'Quatro Queijos',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Mussarela, catupiry, gorgonzola e parmesão',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: 'a31eb3',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
            ],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:26:43',
            updated_at: '2023-07-19 14:26:43',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
          {
            id: 7054257,
            cart: [
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [
                    {
                      id: 1,
                      max: 10,
                      min: 0,
                      name: 'Turbine seu Lanche',
                      itens: [
                        {
                          code: '40df65',
                          name: 'carne extra',
                          value: 5,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                        {
                          code: 'ce5251',
                          name: 'bacon',
                          value: 2,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                      ],
                      required: 0,
                    },
                  ],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 2,
                productId: 92880,
              },
              {
                obs: 'Sem tomate por favor',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7090,
            type: 'D',
            total: 0,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry ',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [],
                },
                pizzaId: 1679,
                quantity: 1,
              },
              {
                obs: '',
                name: 'Pizza Broto 1 Sabor Quatro Queijos com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 22,
                  flavors: [
                    {
                      code: 'a0dbd2',
                      name: 'Quatro Queijos',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Mussarela, catupiry, gorgonzola e parmesão',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: 'a31eb3',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
            ],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:24:57',
            updated_at: '2023-07-19 14:24:57',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
          {
            id: 7054256,
            cart: [
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [
                    {
                      id: 1,
                      max: 10,
                      min: 0,
                      name: 'Turbine seu Lanche',
                      itens: [
                        {
                          code: '40df65',
                          name: 'carne extra',
                          value: 5,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                        {
                          code: 'ce5251',
                          name: 'bacon',
                          value: 2,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                      ],
                      required: 0,
                    },
                  ],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 2,
                productId: 92880,
              },
              {
                obs: 'Sem tomate por favor',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7089,
            type: 'D',
            total: 0,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry ',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [],
                },
                pizzaId: 1679,
                quantity: 1,
              },
              {
                obs: '',
                name: 'Pizza Broto 1 Sabor Quatro Queijos com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 22,
                  flavors: [
                    {
                      code: 'a0dbd2',
                      name: 'Quatro Queijos',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Mussarela, catupiry, gorgonzola e parmesão',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: 'a31eb3',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
            ],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:10:15',
            updated_at: '2023-07-19 14:10:15',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
          {
            id: 7054255,
            cart: [
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [
                    {
                      id: 1,
                      max: 10,
                      min: 0,
                      name: 'Turbine seu Lanche',
                      itens: [
                        {
                          code: '40df65',
                          name: 'carne extra',
                          value: 5,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                        {
                          code: 'ce5251',
                          name: 'bacon',
                          value: 2,
                          status: true,
                          quantity: 1,
                          description: '',
                        },
                      ],
                      required: 0,
                    },
                  ],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 92880,
              },
              {
                obs: '',
                name: 'X-Salada Duplo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 2,
                productId: 92880,
              },
              {
                obs: 'Sem tomate por favor',
                name: 'X-Tudo',
                type: 'default',
                details: {
                  value: 9.9,
                  isPromote: true,
                  complements: [],
                },
                quantity: 1,
                productId: 23268,
              },
            ],
            code: 7088,
            type: 'D',
            total: 0,
            status: null,
            cupomId: null,
            clientId: 56,
            controls: {},
            addressId: null,
            cartPizza: [
              {
                obs: '',
                name: 'Pizza Grande 2 Sabores Atum,Frango com Catupiry ',
                type: 'pizza',
                details: {
                  value: 44,
                  flavors: [
                    {
                      code: '53e5e0',
                      name: 'Atum',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, atum, orégano e azeitonas',
                      valuesTable: {
                        Broto: 15,
                        Grande: 30,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                    {
                      code: 'a0b3c5',
                      name: 'Frango com Catupiry',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: '4a248f',
                  complements: [],
                  implementations: [],
                },
                pizzaId: 1679,
                quantity: 1,
              },
              {
                obs: '',
                name: 'Pizza Broto 1 Sabor Quatro Queijos com Borda de Catupiry',
                type: 'pizza',
                details: {
                  value: 22,
                  flavors: [
                    {
                      code: 'a0dbd2',
                      name: 'Quatro Queijos',
                      image: 'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description: 'Mussarela, catupiry, gorgonzola e parmesão',
                      valuesTable: {
                        Broto: 22,
                        Grande: 44,
                      },
                      disponibility: {
                        store: 'full',
                      },
                      implementations: [],
                    },
                  ],
                  sizeCode: 'a31eb3',
                  complements: [],
                  implementations: [
                    {
                      code: 'cf2e08',
                      name: 'Borda de Catupiry',
                      value: 5,
                      status: true,
                    },
                  ],
                },
                pizzaId: 1679,
                quantity: 1,
              },
            ],
            cashierId: null,
            commandId: null,
            profileId: 1,
            created_at: '2023-07-19 14:06:17',
            updated_at: '2023-07-19 14:06:17',
            packageDate: null,
            taxDelivery: 0,
            timeDelivery: 0,
          },
        ],
        controls: {},
        date_last_request: '2023-07-19T17:58:54.000Z',
        deleted_at: null,
        created_at: '2023-06-26 12:47:36',
        updated_at: '2023-07-19 14:58:54',
      },
      cashier: null,
    }

    return new Cart(cartPrintTest)
  }
}
