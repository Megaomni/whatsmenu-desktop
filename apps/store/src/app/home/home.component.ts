import { ViewportScroller } from '@angular/common'
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { DateTime } from 'luxon'
import { SwiperConfigInterface } from 'ngx-swiper-wrapper'
import { CartDetailsComponent } from '../modals/cart-details/cart-details.component'
import { MoreinfoComponent } from '../modals/moreinfo/moreinfo.component'
import { CategoryType } from './../category-type'
import { TableResumeComponent } from './../modals/table-resume/table-resume.component'
import { PizzaFlavorType, PizzaSizeType } from './../pizza-product-type'
import { QrcodeComponent } from './../qrcode/qrcode.component'
import { TableType } from './../table-type'
import { TableComponent } from './../table/table.component'

import { animate, state, style, transition, trigger } from '@angular/animations'

import { ApiService } from '../services/api/api.service'

import { CartFlavorPizzaType } from '../cart-pizza'
import { CartType } from '../cart-type'
import { DeliveryType } from '../delivery-type'
import { PizzaProductType } from '../pizza-product-type'
import { ComplementType, ProductType } from '../product-type'

import { MatBottomSheet } from '@angular/material/bottom-sheet'
import {
  faBellConcierge,
  faCalendarDay,
  faChevronRight,
  faClock,
  faMoneyCheck,
  faMotorcycle,
  faReceipt,
  faSearch,
  faShoppingBasket,
  faStore,
  faTable,
} from '@fortawesome/free-solid-svg-icons'
import Command, { CommandType } from 'src/classes/command'
import { AddressType } from '../address-type'
import { AddressComponent, AddressComponentData } from '../address/address.component'
import { CartRequestType } from '../cart-request-type'
import { CupomType } from '../cupom'
import { CustomerType } from '../customer-type'
import { AddonFormPaymentType } from '../formpayment-type'
import { AlertComponent } from '../modals/alert/alert.component'
import { CartPaymentComponent, CartPaymentComponentData } from '../modals/cart-payment/cart-payment.component'
import { CartComponent } from '../modals/cart/cart.component'
import { ProductComponent } from '../modals/cart/product/product.component'
import { ClientidComponent } from '../modals/clientid/clientid.component'
import { LatestRequestsComponent } from '../modals/latest-requests/latest-requests.component'
import { ListAdressesComponent } from '../modals/list-adresses/list-adresses.component'
import { PizzaComponent, PizzaComponentData } from '../modals/pizza/pizza.component'
import { ProductOptionsComponent } from '../modals/product-options/product-options.component'
import { ProfileType } from '../profile-type'
import { CartService } from '../services/cart/cart.service'
import { ComponentService } from '../services/components/component.service'
import { ContextService } from '../services/context/context.service'
import { TranslateService } from '../translate.service'
import { I18n } from '../services/ngb-datepicker/ngb-datepicker.service'

declare const fbq: any

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [trigger('fade', [state('void', style({ opacity: 0 })), transition(':enter', [animate(300)]), transition(':leave', [animate(500)])])],
})
export class HomeComponent implements OnInit, AfterViewChecked {
  clientData: ProfileType
  clientCategories: CategoryType[] = []
  customer: CustomerType
  filter = ''
  allProducts: ProductType[] = []
  allPizzas: PizzaFlavorType[] = []
  cart: CartType[] = []
  cartPizza: CartFlavorPizzaType[] = []
  maxDescription: string
  addon: AddonFormPaymentType
  cartRequest: CartRequestType = {
    paymentType: null,
    status: null,
    clientId: null,
    addressId: null,
    cupomId: null,
    commandId: null,
    bartenderId: null,
    itens: [],
    cashierId: null,
    obs: null,
    type: 'D',
    taxDelivery: -1,
    formsPayment: [],
    total: 0,
    packageDate: null,
  }
  cupom: CupomType
  private requestCode = 0

  hour: string
  relogio: any
  fusos: any
  tableRequest: boolean
  table: TableType
  commandSession = JSON.parse(sessionStorage.getItem('command'))
  commandSessionInterval: any
  enableSend = true
  taxDeliveryValue = -1
  timeDelivery: string
  notNeedTransshipment = false
  timeOutLoad: any
  delivery: DeliveryType = {
    formPayment: '',
    transshipment: '',
    name: '',
    contact: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    reference: '',
    city: '',
    latitude: NaN,
    longitude: NaN,
    distance: NaN,
  }
  activeCategory: string
  activeScrollCategory: string
  disponibilityText: string
  enableDeliveryAddress: boolean
  cupomIsValid: boolean
  clientInfo: { id: number | null; defaultAddressId: number | null } = { id: null, defaultAddressId: null }
  linkCupom: string

  // ICONS
  chevronRight = faChevronRight
  magnifying = faSearch
  motorcycle = faMotorcycle
  clock = faClock
  storeIcon = faStore
  faShoppingBasket = faShoppingBasket
  faCalendarDay = faCalendarDay
  faMoneyCheck = faMoneyCheck
  faReceipt = faReceipt
  faTable = faTable
  faBellConcierge = faBellConcierge
  public isCollapsed = false

  // Encomendas Variaveis
  packageHours = {}
  datesAndHoursLength = false
  packageDate: DateTime | null = null // Data e hora do pedido
  viewContentAlternate = 'D' // Alterna Abas
  cookieP = false // Desabilita a barra de abas se não Encomendas
  tableButtons: any // Desabilita a barra de abas caso, Mesa
  allProductsPackage: ProductType[] = [] // Todos Produtos de Encomendas
  openingHoursCollapse = true
  taxValueNull = this.taxDeliveryValue
  firstMenuElement: any

  @ViewChild('formaPagamento') pagamentoModal
  @ViewChild('companyButton') companyButton: ElementRef<HTMLAnchorElement>

