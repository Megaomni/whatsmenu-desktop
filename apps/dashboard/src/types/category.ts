import { Dispatch } from 'react'
import { SetStateAction } from 'react'
import { apiRoute, copy } from './../utils/wm-functions'
import { Session } from 'next-auth'
import Profile from '../types/profile'
import Week, { WeekType } from '../types/dates'
import PizzaProduct, { PizzaProductType } from './pizza-product'
import Product, { ProductType } from './product'

type OrderItems = {
  name?: string
  categoryId?: number
  productId?: number
  complementId?: number
  order?: any[]
}

export interface CategoryType {
  id?: number
  profileId: number
  name: string
  order: number
  status: boolean
  type: 'default' | 'pizza'
  disponibility: {
    store: {
      delivery: boolean
      table: boolean
      package: boolean
    }
  }
  options: {
    week?: WeekType
    [key: string]: any
  }
  products?: Product[]
  product?: PizzaProduct
  created_at?: string
  updated_at?: string
}

type CategoryAPI = {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'STATUS'
  session: Session | null
  data?: any
  category: Category
  categories?: Category[]
  setCategories?: Dispatch<SetStateAction<Category[]>>
}

/** Classe para gerar as instâncias das categorias */
export default class Category {
  [key: string]: any
  id?: number
  profileId: number
  name: string
  order: number
  status: boolean
  type: 'default' | 'pizza'
  disponibility: {
    store: {
      delivery: boolean
      table: boolean
      package: boolean
    }
  }
  options: {
    week?: WeekType
    [key: string]: any
  }
  products?: Product[]
  product?: PizzaProduct
  created_at?: string
  updated_at?: string

  constructor({
    id,
    profileId,
    name,
    order,
    status,
    type,
    disponibility,
    options,
    products,
    product,
    created_at,
    updated_at,
  }: CategoryType) {
    this.id = Number(id)
    ;(this.profileId = profileId), (this.name = name.trim())
    this.order = Number(order) || 0
    this.status = status
    this.type = type
    this.disponibility = disponibility
    this.options = options
    this.products = products
    this.product = product
    this.created_at = created_at
    this.updated_at = updated_at

    if (products && this.type === 'default') {
      this.products = products?.map((prod) => {
        return new Product(prod, this)
      })
    }

    if (product && this.type === 'pizza') {
      this.product = new PizzaProduct(product)
    }

    if (options && this.options.week) {
      this.options.week = new Week(this.options.week)
    }
  }

  /** Retorna todos os complementos dos produtos da  categoria */
  public getAllProductsComplements() {
    if (this.products) {
      return this.products.flatMap((prod) => prod.getAllComplements())
    }

    return []
  }

  /** Pega todos os produtos da categoria */
  public getAllProducts() {
    if (this.products) {
      return this.products.flat()
    }

    return []
  }

  /** Gera instâncias para os próprios produtos */
  public setProductsIntance() {
    if (this.type === 'default') {
      this.products = this.products?.map((prod) => {
        return new Product(prod, this)
      })
    }
  }

  /** Remove a instância de todos os produtos da categoria e retorna */
  public returnProdNoInstaced() {
    if (this.type === 'default') {
      return this.products?.map((prod) => Product.removeInstance(prod)) || []
    } else if (this.product) {
      return PizzaProduct.removeInstance(this.product)
    }
  }

