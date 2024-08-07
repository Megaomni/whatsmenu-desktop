import { ElectronService } from './../electron.service'
import { AfterViewChecked, Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft,
  faBars,
  faCashRegister,
  faChevronDown,
  faChevronUp,
  faEdit,
  faPhone,
  faPhoneSquare,
  faSearch,
  faShoppingBasket,
  faUser,
  faCircle,
} from '@fortawesome/free-solid-svg-icons'
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateTime } from 'luxon'
import Command from 'src/classes/command'
import Table, { TableOpened } from 'src/classes/table'
import { CartFlavorPizzaType } from '../cart-pizza'
import { CartRequestType } from '../cart-request-type'
import { CartType } from '../cart-type'
import { CupomType } from '../cupom'
import { AlertComponent } from '../modals/alert/alert.component'
import { ApiService } from '../services/api/api.service'
import { CartService } from '../services/cart/cart.service'
import { ContextService } from '../services/context/context.service'
import { ToastService } from '../services/ngb-toast/toast.service'
import { WebsocketService } from '../services/websocket/websocket.service'
import { TableType } from '../table-type'
import { CartRepeatComponent } from './modals/cart-repeat/cart-repeat.component'
import { CartResumeComponent } from './modals/cart-resume/cart-resume.component'
import { CartTypeComponent } from './modals/cart-type/cart-type.component'
import { CashierLoginComponent } from './modals/cashier-login/cashier-login.component'
import { CashierComponent } from './modals/cashier/cashier.component'
import { ClientAddressComponent } from './modals/client-address/client-address.component'
import { ClientSearchListComponent } from './modals/client-search-list/client-search-list.component'
import { ClientStoreComponent } from './modals/client-store/client-store.component'
import { CommandsComponent } from './modals/commands/commands.component'
import { NewcommandComponent } from './modals/newcommand/newcommand.component'
import { PaymentComponent } from './modals/payment/payment.component'
import { SwitchTableComponent } from './modals/switch-table/switch-table.component'
import { ConfirmPrintComponent } from './modals/confirm-print/confirm-print.component'
import { PrintService } from '../services/print/print.service'
import { StoreService } from '../services/store/store.service'
import { ProfileOptionsType } from '../profile-type'
import { Observable } from 'rxjs'
import { CustomerType } from '../customer-type'
// import { encodeTextURL } from '../../utils/wm-functions'

@Component({
  selector: 'app-pdv',
  templateUrl: './pdv.component.html',
  styleUrls: ['./pdv.component.scss'],
})
export class PdvComponent implements OnInit, AfterViewChecked {
  pageType: 'pdv' | 'bartender'
  activeTab: 'counter' | 'table' | 'tables' | 'resume'
  deviceWidth: number
  queueAudio = new Audio('../../assets2/sino.mp3')

  activeCategory: number
  originalCategories: any = []
  allProducts: any[]
  allPizzas: any[]

  cartRequest: CartRequestType
  cart: CartType[] = []
  cartPizza: CartFlavorPizzaType[] = []
  cupom: CupomType | null
  addressSelectedId: number

  profileOptions: ProfileOptionsType
  placeholders: ProfileOptionsType
  lastCart: CartRequestType

  bartender = ''
  table: TableType
  persistBartender = false

  client: CustomerType

  filter: 'whatsapp' | 'name' = 'whatsapp'
  search: string

  packageHours: any = {}
  desnableButton: boolean = false

  activeCashierInterval: any

  message: string = ''
  loading: boolean = false

  faCashRegister = faCashRegister
  faUser = faUser
  faPhone = faPhone
  faSearch = faSearch
  faShoppingBasket = faShoppingBasket
  faChevronUp = faChevronUp
  faChevronDown = faChevronDown
  faEdit = faEdit
  faTrash = faTrashAlt
  faBars = faBars
  faArrowLeft = faArrowLeft
  faCircle = faCircle

  constructor(
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public printService: PrintService,
    private matDialog: MatDialog,
    public cartService: CartService,
    private route: ActivatedRoute,
    private websocket: WebsocketService,
    private storeService: StoreService,
    private electronService: ElectronService
  ) {}

