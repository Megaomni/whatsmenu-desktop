import Category from './category'
import Complement, { ComplementType } from './complements'
import Week from './dates'

/** Inteface da propriedade disponibility */
export interface DisponibilityType {
  week: Week
  store: {
    delivery: boolean
    table: boolean
    package: boolean
  }
}

/** Interface principal do tipo Produto, necessária para tipar as propriedades da classe Product */
export interface ProductType {
  id?: number
  categoryId?: number
  status: boolean
  amount?: number
  amount_alert?: number
  bypass_amount?: boolean
  order: number
  name: string
  description: string
  value: number
  valueTable: number
  promoteValue: number
  promoteStatus: boolean
  promoteStatusTable: boolean
  promoteValueTable: number
  image: string
  complements: Complement[]
  disponibility: DisponibilityType
  quantity?: number
  category?: Category | null
  ncm_code?: string
  cfop?: string
  csosn?: string
}

/** Classe dos produtos usada para criar instâncias e manter a referência dos produtos nas chamadas API, agilizando o processo de atualização dos estados (REACT). */
export default class Product {
  id?: number
  categoryId?: number
  status: boolean
  amount?: number
  amount_alert?: number
  bypass_amount?: boolean
  order: number
  name: string
  description: string
  value: number
  valueTable: number
  promoteValue: number
  promoteStatus: boolean
  promoteStatusTable: boolean
  promoteValueTable: number
  image: string
  complements: Complement[]
  disponibility: DisponibilityType
  quantity?: number
  category?: Category | null
  ncm_code?: string
  cfop?: string
  csosn?: string
  private basicRoute: string = '/dashboard/menu/product'

  constructor(
    {
      id,
      categoryId,
      status,
      order,
      name,
      description,
      value,
      valueTable,
      amount,
      amount_alert,
      bypass_amount,
      promoteValue,
      promoteValueTable,
      promoteStatus,
      promoteStatusTable,
      image,
      complements,
      disponibility,
      quantity,
      ncm_code,
      cfop,
      csosn,
    }: ProductType,
    category?: Category | null
  ) {
    disponibility.week = new Week(disponibility.week)

    this.id = id
    this.categoryId = categoryId
    this.status = status
    this.amount = amount
    this.amount_alert = amount_alert
    this.bypass_amount = bypass_amount
    this.order = order
    this.name = name
    this.description = description
    this.value = Number(value ?? 0)
    this.valueTable = Number(valueTable ?? 0)
    this.promoteValue = Number(promoteValue ?? 0)
    this.promoteValueTable = Number(promoteValueTable ?? 0)
    this.promoteStatus = promoteStatus
    this.promoteStatusTable = promoteStatusTable
    this.image = image
    this.complements = complements
      ? complements.map((c) => new Complement(c))
      : []
    this.disponibility = disponibility
    this.quantity = quantity
    this.category = category
    this.ncm_code = ncm_code
    this.cfop = cfop
    this.csosn = csosn
  }

  // ----- COMPLEMENTS FUNCTIONS ----

  /**
   * Função que é usada apenas para retornar os complementos do produto
   * @return { Complement[] } Complement Array
   */
  public getAllComplements() {
    return this.complements.flatMap((compl) => compl)
  }

  public getTotalComplements() {
    return this.complements.reduce(
      (total, compl) => (total += compl.getTotal()),
      0
    )
  }

  /** Função para agilizar a criação de um novo produto*/
  static newProduct(category?: Category) {
    return new Product(
      {
        id: undefined,
        categoryId: category?.id,
        order: category?.products?.length ?? 0,
        name: '',
        amount: 0,
        amount_alert: 0,
        bypass_amount: true,
        status: true,
        description: '',
        value: 0,
        valueTable: 0,
        promoteValue: 0,
        promoteValueTable: 0,
        promoteStatus: false,
        promoteStatusTable: false,
        image: '',
        complements: [],
        disponibility: {
          week: new Week(),
          store: {
            delivery: true,
            table: true,
            package: true,
          },
        },
        quantity: undefined,
      },
      category
    )
  }

  /** Função que auxília na construção da rota para cada metódo de requisição para API dos produtos */
  static getRouteAPI(
    type: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS' | 'DUPLICATE',
    id: number | undefined
  ) {
    let basicRoute = '/dashboard/menu/product'
    let method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST'

    switch (type) {
      case 'CREATE':
        basicRoute = `${basicRoute}/register`
        break
      case 'UPDATE':
        basicRoute = `${basicRoute}/${id}/update`
        method = 'PATCH'
        break
      case 'DELETE':
        basicRoute = `${basicRoute}/${id}/delete`
        method = 'DELETE'
        break
      case 'STATUS':
        basicRoute = `${basicRoute}/default/${id}/playpause`
        method = 'PATCH'
        break
      case 'DUPLICATE':
        basicRoute = `${basicRoute}/default/${id}/duplicate`
        break
    }

    return {
      basicRoute,
      method,
    }
  }

  /** Função que remapeia as propriedades do produto, para os tipos correspondentes garantindo que o valor vai ser do mesmo tipo */
  static remapValues(product: Product) {
    product.value = Number(product.value) || 0
    product.amount = Number(product.amount)
    product.valueTable = Number(product.valueTable) || 0
    product.promoteValue = Number(product.promoteValue) || 0
    product.promoteValueTable = Number(product.promoteValueTable) || 0

    if (product.complements) {
      if (typeof product.complements === 'string') {
        product.complements = JSON.parse(JSON.stringify(product.complements))
      }

      product.complements?.forEach((compl) => {
        if (compl.itens) {
          compl.itens.forEach((item) => {
            item.value = Number(item.value) || 0
          })
        }
      })
    }
  }

  /** Remove a instância do produto, caso necessite que use sem instância ou para enviar em uma requisição. */
  static removeInstance(prod: Product, callback?: (...args: any) => any) {
    const product: ProductType = {
      id: prod.id,
      categoryId: prod.categoryId,
      order: prod.order,
      name: prod.name,
      description: prod.description,
      disponibility: prod.disponibility,
      image: prod.image,
      complements: prod.complements,
      promoteStatus: prod.promoteStatus,
      promoteStatusTable: prod.promoteStatusTable,
      value: prod.value,
      valueTable: prod.valueTable,
      promoteValue: prod.promoteValue,
      promoteValueTable: prod.promoteValueTable,
      status: prod.status,
    }

    callback && callback(product)

    return product
  }
}
