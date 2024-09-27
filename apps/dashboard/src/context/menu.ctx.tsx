import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSession } from 'next-auth/react'
import Complement from '../types/complements'
import PizzaProduct, {
  PizzaFlavorType,
  PizzaImplementationType,
  PizzaSizeType,
} from '../types/pizza-product'
import Product, { ProductType } from '../types/product'
import { ProductModal } from '../components/Modals/Menu/Product'
import { PizzaSize } from '../components/Modals/Menu/PizzaSize'
import { PizzaImplementation } from '../components/Modals/Menu/PizzaImplementation'
import { PizzaFlavorModal } from '../components/Modals/Menu/PizzaFlavor'
import { MenuReorder } from '../components/Modals/Menu/Reorder'
import { AppContext } from './app.ctx'
import Category, { CategoryType } from '../types/category'
import { CategoryModal } from '../components/Modals/Menu/Category'
import { PizzaComplement } from '../components/Modals/Menu/PizzaComplement'
import { CartsContext } from './cart.ctx'
import { apiRoute } from '@utils/wm-functions'
import axios from 'axios'

interface IMenu {
  categories: Category[]
  allComplements: Complement[]
}

interface MenuProviderProps {
  children: ReactNode
  props: IMenu
}

interface MenuContextData {
  typeModal: 'create' | 'update'
  categories: Category[]
  setCategories: Dispatch<SetStateAction<Category[]>>
  category: Category
  setCategory: Dispatch<SetStateAction<Category>>
  products: Product[]
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
  productComplements: Complement[]
  pizzaComplements: Complement[]
  focusId?: number
  setSize: Dispatch<SetStateAction<PizzaSizeType>>
  setImplementation: Dispatch<SetStateAction<PizzaImplementationType>>
  setFlavor: Dispatch<SetStateAction<PizzaFlavorType>>
  setFocusId: Dispatch<SetStateAction<number | undefined>>
  componentIsLinked: ({ complementId }: { complementId?: number }) => boolean
  handleMenuModal(
    show: boolean,
    modal:
      | 'category'
      | 'product'
      | 'pizzaSize'
      | 'pizzaImplementation'
      | 'pizzaComplement'
      | 'pizzaFlavor'
      | 'reorder',
    type?: 'create' | 'update',
    tab?: string
  ): void
  updateProduct({ newProduct }: { newProduct: ProductType }): void
}

export const MenuContext = createContext<MenuContextData>({} as MenuContextData)

