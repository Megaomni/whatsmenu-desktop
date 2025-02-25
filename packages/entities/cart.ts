import { DateTime } from 'luxon'
import Bartender from './bartender'
import CartItem, { CartItemType } from './cart-item'
import Command from './command'
import Complement from './complements'
import Cupom, { CupomType } from './cupom'
import { IfoodOrderType } from './ifood-order'
import Profile, {
  ProfileFormPayment,
  ProfileType
} from './profile'
import i18n from '../i18n'

export interface CartType {
  id: number
  profileId: number
  clientId?: number
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
  status: null | 'transport' | 'production' | 'canceled' | 'motoboy'
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
  origin?: 'whatsmenu' | 'portal' | 'ifood'
  ifoodStatus?: string
  ifoodAditionalInfo?: IfoodOrderType['additionalInfo']
  taxIfood?: number
  orderId?: string
  sendMB?: boolean
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

interface Controls {
  pickupCode?: string | null
  grovenfe?: {
    fiscal_note: any
    created_at?: string
  }
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
export default class Cart {
  id: number
  profileId: number
  clientId?: number
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
  status: null | 'transport' | 'production' | 'motoboy' | 'canceled'
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
  origin?: 'whatsmenu' | 'portal' | 'ifood'
  ifoodStatus?: string
  ifoodAditionalInfo?: IfoodOrderType['additionalInfo']
  taxIfood?: number
  orderId?: string

  public defaultStatusProductionPackage = 'Olá [NOME], seu pedido foi recebido.'
  public defaultStatusProductionMessage =
    'Olá [NOME], seu pedido está em produção.'
  public defaultStatusToRemoveMessage =
    'Obaaa [NOME], seu pedido está pronto para retirada.'
  public defaultStatusTransportMessage =
    'Obaaa [NOME], seu pedido está a caminho.'
  public defaultCanceledMessage = 'Olá [NOME], seu pedido foi cancelado.'
  sendMB = false

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
    formsPayment,
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
    origin = 'whatsmenu',
    taxIfood,
    orderId,
    ifoodStatus,
    ifoodAditionalInfo,
  }: CartType & {
    origin?: 'whatsmenu' | 'portal' | 'ifood'
    ifoodStatus?: string
  }) {
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
    this.formsPayment = formsPayment
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
    this.origin = origin
    this.ifoodStatus = ifoodStatus
    this.ifoodAditionalInfo = ifoodAditionalInfo
    this.taxIfood = taxIfood
    this.orderId = orderId

    if (
      this.formsPayment.length === 1 &&
      this.formsPayment[0]?.payment === 'cashback'
    ) {
      this.formsPayment[0].value = this.getTotalValue('total')
    }
  }

  public returnMaskedContact() {
    if (this.type === 'T') {
      return '-'
    }
    if (this.client) {
      if (this.client.whatsapp.length > 10) {
        return this.client.whatsapp.replace(
          /(\d{2})(\d{5})(\d{4})/,
          '($1) $2-$3'
        )
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
    let formatted
    if (this.origin === 'ifood') {
      formatted = `${DateTime.fromISO(this.packageDate, { setZone: true }).toFormat('dd/MM/yyyy')} ${
        DateTime.fromISO(this.packageDate, { setZone: true })
          .toFormat('ss')
          .includes('01')
          ? '(SH)'
          : DateTime.fromISO(this.packageDate, { setZone: true }).toFormat(
              'HH:mm'
            )
      }`
    }
    if (this.origin !== 'ifood') {
      formatted = `${DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat('dd/MM/yyyy')} ${
        DateTime.fromSQL(this.packageDate, { setZone: true })
          .toFormat('ss')
          .includes('01')
          ? '(SH)'
          : DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat(
              'HH:mm'
            )
      }`
    }

    return {
      date: this.packageDate,
      onlyDate: DateTime.fromSQL(this.packageDate, { setZone: true }).toFormat(
        'dd/MM/yyyy'
      ),
      zero: DateTime.fromSQL(this.packageDate, { setZone: true }).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      }),
      formatted,
    }
  }