  swiperConfig: SwiperConfigInterface = {
    slidesPerView: 3,
    spaceBetween: 10,
    breakpoints: {
      1024: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 30,
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 30,
      },
      320: {
        slidesPerView: 1,
        spaceBetween: 30,
      },
    },
  }
  faUser: any

  constructor(
    public api: ApiService,
    public translate: TranslateService,
    private route: ActivatedRoute,
    private viewportscroller: ViewportScroller,
    private titleService: Title,
    private matDialog: MatDialog,
    private router: Router,
    public context: ContextService,
    public cartService: CartService,
    private _bottomSheet: MatBottomSheet,
    public componentService: ComponentService
  ) {
    this.openModalProduct2 = this.openModalProduct2.bind(this)
    this.filterProducts = this.filterProducts.bind(this)
    this.verifyDisponibility = this.verifyDisponibility.bind(this)
    this.alternateButton = this.alternateButton.bind(this)
    this.modifyPackageDate = this.modifyPackageDate.bind(this)
    this.getCart = this.getCart.bind(this)

    this.toggleOpenHour = this.toggleOpenHour.bind(this)
  }

  ngOnInit(): void {
    document.body.classList.remove('mat-typography')
    this.router.parseUrl('teste')
    this.alternateContent()
    localStorage.removeItem('fold')
    this.getClientData().then(() => {
      this.firstMenuElement = setInterval(() => {
        document.querySelectorAll('.category-menu-item')[0]?.classList.add('active')
      }, 100)

      setTimeout(() => {
        window.addEventListener('scroll', () => {
          const element = document.getElementById('menuSearch')
          const offset = element.offsetTop
          if (window.scrollY > offset) {
            element.classList.add('sticky')
          } else {
            element.classList.remove('sticky')
          }

          const categories = document.querySelectorAll('.title-category')

          const distances: number[] = []
          categories.forEach((category, index, arr) => {
            distances.push(category.parentElement.offsetTop - 240)
          })

          function scroll(c, index) {
            const tabActiveElement = document.querySelector(`#category${c.id}`)

            if (window.scrollY >= distances[index] && distances[index + 1] && window.scrollY < distances[index + 1]) {
              tabActiveElement.classList.add('active')

              document.getElementById('scrollmenu').scrollLeft = document.getElementById(`category${c.id}`).offsetLeft - 30
            } else if (!distances[index + 1] && window.scrollY >= distances[index]) {
              tabActiveElement.classList.add('active')
            } else {
              tabActiveElement.classList.remove('active')
            }
            if (
              index === 0 &&
              Array.from(document.querySelectorAll('.category-menu-item')).every((element) => !element.classList.contains('active'))
            ) {
              document.querySelectorAll('.category-menu-item')[0].classList.add('active')
            }
          }

          this.clientCategories &&
            this.clientCategories.forEach((c, index) => {
              if (this.viewContentAlternate === 'P') {
                const products = c.products && c.products.filter((prod) => prod.disponibility.store.package)

                if (c.disponibility.store.package === true) {
                  if (products && products.length > 0) {
                    scroll(c, index)
                  }
                }
              } else {
                scroll(c, index)
              }
            })
        })
      }, 300)

      setInterval(() => this.getClientData(), 600000)
      this.commandSessionInterval = setInterval(() => {
        this.commandSession = JSON.parse(sessionStorage.getItem('command'))
        if (this.commandSession && this.table) {
          const haveCommand = this.table.opened?.commands && this.table.opened?.commands.find((c) => c.id === this.commandSession.id)
          if (!haveCommand && this.table.opened?.commands) {
            this.table.opened?.commands.push(this.commandSession)
          }
        }
        return this.commandSession
      }, 2000)
    })

    this.tableButtons = this.api.getCookie('table')
    if (this.tableButtons) {
      this.cartRequest.type = 'T'
      if (this.commandSession) {
        this.cartRequest.commandId = this.commandSession.id
      }
    }

    this.route.params.subscribe((params) => {
      if (params.categoryId || params.productId) {
        const hashId = params.productId || params.categoryId
        const type = params.productId ? 'product' : 'category'

        let element: any
        if (!this.table) {
          switch (params.planOffer) {
            case 'delivery':
              this.viewContentAlternate = 'D'
              break
            case 'package':
              this.viewContentAlternate = 'P'
              break
            default:
              break
          }
          localStorage.setItem('viewContentAlternate', this.viewContentAlternate)
          const intervalLinkElement = setInterval(() => {
            element = document.getElementById(`${type}-${params.planOffer}-${hashId}`)
            if (!element) {
              element = document.getElementById(`${type}-${params.planOffer === 'delivery' ? 'D' : 'P'}-${hashId}`)
            }
            if (element) {
              document.body.style.setProperty('--border', this.context.Luminosity(this.clientData.color, params.planOffer === 'P').background)
              if (!element.dataset.type) {
                element.classList.add('searchUrl')
              } else {
                element.parentElement.parentElement.style.borderRadius = '5px'
                element.parentElement.parentElement.classList.add('searchUrl')
              }

              window.scrollTo(0, element.getBoundingClientRect().top - 119)
              setTimeout(() => {
                element.click()
              }, 1000)
              clearInterval(intervalLinkElement)
            }

            if (element && !element.dataset.type) {
              setTimeout(() => {
                element.classList.remove('searchUrl')
              }, 15000)
            } else if (element && element.dataset.type) {
              setTimeout(() => {
                element.parentElement.parentElement.classList.remove('searchUrl')
              }, 10000)
            }
          }, 30)
        }
      }
    })

    if (this.clientData?.description) {
      if (this.clientData.description.length <= 42) {
        this.maxDescription = this.clientData.description
      } else {
        this.maxDescription = this.clientData.description.substring(0, 42)
      }
    }

    let whileNotClient = setInterval(() => {
      if (this.clientData) {
        if (!this.packageDate) {
          if (localStorage.getItem(`${this.clientData.slug}_packageDate`) !== null) {
            localStorage.removeItem(`${this.clientData.slug}_packageDate`)
          }
        }

        clearTimeout(whileNotClient)
      }
    }, 1000)    
  }

  ngAfterViewChecked(): void {
    if (Array.from(document.querySelectorAll('.category-menu-item')).some((element) => element.classList.contains('active'))) {
      clearInterval(this.firstMenuElement)
    }
    if (this.clientData) {
      document.body.style.setProperty('--bg-theme', this.context.Luminosity(this.clientData.color, this.viewContentAlternate === 'P').background)
      document.body.style.setProperty('--text-theme', this.context.Luminosity(this.clientData.color).color)
      this.context.packageLabel = this.clientData.options.package.label2 ? this.translate.text().scheduling : this.translate.text().package
      if (!this.context.isMobile && !this.table) {
        this.clientData.options.store.catalogMode?.delivery
          ? document.body.style.setProperty('--modal-content-h', '90vh')
          : document.body.style.setProperty('--modal-content-h', '65vh')
      }
      if (this.context.isMobile && !this.table) {
        this.clientData.options.store.catalogMode?.delivery
          ? document.body.style.setProperty('--modal-content-h', '90vh')
          : document.body.style.setProperty('--modal-content-h', '65vh')
      }
      if (!this.context.isMobile && this.table) {
        this.clientData.options.store.catalogMode?.table
          ? document.body.style.setProperty('--modal-content-h', '90vh')
          : document.body.style.setProperty('--modal-content-h', '65vh')
      }
      if (this.context.isMobile && this.table) {
        this.clientData.options.store.catalogMode?.table
          ? document.body.style.setProperty('--modal-content-h', '90vh')
          : document.body.style.setProperty('--modal-content-h', '65vh')
      }
    }
    if (this.context.isMobile && this.safariTrash()) {
      document.body.style.setProperty('--modal-date-height', '89vh')
    }
    this.cartService.cartRequest = this.cartRequest
  }
  async getCommand() {
    const command = sessionStorage.getItem('command')

    if (command !== null) {
      const haveCommand = this.table.opened?.commands.find((c) => c.id === JSON.parse(command).id)
      const req: CommandType = await this.api.getCommand(JSON.parse(command).id, this.clientData.slug)
      if (req.status && (this.table.tableOpenedId === req.tableOpenedId || this.table.newTable) && haveCommand) {
        sessionStorage.setItem('command', JSON.stringify(req))
      }
    }
  }

  public alternateContent() {
    if (!this.tableButtons) {
      if (this.api.getCookie('onlyPackage') || (this.api.getCookie('package') && !this.api.getCookie('basic') && !this.api.getCookie('table'))) {
        localStorage.setItem('viewContentAlternate', 'P')
        this.viewContentAlternate = 'P'
        this.cookieP = true
        this.cartRequest.type = 'P'
      } else if (!this.api.getCookie('package')) {
        localStorage.setItem('viewContentAlternate', 'D')
        this.viewContentAlternate = 'D'
        this.cartRequest.type = 'D'
        this.cookieP = true
      }
    }
    localStorage.setItem('viewContentAlternate', this.viewContentAlternate)
  }

  private async getClientData() {
    this.route.queryParams.subscribe(async (params) => {
      const cupom = params.firstOnlyCupom || params.linkCupom
      if (cupom) {
        this.linkCupom = cupom
      }
    })
    // tslint:disable-next-line: deprecation
    this.route.params.subscribe(async (params) => {
      // this.clientData = await this.api.getClientData(this.api.getCookie('slug'));
      this.clientData = await this.api.getClientData(params.slug)
      this.context.profile = this.clientData

      // this.delivery = this.defaultDelivery()

      this.cartService.profile = this.context.profile
      if (this.clientData.options.blackList && this.clientData.options.blackList.find((bl) => bl.ip === localStorage.ip)) {
        localStorage.setItem(`${this.clientData.slug}-bl`, '1')
      }
      const clientLocal = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`))

      if (clientLocal?.id) {
        try {
          const { client }: any = await this.api.clientFindOne({ slug: this.clientData.slug, clientId: clientLocal.id })
          if (client) {
            this.customer = { ...client }
          }
          this.taxDeliveryValue = this.context.calculateDeliveryEstimates(
            this.findAddressById(this.delivery?.id ? this.delivery.id : this.customer?.last_requests[0]?.addressId)
          )?.value
        } catch (error) {
          localStorage.removeItem(`${this.clientData.slug}-clientInfo`)
          console.error(error)
        }
      }
      if (this.customer) {
        const oldDefaultAddress = JSON.parse(localStorage.getItem(`${this.clientData.slug}`))
        if (oldDefaultAddress) {
          clientLocal.defaultAddressId = oldDefaultAddress.id
          this.clientInfo = clientLocal
          localStorage.removeItem(`${this.clientData.slug}`)
        } else {
          const lastAddress = this.customer.addresses.find((a) => a.id === this.customer?.last_requests[0]?.addressId)
          clientLocal.defaultAddressId = lastAddress ? lastAddress.id : null
        }
        localStorage.setItem(`${this.clientData.slug}-clientInfo`, JSON.stringify(clientLocal))
        this.clientInfo = clientLocal
      }
      const table = this.api.getCookie('table')
      let command

      try {
        this.table = table && (await this.api.decryptTableCookie(table))
        await this.getCommand()
        command = sessionStorage.getItem('command')
        // this.clientCategories = this.filterMain();
        this.alternateContent()
      } catch (e) {}

      this.clientCategories = this.filterMain()
      const tableJSON: TableType = table && this.table

      let onlyTable = this.api.getCookie('onlyTable')
      if (onlyTable) {
        onlyTable = JSON.parse(onlyTable)
      }

      const localTableOpenedId = JSON.parse(sessionStorage.getItem(`@whatsmenu-${this.clientData.slug}:tableOpenedId`))

      let admOrder = this.api.getCookie('admOrder')

      if (admOrder) {
        admOrder = JSON.parse(admOrder)
      }

      if (localTableOpenedId && this.table.tableOpenedId !== localTableOpenedId) {
        if (admOrder && this.table) {
          this.openTableComponent()
        } else {
          if (onlyTable) {
            this.openQrcodeComponent()
          } else if (this.table) {
            this.openClosedCommandModal()
          }
        }
      }

      if (onlyTable && !this.table) {
        this.openQrcodeComponent()
      }

      if (table && tableJSON && tableJSON.profileId !== this.clientData.id) {
        this.matDialog.open(AlertComponent, {
          closeOnNavigation: true,
          data: {
            title: 'Ops',
            message: `<strong>Desculpe mesa inválida!</strong><br>`,
          },
        })
        this.api.deleteCookie('table')
        sessionStorage.removeItem('command')
        location.replace(`https://${location.hostname}/${this.clientData.slug}`)
      } else {
        if (table && !command) {
          if (!tableJSON.status) {
            this.matDialog.open(AlertComponent, {
              closeOnNavigation: true,
              data: {
                title: 'Desculpe está mesa se encontra desativada!',
                message: `<strong>No momento, essa mesa não está disponível para novos pedidos.</strong><br>`,
              },
            })
            this.api.deleteCookie('table')
            this.limpaUrl()
          } else {
            this.clearCart()
            if (!localTableOpenedId || this.table.tableOpenedId === localTableOpenedId) {
              this.openTableComponent()
            }
          }
        }
      }

      // var taxas = this.clientData.taxDelivery[0].neighborhoods.map(({value}) => value)
      // this.taxDeliveryValue = Math.min(...taxas)

      clearInterval(this.relogio)

      this.relogio = setInterval(() => {
        this.hour = DateTime.fromISO(this.clientData.fuso, { zone: 'America/Sao_Paulo' }).setZone(this.clientData.timeZone).toFormat('HH:mm')
        if (this.clientData) {
          const { isOpen, text } = this.verifyDisponibilityOpen()
          if (isOpen) {
            this.companyButton.nativeElement.classList.add('companyOpen')
            this.companyButton.nativeElement.classList.remove('companyClose')
            this.disponibilityText = this.translate.text().opened
          } else {
            this.companyButton.nativeElement.classList.add('companyClose')
            this.companyButton.nativeElement.classList.remove('companyOpen')
            this.disponibilityText = this.translate.text().closed
          }
        }
      }, 1000)

      // clearInterval();
      this.titleService.setTitle(this.clientData.name)
      this.delivery.uf = this.clientData.address.state

      this.clientData.categories.forEach((category, index) => {
        if (category.products) {
          category.products.forEach((prod) => {
            const prodCopy = { ...prod }
            prodCopy.category = category
            if (prodCopy.status) {
              this.allProducts.push(prodCopy)
            }
          })
        }
        if (category.product) {
          category.product.flavors.forEach((flavors) => {
            const prodCopy = { ...flavors }
            prodCopy.category = category
            if (prodCopy.status) {
              this.allPizzas.push(prodCopy)
            }
          })
        }
      })

      if (!localStorage.getItem(`${this.clientData.slug}_address`)) {
        localStorage.setItem(`${this.clientData.slug}_address`, JSON.stringify(this.clientData.address))
      }

      const cacheAddress: DeliveryType = JSON.parse(localStorage.getItem(`${this.clientData.slug}`))

      if (localStorage.getItem(this.clientData.slug)) {
        const testVersion = JSON.parse(localStorage.getItem(this.clientData.slug))

        // tslint:disable-next-line: max-line-length
        if (
          !testVersion.version ||
          testVersion.version < this.clientData.version ||
          this.clientData.address.street !== cacheAddress.street ||
          this.clientData.address.number !== cacheAddress.number
        ) {
          // localStorage.removeItem(this.clientData.slug);
          localStorage.removeItem(`${this.clientData.slug}_address`)
        }
      }

      if (localStorage.getItem(`${this.clientData.slug}_address`)) {
        const address: DeliveryType = JSON.parse(localStorage.getItem(`${this.clientData.slug}`))

        // if (this.clientData.options.blackList) {
        //   const blackList = this.clientData.options.blackList.find((bl) => bl.ip === localStorage.ip || bl.whatsapp === address.contact)
        //   if (blackList) {
        //     localStorage.setItem(`${this.clientData.slug}-bl`, '1')
        //   } else {
        //     localStorage.removeItem(`${this.clientData.slug}-bl`)
        //   }
        // }

        if (this.clientData.typeDelivery === 'km') {
          if (address && address.distance) {
            address.formPayment = undefined
            address.transshipment = undefined
            this.delivery = address
            const taxValues = this.clientData.taxDelivery.filter((tax) => tax.distance * 1000 > address.distance)

            if (taxValues.length) {
              this.taxDeliveryValue = taxValues[0].value
              this.timeDelivery = taxValues[0].time
            } else {
              this.taxDeliveryValue = -1
            }
          }
        } else {
          const city = address && this.clientData.taxDelivery.find((t) => t.city === address.city)

          if (city) {
            const tax = city.neighborhoods.find((n) => n.name === address.neighborhood)

            if (tax) {
              address.formPayment = undefined
              address.transshipment = undefined
              this.delivery = address
              this.taxDeliveryValue = tax.value
              this.timeDelivery = tax.time
            }
          }
        }
      }

      this.getCart(false)

      if (
        (!this.disponibility() && this.api.getCookie('P') && this.clientData.options.package.active && !this.table) ||
        this.api.getCookie('onlyPackage')
      ) {
        this.alternateButton('P')
      }
      this.filterProducts()
    })

    // setInterval(async () => {
    //   if (localStorage.getItem(`${this.clientData.slug}-request`)) {
    //     try {
    //       await this.api.postRequest(localStorage.getItem(`${this.clientData.slug}-request`));
    //       localStorage.removeItem(`${this.clientData.slug}-request`);
    //     } catch (error) {
    //       console.error(error);
    //       alert('falha na conexão, verifique sua internete!');
    //     }
    //   }
    // }, 2000);
  }

  public filterMain() {
    clearTimeout(this.timeOutLoad)
    const arrCategory = this.verifyDisponibility(this.clientData.categories)
    const actuallyAlternate = this.viewContentAlternate
    let newArr = arrCategory.filter((category: CategoryType) => {
      if (category.type === 'default') {
        category.products = this.verifyDisponibility(category.products)
        return category.products.length
      } else {
        const flavors = Array(
          category.product.flavors.filter((flavor) => this.cartService.checkInventoryDisponibility({ item: { ...flavor, quantity: 1 } })).length
        )
          .fill(0)
          .map((_, i) => i + 1)
        flavors.splice(4)
        category.product.sizes.forEach((size) => {
          size.flavors = flavors.filter((f) => size.flavors.includes(f))
        })
        return category.product.sizes.length
      }
    })

    if (!newArr.length) {
      this.timeOutLoad = setTimeout(() => {
        if (actuallyAlternate === this.viewContentAlternate) {
          this.clientCategories = null
        }
      }, 3000)
    }

    if (!this.table) {
      sessionStorage.removeItem('command')
    }

    return newArr
  }

  // MODALS

  public openTableComponent() {
    this.tableRequest = true
    this.matDialog
      .open(TableComponent, {
        disableClose: true,
        data: { clientData: this.clientData, table: this.table, cart: this.cart },
        autoFocus: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result.command) {
          //@ts-ignore
          this.table.commands.push(new Command(result.command))
        }
      })
  }

  public openClosedCommandModal() {
    this.matDialog.open(AlertComponent, {
      minWidth: '100vw',
      data: {
        message: 'A comanda anterior já foi finalizada, você ainda esta no restaurante ou deseja fazer um novo pedido para entrega?',
        textButton: 'Estou na mesa',
        goToAnotherCommand: true,
        secondTextButton: 'Entregar pedido',
        clientData: this.clientData,
        table: true,
      },
    })
  }

  public openQrcodeComponent() {
    sessionStorage.removeItem('command')
    this.matDialog.open(QrcodeComponent, {
      data: {
        clientData: this.clientData,
      },
      maxWidth: '100vw',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      id: 'qr-code-modal',
      disableClose: true,
      closeOnNavigation: true,
    })
  }

  public openPaymentModal(customer: CustomerType) {
    if (this.cartRequest.type !== 'P') {
      this.cartRequest.packageDate = null
    }
    const dialog = this.matDialog.open<CartPaymentComponent, CartPaymentComponentData>(CartPaymentComponent, {
      data: {
        clientData: this.clientData,
        cartRequest: { ...this.cartRequest, cupom: this.cartRequest.cupom ?? this.cupom },
        customer: customer,
        // taxDeliveryValue: taxDelivery,
        // delivery: delivery,
        // typeDelivery: typeDelivery,
        // cart: this.cart,
        // cartPizza: this.cartPizza,
        // cupom: cupom,
      },
      maxWidth: window.innerWidth < 700 ? '100vw' : '35vw',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      minWidth: window.innerWidth < 700 ? '100vw' : '35vw',
      height: window.innerWidth < 700 ? '100%' : 'auto',
      minHeight: window.innerWidth < 700 ? '100%' : '80vh',
      id: 'payment-type-modal',
      disableClose: true,
      closeOnNavigation: true,
    })

    dialog.afterClosed().subscribe((result) => {
      if (!result) return
      if (result.targetModal === 'back') return this.openModalCartDetails()
      if (result.targetModal === 'cart') {
        const alert = this.matDialog.open(AlertComponent, {
          data: {
            title: `${this.translate.text().attention}!`,
            message: result.message,
            textButton: 'Ok',
          },
        })
        alert.afterClosed().subscribe(() => {
          this.openCart()
        })
      }

      if (result.success) {
        // this.reload(result.sendMessage)
      }
    })
  }

  public plansCategory() {
    return (
      !this.table &&
      this.clientData.plans.flatMap((plan) => plan.category).includes('package') &&
      this.clientData.plans.flatMap((plan) => plan.category).includes('basic')
    )
  }

  public openMoreInfo() {
    const dialogMoreInfo = this.matDialog.open(MoreinfoComponent, {
      maxWidth: '100vw',
      width: window.innerWidth < 700 ? '100vw' : '80vw',
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      data: { clientData: this.clientData },
      panelClass: ['modalBorder'],
    })

    dialogMoreInfo.afterClosed().subscribe((result) => {})
  }

  public toggleOpenHour(collapse?: boolean) {
    this.openingHoursCollapse = collapse ? collapse : !this.openingHoursCollapse
  }

  private saveCarts() {
    const storageCart = {
      cart: this.cart,
      cartPizza: this.cartPizza,
      date: DateTime.local().plus({ minutes: 30 }),
    }
    localStorage.setItem(`${this.table ? 'table' : this.viewContentAlternate}_cart_${this.clientData.slug}`, JSON.stringify(storageCart))
  }

  private clearCart() {
    this.cart = []
    this.cartPizza = []

    localStorage.removeItem(`${this.table ? 'table' : this.viewContentAlternate}_cart_${this.clientData.slug}`)
  }

  public getCart(reload = false) {
    const nameCart = this.table ? 'table' : this.viewContentAlternate
    const carts = JSON.parse(localStorage.getItem(`${nameCart}_cart_${this.clientData.slug}`))
    if (carts && carts.date) {
      if (DateTime.fromISO(carts.date) > DateTime.local()) {
        this.cart = carts.cart
        this.cartPizza = carts.cartPizza
      } else {
        this.cart = []
        this.cartPizza = []
        localStorage.removeItem(`${nameCart}_cart_${this.clientData.slug}`)
        if (nameCart === 'package') {
          localStorage.removeItem(`packageDate`)
        }

        reload && window.location.reload()
      }
    }
  }

  public anchorScroll(id: string) {
    const categoryId = `category-${this.viewContentAlternate}-${id}`
    const linkId = `category${id}`
    this.activeCategory = linkId
    this.activeScrollCategory = null
    this.viewportscroller.setOffset([0, 120])
    this.viewportscroller.scrollToAnchor(categoryId)
    if (!this.activeScrollCategory) {
      this.activeCategory = linkId
    }
  }

  public filterProducts() {
    let filtered: ProductType[] = []

    // Se existir filter retorna produtos com nome e descrição correspondentes
    if (this.filter) {
      this.filter.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

      filtered = this.allProducts.filter((product) => {
        if (product.description == null) {
          product.description = '' // Seta description como string vazia caso seja null
        }

        if (
          product.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(
              this.filter
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase()
            ) ||
          product.description
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(
              this.filter
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase()
            )
        ) {
          if (this.table) {
            return product.category.disponibility.store.table && product.disponibility.store.table
          } else {
            const store = this.viewContentAlternate === 'D' ? 'delivery' : 'package'
            return product.category.disponibility.store[store] && product.disponibility.store[store]
          }
        }
      })
    }
    // teste
    if (this.clientData.options.tracking && this.clientData.options.tracking.pixel && filtered.length > 0 && localStorage.filter !== this.filter) {
      localStorage.filter = this.filter
      if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
        fbq('track', 'Search', {
          search_string: this.filter,
        })
      }
    }

    return filtered
  }

  public async setPaymentForm(form: string) {
    this.delivery.formPayment = form
  }

  public async removeCartItem(item: number) {
    this.cart.splice(item, 1)
    this.saveCarts()
  }

  public rmPizzaFromCart(item: number) {
    this.cartPizza.splice(item, 1)
    this.saveCarts()
  }

  public resetTransshipment() {
    this.delivery.transshipment = undefined
  }

  public async searchZipCode() {
    this.delivery.city = undefined

    if (this.delivery.zipCode && this.delivery.zipCode.length === 8) {
      const address: any = await this.api.getInfoByZipCode(this.delivery.zipCode)

      this.delivery.street = address.logradouro
      this.delivery.neighborhood = address.bairro
      this.delivery.city = address.localidade

      if (address.erro) {
        this.delivery.street = 'CEP não encontrado'
        this.delivery.neighborhood = 'CEP não encontrado'
        this.delivery.city = 'CEP não encontrado'
      }
    }
  }

  public calcProductTotalValue(product: CartType): number {
    const table = this.api.getCookie('table')

    if (table) {
      let valueTable = product.valueTable

      if (product.promoteStatusTable) {
        valueTable = product.promoteValueTable
      }

      product.complements.forEach((complement) => {
        valueTable += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
      })

      return valueTable * product.quantity
    } else {
      let value = product.value

      if (product.promoteStatus) {
        value = product.promoteValue
      }

      product.complements.forEach((complement) => {
        value += complement.itens.reduce((a, b) => a + b.value * b.quantity, 0)
      })

      return value * product.quantity
    }
  }

  public verifyDisponibility(arrFilter: any) {
    const arrFilter2 = JSON.parse(JSON.stringify(arrFilter))
    const showProd = this.clientData.options.disponibility.showProductsWhenPaused
    const store = this.viewContentAlternate === 'D' ? 'delivery' : 'package'

    let newArr = arrFilter2.filter((el: any) => {
      if (this.table) {
        if (showProd) {
          return el.disponibility.store.table
        }
        return el.disponibility.store.table && el.status
      } else {
        if (showProd) {
          return el.disponibility.store[store]
        }
        return el.disponibility.store[store] && el.status
      }
    })

    return newArr
  }

  public async openModalProduct2(item: ProductType, category?: CategoryType, editProduct?: CartType, editProductIndex?: number) {
    if (!category) {
      category = this.clientData.categories.find((c) => c.id === item.categoryId)
    }

    if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
      fbq('track', 'ViewContent', {
        content_name: item.name,
        content_category: category.name,
        content_ids: [item.id],
        content_type: 'product',
        value: item.promoteStatus ? item.promoteValue : item.value,
        currency: 'BRL',
      })
    }
    const i: ProductType = {
      id: item.id,
      name: item.name,
      code: editProduct?.code,
      description: item.description,
      image: item.image,
      value: item.value,
      ncm_code: item.ncm_code ? item.ncm_code : null,
      promoteStatus: item.promoteStatus,
      promoteValue: item.promoteValue,
      valueTable: item.valueTable,
      promoteStatusTable: item.promoteStatusTable,
      promoteValueTable: item.promoteValueTable,
      complements: [],
      obs: editProduct ? editProduct.obs : item.obs,
      quantity: editProduct ? editProduct.quantity : 1,
      category: category,
      disponibility: item.disponibility,
      store: item.disponibility.store,
      status: item.status,
      amount: editProduct?.amount,
      amount_alert: editProduct?.amount_alert,
      bypass_amount: editProduct?.bypass_amount,
    }

    item.complements.forEach((complement) => {
      const comp: ComplementType = {
        ...complement,
        itens: [],
      }

      // tslint:disable-next-line: no-shadowed-variable
      complement.itens.forEach((item) => {
        const complementToEdit =
          !editProduct || !editProduct.complements.length
            ? null
            : editProduct.complements
                .find((editComplement) => editComplement.name === complement.name)
                ?.itens.find((editItem) => editItem.code === item.code)
        const it = {
          code: item.code,
          name: item.name,
          description: item.description,
          quantity: complementToEdit ? complementToEdit.quantity : item.quantity,
          status: item.status,
          value: item.value,
          amount: item.amount,
          bypass_amount: item.bypass_amount,
        }
        comp.itens.push(it)
      })
      i.complements.push(comp)
    })

    if (this.viewContentAlternate === 'P') {
      const time = await this.componentService.getPackageDate({
        clientData: this.clientData,
        packageHours: this.packageHours,
      })

      this.packageDate = time
      this.cartRequest.packageDate = time.toFormat('yyyy-MM-dd HH:mm:ss')
    }

    const dialog = this.matDialog.open(ProductComponent, {
      data: {
        product: i,
        productCart: this.cart,
        valueType: this.cartRequest.type,
        clientData: this.clientData,
        catName: category ? category.name : '',
        table: this.table,
        modifyPackageDate: this.modifyPackageDate,
        viewContentAlternate: this.viewContentAlternate,
        disponibility: this.disponibility(),
        cart: this.cart,
        editProduct: !!editProduct,
      },
      autoFocus: false,
      maxWidth: window.innerWidth < 1024 ? '100vw' : '80vw',
      minWidth: window.innerWidth < 1024 ? '100vw' : '50vw',
      maxHeight: window.innerWidth < 1024 ? '100vh' : 'auto',
      height: window.innerWidth < 1024 ? '100%' : 'auto',
      closeOnNavigation: true,
    })

    // dialog.backdropClick().subscribe(e => dialog.close());

    // tslint:disable-next-line: deprecation
    dialog.afterClosed().subscribe((result) => {
      if (result && result.item) {
        if (typeof editProductIndex === 'number') {
          this.cart[editProductIndex] = result.item
          this.openCart()
        }
        if (this.viewContentAlternate !== 'package' || this.table || this.disponibility()) {
          this.saveCarts()
        } else {
          this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Fechado no momento!',
              message: `<strong>No momento, não estamos aceitando novos pedidos.</strong><br>${this.hoursOpen()}`,
            },
          })
        }
      }
    })
  }

  public async openModalPizza(
    pizza: PizzaProductType,
    sizeName: string,
    cover: string,
    flavorsCount: number,
    category: CategoryType,
    sizeContent: PizzaSizeType,
    editPizza?: CartFlavorPizzaType,
    editIndex?: number
  ) {
    if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
      fbq('track', 'ViewContent', {
        content_name: `Pizza ${sizeName} ${flavorsCount === 1 ? 'Sabor' : 'Sabores'}`,
        content_category: category,
        content_ids: [pizza.id],
        content_type: 'product',
      })
    }

    if (this.viewContentAlternate === 'P') {
      const time = await this.componentService.getPackageDate({
        clientData: this.clientData,
        packageHours: this.packageHours,
      })

      this.packageDate = time
      this.cartRequest.packageDate = time.toFormat('yyyy-MM-dd HH:mm:ss')
    }

    const pizzaModal = this.matDialog.open<PizzaComponent, PizzaComponentData>(PizzaComponent, {
      data: {
        pizza: structuredClone(pizza),
        sizeName,
        flavorsCount,
        valueType: this.cartRequest.type,
        cover,
        table: this.table,
        editPizza: editPizza
          ? {
              obs: editPizza.obs,
              ncm_code: editPizza.ncm_code ? editPizza.ncm_code : null,
              quantity: editPizza.quantity,
              type: 'pizza',
              complements: editPizza.complements,
              details: editPizza.details,
              name: editPizza.name,
              pizzaId: editPizza.pizzaId,
            }
          : undefined,
      },
      autoFocus: false,
      width: window.innerWidth < 1024 ? '100vw' : '900px',
      maxWidth: window.innerWidth < 1024 ? '100vw' : '80vw',
      minWidth: window.innerWidth < 1024 ? '100vw' : 'auto',
      height: window.innerWidth < 700 ? '100%' : 'auto',
      closeOnNavigation: true,
    })

    // tslint:disable-next-line: deprecation
    pizzaModal.afterClosed().subscribe((result) => {
      if (result && result.item) {
        if (this.disponibility() || this.table || this.viewContentAlternate === 'package' || this.viewContentAlternate === 'P') {
          if (editPizza) {
            this.cartPizza[editIndex] = {
              ...result.item,
              flavors: result.item.details.flavors,
              complements: result.item.details.complements,
              implementations: result.item.details.implementations,
              size: result.item.details.size,
              sizes: pizza.sizes,
            }
            this.cartPizza[editIndex].name = this.cartService.editPizzaName(result.item)
          } else {
            this.cartService.addPizzaItemToCart(result.item, this.cartPizza)
          }
          this.saveCarts()
        } else {
          this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Fechado no momento!',
              message: `<strong>No momento, não estamos aceitando novos pedidos.</strong><br>${this.hoursOpen()}`,
            },
          })
        }
      }
      const localPackageDate = localStorage.getItem('packageDate')
      if (this.cartRequest.type === 'P' && localPackageDate) {
        this.cartRequest.packageDate = localPackageDate
      }
    })
  }

  private safariTrash() {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.indexOf('safari') !== -1) {
      if (ua.indexOf('chrome') > -1) {
        return false // Chrome
      } else if (ua.indexOf('edg') > -1) {
        return false // Edge
      } else if (ua.indexOf('opr') > -1) {
        return false // Opera
      } else {
        //  SAFARI
        if (ua.indexOf('iphone') > -1) {
          return true // Safari IPhone
        } else {
          return false // Safari Desktop
        }
      }
    }
    return false
  }

  async customerVerification() {
    const checkLocalStorage = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`))
    if (!checkLocalStorage?.id) {
      return false
    }
    const searchClient: any = await this.api.clientFindOne({ slug: this.clientData.slug, clientId: checkLocalStorage.id })

    if (!searchClient) {
      return false
    }
    // if (searchClient.client.birthday_date === null && this.clientData.options.pdv.clientConfig?.required) {
    //   this.customer = searchClient.client
    //   return false
    // }
    this.customer = searchClient.client
    return true
  }

  public async openLatestRequests() {
    const dialog = this.matDialog.open(LatestRequestsComponent, {
      data: {
        customer: this.customer,
        clientData: this.clientData,
      },
      maxWidth: window.innerWidth < 550 ? '100vw' : '500px',
      minWidth: window.innerWidth < 550 ? '100vw' : '500px',
      maxHeight: window.innerWidth < 550 ? '100vh' : '72vh',
      height: window.innerWidth < 700 ? '100%' : 'auto',
    })
  }

  public async openClientIdModal(auto: boolean, deliveryButton?: boolean, targetModal?: string) {
    if (auto && (await this.customerVerification())) {
      return deliveryButton ? this.openListAddressModal() : await this.openModalCartDetails()
    }

    const dialog = this.matDialog.open(ClientidComponent, {
      data: {
        clientData: this.clientData,
        customer: this.customer,
        deliveryButton: deliveryButton,
        targetModal,
      },
      maxWidth: window.innerWidth < 1024 ? '100vw' : '80vw',
      minWidth: window.innerWidth < 1024 ? '100vw' : '50vw',
      maxHeight: window.innerWidth < 1024 ? '100vh' : '120vh',
      height: window.innerWidth < 700 ? '100%' : '90vh',
    })
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.customer = result.customerInfo
        if (this.customer.last_requests.length && this.cupom?.firstOnly) {
          alert(`O cupom ${this.cupom.code} só pode ser utilizado uma vez e não será aplicado nessa compra!`)
          this.cupom = null
        }
        switch (result.targetModal) {
          case 'formPayment':
            this.openModalCartDetails()
            break
          case 'back':
            this.openCart()
            break
          case 'listAddress':
            this.openListAddressModal()
            break
          case 'lastRequests':
            this.openLatestRequests()
            break
          default:
            break
        }
      }
    })
  }

  public openListAddressModal() {
    const dialog = this.matDialog.open(ListAdressesComponent, {
      data: {
        customer: this.customer,
        clientData: this.clientData,
        clientInfo: this.clientInfo,
      },
      autoFocus: false,
      maxWidth: window.innerWidth < 1024 ? '100vw' : '80vw',
      minWidth: window.innerWidth < 1024 ? '100vw' : '50vw',
      maxHeight: window.innerWidth < 1024 ? '100%' : '85vh',
      height: window.innerWidth < 1024 ? '100%' : 'auto',
      closeOnNavigation: true,
    })

    dialog.afterClosed().subscribe((result) => {
      if (result?.targetModal === 'addAddress') {
        this.addressConfirmProcess()
      }
      if (result?.targetModal === 'addAddress' && this.enableDeliveryAddress === false) {
        return
      }
      if (result?.delivery) {
        this.delivery = result.delivery

        this.enableDeliveryAddress = this.enableDelivery()
        this.taxDeliveryValue = this.calculateTaxDelivery(result.delivery, this.clientData, true, result.delivery)?.taxDeliveryValue
        this.saveAddress()
      }
    })
  }

  public async openModalCartDetails() {
    const dialog = this.matDialog.open(CartDetailsComponent, {
      data: {
        clientData: this.clientData,
        clientInfo: this.clientInfo,
        delivery: this.delivery,
        cart: this.cart,
        cartPizza: this.cartPizza,
        cartRequest: { ...this.cartRequest, addressId: null, itens: this.cartService.cartItem(this.cart, this.cartPizza, this.cartRequest.type) },
        customer: this.customer,
        requestCode: this.requestCode,
        taxDeliveryValue: this.taxDeliveryValue,
        timeDelivery: this.timeDelivery,
        cupom: this.cupom,
        removeCupom: () => (this.cupom = this.cupom),
        dataPackage: this.packageDate,
        viewContentAlternate: this.viewContentAlternate === 'D' ? 'D' : 'P',
        modifyPackageDate: this.modifyPackageDate,
      },
      autoFocus: false,
      maxWidth: '100vw',
      minWidth: '40vw',
      width: document.documentElement.clientWidth < 700 ? '100vw' : '35vw',
      height: document.documentElement.clientWidth < 700 ? '100vh' : '90vh',
      closeOnNavigation: true,
    })

    // tslint:disable-next-line: deprecation
    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        // if (this.cartRequest.type === 'P') {
        //   this.updatePackageDate()
        // }
        if (result.paymentModal) {
          this.cartRequest = result.cartRequest
          return this.openPaymentModal(result.customer)
        }

        if (result.targetModal) {
          switch (result.targetModal) {
            case 'clientId':
              return this.openClientIdModal(false)
            case 'back':
              return (await this.customerVerification()) ? this.openCart() : this.openClientIdModal(false)
            default:
              break
          }
        }
      }
    })
  }

  public openDisponibilityModal() {
    setTimeout(
      () => {
        this.matDialog.open(AlertComponent, {
          closeOnNavigation: true,
          data: {
            title: 'Horários',
            message: this.hoursOpen(),
          },
        })
      },
      this.hour ? 1 : 700
    )
  }

  private hoursOpen() {
    return `
    <h4>Agora: ${this.hour}</h4>
    <table class="table row-border table-border">
      <tbody>
        <tr>
          <td ${this.clientData.week.sunday.length > 1 ? `rowspan="${this.clientData.week.sunday.length}"` : ''}><strong>Domingo</strong></td>
          ${
            this.clientData.week.sunday.length
              ? this.clientData.week.sunday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.monday.length > 1 ? `rowspan="${this.clientData.week.monday.length}"` : ''}><strong>Segunda</strong></td>
          ${
            this.clientData.week.monday.length
              ? this.clientData.week.monday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.tuesday.length > 1 ? `rowspan="${this.clientData.week.tuesday.length}"` : ''}><strong>Terça</strong></td>
          ${
            this.clientData.week.tuesday.length
              ? this.clientData.week.tuesday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.wednesday.length > 1 ? `rowspan="${this.clientData.week.wednesday.length}"` : ''}><strong>Quarta</strong></td>
          ${
            this.clientData.week.wednesday.length
              ? this.clientData.week.wednesday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.thursday.length > 1 ? `rowspan="${this.clientData.week.thursday.length}"` : ''}><strong>Quinta</strong></td>
          ${
            this.clientData.week.thursday.length
              ? this.clientData.week.thursday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.friday.length > 1 ? `rowspan="${this.clientData.week.friday.length}"` : ''}><strong>Sexta</strong></td>
          ${
            this.clientData.week.friday.length
              ? this.clientData.week.friday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
        <tr>
          <td ${this.clientData.week.saturday.length > 1 ? `rowspan="${this.clientData.week.saturday.length}"` : ''}><strong>Sábado</strong></td>
          ${
            this.clientData.week.saturday.length
              ? this.clientData.week.saturday.map(
                  (d, i) => `${i > 0 ? '<tr>' : ''}<td>${d.open.replace(':', 'h')} às ${d.close.replace(':', 'h')}</td> ${i > 0 ? '</tr>' : ''}`
                )
              : '<td>fechado</td>'
          }
        </tr>
      </tbody>
    </table>
    `
      .split(',')
      .join('')
  }

  public async openCart() {
    clearInterval(this.commandSessionInterval)
    if (this.enableSend) {
      this.enableSend = false
      setTimeout(async () => {
        this.enableSend = true
      }, 1500)
      await this.getCommand()
      const command: CommandType = JSON.parse(sessionStorage.getItem('command'))

      const table = this.api.getCookie('table')

      if (table) {
        if (!command) {
          this.openClosedCommandModal()
        }
      }

      if (table && !command) return

      this.cartPizza.forEach((pizza) => {
        pizza.details.flavors = pizza.flavors
      })

      const storedClientInfo = JSON.parse(localStorage.getItem(`${this.clientData.slug}-clientInfo`))
      if (storedClientInfo) {
        this.clientInfo = storedClientInfo
      }

      if (this.cartRequest.type === 'P' && !this.cartRequest.packageDate) {
        this.updatePackageDate(() => this.openCart())
        return
      }

      const cartModal = this.matDialog.open(CartComponent, {
        // tslint:disable-next-line: object-literal-shorthand
        data: {
          clientData: this.clientData,
          cartRequest: this.cartRequest,
          cart: this.cart,
          cartPizza: this.cartPizza,
          delivery: this.delivery,
          taxDeliveryValue: this.taxDeliveryValue,
          timeDelivery: this.timeDelivery,
          cupom: this.cupom,
          table: this.table,
          packageDateModify: this.modifyPackageDate,
          packageDate: this.packageDate,
          viewContentAlternate: this.viewContentAlternate,
          clientInfo: this.clientInfo,
          linkCupom: this.linkCupom,
        },
        autoFocus: false,
        minWidth: '45vw',
        width: window.innerWidth < 700 ? '100vw' : 'auto',
        maxWidth: '100vw',
        height: window.innerWidth < 700 ? '100%' : 'auto',
        closeOnNavigation: true,
      })

      cartModal.afterClosed().subscribe((result) => {
        if (localStorage.fold) {
          this.taxDeliveryValue = parseFloat(localStorage.fold)
        }
        if (result) {
          if (result.cupom) {
            this.cupom = result.cupom

            if (this.cupom.type === 'freight') {
              // localStorage.setItem('fold', this.taxDeliveryValue.toFixed(2));
              this.taxDeliveryValue = 0
            }
          }
        }

        if (result) {
          if (result.payment) {
            this.cupom = result.cupom
            this.openClientIdModal(true)
          }
          if (result.toDelivery) {
            this.limpaUrl()
            location.reload()
          }
          if (result.requestTable) {
            this.reloadTable()
          }
          if (result.target) {
            if (result.target === 'editDefault') {
              const storeProduct = this.allProducts.find((product) => product.id === result.product.id)
              this.openModalProduct2(storeProduct, undefined, result.product, result.index)
            } else {
              const storePizzaCategory = this.clientData.categories
                .filter((c) => c.type === 'pizza')
                .find((category) => category.product.id === result.product.pizzaId)
              const selectedPizza: CartFlavorPizzaType = result.product
              this.openModalPizza(
                storePizzaCategory.product,
                selectedPizza.size,
                storePizzaCategory.product.sizes.find((size) => size.name === selectedPizza.size).covers[selectedPizza.flavors.length - 1],
                selectedPizza.flavors.length,
                storePizzaCategory,
                storePizzaCategory.product.sizes.find((size) => size.name === selectedPizza.size),
                selectedPizza,
                result.index
              )
            }
          }
        }
      })
    }
  }

  openBottomSheet(index: number, product: CartType | CartFlavorPizzaType, productType: string): void {
    const bottomSheetRef = this._bottomSheet.open(ProductOptionsComponent, {
      data: {
        index: index,
        product: product,
        productType: productType,
      },
    })
    bottomSheetRef.afterDismissed().subscribe((result) => {
      if (result) {
        if (result.target === 'remove') {
          if (result.productType === 'default') {
            this.cartService.removeProductCart(result.index, this.cart)
          } else {
            this.cartService.removePizzaCart(result.index, this.cartPizza)
          }

          this.saveCarts()
        }
        if (result.target === 'edit') {
          if (result.productType === 'default') {
            const storeProduct = this.allProducts.find((product) => product.id === result.product.id)
            this.openModalProduct2(storeProduct, undefined, result.product, index)
          } else {
            const storePizzaCategory = this.clientData.categories.find((category) => category.id === result.product.categoryId)
            const selectedPizza: CartFlavorPizzaType = result.product
            this.openModalPizza(
              storePizzaCategory.product,
              selectedPizza.size,
              storePizzaCategory.product.sizes.find((size) => size.name === selectedPizza.size).covers[selectedPizza.flavors.length - 1],
              selectedPizza.flavors.length,
              storePizzaCategory,
              storePizzaCategory.product.sizes.find((size) => size.name === selectedPizza.size),
              selectedPizza,
              index
            )
          }
        }
      }
      ;(this.cart.length || this.cartPizza.length) && result?.target !== 'edit' && this.openCart()
    })
  }

  public openAddress() {
    const dialog = this.matDialog.open<AddressComponent, AddressComponentData>(AddressComponent, {
      autoFocus: false,
      height: document.documentElement.clientWidth < 700 ? '100vh' : 'auto',
      width: document.documentElement.clientWidth < 700 ? '100vw' : 'auto',
      maxWidth: document.documentElement.clientWidth < 700 ? '100vw' : 'auto',
      data: {
        address: this.delivery,
        clientData: this.clientData,
        addressRevalidation: false,
        customer: this.customer,
        edit: false,
      },
      closeOnNavigation: true,
    })

    // tslint:disable-next-line: deprecation
    dialog.afterClosed().subscribe((result) => {
      this.cupom = result.cupom
      if (result.itens) {
        this.delivery = result.itens.delivery
        if (this.clientData.typeDelivery === 'km') {
          const values = this.clientData.taxDelivery.filter(
            (tax) => (tax.distance >= 1000 ? tax.distance : tax.distance * 1000) >= this.delivery.distance
          )
          if (values.length) {
            this.taxDeliveryValue = values[0].value
            this.timeDelivery = values[0].time
          } else {
            this.taxDeliveryValue = -1
          }
        } else {
          if (this.delivery.neighborhood === 'others') {
            this.taxDeliveryValue = -1
          } else {
            const city = this.clientData.taxDelivery.find((t) => t.city === this.delivery.city)
            const tax = city.neighborhoods.find((n: any) => n.name === this.delivery.neighborhood)
            this.taxDeliveryValue = tax.value
            this.timeDelivery = tax.time
          }
        }
      }
      this.openCart()
    })
  }

  public openAddressCalc() {
    const dialog = this.matDialog.open<AddressComponent, AddressComponentData, { address: AddressType }>(AddressComponent, {
      autoFocus: false,
      height: document.documentElement.clientWidth < 700 ? '100vh' : 'auto',
      width: document.documentElement.clientWidth < 700 ? '100vw' : 'auto',
      maxWidth: document.documentElement.clientWidth < 700 ? '100vw' : 'auto',
      data: {
        clientData: this.clientData,
        customer: this.customer,
      },
      closeOnNavigation: true,
    })

    dialog.afterClosed().subscribe(({ address }) => {
      if (!address) return
      this.taxDeliveryValue = this.context.calculateTaxDelivery(address, this.clientData, this.delivery, this.cupom, this.cupomIsValid)
    })
  }

  public calculateTaxDelivery(addressData: DeliveryType, clientData: ProfileType, enableDeliveryAddress: boolean, delivery: DeliveryType) {
    if (!addressData) {
      return
    }
    let tax: number
    if (clientData.typeDelivery === 'km' && delivery.street) {
      const taxValues = this.clientData.taxDelivery.filter((tax) => tax.distance * 1000 > addressData.distance)
      if (taxValues.length) {
        tax = taxValues[0].value
        enableDeliveryAddress = true
      } else {
        enableDeliveryAddress = false
      }
    } else {
      const city = addressData && this.clientData.taxDelivery.find((t) => t.city === addressData.city)
      if (city) {
        let neighborhood = city.neighborhoods.find((n) => n.name === addressData.neighborhood)
        if (neighborhood) {
          delivery.formPayment = undefined
          delivery.transshipment = undefined
          tax = neighborhood.value
        }
      }
    }

    return {
      taxDeliveryValue: this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : JSON.parse(JSON.stringify(Number(tax))),
    }
  }

  public saveAddress() {
    localStorage.setItem(this.clientData.slug, JSON.stringify({ ...this.delivery, version: this.clientData.version }))
  }

  public formatCurrency(val: any): string {
    let value = val
    if (typeof val === 'string') {
      value = parseFloat(val.replace(',', '.').replace('R$', '').split(' ').join(''))
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  public addressConfirmProcess() {
    const confirmDialog = this.matDialog.open<AddressComponent, AddressComponentData>(AddressComponent, {
      autoFocus: false,
      height: window.innerWidth < 700 ? '100%' : 'auto',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      maxWidth: window.innerWidth < 700 ? '100vw' : 'auto',
      data: {
        address: JSON.parse(JSON.stringify(this.delivery)),
        clientData: this.clientData,
        addressRevalidation: true,
        customer: this.customer,
      },
      closeOnNavigation: true,
    })

    confirmDialog.afterClosed().subscribe(({ address }) => {
      if (!address) {
        return
      }

      if (address) {
        this.delivery = address

        localStorage.setItem(this.clientData.slug, JSON.stringify({ ...address, version: this.clientData.version }))
        this.cartRequest.addressId = address.id
        this.customer.addresses.unshift(address)
      }

      if (this.clientData.typeDelivery === 'km') {
        const taxValues = this.clientData.taxDelivery.filter((tax) => tax.distance * 1000 > address.distance)
        if (taxValues.length) {
          this.taxDeliveryValue = this.cupom?.type === 'freight' && this.cupomIsValid ? 0 : Number(taxValues[0].value)
          this.timeDelivery = taxValues[0].time
        }
      } else {
        const city = this.delivery && this.clientData.taxDelivery.find((t) => t.city === this.delivery.city)
        if (city) {
          const tax = city.neighborhoods.find((n) => n.name === this.delivery.neighborhood)

          if (tax) {
            this.delivery.formPayment = undefined
            this.delivery.transshipment = undefined
            this.taxDeliveryValue = Number(tax.value)
            this.timeDelivery = tax.time
          }
        }
      }
    })
  }

  public modalSize(): { width: string; height: string } {
    if (window.innerWidth < 700) {
      return {
        width: '100vw',
        height: '100vh',
      }
    }

    return { width: 'auto', height: 'auto' }
  }

  public reloadTable() {
    this.cart = []
    this.cartPizza = []
    this.saveCarts()
    this.requestCode = NaN
    this.cupom = null

    const ok = this.matDialog.open(AlertComponent, {
      data: {
        title: 'Prontinho!',
        message: `Já recebemos o seu pedido e estamos preparando.`,
        clientData: this.clientData,
      },
    })

    ok.afterClosed().subscribe(() => {
      this.getClientData()
    })
  }

  public disponibility() {
    const today = DateTime.fromISO(this.clientData.fuso, { zone: this.clientData.timeZone }).toFormat('EEEE').toLowerCase()
    const convert = (text: string) => parseFloat(text.replace(':', '.'))

    const week = this.cartRequest.type === 'P' && this.clientData.options.package.active ? this.clientData.options.package.week : this.clientData.week

    const delivery: boolean = !this.clientData.options.delivery.disableDelivery
    const local: boolean = this.clientData.deliveryLocal

    if (!(delivery || local)) {
      localStorage.removeItem(`delivery_cart_${this.clientData.slug}`)
      return false
    }

    if (this.api.getCookie('noPlans')) {
      return false
    }

    if (!week[today]) {
      return false
    }
    const now = parseFloat(DateTime.now().setZone(this.clientData.timeZone).toFormat('HH.mm'))

    const filter = week[today].filter((d) => now >= convert(d.open) && now <= convert(d.close))

    const forceNow = DateTime.local().setZone(this.clientData.timeZone)

    const forceCloseDate = this.clientData.options.forceClose ? DateTime.fromISO(this.clientData.options.forceClose) : null

    if (forceCloseDate !== null && forceCloseDate >= forceNow) {
      return false
    }

    if (filter.length) {
      return true
    }
    return false
  }

  public enableDelivery() {
    if (this.clientData.typeDelivery === 'neighborhood') {
      const city = this.clientData.taxDelivery.find((location) => location.city === this.delivery.city)

      if (!city) return false

      if (!city.neighborhoods.find((location) => location.name === this.delivery.neighborhood)) return false
      return true
    }
    if (this.delivery) {
      return this.clientData.taxDelivery.some((tax) => tax.distance >= this.delivery.distance / 1000)
    }
    return false
  }

  public formatPhone(phone: string): string {
    switch (this.translate.language()) {
      case 'pt-BR': {
        return `(${phone.substring(2, 4)}) ${phone.substring(4, 9)}-${phone.substring(9, 15)}`
      }
      case 'en-US': {
        return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6, 10)}`
      }
      case 'fr-CH': {
        return `(${phone.substring(0, 2)}) ${phone.substring(2, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 10)} ${phone.substring(10, 12)}`
      }
      case 'pt-PT': {
        return `${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 9)}`
      }
      case 'ar-AE': {
        return `${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 12)}`
      }
    }
  }

  public clearSearchFilter() {
    this.filter = ''
  }

  public async clearSearchFilterMenu(id: string) {
    this.filter = ''
    setTimeout(() => {
      this.anchorScroll(id)
    }, 1)
  }

  public parse(string) {
    string = string === undefined || string === null ? '{"store": {"D": true, "table": true, "P": true}}' : string
    return JSON.parse(string)
  }

  public limpaUrl() {
    //função
    let urlpg = location.href //pega a url atual da página
    let urllimpa = urlpg.split('?')[0] //tira tudo o que estiver depois de '?'

    window.history.replaceState(null, null, urllimpa) //subtitui a url atual pela url limpa
  }

  public getTableRequests() {
    this.matDialog.open(TableResumeComponent, {
      data: { clientData: this.clientData, table: this.table },
      autoFocus: false,
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: 'auto',
      height: 'auto',
      closeOnNavigation: true,
    })
  }

  public async callBartender(): Promise<void> {
    // fazer uma variável para rever o this.api? para realizar um retorno?
    await this.api.postCallBartender(this.context.profile.slug, {
      commandId: this.commandSession.id,
      tableId: this.table.id,
      openedId: this.table.tableOpenedId,
      commandName: this.commandSession.name,
    })
  }

  //Alterna Entre os Botões de Delivery e Encomenda, e filtra os produtos.
  public alternateButton(e?: any) {
    if ((e.target && e.target.id !== this.viewContentAlternate) || typeof e === 'string') {
      const result = typeof e !== 'string' ? e.target.id : e
      this.viewContentAlternate = result
      this.cartRequest.type = result
      localStorage.setItem('viewContentAlternate', this.viewContentAlternate)
      const cart = JSON.parse(localStorage.getItem(`${this.viewContentAlternate}_cart_${this.clientData.slug}`))
      this.clientCategories = this.filterMain()
      if (cart) {
        this.cart = cart.cart
        this.cartPizza = cart.cartPizza
      } else {
        this.cart = []
        this.cartPizza = []
        this.saveCarts()
      }
    }
  }

  public modifyPackageDate(e: any) {
    !e && (this.packageDate = null)
    e && (this.packageDate = DateTime.fromJSDate(new Date(e)))

    return this.packageDate
  }

  public nextDate(nextDate: any) {
    let result = Number(nextDate.id) - DateTime.local().weekday
    if (result < 0) {
      result = Number(nextDate.id) + (7 - DateTime.local().weekday)
    }
    const from = nextDate.time.from.split(':')
    return result === 0
      ? DateTime.fromObject({ hour: Number(from[0]), minute: Number(from[1]) }).toFormat('T')
      : DateTime.local().plus({ day: result }).toFormat('dd/MM')
  }

  public async updatePackageDate(callback?: () => void) {
    const result = await this.componentService.getPackageDate({ clientData: this.clientData, packageHours: this.packageHours, everOpen: true })
    if (result) {
      this.packageDate = result
      this.cartRequest.packageDate = result.toFormat(`yyyy-MM-dd HH:mm:ss`)
    }
    if (callback) {
      callback()
    }
  }

  verifyDisponibilityOpen() {
    if (!this.table) {
      if ((this.api.getCookie('package') || this.api.getCookie('onlyPackage')) && !this.disponibility()) {
        if (this.clientData.options.package.active) {
          if (this.api.getCookie('basic')) {
            if (this.viewContentAlternate === 'D') {
              return { text: 'Fechado para Delivery', isOpen: false }
            } else {
              return { text: 'Aberto para Encomendas', isOpen: true }
            }
          } else {
            return { text: 'Aberto', isOpen: true }
          }
        } else {
          return { text: 'Fechado', isOpen: false }
        }
      } else if (this.api.getCookie('basic') && this.disponibility()) {
        if (!this.clientData.options.package.active && this.api.getCookie('package')) {
          if (this.viewContentAlternate === 'package') {
            return { text: 'Fechado para Encomendas', isOpen: false }
          } else {
            return { text: 'Aberto para Delivery', isOpen: true }
          }
        } else {
          return { text: 'Aberto', isOpen: true }
        }
      } else if (this.disponibility()) {
        return { text: 'Aberto', isOpen: true }
      } else {
        return { text: 'Fechado', isOpen: false }
      }
    } else {
      return { text: 'Aberto', isOpen: true }
    }
  }

  returnLuxonDate(date: DateTime, format: string) {
    if (date) {
      return date.toFormat(format)
    }
  }

  public timeFreightText() {
    return !!(this.timeDelivery ?? ' ').replace(/\D/g, '') ? `${this.timeDelivery} min.` : this.timeDelivery
  }

  public findAddressById(id: number) {
    if (id) {
      return this.customer.addresses.find((address) => id === address.id)
    }
    return null
  }

  public takeOutAddress() {
    const { street, number, neigborhood, city, complement } = this.clientData.address
    return `${street}${number ? ',' + number : ''} - ${neigborhood} / ${city} ${complement ? '-' + complement : ''}`
  }

  public taxText() {
    const tax = this.context.calculateDeliveryEstimates(this.findAddressById(this.clientInfo.defaultAddressId))
    if (tax) {
      return {
        value: tax.value ?? 0,
        time: !!(tax.time ?? ' ').replace(/\D/g, '') ? `${tax.time} min.` : tax.time,
      }
    }
  }
}
