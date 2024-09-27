import { AlertMessage } from '@components/Generic/AlertMessage'
import { ConfirmModal, ConfirmModalProps } from '@components/Modals/Confirm'
import { HelpVideos, UrlsType } from '@components/Modals/HelpVideos'
import { PrinterRequests } from '@components/Modals/PrinterRequests'
import { NewFeat } from '@components/NewFeat'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { Footer } from '@components/Partials/footer'
import { Sidebar } from '@components/Partials/sidebar'
import { Topbar } from '@components/Partials/topbar'
import { WMToast, WMToastProps } from '@components/WMToast'
import InventoryWarning from '@components/Warnings/Inventory'
import { Subscription } from '@hooks/useWebSocket'
import { useWhatsAppBot } from '@hooks/useWhatsAppBot'
import { getBrowserVersion } from '@utils/getBrowserVersion'
import { AxiosResponse } from 'axios'
import i18n from 'i18n'
import { DateTime, Interval } from 'luxon'
import { UserType } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  Dispatch,
  ReactNode,
  Reducer,
  SetStateAction,
  createContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  Alert,
  Button,
  Container,
  Fade,
  Modal,
  Navbar,
  Offcanvas,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { FaDownload, FaGooglePlay } from 'react-icons/fa'
import { IoVolumeMuteSharp } from 'react-icons/io5'
import { api, groveNfeApi } from 'src/lib/axios'
import useLocalStorage from '../hooks/useLocalStorage'
import { Invoice } from '../pages/dashboard/invoices'
import StrategyPagarme from '../payment/pagarme'
import Gateway from '../payment/strategy/gateway'
import StrategyStripe from '../payment/stripe'
import { userReducer } from '../reducers/user/reducer'
import Bartender, { BartenderType } from '../types/bartender'
import Cart from '../types/cart'
import Command, { CommandType } from '../types/command'
import { CupomType } from '../types/cupom'
import { Plan } from '../types/plan'
import Profile, { ProfileOptions } from '../types/profile'
import Table, { TableOpened } from '../types/table'
import { WmFunctions, apiRoute, getMobileOS } from '../utils/wm-functions'
import { CartsProvider } from './cart.ctx'
import { PaymentMethodProvider } from './paymentMethod.ctx'
import { TablesProvider } from './table.ctx'
type ChangeType = {
  changeState?: boolean
  confirmSave?: boolean
  toRouter?: () => void
  // setChangeState: Dispatch<SetStateAction<boolean>>;
  // setConfirmSave: Dispatch<SetStateAction<boolean | undefined>>;
}
//
export type PackagePages = {
  data: Request[]
  total: number
  page: number
  perPage: number
  lastPage: number
}

interface IHelpVideos {
  show: boolean
  urls: UrlsType[]
}
interface AppContextData {
  // requests: Request[];
  // setRequests: Dispatch<SetStateAction<Request[]>>;
  // showLostRequestsModal: boolean;
  // setShowLostRequestsModal: Dispatch<SetStateAction<boolean>>;
  requestsToPackage: PackagePages
  setRequestsToPackage: Dispatch<SetStateAction<PackagePages>>
  profile: Profile
  setProfile: Dispatch<SetStateAction<Profile | undefined>>
  plansCategory: ('package' | 'basic' | 'table')[]
  plans: Plan[]
  cupons: CupomType[]
  setCupons: Dispatch<SetStateAction<CupomType[]>>
  invoicePending?: { invoice: any; addons: Invoice[] }
  modalFooterOpened: boolean
  setModalFooterOpened: Dispatch<SetStateAction<boolean>>

  //Funções para mostrar toast ou um modal de confirmação
  handleShowToast(toastProps: WMToastProps): void
  handleConfirmModal(confirmModalProps: ConfirmModalProps): void

  //Modal de Videos de Ajuda
  handleHelpVideo(urls: UrlsType[]): void
  //Verifica se houve alterações nas informações antes de salvar
  changeConfig: ChangeType
  setChangeConfig: Dispatch<SetStateAction<ChangeType>>

  // overlaySpinnerConfig: OverlaySpinnerPropsType;
  // setOverlaySpinnerConfig: Dispatch<SetStateAction<OverlaySpinnerPropsType>>;

  requestsToPrint: RequestsToPrintType
  setRequestsToPrint: Dispatch<SetStateAction<RequestsToPrintType>>

  // cartsNotPrinted: Cart[];
  // setCartsNotPrinted: Dispatch<SetStateAction<Cart[]>>;

  //Contador de pedidos no LocalStorage
  requestsCount: number
  setRequestsCount: (value: number | ((val: number) => number)) => void
  setHelpVideoModal: Dispatch<SetStateAction<IHelpVideos>>

  //KeyPressedEventsGlobal
  keysPressed: Set<string>
  setKeysPressed: Dispatch<SetStateAction<Set<string>>>

  // Canal de impressões WS
  wsPrint: any
  setWsPrint: Dispatch<SetStateAction<any>>
  // SideBar
  showSidebar: boolean
  setShowSidebar: Dispatch<SetStateAction<boolean>>

  audio?: HTMLAudioElement | null
  setAudio?: Dispatch<SetStateAction<HTMLAudioElement | null>>

  bartenders: Bartender[]
  setBartenders: Dispatch<SetStateAction<Bartender[]>>

  iframeReq?: HTMLIFrameElement | null
  setIframeReq?: Dispatch<SetStateAction<HTMLIFrameElement | null>>