  public transshipment() {
    return this.formsPayment.reduce(
      (total, formPayment) =>
        (total +=
          formPayment.payment === 'money'
            ? (Number(formPayment.change) ?? 0)
            : 0),
      0
    )
  }

  public typeDeliveryText(
    textPackage: 'Encomendas' | 'Agendamentos' = 'Encomendas',
    textOnly = false,
    language?: string | 'pt-BR'
  ) {
    let textDelivery = ''
    i18n.changeLanguage(language)
    switch (this.type) {
      case 'D':
        textDelivery =
          this.address && !textOnly
            ? `**Delivery**\n\r`
            : `**${i18n.t('pickup_the_location')}**`
        break
      case 'P':
        textDelivery =
          this.address && !textOnly
            ? `**${textPackage}**\r\n`
            : `**${i18n.t('pickup_the_location')}**`
        break
      case 'T':
        textDelivery = `**${i18n.t('table_request')}**`
        break
    }

    return textDelivery
  }

  public getTextTypeReq() {
    return this.type
  }

  /**
   * Retorna o nome do cliente baseado no tipo do carrinho.
   *
   * @returns {string} nome do cliente ou comanda
   */
  public nameClient = () => {
    switch (this.type) {
      case 'T':
        return `${this.command?.name}`
      case 'D':
        return `${this.client ? this.client.name : 'Sem cadastro'}`
      case 'P':
        return `${this.client ? this.client.name : 'Sem cadastro'}`
      default:
        break
    }
  }

