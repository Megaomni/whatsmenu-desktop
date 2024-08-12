import { Session } from 'next-auth'
import Category from './category'
import Week, { WeekType } from './dates'
import Complement, { ComplementType } from './complements'
import { apiRoute, copy } from '../utils/wm-functions'
import { Dispatch, SetStateAction, useContext } from 'react'
import { AppContext } from '@context/app.ctx'

/** Tipagem da função que auxilia a construção da rota de API */
type ProductAPI = {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS' | 'DUPLICATE'
  session: Session | null
  product: Product | ProductType
  data?: any
  categories?: Category[]
  recicle?: { id: number; link?: boolean }[]
  setCategories?: Dispatch<SetStateAction<Category[]>>
}

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
    this.complements = complements ? complements.map((c) => new Complement(c)) : []
    this.disponibility = disponibility
    this.quantity = quantity
    this.category = category
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
    return this.complements.reduce((total, compl) => (total += compl.getTotal()), 0)
  }

  /** API dos produtos, CREATE, UPDATE, DELETE,  Atualiza os status e duplica o produto. */
  static async API({ type, session, data, product, categories, setCategories }: ProductAPI) {
    try {
      const { category } = product
      const { basicRoute, method } = this.getRouteAPI(type, product.id)

      let { data: responseData } =
        type !== 'CREATE' && type !== 'UPDATE'
          ? await apiRoute(basicRoute, session, method, data)
          : await apiRoute(basicRoute, session, method, data, {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${session?.accessToken}`,
            })

      responseData = new Product(responseData.product || responseData, category)

      if (typeof responseData.disponibility === 'string') {
        responseData.disponibility = JSON.parse(responseData.disponibility)
      }

      if (responseData.complements) {
        responseData.complements = responseData.complements.map((compl: ComplementType) => new Complement(compl))
      }

      if (category && category.products) {
        switch (type) {
          case 'DUPLICATE':
          case 'CREATE':
            category.products.push(responseData)
            break
          case 'DELETE':
            category.products = category.products
              .filter((prod) => {
                return prod.id !== responseData.id
              })
              .map((prod, indexProd) => {
                prod.order = indexProd

                return prod
              })

            break
          case 'UPDATE':
            const products = categories?.flatMap((cat) => cat?.products?.flat()).filter((prod) => prod)
            if (responseData.complements) {
              responseData.complements.forEach((compl: Complement) => {
                const allComplements = products?.flatMap((prod) => prod?.getAllComplements()).filter((compl) => compl)
                if (allComplements) {
                  compl.isLinked(allComplements as Complement[], true)
                }
              })
            }

          case 'STATUS':
            product.id = responseData.id
            product.categoryId = Number(responseData.categoryId)
            product.status = responseData.status
            product.amount = responseData.amount
            product.amount_alert = responseData.amount_alert
            product.bypass_amount = responseData.bypass_amount
            product.order = responseData.order
            product.name = responseData.name
            product.description = responseData.description
            product.value = parseFloat(responseData.value)
            product.valueTable = parseFloat(responseData.valueTable)
            product.promoteValue = parseFloat(responseData.promoteValue)
            product.promoteValueTable = parseFloat(responseData.promoteValueTable)
            product.promoteStatus = responseData.promoteStatus
            product.promoteStatusTable = responseData.promoteStatusTable
            product.image = responseData.image
            product.disponibility = responseData.disponibility
            product.quantity = responseData.quantity

            if (responseData.complements) {
              product.complements = responseData.complements
            }
        }
      }

      if (type !== 'DELETE' && type !== 'STATUS') {
        if (category && categories && product instanceof Product) {
          if (parseInt(responseData.categoryId) !== Number(category.id)) {
            category.products = category.products?.filter((prod) => prod.id !== parseInt(responseData.id))
            const newCategory = categories.find((cat) => cat.id === parseInt(responseData.categoryId))

            if (newCategory) {
              const findProduct = newCategory.products?.find((prod) => prod.id === responseData.id)
              if (!findProduct) {
                product.category = newCategory
                newCategory.products?.push(product)
              }
            }
          }
        }
      }

      if (setCategories && categories) {
        setCategories([...categories.map((cat) => cat)])
      }

      if (type === 'DUPLICATE') {
        return responseData as Product
      }

      return { product, inventory: responseData.inventory || null }
    } catch (error) {
      throw error
    }
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
  static getRouteAPI(type: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS' | 'DUPLICATE', id: number | undefined) {
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
        product.complements = copy(product.complements, 'parse')
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