  /** API da categoria, usada para CREATE, UPDATE, DELETE, DUPLICATE e STATUS da categoria */
  static async API({
    type,
    session,
    data,
    category,
    categories,
    setCategories,
  }: CategoryAPI) {
    try {
      const { route, method } = this.getRouteAPI(
        type,
        category.type,
        category.id
      )

      if (type === 'CREATE') {
        data = {
          name: category.name,
          type: category.type,
          options: category.options,
          disponibility: category.disponibility,
        }
      }

      const { data: dataCategory } = await apiRoute(
        route,
        session,
        method,
        data
      )

      if (typeof dataCategory.disponibility === 'string') {
        dataCategory.disponibility = JSON.parse(dataCategory.disponibility)
      }

      if (typeof dataCategory.options === 'string') {
        dataCategory.options = JSON.parse(dataCategory.options)
      }

      switch (type) {
        case 'CREATE':
        case 'DUPLICATE':
          const newCategory = new Category(dataCategory)
          // this.remapCategory(dataCategory, newCategory);
          if (categories && setCategories) {
            categories.push(newCategory)
            setCategories([...categories])
          }
          return newCategory
        case 'DELETE':
          categories = categories
            ?.filter((cat) => cat.id !== parseInt(dataCategory.id))
            .map((cat, index) => {
              cat.order = index
              return cat
            })
        case 'UPDATE':
        case 'STATUS':
          // this.remapCategory(dataCategory, category);
          category.id = dataCategory.id
          category.name = dataCategory.name
          category.disponibility = dataCategory.disponibility
          if (category.product) {
            category.product.amount = dataCategory.product?.amount
            category.product.amount_alert = dataCategory.product?.amount_alert
            category.product.bypass_amount = dataCategory.product?.bypass_amount
          }
          category.status = dataCategory.status
          category.options = dataCategory.options
          category.order = dataCategory.order
          category.type = dataCategory.type
          category.updated_at = dataCategory.updated_at
          category.created_at = dataCategory.created_at
          break
      }

      if (categories && setCategories) {
        setCategories([...categories])
      }

      return category
    } catch (error) {
      throw error
    }
  }

