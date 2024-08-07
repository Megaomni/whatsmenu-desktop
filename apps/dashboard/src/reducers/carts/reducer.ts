import Cart, { CartType } from '../../types/cart'
import { CartStateActions } from './actions'

export type PackageCartsData = {
  data: Cart[]
  total: number
  page: number
  perPage: number
  lastPage: number
}
export interface CartsState {
  carts: Cart[]
  packageCarts: PackageCartsData | null
}

export const cartsReducer = (state: CartsState, action: any): CartsState => {
  switch (action.type) {
    case CartStateActions.SET_CARTS: {
      return {
        ...state,
        carts: action.payload.carts.map((cart: CartType) => {
          if (cart instanceof Cart) {
            return cart
          }

          return new Cart(cart)
        }),
      }
    }
    case CartStateActions.SET_CART: {
      return {
        ...state,
        carts: state.carts.map((cart: Cart) => {
          if (cart.id === action.payload.cart.id) {
            cart = action.payload.cart
          }
          return cart
        }),
      }
    }
    case CartStateActions.SET_PACKAGE_CARTS: {
      if (!state.packageCarts) {
        return {
          ...state,
          packageCarts: {
            ...action.payload.packageCarts,
            data: action.payload.packageCarts.data.map((cart: CartType) => new Cart(cart)),
          },
        }
      } else {
        return {
          ...state,
          packageCarts: {
            ...action.payload.packageCarts,
            data: state.packageCarts.data.concat(action.payload.packageCarts.data.map((cart: CartType) => new Cart(cart))),
          },
        }
      }
    }
    case CartStateActions.ADD_ITEM_CART: {
      if (state.carts.some((cart) => cart.code === action.payload.cart.code)) {
        return state
      }
      return { ...state, carts: [new Cart(action.payload.cart), ...state.carts] }
    }
    case CartStateActions.ADD_ITEM_PACKAGE_CART: {
      if (state.packageCarts?.data.some((cart) => cart.code === action.payload.packageCart)) {
        return state
      }
      if (state.packageCarts) {
        return {
          ...state,
          packageCarts: {
            ...state.packageCarts,
            data: [new Cart(action.payload.packageCart), ...state.packageCarts.data],
          },
        }
      }
    }
    case CartStateActions.REMOVE_ITEM_CART: {
      return {
        ...state,
        carts: action.payload.carts.filter((cart: CartType) => {
          return cart.id === action.payload.id
        }),
      }
    }
    default:
      return state
  }
}