  ngOnInit(): void {
    this.cartRequest = {
      paymentType: 'local',
      status: null,
      clientId: null,
      addressId: null,
      cupomId: null,
      commandId: null,
      bartenderId: null,
      itens: [],
      cashierId: null,
      formsPayment: [],
      obs: '',
      packageDate: null,
      taxDelivery: -1,
      total: 0,
      type: 'D',
    }
    this.loadPDVCart()

    this.deviceWidth = window.innerWidth
    this.route.url.subscribe((segments) => {
      this.pageType = segments[1]?.path === 'pdv' ? 'pdv' : 'bartender'
    })
    this.route.params.subscribe(async (params) => {
      try {
        this.context.profile = await this.api.getClientData(params.slug, 'pdv', sessionStorage.getItem('bartenderId'))
        if (this.context.profile.plans.every((plan) => plan.category === 'basic')) {
          this.cartRequest.type = 'D'
        }
        if (this.context.profile.plans.every((plan) => plan.category === 'package')) {
          this.cartRequest.type = 'P'
        }
        if (this.context.profile.plans.every((plan) => plan.category === 'table')) {
          this.cartRequest.type = 'T'
        }
        if (!this.context.profile.options.pdv.cashierManagement && this.pageType === 'pdv') {
          const defaultCashier = this.context.profile.bartenders.find((bartender) => bartender.controls.defaultCashier)
          sessionStorage.setItem('bartenderId', defaultCashier?.id.toString())
        }
        if (this.context.profile.options.pdv.cashierManagement && !sessionStorage.getItem('bartenderId') && this.pageType === 'pdv') {
          this.openCashierLogin()
        } else {
          this.context.activeBartender = this.context.profile.bartenders.find(
            (bartender) => bartender.id == JSON.parse(sessionStorage.getItem('bartenderId'))
          )
          // this.context.activeBartender = (!this.context.profile.options.pdv.cashierManagement && this.pageType === "pdv") ? null : this.context.profile.bartenders.find(bartender => bartender.id === JSON.parse(sessionStorage.getItem('bartenderId')))
          if (this.context.activeBartender) {
            this.context.activeBartender.controls.activeCashier = this.context.profile.cashiers.find(
              (cashier) => cashier.bartenderId === this.context.activeBartender?.id
            )
          }

          if (!this.context.activeCashier) {
            this.activeCashierInterval = setInterval(() => {
              this.context.activeCashier = this.context.profile.cashiers.find((cashier) => {
                return cashier.bartenderId === this.context.activeBartender?.id
              })

              if (this.context.activeCashier) {
                clearInterval(this.activeCashierInterval)
              }
            }, 1000)
          }

          if (this.context.profile.plans.length === 1) {
            switch (this.context.profile.plans[0].category) {
              case 'basic':
                this.cartRequest.type = 'D'
                break
              case 'table':
                this.cartRequest.type = 'T'
                break
              case 'package':
                this.cartRequest.type = 'P'
                break
            }
          }
          if (this.pageType === 'pdv') {
            if (this.context.activeBartender && !this.context.activeBartender.controls.activeCashier) {
              this.openCashier()
            } else {
              this.checkCashier()
            }
          }
        }

        this.context.packageLabel = this.context.profile.options.package.label2 ? 'Agendamento' : 'Encomenda'
        // AINDA ALTERAR

        // this.context.profile.categories = this.context.profile.categories.filter(category => {
        //   let lengthCondition = true
        //   if (category.type === 'default') {
        //     lengthCondition = !!category.products.length
        //   } else {
        //     lengthCondition = !!category.product.flavors.length
        //   }
        //   return category.disponibility.store.table && lengthCondition
        // })
        this.persistBartender = this.context.profile.options.table?.persistBartender ? true : false
        this.storeService.verifyDateDisponibility(this.context.profile.categories)

        this.activeCategory = this.context.profile.categories.length ? this.context.profile.categories[0].id : 0
        this.originalCategories = this.context.profile.categories.map((category) => this.cartService.copyObj(category))
        this.allProducts = this.context.profile.categories.flatMap((category) => category.products).filter((category) => category)
        this.allPizzas = this.context.profile.categories
          .flatMap((category) => category.pizzas?.map((pizza) => ({ ...pizza, pizzaId: category.product.id })))
          .filter((category) => category)
        this.cartService.profile = this.context.profile
        this.context.tables = this.context.profile.tables.map((t) => new Table(t))

        this.websocket.connect.subscribe(
          async ({
            type,
            data,
          }: {
            type: 'connection' | 'request' | 'command' | 'menu' | 'profile'
            data: {
              connection?: WebSocket
              request?: CartRequestType
              command?: Command
              finish?: 'table' | 'command'
              tableId: number
              tableStatus?: boolean
              type?: 'join' | 'leave'
              bartender?: Array<{ id: number; commandId: number; commandName: string; created_at: string; openedId: number; tableId: number }>
            }
          }) => {
            this.websocket.subscribe('request', this.context.profile.slug)
            this.websocket.subscribe('profile', this.context.profile.slug)

            this.websocket.subscribe('command', this.context.profile.slug)
            if (this.context.profile.options.print.app) {
              this.websocket.subscribe('print', this.context.profile.slug)
            }
            switch (type) {
              case 'request':
                if (data.request.type !== 'T') {
                  if (
                    data.request.type === 'P' &&
                    this.context.profile.options.package.cashierDate === 'deliveryDate' &&
                    DateTime.fromFormat(data.request.packageDate, 'yyyy-MM-dd HH:mm:ss').diffNow('days').days > 1
                  ) {
                    break
                  }
                  if (!this.context.activeCashier.carts.some((c) => c.code === data.request.code)) {
                    this.context.activeCashier.carts.push(data.request)
                  }
                } else {
                  const tableToUpdateIndex = this.context.tables.findIndex((table) => table.id === data.request.command.opened.tableId)
                  if (tableToUpdateIndex !== -1) {
                    const commandToUpdateIndex = this.context.tables[tableToUpdateIndex].opened?.commands.findIndex(
                      (command) => command.id === data.request.commandId
                    )
                    if (commandToUpdateIndex !== -1) {
                      const commandToUpdate = this.context.tables[tableToUpdateIndex].opened.commands[commandToUpdateIndex]
                      if (!commandToUpdate.carts.some((c) => c.code === data.request.code)) {
                        commandToUpdate.carts.push(data.request)
                      }
                      if (this.context.activeCommandId === data.request.commandId) {
                        this.context.getActiveCommand().carts = commandToUpdate.carts
                      }
                    }
                  }
                }
                break
              case 'command':
                setTimeout(() => {
                  let table = this.context.tables.find((table) => table.id === data.command?.tableId)
                  if (table) {
                    if (!this.context.activeCommandId) {
                      this.context.activeCommandId = data.command.id
                    }
                    if (table.opened) {
                      const alreadyExistisCommandIndex = table.opened.commands.findIndex((command) => command.id === data.command.id)
                      if (alreadyExistisCommandIndex !== -1) {
                        if (!data.finish) {
                          if (!data.command.status) {
                            table.opened.commands = table.opened.commands.filter((command) => command.id !== data.command.id)
                          }
                        } else {
                          if (data.finish === 'command' && (!this.context.getActiveCommand() || !this.context.getActiveCommand().printMode)) {
                            const openedCommands = (table.opened.commands = table.opened.commands.filter((command) => command.id !== data.command.id))
                            if (openedCommands.length) {
                              table.opened.commands = table.opened.commands.filter((command) => command.id !== data.command.id)
                            } else {
                              table.opened = undefined
                            }
                          }
                        }
                      } else {
                        table.opened.commands.push(new Command(data.command))
                      }
                    } else {
                      const { tableId, tableOpenedId } = data.command
                      table.opened = new TableOpened({
                        id: tableOpenedId,
                        tableId,
                        commands: [data.command],
                        fees: [],
                        formsPayment: [],
                        status: true,
                      })
                    }
                  }

                  table = this.context.tables.find((t) => {
                    return t.id === data.tableId
                  })

                  if (data.tableStatus !== undefined) {
                    table.status = data.tableStatus
                  }

                  if (data.finish === 'table' && !table.printMode) {
                    table.opened = undefined
                  }
                }, 500)
                break
              case 'menu':
                this.context.profile = await this.api.getClientData(this.context.profile.slug, 'pdv', sessionStorage.getItem('bartenderId'))
                this.storeService.verifyDateDisponibility(this.context.profile.categories)
                break
              case 'profile':
                this.context.profile.options.queues?.bartender.push(data as any)
                if (data.type === 'join') {
                  navigator.vibrate(500)
                  this.queueAudio.play()
                }
                if (data.type === 'leave' && this.context.profile.options.queues) {
                  this.context.profile.options.queues.bartender = data.bartender
                }
              default:
                break
            }
          }
        )
      } catch (error) {
        console.error(error)
        throw error
      }
    })
  }

