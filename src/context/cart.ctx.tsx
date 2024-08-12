import { apiRoute } from '@utils/wm-functions'
import EventEmitter from 'events'
import { Session } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useReducer, useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { Subscription, useWebSocket } from '../hooks/useWebSocket'
import { addItemCartAction, addItemPackageCart, setCartAction, setCartsAction, setPackageCartsAction } from '../reducers/carts/actions'
import { CartsState, PackageCartsData, cartsReducer } from '../reducers/carts/reducer'
import Cart, { CartType } from '../types/cart'
import { AppContext } from './app.ctx'
import { useWhatsAppBot } from '@hooks/useWhatsAppBot'

interface CartContextData {
  carts: Cart[]
  packageCarts: PackageCartsData | null
  setCarts: (carts: Cart[]) => void
  setCart: (cart: Cart) => void
  updateMotoboyId: (cartId: number, motoboyId: number, session: Session) => void
  setPackageCarts: (data: PackageCartsData) => void
  showLostRequestsModal: boolean
  setShowLostRequestsModal: Dispatch<SetStateAction<boolean>>
  motoboys: any[]
  setMotoboys: Dispatch<SetStateAction<any[]>>
  cartEvents: EventEmitter
}
//
interface CartProviderProps {
  children: ReactNode
}

export const CartsContext = createContext<CartContextData>({} as CartContextData)

export function CartsProvider({ children }: CartProviderProps) {
  const { wsConnect, wsSubscribe } = useWebSocket()
  const { profile, setWsPrint, verifyInventory } = useContext(AppContext)
  const { data: session } = useSession()
  const { onCart } = useWhatsAppBot()
  const cartEvents = new EventEmitter()

  const [showLostRequestsModal, setShowLostRequestsModal] = useState(false)
  const [state, dispatch] = useReducer(cartsReducer, { carts: [], packageCarts: null } as CartsState)
  const [motoboys, setMotoboys] = useState<any[]>([])
  const { data: result_carts } = useFetch<{ carts: CartType[] }>('/dashboard/carts')
  const { data: result_motoboys } = useFetch<{ motoboys: any[] }>('/dashboard/motoboys')
  const { data: result_package_data } = useFetch<{ packageCarts: PackageCartsData }>(`/dashboard/carts/package?page=${1}`)
  const [printSubscription, setPrintSubscription] = useState<Subscription>()

  const setCarts = (carts: Cart[]) => {
    dispatch(setCartsAction(carts))
  }

  const setCart = (cart: Cart) => {
    dispatch(setCartAction(cart))
  }

  const setPackageCarts = (data: PackageCartsData) => {
    dispatch(setPackageCartsAction(data))
  }

  const addItemCart = (cart: CartType) => {
    if (cart.type !== 'P') {
      dispatch(addItemCartAction(cart))
    } else {
      dispatch(addItemPackageCart(cart))
    }
  }

  const updateMotoboyId = async (cartId: number, motoboyId: number, session: Session) => {
    try {
      const { data: cartUpdated } = await apiRoute('/dashboard/cart/singMotoboy', session, 'PATCH', { cartId, motoboyId })
      setCart(new Cart(cartUpdated))
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const onWsReconnect = async () => {
    const { data: result_carts } = await apiRoute('/dashboard/carts', session)
    const { data: result_package_data } = await apiRoute(`/dashboard/carts/package?page=${1}`, session)
    if (result_carts) {
      const { carts } = result_carts
      setCarts(carts.map((cart: CartType) => new Cart(cart)))
      setShowLostRequestsModal(carts.length > 3)
    }

    if (result_package_data) {
      const { packageCarts } = result_package_data
      setPackageCarts(packageCarts)
    }
  }

  useEffect(() => {
    if (result_carts) {
      const { carts } = result_carts
      setCarts(carts.map((cart: CartType) => new Cart(cart)))
      setShowLostRequestsModal(carts.length > 3)
    }
  }, [result_carts])

  useEffect(() => {
    if (result_motoboys) {
      const { motoboys } = result_motoboys
      setMotoboys(motoboys)
    }
  }, [result_motoboys])

  useEffect(() => {
    if (result_package_data) {
      const { packageCarts } = result_package_data
      setPackageCarts(packageCarts)
    }
  }, [result_package_data])

  useEffect(() => {
    if (profile.id) {
      wsConnect(
        {
          url: `${process.env.NODE_ENV === 'development' ? 'ws' : 'wss'}://${process.env.WS_SOCKET_API}/adonis-ws`,
          attemptsInterval: 1000 * 10,
          reconnectAttempts: 10,
        },
        () => {
          wsSubscribe('profile', profile.slug, (subscription) => {
            subscription.on(`profile`, ({ data }) => {
              if (data.forceLogout) {
                signOut()
              }
            })
          })
          wsSubscribe('request', profile.slug, (subscription) => {
            subscription.on('request', async (wsCart) => {
              verifyInventory()
              addItemCart(wsCart)
              onCart(wsCart)
              cartEvents.emit('newCart')
              if (wsCart.type === 'P') {
                cartEvents.emit('newCartPackage')
              }
            })
          })
          wsSubscribe('command', profile.slug, (subscription) => {
            subscription.on('command', (command) => { })
          })
          if (profile.options?.print.app) {
            wsSubscribe('print', profile.slug, (subscription) => {
              setPrintSubscription(subscription)

              setWsPrint(subscription)
            })
          }
        },
        onWsReconnect
      )
    }
  }, [])

  useEffect(() => {
    if (printSubscription) {
      printSubscription.on('sucessesFullPrinting', ({ requestId }: { requestId: number }) => {
        const cartIndex = state.carts.findIndex((r) => r.id === requestId)
        if (cartIndex !== -1) {
          state.carts[cartIndex].print = 1
        }
        setCarts([...state.carts])
      })
    }
  }, [state.carts, printSubscription])

  if (!profile.id) {
    return (
      <CartsContext.Provider
        value={{
          carts: [],
          packageCarts: {
            data: [],
            lastPage: 1,
            page: 1,
            perPage: 30,
            total: 0,
          },
          setCarts: () => { },
          setPackageCarts: () => { },
          setShowLostRequestsModal: () => { },
          showLostRequestsModal: false,
          cartEvents,
          setCart: () => { },
          setMotoboys,
          motoboys: [],
          updateMotoboyId: () => { },
        }}
      >
        {children}
      </CartsContext.Provider>
    )
  }

  return (
    <CartsContext.Provider
      value={{
        carts: state.carts,
        packageCarts: state.packageCarts,
        setCarts,
        setCart,
        updateMotoboyId,
        setPackageCarts,
        showLostRequestsModal,
        setShowLostRequestsModal,
        motoboys,
        setMotoboys,
        cartEvents,
      }}
    >
      <>{children}</>
    </CartsContext.Provider>
  )
}
