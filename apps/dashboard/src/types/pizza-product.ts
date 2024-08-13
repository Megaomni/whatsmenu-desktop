import { apiRoute, hash, copy } from './../utils/wm-functions'
import { Session } from 'next-auth'
import { Console } from 'console'
import { Dispatch, SetStateAction } from 'react'
import Category from './category'
import Complement, { ComplementType } from './complements'

//** Inteface padrão do produto de pizza */
export interface PizzaProductType {
  id: number
  amount: number | null
  amount_alert: number | null
  bypass_amount: boolean | null
  status: boolean | number
  sizes: PizzaSizeType[]
  size?: string
  implementations: PizzaImplementationType[]
  flavors: PizzaFlavorType[]
  complements: Complement[]
}

/** Types para os parametros da função de API */
type PizzaAPI2 = {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'STATUS'
  property: 'size' | 'flavor' | 'implementation' | 'complements' | 'amount'
  session: Session | null
  body?: any
  product: PizzaProduct
  itemCode?: string
  name?: string
  items?: {
    implementation?: PizzaImplementationType
    size?: PizzaSizeType
    flavor?: PizzaFlavorType
  }
  categories?: Category[]
  setCategories?: Dispatch<SetStateAction<Category[]>>
}

/** Classe para gerar a instância dos produtos */
export default class PizzaProduct {
  id: number
  amount: number | null
  amount_alert: number | null
  bypass_amount: boolean | null
  status: boolean | number
  sizes: PizzaSizeType[]
  size?: string
  implementations: PizzaImplementationType[]
  flavors: PizzaFlavorType[]
  complements: Complement[]
  private basicPizzaUrl: string = '/dashboard/menu/product/pizza'

  constructor({
    id,
    amount,
    amount_alert,
    bypass_amount,
    status,
    sizes,
    size,
    implementations,
    flavors,
    complements,
  }: PizzaProductType) {
    this.id = id
    this.status = status
    this.sizes = sizes
    this.size = size
    this.amount = amount
    this.amount_alert = amount_alert
    this.bypass_amount = bypass_amount
    this.implementations = implementations
    this.flavors = flavors
    this.complements = complements
      ? complements.map((c) => new Complement(c))
      : []

    this.flavors.forEach((flavor) => {
      if (!flavor.name) {
        flavor.name = ''
      }

      for (const [key, value] of Object.entries(flavor.values)) {
        if (!Number(flavor.values[key])) {
          flavor.values[key] = 0
        }
      }

      for (const [key, value] of Object.entries(flavor.valuesTable)) {
        if (!Number(flavor.valuesTable[key])) {
          flavor.valuesTable[key] = 0
        }
      }
    })
  }