  ngAfterViewChecked(): void {
    if (!!this.context.activeCashier) {
      clearInterval(this.activeCashierInterval)
    }
    this.cartRequest.clientId = this.client?.id ?? null
    this.cartRequest.cashierId =
      this.context.profile?.cashiers.find((cashier) => cashier.bartenderId === this.context.activeBartender?.id)?.id ?? null
    this.cartRequest.bartenderId = this.context.activeBartender?.id
    this.cartRequest.commandId = this.cartRequest.type === 'T' ? Number(this.context.activeCommandId) : null
    this.cartRequest.cupomId = this.cupom?.id
    this.cartRequest.taxDelivery = this.cartRequest.type === 'T' ? 0 : this.cupom?.type === 'freight' ? 0 : this.cartRequest.taxDelivery
    this.cartRequest.packageDate = this.cartRequest.type === 'P' ? this.cartRequest.packageDate : null
    this.cartRequest.secretNumber = this.client?.secretNumber
    if (this.client) {
      const address = this.client?.addresses.find((address) => address.id === this.cartRequest.addressId)
      if (address) {
        let tax

        if (this.context.profile?.typeDelivery === 'km') {
          tax = this.context.profile?.taxDelivery.find((tax) => tax.distance >= address?.distance / 1000)
        }

        if (this.context.profile?.typeDelivery === 'neighborhood') {
          tax = this.context.profile?.taxDelivery
            .filter((tax) => tax.city.toLocaleLowerCase().trim() === address.city.toLocaleLowerCase().trim())
            .flatMap((tax) => tax.neighborhoods)
            .find((neighborhood) => neighborhood.name.toLocaleLowerCase().trim() === address.neighborhood.toLocaleLowerCase().trim())
        }

        if (tax) {
          this.cartRequest.taxDelivery = isNaN(Number(tax.value)) ? tax.value : Number(tax.value)
        } else {
          this.cartRequest.taxDelivery = -1
        }
      }
    }
    if (this.pageType === 'bartender') {
      this.cartRequest.type = 'T'
    }
  }

