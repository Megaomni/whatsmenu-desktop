import { hash } from './utils/hash'
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
  ncm_code?: string
  cfop?: string
  csosn?: string
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
  ncm_code?: string
  cfop?: string
  csosn?: string

  constructor({ id, amount, amount_alert, bypass_amount, status, sizes, size, implementations, flavors, complements, ncm_code, cfop, csosn }: PizzaProductType) {
    this.id = id
    this.status = status
    this.sizes = sizes
    this.size = size
    this.amount = amount
    this.amount_alert = amount_alert
    this.bypass_amount = bypass_amount
    this.implementations = implementations
    this.flavors = flavors
    this.complements = complements ? complements.map((c) => new Complement(c)) : []
    this.ncm_code = ncm_code
    this.cfop = cfop
    this.csosn = csosn
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

  constructor({ code, name, description, image, status, values, valuesTable }: PizzaFlavorType) { }
}