  onOnlineCallback: () => void
  verifyInventory: () => void
  lowStockAlert: () => boolean
  lowInventoryItems: { low: any[]; soldOut: any[] } | null
  setLowInventoryItems: Dispatch<SetStateAction<{ low: any[]; soldOut: any[] }>>
  getBartender: (bartenderId?: number) => Bartender | undefined
  printStart: boolean
  setPrintStart: Dispatch<SetStateAction<boolean>>
  // SOCKET COMMANDS
  socketCommands: CommandType[]
  setSocketCommands: Dispatch<SetStateAction<CommandType[]>>
  finishCommand?: 'command' | 'table'
  lastCartTable?: Cart
  firsInteract: boolean

  door: boolean
  setDoor: Dispatch<SetStateAction<boolean>>
  lastRequestDate: number
  possibleMobile: boolean
  gateway?: Gateway

  user: UserType
  dispatchUser: Dispatch<{
    type: 'update'
    payload: Partial<UserType>
  }>
  setPrintAppDownloaded: Dispatch<SetStateAction<boolean>>
  setWhatsmenuDesktopDownloaded: Dispatch<SetStateAction<boolean>>

  wsCommand: CommandType | null
  setShowNewFeatureModal: (value: boolean | ((val: boolean) => boolean)) => void
  currency: (payload: {
    value: number
    symbol?: boolean
    withoutSymbol?: boolean
  }) => string
  groveNfeCompany: any
}

type RequestsToPrintType = {
  show?: boolean
  carts: Cart[]
  directPrint?: boolean
  playAudio?: boolean
  type?: 'table' | 'command' | 'D' | 'P' | 'T'
  report?: boolean
  table?: Table
  opened?: TableOpened
  command?: Command | null
  titleTable?: string
  profileOptions?: ProfileOptions
  printerTest?: boolean
  printerCenter?: boolean
  appPrint?: boolean
  wsPrinting?: boolean
  detaildTable?: boolean
  onHide?: (...params: any) => void
  onFinished?: (...params: any) => void
}

interface AppProviderProps {
  children: ReactNode
}

export const AppContext = createContext<AppContextData>({} as AppContextData)

