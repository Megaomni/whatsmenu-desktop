import Cart, { CartType } from '../../types/cart'
import { PackageCartsData } from './reducer'

export enum CartStateActions {
  SET_CARTS = 'SET_CARTS',
  SET_CART = 'SET_CART',
  SET_PACKAGE_CARTS = 'SET_PACKAGE_CARTS',
  ADD_ITEM_CART = 'ADD_ITEM_CART',
  ADD_ITEM_PACKAGE_CART = 'ADD_ITEM_PACKAGE_CART',
  REMOVE_ITEM_CART = 'REMOVE_ITEM_CART',
}

export const setCartsAction = (carts: CartType[] | Cart[]) => {
  return {
    type: CartStateActions.SET_CARTS,
    payload: {
      carts,
    },
  }
}

export const setCartAction = (cart: CartType | Cart) => {
  return {
    type: CartStateActions.SET_CART,
    payload: {
      cart,
    },
  }
}

export const setPackageCartsAction = (data: PackageCartsData) => {
  return {
    type: CartStateActions.SET_PACKAGE_CARTS,
    payload: {
      packageCarts: data,
    },
  }
}

export const addItemCartAction = (cart: CartType) => {
  return {
    type: CartStateActions.ADD_ITEM_CART,
    payload: {
      cart,
    },
  }
}

export const addItemPackageCart = (cart: CartType) => {
  return {
    type: CartStateActions.ADD_ITEM_PACKAGE_CART,
    payload: {
      packageCart: cart,
    },
  }
}