export function MenuProvider({
  children,
  props: { allComplements, categories: propsCategories },
}: MenuProviderProps) {
  const { profile } = useContext(AppContext)
  const { cartEvents } = useContext(CartsContext)
  const { data: session } = useSession()

  const [categories, setCategories] = useState<Category[]>(propsCategories)
  const [category, setCategory] = useState<Category>(
    Category.newCategory(profile)
  )
  const [products, setProducts] = useState<Product[]>([])
  const [product, setProduct] = useState<Product>(Product.newProduct(category))
  const [productComplements, setProductComplements] = useState<Complement[]>([])
  const [pizzaComplements, setPizzaComplements] = useState<Complement[]>([])

  const [size, setSize] = useState<PizzaSizeType>(PizzaProduct.newSize())

  const [implementation, setImplementation] = useState<PizzaImplementationType>(
    PizzaProduct.newImplementation()
  )
  const [flavor, setFlavor] = useState<PizzaFlavorType>(
    PizzaProduct.newFlavor(category.product?.sizes || [])
  )
  const [typeModal, setTypeModal] = useState<'create' | 'update'>('create')
  const [tabModal, setTabModal] = useState('details')
  const [showMenuModal, setShowMenuModal] = useState({
    category: false,
    product: false,
    pizzaSize: false,
    pizzaImplementation: false,
    pizzaComplement: false,
    pizzaFlavor: false,
    reorder: false,
  })
  const [focusId, setFocusId] = useState<number>()

  const getMenu = useCallback(async () => {
    try {
      const { data } = await apiRoute('/dashboard/api/menu', session)
      setCategories(
        data.categories.map((category: CategoryType) => new Category(category))
      )
    } catch (error) {
      console.error(error)
    }
  }, [session])

  const componentIsLinked = ({ complementId }: { complementId?: number }) => {
    if (!complementId) {
      return false
    }
    return products.filter((p) => p.id !== product.id).flatMap((product) => product.complements).some(c => c.pivot?.complementId === complementId)
  }

  const updateProduct = ({ newProduct }: { newProduct: ProductType }) => {
    setCategories((state) => {
      const oldProduct = state.filter(c => c.type === 'default').flatMap(c => c.products).find(p => p!.id === newProduct.id)
      if (oldProduct?.categoryId !== newProduct.categoryId) {
        state.map(c => {
          if (c.id === oldProduct?.categoryId) {
            c.products = c.products!.filter(p => p!.id !== newProduct.id)
          }
          if (c.id === newProduct.categoryId) {
            c.products?.push(new Product(newProduct))
          }
        })
      } else {
        state.map(c => {
          if (c.id === newProduct.categoryId) {
            c.products?.map(p => {
              if (p!.id === newProduct.id) {
                p = new Product(newProduct)
              }
            })
          }
        })
      }
      return state
    })
    setProduct(new Product(newProduct))
  }

  useEffect(() => {
    setProducts(categories.flatMap((cat) => cat.getAllProducts()))
    // setProduct((state) => {
    //   const productUpdated = categories
    //     .flatMap((cat) => cat.getAllProducts())
    //     .find((p) => p.id === state.id)
    //   if (productUpdated) {
    //     return productUpdated
    //   }
    //   return state
    // })
    setProductComplements(
      categories.flatMap((cat) => cat.getAllProductsComplements())
    )
    setPizzaComplements(
      categories.flatMap((cat) => {
        if (cat.product) {
          return cat.product.complements
        }
        return []
      })
    )
  }, [categories])

  useEffect(() => {
    if (!cartEvents.eventNames().includes('newCart')) {
      cartEvents.on('newCart', () => {
        getMenu()
      })
    }
    return () => {
      cartEvents.removeAllListeners()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMenuModal = (
    show: boolean,
    modal:
      | 'category'
      | 'product'
      | 'pizzaSize'
      | 'pizzaImplementation'
      | 'pizzaComplement'
      | 'pizzaFlavor'
      | 'reorder',
    type?: 'create' | 'update',
    tab?: string
  ) => {
    if (type) {
      setTypeModal(type)
    }
    if (tab) {
      setTabModal(tab)
    }
    setTimeout(() => {
      setShowMenuModal({ ...showMenuModal, [modal]: show })
    }, 10)
  }

  return (
    <MenuContext.Provider
      value={{
        categories,
        category,
        productComplements,
        pizzaComplements,
        handleMenuModal,
        product,
        products,
        setCategories,
        setCategory,
        setProduct,
        setFlavor,
        setImplementation,
        setSize,
        typeModal,
        focusId,
        setFocusId,
        componentIsLinked,
        updateProduct
      }}
    >
      {children}
      <section id="modals">
        {categories && category && (
          <>
            <CategoryModal
              show={showMenuModal.category}
              handleClose={() => {
                handleMenuModal(false, 'category')
                setCategory(Category.newCategory(profile, 'default'))
              }}
              type={typeModal}
            />

            <ProductModal
              show={showMenuModal.product}
              handleClose={() => {
                handleMenuModal(false, 'product')
                setCategory(Category.newCategory(profile, 'default'))
              }}
              type={typeModal}
            />

            <PizzaSize
              show={showMenuModal.pizzaSize}
              handleClose={() => {
                handleMenuModal(false, 'pizzaSize')
                setTimeout(() => {
                  setSize(PizzaProduct.newSize())
                }, 150)
                setTabModal('details')
              }}
              type={typeModal}
              size={size}
              tab={tabModal as 'details' | 'covers'}
              category={category}
              setCategory={setCategory}
            />
            {implementation && (
              <PizzaImplementation
                show={showMenuModal.pizzaImplementation}
                handleClose={() => {
                  handleMenuModal(false, 'pizzaImplementation')
                  setImplementation(PizzaProduct.newImplementation())
                  setCategory(Category.newCategory(profile, 'default'))
                }}
                type={typeModal}
                implementation={implementation}
                category={category}
                setCategory={setCategory}
                setImplementation={setImplementation}
              />
            )}
            {category.product ? (
              <PizzaComplement
                show={showMenuModal.pizzaComplement}
                handleClose={() => {
                  handleMenuModal(false, 'pizzaComplement')
                  setImplementation(PizzaProduct.newImplementation())
                  setCategory(Category.newCategory(profile, 'default'))
                }}
                type={'update'}
                category={category}
                setCategory={setCategory}
              />
            ) : null}
            <PizzaFlavorModal
              show={showMenuModal.pizzaFlavor}
              handleClose={() => {
                setFlavor(PizzaProduct.newFlavor(category.product?.sizes || []))
                handleMenuModal(false, 'pizzaFlavor')
                setCategory(Category.newCategory(profile, 'default'))
              }}
              type={typeModal}
              flavor={flavor}
              sizes={category?.product?.sizes || []}
              categories={categories}
              category={category}
            />
          </>
        )}
        {showMenuModal.reorder && (
          <MenuReorder
            show={showMenuModal.reorder}
            onHide={() => handleMenuModal(false, 'reorder')}
          />
        )}
      </section>
    </MenuContext.Provider>
  )
}