export function AppProvider({ children }: AppProviderProps) {
  const { t } = useTranslation()
  const { data: session, status } = useSession()

  const router = useRouter()

  const [cartsNotPrinted, setCartsNotPrinted] = useState<Cart[]>([])
  const [gateway, setGateway] = useState<Gateway>()

  const [requestsToPackage, setRequestsToPackage] = useState<PackagePages>({
    data: [],
    lastPage: 1,
    page: 1,
    perPage: 30,
    total: 0,
  })

  const [lastRequestDate, setLastRequestDate] = useState<number>(0)
  const [lowInventoryItems, setLowInventoryItems] = useState<any | null>(null)
  const [door, setDoor] = useState(true)
  const [bartenders, setBartenders] = useState<Bartender[]>([])
  const [iframeReq, setIframeReq] = useState<HTMLIFrameElement | null>()
  const [inactivityInterval, setInactivityInterval] = useState<any>()
  const [printStart, setPrintStart] = useState<boolean>(false)
  const [blockButtonClick, setBlockButtonClick] = useState<boolean>(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [messageCloseSocket, setMessageCloseSocket] = useState<{
    show: boolean
    message: string
    showSupportButton?: boolean
    type?: 'success' | 'error'
  }>({ show: false, message: '' })
  const [modalFooterOpened, setModalFooterOpened] = useState<boolean>(true)
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set())
  const [updateHTML, setUpdateHTML] = useState<number>(0)
  const [showToastBeta, setShowToastBeta] = useState<boolean>(false)
  const [showOverlayReload, setShowOverlayReload] = useState<boolean>(false)
  const [navigatorOnline, setNavigatorOnline] = useState<boolean>(true)
  const [showStatusNavigator, setStatusNavigator] = useState<boolean>(false)
  const [profile, setProfile] = useState<Profile>()
  const [plansCategory, setPlansCategory] = useState<
    ('package' | 'basic' | 'table')[]
  >([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [cupons, setCupons] = useState<CupomType[]>([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toast, setToast] = useState<WMToastProps>({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalProps>({
    show: showConfirmModal,
    onHide: () => setShowConfirmModal(false),
  })
  const [showNewFeatureModal, setShowNewFeatureModal] = useLocalStorage(
    '@whatsmenu:new-feature-modal',
    false
  )
  const [possibleMobile, setPossibleMobile] = useState<boolean>(true)
  const [invoicePending, setInvoicePending] = useState<{
    invoice: any
    addons: Invoice[]
  }>({ invoice: null, addons: [] })

  const [changeConfig, setChangeConfig] = useState<ChangeType>({
    changeState: false,
    confirmSave: false,
  })

  const [requestsToPrint, setRequestsToPrint] = useState<RequestsToPrintType>({
    carts: [],
  })
  let [requestsCount, setRequestsCount] = useLocalStorage('requestsCount', 0)

  const [socketCommands, setSocketCommands] = useState<CommandType[]>([])
  const [lastCartTable, setlastCartTable] = useState<Cart>()
  const [playCount, setPlayCount] = useState(0)

  const [helpVideoModal, setHelpVideoModal] = useState<IHelpVideos>({
    show: false,
    urls: [],
  })

  //Adonis WS
  const [wsConnection, setWsConnection] = useState<any>(null)
  const [wsRequest, setWsRequest] = useState<Subscription | null>(null)
  const [wsCommand, setWsCommand] = useState<CommandType | null>(null)
  const [wsPrint, setWsPrint] = useState<Subscription | null>(null)
  const [prevent, setPrevent] = useState<boolean>(false)
  const [groveNfeCompany, setGroveNfeCompany] = useState<any>()

  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    'defaultDomain',
    null,
    'sessionStorage'
  )

  const [printAppDownloaded, setPrintAppDownloaded] = useLocalStorage(
    '@whatsmenu:whatsmenu-print-app-downloaded',
    false
  )
  const [whatsmenuDesktopDownloaded, setWhatsmenuDesktopDownloaded] =
    useLocalStorage('@whatsmenu:whatsmenu-desktop-downloaded', false)

  // const [bluetoothPrinter, setBlueToothPrinter] = useLocalStorage<any>('@default-printer', null)

  // Interação do usuário para audio
  const [firsInteract, setFirsInteract] = useState(false)

  const [finishCommand, setFinishCommand] = useState<'command' | 'table'>()

  // Alerta de Atualização

  const [showUpdateMessage, setShowUpdateMessage] = useState(true)
  const [showMessageWhatsapp, setShowMessageWhatsapp] = useState(false)
  const [siginError, setSiginError] = useState(false)
  const [showUpdateSubAccountModal, setShowUpdateSubAccountModal] =
    useState(false)

  const [showAlertMessage, setShowAlertMessage] = useState(true)

  const [user, dispatchUser] = useReducer<Reducer<any, any>>(userReducer, {})

  const baseUrl = process.env.NEXT_PUBLIC_WHATSMENU_BASE_URL
  const audioRef = useRef<HTMLAudioElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const workerRef = useRef<Worker>()
  // rollback
  const { storeProfile } = useWhatsAppBot()

  // const initWorker = useCallback(() => {
  //   addEventListener('message', (event: MessageEvent<{ profile?: Profile, action?: string, data?: any }>) => {
  //     const { profile, action, data } = parseFunctions(event.data)

  //     const url = `${process.env.NODE_ENV === "development" ? "ws" : "wss"}://${process.env.NEXT_PUBLIC_WS_SOCKET_API}/adonis-ws`
  //     let ws: WebSocket | null = null
  //     ws = new WebSocket(url)

  //     // if (ws === null) {
  //     // } else {
  //     //   switch (action) {
  //     //     case 'init': {

  //     //       ws.onclose = () => {
  //     //         setTimeout(() => {
  //     //           ws = new WMSocket(url, profile)
  //     //         }, 1000 * 25);
  //     //       }
  //     //       break
  //     //     }
  //     //     case 'emit': {
  //     //       const { topic, event, data: dataToEmit } = data
  //     //       ws?.emit(topic, event, dataToEmit)
  //     //       break
  //     //     }

  //     //   }

  //     // }

  //   })
  // }, [])

  // const adonisWs = () => {
  //   return (
  //     <Script
  //       id="ws"
  //       src="/js/Ws.browser.js"
  //       onLoad={(e) => {
  //         const ws = adonis.Ws(
  //           `${process.env.NODE_ENV === "development" ? "ws" : "wss"}://${process.env.NEXT_PUBLIC_WS_SOCKET_API}`
  //         );
  //         setWsConnection(ws);

  //         ws.connect();
  //         let hourClose;
  //         let hourConnect;
  //         ws.on("open", async () => {
  //           setWsChanel((state: any) => {
  //             if (state) {
  //               getRequestsProfile(true, true)
  //                 .then(() => console.log('Atualizando Pedidos'))
  //                 .catch(err => console.error(err))
  //             }
  //             return state
  //           })
  //           const wsRequestChanel = ws.subscribe(`request:${profile?.slug}`);
  //           const wsCommandChanel = ws.subscribe(`command:${profile?.slug}`);
  //           if (profile?.options?.print.app) {
  //             const wsPrintChanel = ws.subscribe(`print:${profile?.slug}`);

  //             setWsPrint(wsPrintChanel);
  //           }

  //           setWsChanel(wsRequestChanel);
  //           setWsCommand(wsCommandChanel);
  //           hourConnect = DateTime.local();
  //           // wsRequestChanel?.on(
  //           //   `request:${profile?.slug}`, (requestsWs: RequestType[]) => {
  //           //     const lastRequests: number[] = JSON.parse(sessionStorage.getItem("lastRequests") as string) ?? [];

  //           //     requestsWs.forEach(async (reqWs) => {
  //           //       if (reqWs) {
  //           //         if (lastRequests && lastRequests.find(lReq => lReq === reqWs.id)) {
  //           //           return
  //           //         } else {
  //           //           const saveSession = () => {
  //           //             const newArray: number[] = lastRequests.length === 5 ? lastRequests.slice(1).concat(reqWs.id) : lastRequests.concat(reqWs.id);
  //           //             sessionStorage.setItem("lastRequests", copy(newArray, "json"))
  //           //           };

  //           //           if (reqWs.type !== "P") {
  //           //             setRequests(state => {
  //           //               if (state.find(req => req.id === reqWs.id)) {
  //           //                 console.log("Pedido duplicado", reqWs.id);
  //           //                 return state;
  //           //               } else {
  //           //                 const newRequest = new Request(reqWs);

  //           //                 if (reqWs.type === "T") {
  //           //                   setlastCartTable(last => newRequest);
  //           //                 }
  //           //                 saveSession();
  //           //                 setLastRequestDate(DateTime.local().toMillis());
  //           //                 setDoor(door => {
  //           //                   if (possibleMobile && !door) {
  //           //                     audio?.play();
  //           //                   }
  //           //                   return door
  //           //                 });

  //           //                 return [newRequest, ...state];
  //           //               }
  //           //             });

  //           //           } else {
  //           //             const packageTabActive = document.querySelector("#packageTabHead a.active");

  //           //             setRequestsToPackage((prevPackages) => {
  //           //               if (prevPackages.data?.find(req => req.id === reqWs.id)) {
  //           //                 return prevPackages;
  //           //               }

  //           //               if (packageTabActive) {
  //           //                 audio?.play();
  //           //               }

  //           //               saveSession();
  //           //               setLastRequestDate(DateTime.local().toMillis());
  //           //               return {
  //           //                 ...prevPackages,
  //           //                 data: [new Request(reqWs), ...prevPackages.data],
  //           //               };
  //           //             });
  //           //           }
  //           //         }

  //           //       }
  //           //     });
  //           //   }
  //           // );

  //           // wsCommandChanel?.on(
  //           //   `command:${profile?.slug}`,
  //           //   (data: CommandWsData) => {
  //           //     const { commandsWs, finish } = data
  //           //     setFinishCommand(state => finish)
  //           //     if (commandsWs) {
  //           //       commandsWs.forEach((commandWs: any) => {
  //           //         setSocketCommands((prevCommands) => {
  //           //           return commandsWs;
  //           //         });
  //           //       });
  //           //     }
  //           //   }
  //           // );
  //         });

  //         ws.on("close", (socket: any) => {
  //           if (socket._reconnectionAttempts === 10) {
  //             window.location.reload();
  //           }
  //         });
  //       }}
  //     ></Script >
  //   );
  // };

  const handleShowToast = (toastProps: WMToastProps) => {
    toastProps.title ? toastProps.title : ''
    toastProps.content ? toastProps.content : ''
    setToast(toastProps)
    setShowToast(true)
  }

  const verifyInventory = async () => {
    if (!profile?.options.inventoryControl) return
    const { data: lowAndSoldOutItems } = await apiRoute(
      '/dashboard/inventory',
      session
    )
    return setLowInventoryItems(lowAndSoldOutItems)
  }

  const lowStockAlert = () => {
    if (!lowInventoryItems) return false

    const {
      low: {
        products: lowProducts,
        pizzaProducts: lowPizzaProducts,
        pizzaFlavors: lowPizzaFlavors,
        complements: lowComplements,
      },
      soldOut: {
        products: soldOutProducts,
        pizzaProducts: soldOutPizzaProducts,
        pizzaFlavors: soldOutPizzaFlavors,
        complements: soldOutComplements,
      },
    } = lowInventoryItems
    return !![
      ...lowProducts,
      ...lowPizzaProducts,
      ...lowComplements,
      ...soldOutProducts,
      ...soldOutPizzaProducts,
      ...soldOutPizzaFlavors,
      ...lowPizzaFlavors,
      ...soldOutComplements,
    ].length
  }

  const handleConfirmModal = (confirmModalProps: ConfirmModalProps) => {
    setConfirmModal({
      ...confirmModalProps,
      show: true,
      onHide: () => setShowConfirmModal(false),
    })
    setShowConfirmModal(true)
  }
  const handleHelpVideo = (urls: UrlsType[]) => {
    setHelpVideoModal({ show: true, urls })
  }

  const onOnlineCallback = async () => {
    setProfile((state) => {
      if (state) {
        return { ...state }
      }
      return state
    })
    try {
      // await apiRoute("https://rt3.whatsmenu.com.br/dashboard/request/wsVerification", session, "POST", { requestsId: [...requests.map(req => req.id), ...requestsToPackage.data.map(req => req.id)] });
    } catch (error) {
      console.error(error)
    } finally {
      setNavigatorOnline(true)
    }
  }

  const getBartender = useCallback(
    (bartenderId?: number) => {
      if (!bartenderId) {
        return undefined
      }
      return bartenders.find((b) => b.id === bartenderId)
    },
    [bartenders]
  )

  const getUser = useCallback(async () => {
    if (session) {
      const { data: dataUser } = (await apiRoute(
        `${process.env.NEXT_PUBLIC_WHATSMENU_API}/dashboard/user/getUser`,
        session
      )) as AxiosResponse<UserType>

      dispatchUser({
        type: 'update',
        payload: dataUser,
      })
    }
  }, [dispatchUser, session])

  // useEffect(() => {
  //   if (status === "authenticated" && plans.length) {
  //     if (inactivityInterval === undefined && !printStart) {
  //       setInactivityInterval(checkInactivity(() => {
  //         getRequestsProfile(true, false);
  //         console.log('Buscando por novos pedidos...')
  //       }));
  //     }

  //     if (printStart) {
  //       console.log("Reiniciando o intervalo");
  //       setInactivityInterval(clearInterval(inactivityInterval));
  //       setPrintStart(false);
  //     }
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [status, inactivityInterval, printStart, plans]);

  /**
   * Formata um valor dado como uma string de moeda.
   *
   * @param {Object} opções - As opções para formatar a moeda.
   * @param {number} opções.value - O valor a ser formatado. Padrão é 0.
   * @param {boolean} [opções.symbol=false] - Se deve incluir o símbolo da moeda. Padrão é false.
   * @param {boolean} [opções.withoutSymbol=false] - Se deve excluir o símbolo da moeda. Padrão é false.
   * @return {string} A string formatada da moeda.
   */
  const currency = ({
    value = 0,
    symbol = false,
    withoutSymbol = false,
  }: {
    value: number
    symbol?: boolean
    withoutSymbol?: boolean
  }) => {
    if (!profile || !profile.options?.locale) {
      return new Intl.NumberFormat(user.controls?.currency ?? 'pt-BR', {
        style: 'currency',
        currency: user.controls?.currency ?? 'BRL',
      }).format(value)
    }
    if (!value || isNaN(value)) {
      value = 0
    }

    const { currency, language } = profile.options?.locale
    value = value && parseFloat(value.toString())
    if (symbol) {
      return (0)
        .toLocaleString(language, {
          style: 'currency',
          currency,
        })
        .replace(/\d+(,|\.)\d+/, '')
    }

    if (withoutSymbol) {
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency,
      })
        .format(value)
        .replace(/\D+/, '')
    }

    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(value)
  }

  useEffect(() => {
    if (status === 'authenticated' && !Object.keys(user).length) {
      console.log('SYSTEM OS: ', getMobileOS())

      getUser()
      window.onclick = () => {
        if (!firsInteract) {
          if (audioRef.current && getMobileOS() === 'iOS') {
            audioRef.current.muted = true
            audioRef.current.play().then(() => {
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.muted = false
                }
              }, 4000)
            })
          }
          setFirsInteract(true)
        }
      }

      window.onoffline = () => {
        setNavigatorOnline(false)
        setStatusNavigator(true)
      }

      window.ononline = () => {
        onOnlineCallback()
      }

      window.onresize = () => {
        window.innerWidth < 1020 ? setShowSidebar(false) : setShowSidebar(true)
      }

      setTimeout(() => {
        if (sessionStorage.getItem('hiddenMessageNext')) {
          setShowToastBeta(false)
        } else {
          setShowToastBeta(true)
        }
      }, 2000)

      window.onerror = (message) => {
        sessionStorage.removeItem('hiddenMessageNext')
        setUpdateHTML(updateHTML + 1)
      }

      document
        .querySelector('#body-application')
        ?.addEventListener('touchstart', function (e: any) {
          if (e.touches && e.touches.length !== 1) {
            return
          }

          const scrollY =
            window.pageYOffset ||
            document.body.scrollTop ||
            document.documentElement.scrollTop
          setPrevent(scrollY === 0)
        })

      document
        .querySelector('#body-application')
        ?.addEventListener('touchmove', function (e: any) {
          if (prevent) {
            setPrevent(false)
            e.preventDefault()
          }
        })

      setAudio(audioRef.current)

      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) && 'ontouchstart' in window

      if (localStorage.getItem('mobile') !== null) {
        setPossibleMobile(false)
      } else {
        if (!mobile) {
          setPossibleMobile(false)
          localStorage.setItem('mobile', 'false')
        } else {
          if (!localStorage.getItem('mobile')) {
            window.onfocus = () => {
              setDoor((old) => true)
            }
          }
        }
      }
    }
  }, [status, getUser, user])

  useEffect(() => {
    if (session && !gateway) {
      if (user && user?.controls?.paymentInfo) {
        const userGateway = user?.controls?.paymentInfo.gateway
        switch (userGateway) {
          case 'pagarme':
            setGateway(
              new Gateway(
                new StrategyPagarme(
                  session,
                  process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY as string
                )
              )
            )
            break
          case 'stripe':
            setGateway(new Gateway(new StrategyStripe(session)))
            break
        }
      }
    }
  }, [session, gateway, user])

  useEffect(() => {
    const alreadyInProfile =
      router.asPath === '/dashboard/profile' ||
      router.asPath === '/dashboard/invoices'
    const acceptedTypes = ['adm', 'manager', 'seller', 'support']
    if (session && !acceptedTypes.includes(user?.controls?.type)) {
      if (
        status === 'authenticated' &&
        profile &&
        (!profile.id ||
          (plansCategory?.some((p) => p !== 'table') &&
            (!profile.address.street || !profile.taxDelivery.length))) &&
        !alreadyInProfile
      ) {
        if (
          user?.controls?.paymentInfo &&
          !user.controls.paymentInfo?.gateways
        ) {
          if (!user.controls.paymentInfo?.subscription) {
            router.push('/dashboard/invoices')
          }
        } else {
          router.push('/dashboard/profile')
        }
      }
    }

    if (profile) {
      if (
        profile.options?.forceLogout &&
        Number(profile.options?.forceLogout) > session?.user?.loginDate
      ) {
        signOut()
      }

      if (
        profile.address &&
        profile.taxDelivery.length &&
        profile.not_security_key &&
        (!user.security_key || user.security_key === '16S7^$kJjWKy')
      ) {
        router.push('/dashboard/settings/account')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile, user])

  useEffect(() => {
    const getData = async () => {
      try {
        const initialRequests = await Promise.all([
          api.get('/dashboard/profile'),
          apiRoute('/dashboard/userPlans', session) as Promise<
            AxiosResponse<Plan[]>
          >,
          apiRoute('/dashboard/invoices/pending', session),
        ])
        const [
          { data: profileFetch },
          { data: userPlansFetch },
          { data: invoicesFetch },
        ] = initialRequests

        setProfile(new Profile(profileFetch || {}))
        storeProfile(profileFetch)
        setPlans(userPlansFetch ? userPlansFetch.sort() : [])
        setPlansCategory(
          userPlansFetch ? userPlansFetch.map((p) => p.category).sort() : []
        )

        if (profileFetch) {
          // if (true) {
          //   try {
          //     const { data: requestsFetch } = await apiRoute(
          //       "/dashboard/requests",
          //       session
          //     );

          //     setRequests(state => {
          //       const toRequests: RequestType[] = [];

          //       for (const r of requestsFetch) {
          //         if (!r.print) {
          //           const reqState = state.find(stRequest => stRequest.id === r.id);
          //           if (reqState && reqState.print) {
          //             try {
          //               r.print = 1;
          //               session && reqState.setPrinted(session);
          //             } catch (error) {
          //               console.error(error);
          //             }
          //           }
          //         }

          //         if (!toRequests.find(req => req.id === r.id)) {
          //           toRequests.push(r);
          //         }
          //       }

          //       return toRequests.map((r: RequestType) => new Request(r));
          //     });
          //     const showModal = requestsFetch.filter((r: RequestType) => !r.print).length > 3;
          //     setShowLostRequestsModal(showModal)
          //   } catch (error) {
          //     console.error("Não foi possível buscar os pedidos de delivery e mesa")
          //     console.error(error);
          //   }
          // }

          // if (userPlansFetch.some(p => p.category === "package")) {
          //       ],
          //     });
          //   } catch (error) {
          //     console.error("Não foi possível buscar os pedidos de encomendas");
          //     console.error(error);
          //   }
          // }

          // if (userPlansFetch.some((p) => p.category === 'table')) {
          const { data: bartenders } = await apiRoute(
            '/dashboard/bartenders',
            session
          )

          if (!defaultDomain) {
            let { data } = await apiRoute('/dashboard/domain', session)
            setDefaultDomain(data || baseUrl)
          }

          setBartenders(
            bartenders.map(
              (br: BartenderType) => new Bartender({ ...br, password: '' })
            )
          )

          // SETANDO PERSIST BARTENDER COMO TRUE PRA USUARIOS MESA ANTERIORES Á ATUALIZAÇÃO DE GARÇONS
          if (
            typeof profileFetch.options.table?.persistBartender !== 'boolean'
          ) {
            const body = { table: { persistBartender: true } }
            const { data } = await apiRoute(
              '/dashboard/settings/tableConfigUpdate',
              session,
              'PATCH',
              body
            )
            setProfile((state) => {
              return (
                state && {
                  ...state,
                  options: { ...state.options, table: data },
                }
              )
            })
          }
          // }

          profileFetch.whatsapp = profileFetch.whatsapp.substring(2)
        }
        setInvoicePending(invoicesFetch)
      } catch (error) {
        console.error(error)
        setSiginError(true)
        signOut()
        throw error
      }
    }

    if (status === 'authenticated') {
      api.defaults.headers.common.Authorization = `Bearer ${session?.user?.v3Token}`
      setShowUpdateMessage(!localStorage.getItem('updateMessage'))
      setShowMessageWhatsapp(!localStorage.getItem('showMessageWhatsapp'))
      getData()
      setAudio(audioRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (firsInteract) {
      window.onclick = null
    }
  }, [firsInteract])

  // useEffect(() => {
  //   if (profile?.options?.inventoryControl) {
  //     const fetchLowInventory = async () => {
  //       await verifyInventory()
  //     }
  //     fetchLowInventory()
  //   }
  // }, [profile])

  useEffect(() => {
    if (!showUpdateSubAccountModal) {
      if (
        profile &&
        profile.options?.asaas &&
        !profile.options?.asaas?.incomeValue
      ) {
        setShowUpdateSubAccountModal(true)
      }
    }
  }, [profile, showUpdateSubAccountModal])

  useEffect(() => {
    if (!profile?.id) {
      i18n.changeLanguage(user?.controls?.language)
    }
    if (profile?.options?.locale) {
      i18n.changeLanguage(profile?.options?.locale.language)
    }
  }, [profile])

  useEffect(() => {
    if (profile && Boolean(profile?.options?.integrations?.grovenfe) && !groveNfeCompany) {
      groveNfeApi.get(`/v1/companies/${profile.options.integrations.grovenfe.company_id}`).then(({ data }) => {
        setGroveNfeCompany(data.company)
        console.log(data.company);
      })
    }

  }, [profile])

  const showInvoiceAlertMessage = user?.controls?.alertInvoiceDayBefore
    ? Interval.fromDateTimes(
      DateTime.local(),
      DateTime.fromISO(invoicePending.invoice?.expiration)
    ).count('days') <= user?.controls?.alertInvoiceDayBefore
    : true

  return (
    <>
      {/* {!wsRequest && profile && adonisWs()} */}
      {status === 'unauthenticated' && children}
      <OverlaySpinner
        show={status === 'loading' ? true : false}
        width={150}
        weight={10}
        textSpinner="Aguarde..."
        className="fs-4"
        backgroundColor="#fff"
      />
      {profile && status === 'authenticated' && (
        <AppContext.Provider
          value={{
            // setCartsNotPrinted,
            // cartsNotPrinted,
            profile,
            setProfile,
            plans,
            cupons,
            setCupons,
            invoicePending,
            handleShowToast,
            handleConfirmModal,
            changeConfig,
            setChangeConfig,
            requestsToPrint,
            setRequestsToPrint,
            requestsCount,
            setRequestsCount,
            requestsToPackage,
            setRequestsToPackage,
            handleHelpVideo,
            setHelpVideoModal,
            keysPressed,
            setKeysPressed,
            setModalFooterOpened,
            modalFooterOpened,
            wsPrint,
            setWsPrint,
            showSidebar,
            setShowSidebar,
            audio,
            bartenders,
            setBartenders,
            onOnlineCallback,
            getBartender,
            printStart,
            setPrintStart,
            socketCommands,
            setSocketCommands,
            finishCommand,
            lastCartTable,
            iframeReq,
            plansCategory,
            firsInteract,
            door,
            setDoor,
            possibleMobile,
            gateway,
            lastRequestDate,
            user,
            dispatchUser,
            setPrintAppDownloaded,
            wsCommand,
            verifyInventory,
            lowInventoryItems,
            setLowInventoryItems,
            lowStockAlert,
            setShowNewFeatureModal,
            setWhatsmenuDesktopDownloaded,
            currency,
            groveNfeCompany,
            // overlaySpinnerConfig,
            // setOverlaySpinnerConfig,
          }}
        >
          <CartsProvider>
            {!siginError ? (
              <TablesProvider>
                <Navbar expand={false} className="mb-3 p-0">
                  <Container fluid>
                    <Topbar
                      setShowSidebar={setShowSidebar}
                      showSidebar={showSidebar}
                    />

                    <Navbar.Offcanvas
                      placement="start"
                      backdrop={false}
                      scroll={true}
                      keyboard={false}
                      show={showSidebar}
                      style={{
                        width: '250px',
                        background: 'transparent',
                        border: 'none',
                        zIndex: 2,
                      }}
                      id="sidebar-offcanvas"
                    >
                      <Offcanvas.Body
                        className="sidebar"
                        as="aside"
                        bsPrefix="sidebar"
                        id="sidebar"
                      >
                        <Sidebar />
                      </Offcanvas.Body>
                    </Navbar.Offcanvas>
                  </Container>
                </Navbar>
                <main
                  id="main"
                  className={`main ${showSidebar ? (window.innerWidth > 1020 ? 'side-open' : 'side-close') : 'side-close'}`}
                  onClick={() => {
                    if (window.innerWidth < 1020 && showSidebar) {
                      setShowSidebar(false)
                    }
                  }}
                >
                  {profile.options?.invoiceMessage && (
                    <AlertMessage
                      title={t('dear_customer')}
                      message={
                        <p>
                          {t('support_more_information')} <br />
                          <a
                            href="https://wa.me/5511937036875?text=Olá,%20recebi%20um%20aviso%20em%20meu%20painel%20sobre%20uma%20parcela%20em%20atraso"
                            target="_blank"
                            rel="noreferrer"
                            className="text-dark fw-bold border-dark border-top-0 border-start-0 border-end-0 border pb-1"
                          >
                            +55 (11) 93703-6875
                          </a>
                          .
                        </p>
                      }
                      alertProps={{
                        variant: 'warning',
                      }}
                    />
                  )}

                  {lowStockAlert() ? (
                    <InventoryWarning lowInventoryItems={lowInventoryItems} />
                  ) : null}

                  {navigator.userAgent.includes('Windows NT 10') &&
                    parseInt(getBrowserVersion()) > 109 &&
                    !whatsmenuDesktopDownloaded &&
                    !('isElectron' in window) &&
                    !possibleMobile ? (
                    <>
                      <div className="bd-callout bd-callout-warning bg-warning bg-opacity-25">
                        <h2 className="mb-3">
                          🎉 {t('message_download_whatsmenu_desktop')}: 🚀
                        </h2>
                        <div className="d-flex align-itens-center justify-content-between">
                          <div className="d-flex flex-column align-itens-center justify-content-between">
                            <h6 className="fw-bold">
                              {t('message_less_work')}
                            </h6>
                            <ul>
                              <li>🤖 {t('message_virtual_assistant')}</li>
                              <li>💘 {t('message_loyalty_program')}</li>
                              <li>🤑 CashBack</li>
                              <li>🤩 {t('message_first_purchase')}</li>
                              <li>👽 {t('message_automated_sales_bot')}</li>
                              <li>😎 {t('message_status_updates')}</li>
                            </ul>
                          </div>
                        </div>
                        <div className="d-flex justify-content-start gap-3 text-end">
                          <Button
                            as="a"
                            className="d-flex align-items-center justify-content-center gap-2 text-center"
                            href="https://whatsmenu-desktop-update-server.vercel.app/download"
                            onClick={() => setWhatsmenuDesktopDownloaded(true)}
                            download
                          >
                            <FaDownload /> {t('message_download_app')}
                          </Button>
                          <HelpVideos.Trigger
                            className="btn btn-danger"
                            urls={[
                              {
                                src: 'https://www.youtube.com/embed/LxgnljotW6U?si=-K3KfGsOMQWDm05e',
                                title: t('donwload_the_whatsmenu'),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                  {possibleMobile && !printAppDownloaded ? (
                    <>
                      <div className="bd-callout bd-callout-warning bg-warning bg-opacity-25">
                        <h6 className="fw-bold mb-3">
                          🎉 {t('message_download_whatsmenu_printers')}: 🚀
                        </h6>
                        <div className="d-flex align-itens-center justify-content-between">
                          <div className="d-flex flex-column align-itens-center justify-content-between">
                            <ul>
                              <li>
                                📱 {t('message_automatic_printing_mobile')}
                              </li>
                              <li>
                                🖨️ {t('message_printing_multiple_printers')}
                              </li>
                              <li>📝 {t('message_copy_printing')}</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex-column d-flex justify-content-start gap-2 text-end">
                          <Button
                            as="a"
                            target="_blank"
                            className="d-flex align-items-center justify-content-center gap-2 text-center"
                            href="https://play.google.com/store/apps/details?id=com.whatsmenu.whatsmenuprintv2"
                            onClick={() => {
                              setPrintAppDownloaded(true)
                              setWhatsmenuDesktopDownloaded(true)
                            }}
                          >
                            <FaGooglePlay />
                            <span>{t('message_download_gplay')}</span>
                          </Button>
                          <HelpVideos.Trigger
                            className="btn btn-danger"
                            urls={[
                              {
                                src: 'https://www.youtube.com/embed/uxXoyyGW5mk?si=atSU0ZGa0eAS24Mn',
                                title: t('message_downlaod_whatsmenu_printers'),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                  <></>
                  <PaymentMethodProvider>{children}</PaymentMethodProvider>
                </main>
                {!('isElectron' in window) && (
                  <Alert
                    variant="warning"
                    transition={Fade}
                    show={!firsInteract}
                    className="with-icon position-fixed w-100 m-0"
                    style={{ top: '0', maxHeight: '70px', zIndex: 99999 }}
                  >
                    <IoVolumeMuteSharp className="ms-auto" />
                    <span className="me-auto">
                      {t('message_audio_disabled')}
                    </span>
                  </Alert>
                )}
                {/* {invoicePending.invoice !== null && showInvoiceAlertMessage ? (
                  <Alert
                    variant={`${invoicePending.invoice?.overdue ? 'danger' : 'warning'}`}
                    className="position-fixed w-100 m-0 text-center"
                    style={{ bottom: '0', zIndex: 999 }}
                  >
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={
                        invoicePending?.invoice?.requests &&
                        invoicePending?.invoice?.requests[0]?.paghiper &&
                        invoicePending?.invoice?.paghiper[0]?.create_request
                          ?.url_slip
                      }
                      style={{ color: 'inherit' }}
                    >
                      {!invoicePending.invoice?.overdue
                        ? t('message_monthly_invoice_available')
                        : t('message_menu_locked')}
                    </a>
                  </Alert>
                ) : null} */}
                <Footer
                  sideOpen={showSidebar}
                  haveInvoice={invoicePending.invoice}
                />
                <>
                  <section className="modals">
                    <HelpVideos.Root
                      show={helpVideoModal.show}
                      handleClose={() =>
                        setHelpVideoModal({ show: false, urls: [] })
                      }
                      urls={helpVideoModal.urls}
                    />
                    <WMToast
                      position={toast.position}
                      flexPositionX={toast.flexPositionX}
                      flexPositionY={toast.flexPositionY}
                      title={toast.title}
                      content={toast.content}
                      show={showToast}
                      setShow={setShowToast}
                      type={toast.type}
                      size={toast.size}
                      delay={toast.delay}
                    />
                    <ConfirmModal
                      show={showConfirmModal}
                      onHide={confirmModal.onHide}
                      confirmButton={confirmModal.confirmButton}
                      cancelButton={confirmModal.cancelButton}
                      title={confirmModal.title}
                      message={confirmModal.message}
                      actionConfirm={confirmModal.actionConfirm}
                      actionCancel={confirmModal.actionCancel}
                      alignText={confirmModal.alignText}
                      size={confirmModal.size}
                    />
                    <PrinterRequests />
                    <Modal size="xl" centered show={showNewFeatureModal}>
                      <NewFeat
                        mainVideo={{
                          title: t('overview_pos_pizza_addons'),
                          id: '9Aq37MSTvJU',
                        }}
                        videos={[
                          {
                            title: t('how_to_register_customer_pos'),
                            id: 'kfif91jSOHU',
                          },
                          {
                            title: t('guide_placing_order_pos'),
                            id: 'HRVEY780QgU',
                          },
                          {
                            title: t('how_to_update_customer_information_pos'),
                            id: '6jknXq56UEw',
                          },
                          {
                            title: t('guide_opening_cash_register'),
                            id: 'rzk0y_GKxDI',
                          },
                          {
                            title: t('guide_closin_cash_register'),
                            id: 'fEQblrE6gb4',
                          },
                          {
                            title: t('cash_register_closing_reports'),
                            id: 'kbF9kBoLcAQ',
                          },
                          {
                            title: t('how_place_order_counter_pos'),
                            id: 'uv6lo70w58E',
                          },
                          {
                            title: t('reordering_customers_orders'),
                            id: '8Cikh-zK4ME',
                          },
                          {
                            title: t('place_order_pizza_pos'),
                            id: 'jLmVWOjfOqk',
                          },
                          { title: t('how_create_tables'), id: 'tkPI7P9uQJU' },
                          {
                            title: t('guide_registering_pizza_crusts'),
                            id: 'y0kTLeWEAXU',
                          },
                        ]}
                        feature={{
                          name: 'PDV',
                          list: [
                            t('register_your_customers_quickly_easily'),
                            t('repeat_your_customer_clicks'),
                            t('cash_register_simply'),
                            t('gain_extra_speed'),
                          ],
                          day: user.controls?.migrationMessage
                            ? DateTime.fromFormat(
                              user.controls?.migrationMessage,
                              `${t('date_format')}`
                            )
                              .setLocale(`${t('language')}`)
                              .toFormat(`cccc ${t('date_format_v2')}`)
                            : '',
                        }}
                      />
                      <Modal.Footer>
                        <Button onClick={() => setShowNewFeatureModal(false)}>
                          {t('close')}
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  </section>
                </>
                <WmFunctions />
              </TablesProvider>
            ) : (
              <OverlaySpinner
                show
                width={150}
                weight={10}
                textSpinner={t('please_wait')}
                className="fs-4"
                backgroundColor="#fff"
              />
            )}
          </CartsProvider>
          {/* <UpdateAccountModal show={showUpdateSubAccountModal} onSuccess={() => setShowUpdateSubAccountModal(false)} /> */}
        </AppContext.Provider>
      )}

      <audio
        ref={audioRef}
        src="/audio/pedido.mp3"
        id="voiceRequest"
        onPlay={() => { }}
        onEnded={() => {
          setPlayCount((prevCount) => --prevCount)
        }}
      ></audio>
      {showStatusNavigator && (
        <div
          className="position-fixed"
          style={{ left: '25%', bottom: 0, zIndex: 9999999, width: '50%' }}
        >
          <Alert
            variant={!navigatorOnline ? 'danger' : 'success'}
            onClose={() => setStatusNavigator(false)}
            {...{ dismissible: navigatorOnline ? true : false }}
          >
            <Alert.Heading>
              {!navigatorOnline ? 'Offline  :(' : 'Online :)'}
            </Alert.Heading>
            {!navigatorOnline ? (
              <p>
                {t('internet_connection_lost')}
                <br />
              </p>
            ) : (
              <p>
                {t('internnet_connection_reestablished')}
                <br />
              </p>
            )}
          </Alert>
        </div>
      )}
      {showOverlayReload && (
        <div
          className="position-fixed"
          style={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, .4)',
            zIndex: 9999,
          }}
        ></div>
      )}
      <iframe
        id="iframeWhatsapp"
        name="iframeWhatsapp"
        ref={iframeRef}
        src=""
        style={{ position: 'absolute', top: -100000, left: -100000 }}
      ></iframe>
      {!door && <div style={{ position: 'fixed', inset: 0 }}></div>}
    </>
  )
}