  /** API dos produtos de pizza, CREATE, UPDATE, DELETE, DUPLICATE e STATUS */
  static async API({
    type,
    property,
    product,
    items,
    itemCode,
    session,
    body,
    categories,
    setCategories,
    name,
  }: PizzaAPI2) {
    try {
      const { urlAPI, method } = this.getAPIUrl(
        type,
        property,
        product.id,
        itemCode
      )

      const { data: pizza }: { data: PizzaProductType } =
        type !== 'CREATE' && type !== 'UPDATE' && property !== 'implementation'
          ? await apiRoute(urlAPI, session, method, body)
          : await apiRoute(urlAPI, session, method, body, {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${session?.accessToken}`,
            })

      switch (property) {
        case 'size':
          product.sizes = this.parseProperty(pizza.sizes)
          product.flavors = this.parseProperty(pizza.flavors)
          break
        case 'amount':
          product.amount = this.parseProperty(pizza.amount)
        case 'implementation':
          product.implementations = this.parseProperty(pizza.implementations)
          break
        case 'flavor':
          product.flavors = this.parseProperty(pizza.flavors)
          break
        case 'complements':
          product.complements = this.parseProperty(
            pizza.complements.map((c) => new Complement(c))
          )
          break
      }

      if (categories && setCategories) {
        setCategories([...categories])
      }

      switch (property) {
        case 'complements':
          return (product[`${property}`] as any[]).find(
            (el) => el.code === itemCode
          )
        case 'amount':
          return product[`${property}`] as any
        default:
          return (product[`${property}s`] as any[]).find(
            (el) => el.code === itemCode
          )
      }
    } catch (error) {
      throw error
    }
  }

  /** Gera a rota para API de acordo com os metódos de requisição, para os produtos pizzas */
  static getAPIUrl(
    type: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'STATUS',
    property: 'size' | 'flavor' | 'implementation' | 'complements' | 'amount',
    id: number,
    code?: string
  ) {
    let urlAPI = `/dashboard/menu/product/pizza`
    let method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST'

    switch (type) {
      case 'CREATE':
        urlAPI = `${urlAPI}/${id}/add${property}`
        break
      case 'UPDATE':
        urlAPI = `${urlAPI}/${id}/upd${property}/${property === 'complements' || !code ? '' : code}`

        method = 'PATCH'
        break
      case 'DELETE':
        urlAPI = `${urlAPI}/${id}/${property}/${code}/delete`
        method = 'DELETE'
        break
      case 'STATUS':
        urlAPI = `${urlAPI}/${id}/${property}/${code}`
        method = 'PATCH'
        break
    }

    return {
      urlAPI,
      method,
    }
  }

  //Static Functions

  /** Gera um novo tamanho */
  static newSize() {
    const size: PizzaSizeType = {
      code: hash(),
      covers: [],
      flavors: [1, 2],
      name: '',
      status: true,
    }

    return size
  }

  /** Gera uma nova implementação */
  static newImplementation() {
    const implementation: PizzaImplementationType = {
      code: hash(),
      name: '',
      status: true,
      value: 0,
    }

    return implementation
  }

  /** Gera um novo sabor  */
  static newFlavor(sizes: PizzaSizeType[]) {
    const values: any = {}
    const valuesTable: any = {}

    for (const size of sizes) {
      values[size.name] = '0'
      valuesTable[size.name] = '0'
    }

    const flavor: PizzaFlavorType = {
      code: hash(),
      name: '',
      description: '',
      image: '',
      status: true,
      values: values,
      valuesTable: valuesTable,
    }
    return flavor
  }

  /** Função usada para parsear as propriedades, usada com frequência no retorno de API */
  static parseProperty(property: any) {
    if (typeof property === 'string') {
      return JSON.parse(property)
    }

    return property
  }

  /** Remove a instância do produto de pizza */
  static removeInstance(pizzaProduct: PizzaProduct) {
    return {
      id: pizzaProduct.id,
      status: pizzaProduct.status,
      sizes: pizzaProduct.sizes,
      size: pizzaProduct.size,
      implementations: pizzaProduct.implementations,
      flavors: pizzaProduct.flavors,
    }
  }

  /** Retorna todos complementos da pizza */
  public getAllComplements() {
    return this.complements.flatMap((compl) => compl)
  }
}

/** Interface padrão do tipo de tamanho de pizza */
export interface PizzaSizeType {
  code: string
  name: string
  status: boolean
  flavors: number[]
  covers: string[]
}

/** Interface padrão do tipo de implementação de pizza  */
export interface PizzaImplementationType {
  code: string
  name: string
  value: number
  status: boolean
}

/** interface padrão do tipo de sabores de pizza */
export interface PizzaFlavorType {
  code: string
  amount?: number
  amount_alert?: number
  bypass_amount?: boolean
  name: string
  description: string
  image: string
  status: boolean
  complements?: ComplementType[]
  implementations?: PizzaImplementationType[]
  values: {
    [key: string]: number | string
  }
  valuesTable: {
    [key: string]: number | string
  }
  // category?: Category;
}

export class Flavor {
  // code: string;
  // name: string;
  // description: string;
  // image: string;
  // status: boolean;
  // values: {
  //   [key: string]: string;
  // };
  // valuesTable: {
  //   [key: string]: string;
  // };

  constructor({
    code,
    name,
    description,
    image,
    status,
    values,
    valuesTable,
  }: PizzaFlavorType) {}
}