  onNavChange() {
    if (this.activeTab !== 'counter') {
      this.cartRequest.type = 'T'
    } else {
      this.cartRequest.type = 'D'
    }
  }

  // NAVIGATION
  /** Seta aba ativa  */
  public setActiveTab(event: any): void {
    this.activeTab = event
  }

  /** Carrega o carrinho do PDV */
  private loadPDVCart(): void {
    const cartStoragePdv = JSON.parse(localStorage.getItem('cart_pdv'))
    if (cartStoragePdv) {
      this.cart = cartStoragePdv.cart || []
      this.cartPizza = cartStoragePdv.cartPizza || []
    }
  }

  /** Formata para url substituindo o [NOME] pelo valor de name passado */
  private encodeTextURL = (name: string, text: string) => {
    return encodeURIComponent(text.replaceAll('[NOME]', name))
  }

  /** Envia mensagem para o whatsapp */
  public sendToWhatsApp = () => {
    if (this.lastCart.client) {
      const { linkWhatsapp, whatsappOficial } = this.context.profile.options ?? {}
      const isWindows = navigator.userAgent.includes('Windows')
      const phoneNumber = `55${this.lastCart.client.whatsapp}`
      let message = this.context.profile.options.placeholders.sendWhatsMessage

      message = this.encodeTextURL(this.lastCart.client.name, message)
      message += `\n\n ${window.location.protocol}//${window.location.host}/${this.context.profile.slug}/status/${this.lastCart.code}`
      if (whatsappOficial || (linkWhatsapp && !isWindows)) {
        window.open(`whatsapp://send?phone=${phoneNumber}&text=${message}`)
        return
      }
      if (this.electronService.isElectron && linkWhatsapp) {
        const botMessage = `${this.context.profile.options.placeholders.sendWhatsMessage.replaceAll('[NOME]', this.lastCart.client.name)}\n\n ${
          window.location.protocol
        }//${window.location.host}/${this.context.profile.slug}/status/${this.lastCart.code}`
        this.electronService.sendMessage(phoneNumber, botMessage, this.lastCart.client)
        return
      }
      window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`)
    }
  }

  /** Armazena o carrinho no localStorage quando muda de aba (counter -> tables/table | tables/table -> counter) */
  public localCarts(changeEvent: NgbNavChangeEvent): void {
    if (changeEvent.activeId === 'counter') {
      const cart_table = JSON.parse(localStorage.getItem('cart_table'))
      const cartPizza_table = JSON.parse(localStorage.getItem('cartPizza_table'))
      localStorage.setItem('cart_delivery', JSON.stringify(this.cart))
      localStorage.setItem('cartPizza_delivery', JSON.stringify(this.cartPizza))
      this.cart = cart_table ?? []
      this.cartPizza = cartPizza_table ?? []
    }
    if (changeEvent.activeId === 'tables' || changeEvent.activeId === 'table') {
      const cart_delivery = JSON.parse(localStorage.getItem('cart_delivery'))
      const cartPizza_delivery = JSON.parse(localStorage.getItem('cartPizza_delivery'))
      localStorage.setItem('cart_table', JSON.stringify(this.cart))
      localStorage.setItem('cartPizza_table', JSON.stringify(this.cartPizza))
      if (changeEvent.nextId === 'counter') {
        this.cart = cart_delivery ?? []
        this.cartPizza = cartPizza_delivery ?? []
      }
    }
  }

  // MODALS
  public openCashierLogin(): void {
    this.matDialog
      .open(CashierLoginComponent, {
        maxWidth: '100vw',
        height: this.deviceWidth < 600 ? '100vh' : '35vh',
        width: this.deviceWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ open }) => {
          this.checkCashier(open)
        },
        (err) => console.error
      )
  }

  public openCashier(): void {
    if (
      !this.context.profile.options.pdv.cashierManagement ||
      (this.context.profile.options.pdv.cashierManagement && (this.context.activeBartender || this.context.activeCashier))
    ) {
      this.matDialog.open(CashierComponent, {
        maxWidth: '100vw',
        height: '100vh',
        width: '100vw',
        autoFocus: false,
      })
    } else {
      this.openCashierLogin()
    }
  }

  public openClientRegister(data?: { type: 'create' | 'update'; client?: any }): void {
    if (data.type === 'update') {
      data.client = this.client
    }
    this.matDialog
      .open(ClientStoreComponent, {
        data,
        maxWidth: '100vw',
        height: this.deviceWidth < 600 ? '100vh' : '80vh',
        width: this.deviceWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ client }) => {
          if (client) {
            this.cartRequest.type = null
            this.client = client
            if (this.client.addresses.length && !this.cartRequest.addressId) {
              this.cartRequest.addressId = this.client.addresses[0].id
            }
            if (!this.cartRequest.type) this.openCartType()
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public openCartType(): void {
    if (
      this.context.profile.plans.flatMap((plan) => plan.category).includes('basic') &&
      this.context.profile.plans.flatMap((plan) => plan.category).includes('package')
    ) {
      this.matDialog
        .open(CartTypeComponent, {
          maxWidth: '100vw',
          height: window.innerWidth < 600 ? '100vh' : '60vh',
          width: window.innerWidth < 600 ? '100vw' : '700px',
          disableClose: true,
        })
        .afterClosed()
        .subscribe(
          ({ type }) => {
            this.cartRequest.type = type
          },
          (error) => {
            console.error(error)
          }
        )
    } else {
      this.cartRequest.type = this.context.profile.plans.flatMap((plan) => plan.category).includes('package') ? 'P' : 'D'
    }
  }

  public openCartRepeat(client, request): void {
    this.matDialog
      .open(CartRepeatComponent, {
        data: {
          client,
          request,
          cart: this.cart,
          cartPizza: this.cartPizza,
          cartRequest: this.cartRequest,
        },
        maxWidth: '100vw',
        height: this.deviceWidth < 600 ? '100vh' : '60vh',
        width: this.deviceWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ confirm, cart, cartPizza, addressSelectedId }) => {
          this.addressSelectedId = addressSelectedId
          if (confirm) {
            this.cart = cart
            this.cartPizza = cartPizza
            this.openNewCart()
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public async openNewCart(): Promise<void> {
    if (this.cartRequest.type === 'T') {
      await this.storeCart()
      this.setActiveTab('tables')
      return
    } else {
      if (!this.cart.length && !this.cartPizza.length) {
        return this.toastService.show(`Carrinho Vazio!`, { classname: 'bg-warning text-black text-center pos middle-center', delay: 3000 })
      }
      this.matDialog
        .open(CartResumeComponent, {
          data: {
            cupom: this.cupom,
            packageHours: this.packageHours,
            client: this.client,
            cartRequest: this.cartRequest,
            cart: this.cart,
            cartPizza: this.cartPizza,
            addressSelectedId: this.cartRequest.addressId,
          },
          maxWidth: '100vw',
          height: this.deviceWidth < 600 ? '100vh' : '85vh',
          width: this.deviceWidth < 600 ? '100vw' : '700px',
          autoFocus: false,
          disableClose: true,
        })
        .afterClosed()
        .subscribe(
          ({ client, focusSearch, addressId, cupom, packageDate, toPayment, packageHours, addressSelectedId }) => {
            this.addressSelectedId = addressSelectedId
            if (client) {
              this.client = client
            }
            if (focusSearch) {
              const search = document.getElementById('clientSearchInput') as HTMLInputElement
              if (search) {
                search.focus()
              }
            }
            this.cartRequest.packageDate = packageDate ? packageDate : null
            this.cartRequest.addressId = addressId
            if (cupom) {
              this.cupom = cupom
            }
            if (toPayment) {
              this.openPayment({ client: this.client, cartRequest: this.cartRequest })
            }
            if (packageHours) {
              this.packageHours = packageHours
            }
          },
          (error) => {
            console.error(error)
          }
        )
    }
  }

  public openNewCommand(): void {
    this.matDialog
      .open(NewcommandComponent, {
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '35vh',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        async ({ name, createCommand }) => {
          const cashier = this.context.profile.cashiers.find((cashier) => cashier.bartenderId === this.context.activeBartender?.id)
          try {
            if (createCommand && name) {
              const result = await this.api.postCommand({
                name,
                status: 1,
                slug: this.context.profile.slug,
                tableId: this.context.activeTableId,
                cashierId: cashier?.id,
              })

              let table = this.context.tables.find((table) => table.id === result.command.tableId)

              if (table) {
                table.opened = new TableOpened(result.opened)
                table.opened.commands.push(new Command(result.command))
                this.context.activeCommandId = result.command.id
              }
            }
          } catch (error) {
            console.error(error)
            return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public openCommands(): void {
    this.matDialog
      .open(CommandsComponent, {
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : 'auto',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ command }: { command: Command }) => {
          if (command?.haveCarts()) {
            this.openPayment({ cartRequest: this.cartRequest, tableType: 'command' })
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public async openPayment(data?: {
    client?: any
    cartRequest?: CartRequestType
    cupom?: CupomType | null
    tableType?: 'command' | 'table'
  }): Promise<void> {
    if (data.tableType === 'table' && !this.context.getActiveTable()?.haveCarts()) {
      await this.closeTable()
      return
    }

    this.matDialog
      .open(PaymentComponent, {
        data: {
          ...data,
          cartRequest: { ...this.cartRequest, itens: this.cartService.cartItem(this.cart, this.cartPizza, this.cartRequest.type) },
          cupom: this.cupom,
        },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '85vh',
        width: window.innerWidth < 600 ? '100vw' : '745px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ goBack, formsPayment, finishCartRequest, commandId, tableEmpty, cancel, addonValue, cart }) => {
          if (this.activeTab === 'table' && !this.context.activeTableId) {
            this.setActiveTab('tables')
          }
          this.cartRequest.formsPayment = formsPayment
          if (goBack) {
            return this.openNewCart()
          }
          if (
            this.cartRequest.formsPayment?.find((form) => form.payment === 'pix') &&
            !this.context.profile.options.legacyPix &&
            this.context.profile.options.asaas
          ) {
            this.cartRequest.paymentType = 'online'
            this.cartRequest.statusPayment = 'pending'
          }
          if (finishCartRequest && formsPayment.length) {
            return this.storeCart(cart)
          }
          if (data.tableType && !cancel) {
            if (this.context.getActiveTable() && data.tableType === 'table') {
              this.context.getActiveTable().printMode = true
            }
            if (this.context.getActiveCommand() && data.tableType === 'command') {
              this.context.getActiveCommand().printMode = true
            }
            this.openConfirmPrint({ type: data.tableType, commandId, tableEmpty })
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public async openConfirmPrint(data: { type: 'command' | 'table'; commandId?: number; tableEmpty: boolean }) {
    try {
      this.matDialog
        .open(ConfirmPrintComponent, {
          data,
          disableClose: true,
        })
        .afterClosed()
        .subscribe(() => {
          if (data.type === 'table') {
            this.toastService.show(`Mesa ${this.context.getActiveTable().name} encerrada.`, {
              classname: 'bg-success text-light text-center pos middle-center',
              delay: 3000,
            })
            this.context.getActiveTable().opened = undefined
            this.setActiveTab('tables')
            this.context.getActiveTable().printMode = false
          }
          if (data.type === 'command') {
            this.context.closeCommandEffect(this.context.getActiveCommand())
            this.toastService.show(
              data.tableEmpty
                ? `Mesa ${this.context.getActiveTable().name} encerrada.`
                : `Comanda ${this.context.getActiveCommand().name} encerrada.`,
              { classname: 'bg-success text-light text-center pos middle-center', delay: 3000 }
            )
            if (data.tableEmpty) {
              this.context.activeTableId = null
              this.setActiveTab('tables')
            }
            if (this.context.getActiveCommand()) {
              this.context.getActiveCommand().printMode = false
            }
          }
        })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  public openSwitchTable(): void {
    this.matDialog
      .open(SwitchTableComponent, {
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : '55vh',
        width: window.innerWidth < 600 ? '100vw' : '745px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        async (data: { newTableId: number; oldTableId: number | null; commandsIds: number[] }) => {
          if (data) {
            try {
              const result = await this.api.changeTable(data)
              this.context.getActiveTable().opened = result.oldTableOpened.commands.length ? new TableOpened(result.oldTableOpened) : undefined
              const newTableWithCommands = this.context.tables.find((t) => t.id === result.newTableOpened.tableId)
              if (newTableWithCommands) {
                newTableWithCommands.opened = new TableOpened(result.newTableOpened)
              }
            } catch (error) {
              console.error(error)
              return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
            }
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public openAddress(): void {
    this.matDialog
      .open(ClientAddressComponent, {
        data: { type: 'create', clientId: this.client.id },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : 'auto',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(
        ({ address }) => {
          if (address) {
            this.cartRequest.addressId = address.id
            this.client.addresses.push(address)
          }
        },
        (error) => {
          console.error(error)
        }
      )
  }

  public openAlert({ message, title, onClose }: { message: string; title?: string; onClose?: () => void }): void {
    this.matDialog
      .open(AlertComponent, {
        data: {
          title,
          message,
          closeCallback: async () => {
            await this.api.closeCashier({
              bartenderId: this.context.activeBartender?.id,
              closedValues: {},
              slug: this.context.profile.slug,
              cashierId: this.context.activeCashier.id,
            })
            window.location.reload()
          },
        },
        maxWidth: '100vw',
        height: window.innerWidth < 600 ? '100vh' : 'auto',
        width: window.innerWidth < 600 ? '100vw' : '500px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(() => {
        onClose()
      })
  }

  // CART
  /** Limpa todos os carrinhos (delivery/package, table, localStorage) */
  public clearCarts(): void {
    localStorage.removeItem('cart_delivery')
    localStorage.removeItem('cartPizza_delivery')
    localStorage.removeItem('cart_table')
    localStorage.removeItem('cartPizza_table')
    localStorage.removeItem('cart_pdv')
    this.cart = []
    this.cartPizza = []
  }

  /** Retorna data passada no formato dd/MM/yyyy */
  public requestDate(date: string): string {
    return DateTime.fromSQL(date).toFormat('dd/MM/yyyy')
  }

  /** Limpa todos os dados no pedido */
  public clearAll(): void {
    this.cartRequest = {
      paymentType: 'local',
      status: null,
      clientId: null,
      addressId: null,
      cupomId: null,
      commandId: null,
      bartenderId: null,
      cashierId: null,
      formsPayment: [],
      itens: [],
      obs: '',
      packageDate: null,
      taxDelivery: this.cartRequest.taxDelivery,
      total: 0,
      type: this.cartRequest.type,
    }
    this.context.activeTableId = null
    this.client = null
    this.cupom = null
    this.clearCarts()
  }

  // CASHIER
  public checkCashier(open?: boolean) {
    if (DateTime.local().diff(DateTime.fromSQL(this.context.activeBartender?.controls.activeCashier?.created_at), 'days').days > 1) {
      this.openAlert({
        message: 'Existe um caixa aberto há mais de 24 horas e ele será encerrado',
        onClose: async () => {
          await this.api.closeCashier({
            bartenderId: this.context.activeBartender?.id ?? null,
            slug: this.context.profile?.slug,
            closedValues: [],
            cashierId: this.context.activeCashier.id,
          })
          location.reload()
        },
      })
    } else if (open) {
      this.openCashier()
    }
  }

  // API

  /** Busca clientes por nome ou whatsapp e abre o modal de listagem de clientes caso o resultado da busca for maior que um */
  public async getClientBy(event: any): Promise<void> {
    event.preventDefault()
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
    if (button) {
      button.disabled = true
    }
    try {
      const clients: any = await this.api.clientSearch({ slug: this.context.profile.slug, filter: this.filter, search: this.search })
      if (this.filter === 'name' && clients.length > 1) {
        this.matDialog
          .open(ClientSearchListComponent, {
            data: { clients },
            maxWidth: '100vw',
            height: this.deviceWidth < 600 ? '100vh' : 'auto',
            width: this.deviceWidth < 600 ? '100vw' : '500px',
            disableClose: true,
          })
          .afterClosed()
          .subscribe(
            ({ client }) => {
              if (client) {
                this.client = client
                this.cartRequest.addressId = this.client?.addresses.length ? this.client.addresses[0].id : null
                this.openCartType()
              }
            },
            (error) => {
              console.error(error)
            }
          )
      }
      if (this.filter === 'whatsapp' || clients.length === 1) {
        this.client = clients[0]
        this.cartRequest.addressId = this.client?.addresses.length ? this.client.addresses[0].id : null
        this.openCartType()
      }
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
        button.disabled = false
      }
    }
  }

  /** Envia o pedido para o servidor */
  public async storeCart(cart: CartRequestType | null = null): Promise<void> {
    const button = document.getElementById('storeCartButton') as HTMLButtonElement
    try {
      if (button) {
        button.disabled = true
      }
      if (!cart) {
        const { cart: cartResponse } = await this.api.storeCart({
          slug: this.context.profile.slug,
          cartRequest: { ...this.cartRequest, itens: this.cartService.cartItem(this.cart, this.cartPizza, this.cartRequest.type) },
          userAgent: navigator.userAgent,
        })
        cart = cartResponse
        this.lastCart = cartResponse
      }
      const cashier = this.context.profile.cashiers.find((c) => c.bartenderId === this.context.activeBartender?.id)
      if (cart.commandId) {
        const haveCommand = this.context.tables
          .flatMap((t) => t.opened?.commands)
          .filter((c) => c)
          .find((c) => c.id === cart.commandId)
        if (haveCommand) {
          if (!haveCommand.carts.some((c) => c.code === cart.code)) {
            haveCommand.carts.push(cart)
          }
        }
      }

      if (cashier && cart) {
        if (!cashier.carts) {
          cashier.carts = []
        }
        if (!cashier.carts.some((c) => c.code === cart.code)) {
          cashier.carts.push(cart)
        }
      }

      this.clearAll()
      this.search = ''
      if (
        this.cartRequest.formsPayment?.find((form) => form.payment === 'pix') &&
        !this.context.profile.options.legacyPix &&
        this.context.profile.options.asaas
      ) {
        this.cartRequest.paymentType = 'online'
        this.cartRequest.statusPayment = 'pending'
      }

      if (this.context.profile.options.pdv?.sendWhatsMessage) {
        this.sendToWhatsApp()
      }

      return this.toastService.show(`Pedido registrado com sucesso!`, {
        classname: 'bg-success text-light text-center pos middle-center',
        delay: 3000,
      })
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
        button.disabled = false
      }
    }
  }

  /** Encerra a mesa ativa */
  public async closeTable(): Promise<void> {
    if (this.context.getActiveTable()) {
      try {
        const { cashier } = await this.api.closeTable(this.context.getActiveTable(), this.context.profile.slug, [], this.context.activeCashier.id)
        this.context.activeCashier = cashier
        this.context.getActiveTable().opened = undefined
        this.setActiveTab('tables')
      } catch (error) {
        console.error(error)
        return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      }
    }
  }

  /** Altera o status da mesa */
  public async tablesStatus(): Promise<void> {
    try {
      const result: any = await this.api.tablesStatus(this.context.activeTableId)
      this.context.getActiveTable().status = result.status
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    }
  }

  /** Altera o noma da mesa caso ja exista mesa nome */
  public formatTableName(name: string) {
    return name.toLowerCase().replace('mesa', '')
  }

  /** Cancela  um carrinho */
  public async cancelCart(cart: any): Promise<void> {
    try {
      const result: any = await this.api.changeCartStatus('canceled', cart.id, this.context.profile.slug)
      cart.status = result.cart.status
      if (!this.context.getActiveTable()?.haveCarts()) {
        this.activeTab = 'table'
      }
      return this.toastService.show(`Pedido cancelado com sucesso!`, {
        classname: 'bg-success text-light text-center pos middle-center',
        delay: 3000,
      })
    } catch (error) {
      console.error(error)
      return this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    }
  }
  // UTILS

  public trackBy(index: number, item: any): number {
    return item.id
  }

  /** Retorna a diferença de tempo da data passada */
  public diffTime(time: string): string {
    return formatDistanceToNow(new Date(time), {
      locale: ptBR,
      addSuffix: true,
    })
  }

  public async printTable() {
    this.printService.printTable({ table: this.context.getActiveTable(), profile: this.context.profile })
  }

  public checkPlans() {
    return this.context.profile.plans.some((plan) => plan.category === 'basic' || plan.category === 'package')
  }

  public checkTablePlan() {
    return this.context.profile.plans.some((plan) => plan.category === 'table')
  }

  public calcDeviceHeight() {
    if (window.innerHeight <= 600) {
      return '40vh'
    }
    if (window.innerHeight <= 700) {
      return '48vh'
    }
    return '57.5vh'
  }

  deleteAddress(addressId: number) {
    this.api
      .deleteAddress(this.context.profile.slug, this.client.id, addressId)
      .then((observable: Observable<any>) => {
        observable.subscribe(
          (data) => {
            this.client.addresses = this.client.addresses.filter((address) => address.id !== addressId)
            this.toastService.show(`Endereço excluido com sucesso.`, {
              classname: 'bg-success text-light text-center pos middle-center',
              delay: 3000,
            })
          },
          (error) => {
            throw error
          }
        )
      })
      .catch((error) => {
        this.toastService.show(error.error?.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      })
  }
}