  public getTotalValue(
    sumWith: 'subtotal' | 'total' | 'lack' | 'addon' | 'paid' | 'cashback'
  ) {
    let total = this.total
    if (this.taxIfood && sumWith === 'total') {
      total += this.taxIfood
    }
    let addonTotal = 0
    if (
      this.formsPayment &&
      this.formsPayment[0] &&
      this.formsPayment[0].addon &&
      this.formsPayment[0].addon.status
    ) {
      const {
        type: addonType,
        value: addonValue,
        valueType: addonValueType,
      } = this.formsPayment[0].addon
      if (addonValueType === 'percentage') {
        addonTotal = (addonValue / 100) * this.total
      }
      if (addonValueType === 'fixed') {
        addonTotal = addonValue
      }
      if (addonType === 'discount') {
        addonTotal = addonTotal * -1
      }
    }

    const totalResult =
      total + this.taxDelivery - this.calcCupomValue() + addonTotal

    const cashbackValue =
      this.formsPayment.find((form) => form.payment === 'cashback')?.value ?? 0

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
                this.formsPayment.reduce(
                  (total, formPayment) => (total += formPayment.value),
                  0
                ),
                0
              ) +
              addonTotal
          ).toFixed(2)
        )
      case 'addon':
        return addonTotal
      case 'paid':
        return (
          this.formsPayment?.reduce(
            (total, formPayment) => (total += formPayment.value),
            0
          ) || 0
        )
      case 'cashback':
        return cashbackValue
    }
  }

  /**
   * Calcula o valor do cupom com base em seu tipo.
   *
   * @return {number}
   */
  public calcCupomValue(): number {
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
      const totalImplementations = pizza.details.implementations.reduce(
        (total, implementation) => (total += implementation.value),
        0
      )
      return pizza.details.value - totalImplementations
    }

    return pizza.details.value * pizza.quantity
  }

  public permenance(
    report: boolean,
    opened = this.command?.opened
  ): string | undefined {
    let permenance
    if (!opened) {
      return permenance
    }

    const tableOpenDate = DateTime.fromSQL(
      opened.created_at as string
    ).toFormat('HH:mm')
    const tableCloseDate = report
      ? DateTime.fromSQL(opened.updated_at as string).toFormat('HH:mm')
      : DateTime.local().toFormat('HH:mm')
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
                item.details.complements.length ===
                  cartItem.details.complements.length
            )
            if (newItem) {
              const allComplements = Complement.verifyEqualsComplements(
                newItem.details.complements,
                cartItem.details.complements
              )

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
                item.details.flavors.length ===
                  cartItem.details.flavors.length &&
                item.details.implementations.length ===
                  cartItem.details.implementations.length &&
                item.details.complements.length ===
                  cartItem.details.complements.length
            )

            const verificationOne = pizza?.details.flavors.every(
              (pizzaFlavor) =>
                cartItem.details.flavors?.some(
                  (elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code
                )
            )
            const verificationTwo = cartItem.details.flavors?.every(
              (pizzaFlavor) =>
                pizza?.details.flavors?.some(
                  (elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code
                )
            )

            const implementations = pizza?.details.implementations?.every(
              (pizzaImplementation) =>
                cartItem.details?.implementations.some(
                  (elPizzaImplementation) =>
                    elPizzaImplementation.code === pizzaImplementation.code
                )
            )
            if (
              verificationOne &&
              verificationTwo &&
              implementations &&
              pizza
            ) {
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
      taxIfood: 0,
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
          addon: {
            status: true,
            type: 'fee',
            valueType: 'percentage',
            value: 10,
          },
        },
      ],
      print: 1,
      tentatives: 0,
      total: 164.5,
      controls: {
        grovenfe: {
          fiscal_note: {},
        },
      },
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
                image:
                  'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
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
                image:
                  'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                status: true,
                values: {
                  Broto: 22,
                  Grande: 44,
                },
                complements: [],
                description:
                  'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                image:
                  'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                status: true,
                values: {
                  Broto: 22,
                  Grande: 44,
                },
                complements: [],
                description:
                  'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
                valuesTable: {
                  Broto: 22,
                  Grande: 44,
                },
                implementations: [],
              },
              {
                code: '53e5e0',
                name: 'Atum',
                image:
                  'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/53e5e0/4.jpg',
                      status: true,
                      values: {
                        Broto: 15,
                        Grande: 30,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, atum, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0b3c5/4.jpeg',
                      status: true,
                      values: {
                        Broto: 22,
                        Grande: 44,
                      },
                      schedule: {
                        type: 0,
                      },
                      complements: [],
                      description:
                        'Molho, mussarela, frango, catupiry original, orégano e azeitonas',
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
                      image:
                        'https://s3.us-west-2.amazonaws.com/whatsmenu/production/restaurantbrazil/pizza-products/a0dbd2/4.jpeg',
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
      sendMB: false,
    }

    return new Cart(cartPrintTest)
  }

  /**
   * Creates a Cart instance from an Ifood order and a profile.
   *
   * @param {IfoodOrderType} order - The Ifood order object
   * @param {Profile | ProfileType} profile - The profile associated with the order
   * @return {Cart} A new Cart instance created from the Ifood order and profile
   */
  static fromIfood({
    order,
    profile,
  }: {
    order: IfoodOrderType
    profile: Profile | ProfileType
  }): Cart {
    let type
    let address
    let taxIfood = 0
    let cupom
    let status
    if (order.orderTiming === 'IMMEDIATE' || order.orderType === 'TAKEOUT') {
      type = 'D'
    }

    if (order.orderTiming === 'SCHEDULED') {
      type = 'P'
    }

    if (order.orderType === 'TAKEOUT') {
      address = null
    }

    if (order.orderType === 'DELIVERY') {
      address = {
        city: order.delivery.deliveryAddress.city,
        neighborhood: order.delivery.deliveryAddress.neighborhood,
        street: order.delivery.deliveryAddress.streetName,
        number: order.delivery.deliveryAddress.streetNumber,
        complement: order.delivery.deliveryAddress.complement,
        reference: order.delivery.deliveryAddress.reference,
        zipcode: order.delivery.deliveryAddress.postalCode,
        latitude: order.delivery.deliveryAddress.coordinates.latitude,
        longitude: order.delivery.deliveryAddress.coordinates.longitude,
        uf: order.delivery.deliveryAddress.state,
      }
    }

    if (order.total.additionalFees) {
      taxIfood = order.total.additionalFees
    }

    if (order.total.benefits) {
      cupom = {
        value: order.total.benefits,
        type: 'value',
      } as CupomType
    }

    switch (order.orderStatus) {
      case 'PREPARATION_STARTED':
        status = 'production'
        break
      case 'CONCLUDED':
      case 'DISPATCHED':
      case 'READY_TO_PICKUP':
        status = 'transport'
        break
      case 'CANCELLED':
        status = 'canceled'
        break
      default:
        status = null
        break
    }

    const ifoodCart: CartType = {
      id: order.id,
      orderId: order.orderId,
      origin: 'ifood',
      ifoodStatus: order.orderStatus,
      ifoodAditionalInfo: order.additionalInfo,
      obs: order.extraInfo,
      address: address,
      print: order.additionalInfo?.print || 0 || 1,
      profileId: profile.id,
      code: order.displayId,
      taxIfood: taxIfood,
      cupom: cupom,
      client: {
        name: order.customer.name,
        whatsapp: order.customer.phone.number,
        codeLocalizer: order.customer.phone.localizer,
      },
      clientId: 999,
      secretNumber: order.customer.secretNumber
        ? order.customer.secretNumber
        : null,
      status: status as CartType['status'],
      type: type as CartType['type'],
      taxDelivery: order.total.deliveryFee,
      timeDelivery: order.delivery ? order.delivery.deliveryDateTime : '0',
      formsPayment: order.payments[0].methods.map(
        (formPayment: any, index: number) => {
          let payment: string
          let label: string
          switch (formPayment.method) {
            case 'CASH':
              payment = 'money'
              label = 'Dinheiro'
              break
            case 'CREDIT':
              payment = 'credit'
              label = 'Crédito'
              break
            case 'DEBIT':
              payment = 'debit'
              label = 'Débito'
              break
            case 'MEAL_VOUCHER':
              payment = 'snack'
              label = 'Vale Refeição'
              break
            case `FOOD_VOUCHER`:
              payment = 'food'
              label = 'Vale Alimentação'
              break
            case 'GIFT_CARD':
              payment = 'gift_card'
              label = 'Gift Card'
              break
            case 'DIGITAL_WALLET':
              payment = 'digital_wallet'
              label = 'Carteira Digital'
            case 'PIX':
              payment = 'pix'
              label = 'Pix'
              break
            default:
              payment = 'others'
              label = 'Outros'
          }
          return {
            flag: formPayment.card?.brand ?? null,
            change: formPayment.cash ? formPayment.cash?.changeFor : null,
            label: label,
            value: formPayment.value,
            payment,
          } as CartType['formsPayment'][0]
        }
      ),
      tentatives: 0,
      total: order.total.subTotal,
      controls: {
        pickupCode: order.delivery ? order.delivery.pickupCode : null,
      },
      statusPayment: order.payments[0].methods.some(
        (method: any) => method.type === 'OFFLINE'
      )
        ? 'offline'
        : 'paid',
      packageDate:
        DateTime.fromISO(order.additionalInfo?.schedule?.deliveryDateTimeEnd!, {
          zone: profile.timeZone,
        }) || null,
      created_at: DateTime.fromISO(order.createdAt).toSQL() as string,
      updated_at: order.updatedAt,
      itens: order.itens.map((item) => ({
        cartId: order.id,
        controls: {},
        created_at: DateTime.fromISO(item.createdAt).toSQL() as string,
        updated_at: DateTime.fromISO(item.updatedAt).toSQL() as string,
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        productId: item.uniqueId,
        pizzaId: null,
        type: 'default',
        obs: item.observations || '',
        details: {
          complements:
            item.complements?.reduce((acc: any, complement: any) => {
              if (!complement.groupName) {
                complement.groupName = 'Complementos'
              }
              const repeatedGroup = acc.findIndex(
                (group: any) => group.name === complement.groupName
              )
              if (repeatedGroup !== -1) {
                acc[repeatedGroup].itens.push({
                  name: complement.name,
                  quantity: complement.quantity,
                  value: complement.unitPrice,
                  status: true,
                })
              } else {
                acc.push({
                  name: complement.groupName,
                  type: 'default',
                  itens: [
                    {
                      name: complement.name,
                      quantity: complement.quantity,
                      value: complement.unitPrice,
                      status: true,
                    },
                  ],
                })
              }
              return acc
            }, []) ?? [],
          flavors: [],
          implementations: [],
          value: item.unitPrice,
        },
      })),
    }
    return new Cart(ifoodCart)
  }
}