  /** Função usada para criar os produtos e os sabores em massa */
  static async createMassiveAPI(
    body: any,
    session: Session | null,
    category: Category
  ) {
    try {
      const { data: products } = await apiRoute(
        '/dashboard/menu/product/register/massive',
        session,
        'POST',
        body,
        {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${session?.accessToken}`,
        }
      )

      if (category.products) {
        products.map((prod: any) => {
          if (prod.disponibility === 'string') {
            prod.disponibility = copy(prod.disponibility, 'parse')
          }
          category.products?.push(new Product(prod, category))
        })
      }
    } catch (error) {
      throw error
    }
  }

  /** Função que atualiza os produtos e os sabores em massa */
  static async updateMassiveAPI(
    type: 'flavors' | 'products',
    session: Session | null,
    {
      categoryMap,
      arrUpdate,
      imagesMassive,
      categories,
      setCategories,
    }: {
      categoryMap: Category
      arrUpdate: any[]
      imagesMassive: { id: number | string; image: Blob }[]
      categories: Category[]
      setCategories: Dispatch<SetStateAction<Category[]>>
    }
  ) {
    try {
      arrUpdate = arrUpdate.filter((item) => {
        return type === 'flavors' ? item.code : item.id
      })

      const formData = new FormData()

      formData.append('categoryId', copy(categoryMap.id, 'json'))
      imagesMassive.forEach((prod) => {
        formData.append(`image_${prod.id}`, prod.image)
      })

      if (type === 'products') {
        formData.append('products', copy(arrUpdate, 'json'))

        const { data: products } = await apiRoute(
          '/dashboard/menu/product/updateMassive',
          session,
          'PATCH',
          formData,
          {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session?.accessToken}`,
          }
        )

        if (categoryMap.products) {
          products.forEach((dataProduct: ProductType) => {
            const product = categoryMap.products?.find(
              (prod) => dataProduct.id === prod.id
            )
            if (product) {
              product.name = dataProduct.name
              product.value = Number(dataProduct.value)
              product.valueTable = Number(dataProduct.valueTable)
              product.promoteValue = Number(dataProduct.promoteValue)
              product.promoteValueTable = Number(dataProduct.promoteValueTable)
              product.image = dataProduct.image
              product.amount = dataProduct.amount
            }
          })
        }
      }

      if (type === 'flavors') {
        formData.append('pizzaId', copy(categoryMap.product?.id, 'json'))
        formData.append('flavors', copy(arrUpdate, 'json'))

        const { data: pizza } = await apiRoute(
          '/dashboard/menu/product/pizza/updFlavorMassive',
          session,
          'PATCH',
          formData,
          {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session?.accessToken}`,
          }
        )

        if (categoryMap.product) {
          categoryMap.product.flavors = pizza.flavors
        }
      }

      setCategories([...categories])

      return categoryMap
    } catch (error) {
      throw error
    }
  }

  /** Função usada para gerar a rota de API para CREATE, UPDATE, DELETE, DUPLICATE e STATUS da cateoria*/
  static getRouteAPI(
    type: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'STATUS',
    typeCategory: 'default' | 'pizza',
    id?: number
  ) {
    let route = `${'/dashboard/menu/category'}`
    let method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST'

    switch (type) {
      case 'CREATE':
        route = `${route}/register`
        break
      case 'UPDATE':
        route = `${route}/${id}/update`
        method = 'PATCH'
        break
      case 'DELETE':
        route = `${route}/${id}/delete`
        method = 'DELETE'
        break
      case 'DUPLICATE':
        if (typeCategory === 'default') {
          route = `${route}/${id}/duplicate`
        } else {
          route = `${route}Pizza/${id}/duplicate`
        }
        break
      case 'STATUS':
        route = `${route}/${id}/playpause`
        break
    }

    return {
      route,
      method,
    }
  }

  //** Função usada para remover a instancia de uma categoria, retorna uma nova categoria */
  static removeCategoryInstance(
    cat: Category,
    callBack?: (...args: any) => any
  ) {
    const newCategory: CategoryType = {
      id: cat.id,
      name: cat.name,
      options: cat.options,
      disponibility: cat.disponibility,
      profileId: cat.profileId,
      status: cat.status,
      type: cat.type,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      order: cat.order,
    }

    if (cat.type === 'default') {
      newCategory.products = cat.returnProdNoInstaced() as Product[]
    } else {
      newCategory.product = cat.returnProdNoInstaced() as PizzaProduct
    }

    callBack && callBack(newCategory)

    return newCategory
  }

  //* Gera uma nova categoria, para usar no state de app context */
  static newCategory(
    profile: Profile,
    type: 'default' | 'pizza' = 'default',
    categories: Category[] = []
  ) {
    return new Category({
      id: undefined,
      profileId: profile?.id,
      name: '',
      status: true,
      type,
      order: categories?.length ?? 0,
      disponibility: {
        store: {
          delivery: true,
          table: true,
          package: true,
        },
      },
      options: {
        week: new Week(),
      },
      products: [],
      product: undefined,
      created_at: '',
      updated_at: '',
    })
  }

  /** Remapeia as propriedades da categoria, forçando a criação das instâncias */
  static remapCategory(dataCategory: any, cat: Category) {
    for (let [key, values] of Object.entries(dataCategory)) {
      if (key === 'products') {
        values = (values as Product[])?.map((prod) => new Product(prod))
      }

      if (key === 'options') {
        values = {
          week: new Week((values as any).week as WeekType),
        }
      }

      if (key === 'product' && values) {
        values = new PizzaProduct(values as PizzaProduct)
      }

      cat[key] = values as any
    }
  }

  static async orderItem(
    body: OrderItems,
    session: Session | null,
    type:
      | string
      | 'category'
      | 'product'
      | 'complement'
      | 'complement/itens'
      | 'size'
      | 'implementation'
      | 'flavor',
    product: boolean = false
  ) {
    try {
      const { data } = await apiRoute(
        `/dashboard/menu/${product ? 'product/pizza/' : ''}${type}/reorder`,
        session,
        'PATCH',
        body
      )

      return type
    } catch (error) {
      throw error
    }
  }
}
