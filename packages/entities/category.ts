import Week, { WeekType } from './dates'
import PizzaProduct from './pizza-product'
import Product from './product'
import Profile from './profile'

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

  constructor({ id, profileId, name, order, status, type, disponibility, options, products, product, created_at, updated_at }: CategoryType) {
    this.id = Number(id);
    (this.profileId = profileId), (this.name = name.trim())
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

  //** Função usada para remover a instancia de uma categoria, retorna uma nova categoria */
  static removeCategoryInstance(cat: Category, callBack?: (...args: any) => any) {
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
  static newCategory(profile: Profile, type: 'default' | 'pizza' = 'default', categories: Category[] = []) {
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
}
