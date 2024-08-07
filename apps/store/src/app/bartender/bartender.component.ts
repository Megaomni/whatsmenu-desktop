import { DateTime } from 'luxon'
import { ComplementType, ProductType } from './../product-type'
import { Component, OnInit, ChangeDetectorRef, AfterViewChecked, ViewChild, ElementRef } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { ToastService } from 'ng-metro4'
import Command, { CommandType } from 'src/classes/command'
import Table, { TableOpened } from 'src/classes/table'
import { ApiService } from '../services/api/api.service'
import { BartenderLoginComponent } from './bartender-login/bartender-login.component'
import { BartenderType } from '../bartender-type'
import { animate, state, style, transition, trigger } from '@angular/animations'
import { CartType } from '../cart-type'
import { CartPizza } from '../cart-pizza'
import { AlertComponent } from '../modals/alert/alert.component'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { faArrowLeft, faChevronDown, faKeyboard, faMinusCircle, faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { MatKeyboardComponent, MatKeyboardRef, MatKeyboardService } from 'angular-onscreen-material-keyboard'
import { NgControl, NgModel } from '@angular/forms'
import { CartService } from '../services/cart/cart.service'
import { ContextService } from '../services/context/context.service'

@Component({
  selector: 'app-bartender',
  templateUrl: './bartender.component.html',
  styleUrls: ['./bartender.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class BartenderComponent implements OnInit, AfterViewChecked {
  profile: any
  allProducts: any[]
  allPizzas: any[]
  originalCategories: any = []
  tables: Table[]
  table?: Table
  activeCommand?: Command
  activeCommandId?: number
  newCommand = ''
  newCommandInput = false
  allBartenders: BartenderType[]
  bartenders: BartenderType[]
  bartender?: BartenderType
  tablesColumns: number
  commandColumns: number
  displayedProductsColumns: string[] = ['Produto', 'Valor', 'Ação']
  displayedPizzasColumns: string[] = ['Sabor', 'Tamanhos', 'Ação']
  productsColumnsWithExpand = ['expand', ...this.displayedProductsColumns]
  pizzasColumnsWithExpand = ['expand', ...this.displayedPizzasColumns]
  expandedProduct: any
  expandedPizza: any
  search = ''
  tagFilterSearch: 'default' | 'pizza' = 'default'
  cart: CartType[] = []
  cartPizza: CartPizza[] = []
  persistBartender = false
  spinner = false
  tabView: 'order' | 'resume' = 'order'
  changeControl = false
  footerToggleButton: 'closed' | 'opened' = 'closed'
  activeCategory: number
  keyBoardIsEnable = !!navigator.maxTouchPoints && window.innerWidth > 768
  deviceWidth = window.innerWidth
  inputKeyBoard: string

  // ICONES
  faMinusCircle = faMinusCircle
  faPlusCircle = faPlusCircle
  faTimesCircle = faTimesCircle
  faArrowLeft = faArrowLeft
  faKeyboard = faKeyboard
  faChevronDown = faChevronDown

  // KEYBOARD
  private _keyboardRef: MatKeyboardRef<MatKeyboardComponent>

  @ViewChild('newCommandInputKeyboard', { read: ElementRef }) newCommandInputKeyboardElement: ElementRef<HTMLInputElement>
  @ViewChild('newCommandInputKeyboard', { read: NgModel }) newCommandInputKeyboardControl: NgControl
  @ViewChild('bartenderSearchInput', { read: ElementRef }) bartenderSearchInputElement: ElementRef<HTMLInputElement>
  @ViewChild('bartenderSearchInput', { read: NgModel }) bartenderSearchInputControl: NgControl

  constructor(
    public api: ApiService,
    private route: ActivatedRoute,
    private matDialog: MatDialog,
    private toastService: ToastService,
    public cartService: CartService,
    private keyboardService: MatKeyboardService,
    private changeDetector: ChangeDetectorRef,
    public context: ContextService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      this.profile = await this.api.getClientData(params.slug, 'pdv')
      this.profile.categories = this.profile.categories.filter((category) => {
        let lengthCondition = true
        if (category.type === 'default') {
          lengthCondition = !!category.products.length
        } else {
          lengthCondition = !!category.product.flavors.length
        }
        return category.disponibility.store.table && lengthCondition
      })
      this.persistBartender = this.profile.options.table?.persistBartender ? true : false
      this.profile.categories.forEach((category) => {
        if (category.type === 'default') {
          category.products.forEach((product) => {
            const dayName = DateTime.local().setLocale('en-US').weekdayLong.toLowerCase()
            const nowTime = DateTime.local().toFormat('HH:mm')
            product.isAvaliable =
              product.disponibility.week[dayName].some((hour) => nowTime > hour.open && nowTime < hour.close && hour.active) &&
              product.disponibility.store.table
            product.quantity = 1
          })
          // if (!this.profile.options.disponibility.showProductsWhenPaused) {
          //   category.products = category.products.filter(product => product.status)
          // }
        }
        // if (category.type === 'pizza') {
        //   const flavorPizza = {
        //     obs: '',
        //     flavors: category.product.flavors.map(flavor => this.copyObj(flavor)),
        //     sizes: category.product.sizes.map(size => this.copyObj(size)),
        //     implementations: category.product.implementations.map(implementation => this.copyObj(implementation)),
        //     status: category.product.status
        //   }
        //   category.product.flavors = category.product.flavors
        //     .map((flavor) => {
        //       flavor.selectOptions = this.cartService.getFlavorSizes(flavor.valuesTable);
        //       flavor.pizzaId = category.product.id;
        //       flavor.categoryId = category.id;
        //       flavor.quantity = 1;
        //       flavor.size = flavor.selectOptions.length ? flavor.selectOptions[0].name : '';
        //       flavor.implementations = [];
        //       flavor.otherFlavors = [];
        //       flavor.pizza = flavorPizza

        //       if (flavor.status) {
        //         return flavor;
        //       }
        //     })
        //     .filter((f) => f);
        // }
      })
      this.activeCategory = this.profile.categories.length ? this.profile.categories[0].id : 0
      this.originalCategories = this.profile.categories.map((category) => this.copyObj(category))
      this.allProducts = this.profile.categories.reduce((acc, category) => {
        if (category.type === 'default') {
          acc = acc.concat(category.products)
        }
        return acc
      }, [])
      this.allPizzas = this.profile.categories.reduce((acc, category) => {
        if (category.type === 'pizza') {
          acc = acc.concat(category.product.flavors)
        }
        return acc
      }, [])

      try {
        this.tables = this.profile.tables
        if (!this.tables.length) {
          const alertModal = this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Nenhuma mesa ativa!',
              message: `<strong>Parece que não tem nenhuma mesa cadastrada no momento</strong><br>Por favor, crie pelo menos uma mesa`,
              textButton: 'OK',
            },
          })
          alertModal.afterClosed().subscribe(() => {
            window.location.reload()
          })
        }
        this.tables = this.tables.map((table) => new Table(table))
        const numeric = this.tables
          .filter((a) => !isNaN(parseFloat(a.name)))
          .sort((a, b) => {
            if (parseInt(a.name) === parseInt(b.name)) {
              if (a.name.includes('0') && !b.name.includes('0')) {
                return -1
              }

              if (!a.name.includes('0') && b.name.includes('0')) {
                return 1
              }
            }
            return parseInt(a.name) - parseInt(b.name)
          })
        const alphabetic = this.tables
          .filter((a) => isNaN(parseFloat(a.name)))
          .sort((a, b) => {
            let c = parseInt(a.name.replace(/\D/gim, ''))
            let d = parseInt(b.name.replace(/\D/gim, ''))
            return c - d
          })

        this.tables = [...numeric, ...alphabetic]
        this.allBartenders = this.profile.bartenders
        this.bartenders = this.allBartenders.filter((bartender) => bartender.deleted_at === null)
      } catch (error) {
        console.error(error)
        if (error.status === 406) {
          const supportMessage = `Olá gostaria de obter informações sobre o plano de mesa para controle de garçons!`
          const planModal = this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Plano Mesa',
              message: `<strong>${error.error.message}</strong><br>`,
              textButton: 'Contatar Suporte',
              noReload: true,
            },
          })
          planModal.afterClosed().subscribe(() => {
            window.location.href = `https://api.whatsapp.com/send/?phone=5511937036875&text=${encodeURI(supportMessage)}`
          })
        }
      }

      this.setColumns()
      window.addEventListener('resize', () => {
        this.setColumns()
      })

      let time = new Date().getTime()

      window.addEventListener('mousemove', () => {
        time = new Date().getTime()
      })

      window.addEventListener('keypress', () => {
        time = new Date().getTime()
      })

      const refresh = () => {
        if (new Date().getTime() - time >= 300000) {
          window.location.reload()
        } else {
          setTimeout(refresh, 10000)
        }
      }

      setTimeout(refresh, 10000)
    })

    const body = document.querySelector('body') as HTMLBodyElement
    if (body) {
      body.style.overscrollBehavior = 'contain'
    }

    window.onpopstate = (e) => {
      e.preventDefault()
      if (this.table) {
        this.closeTable()
      }
    }
  }

  ngAfterViewChecked(): void {
    if (!(this.tabView === 'order' && this.bartender)) {
      this.changeControl = false
      this.search = ''
      this.newCommand = ''
      if (this.profile && !this.bartender) {
        this.profile.categories.forEach((category) => {
          if (category.type === 'default') {
            category.products.forEach((product) => {
              product.quantity = 1
              product.obs = ''
              product.complements.forEach((complement) => {
                complement.itens.forEach((item) => {
                  item.quantity = 0
                })
              })
            })
          }
          if (category.type === 'pizza') {
            category.product.flavors.forEach((flavor) => {
              flavor.quantity = 1
              flavor.obs = ''
              flavor.otherFlavors = []
              flavor.implementations = []
            })
          }
        })
        this.tabView === 'order'
      }
    }
  }

  public setColumns() {
    if (window.innerWidth <= 320) {
      this.tablesColumns = 3
      this.commandColumns = 1
    } else if (window.innerWidth <= 600) {
      this.tablesColumns = 4
      this.commandColumns = 1
    } else if (window.innerWidth <= 768) {
      this.tablesColumns = window.devicePixelRatio === 3 ? 4 : 8
      this.commandColumns = 3
    } else if (window.innerWidth > 768) {
      this.tablesColumns = 10
      this.commandColumns = 3
    }
  }

  public async getTable(table: Table, login = true) {
    const sessionBartender = sessionStorage.getItem('bartender') ? JSON.parse(sessionStorage.getItem('bartender')) : undefined

    if (this.persistBartender && sessionBartender) {
      try {
        this.spinner = true
        this.table = new Table(await this.api.getTable(table.id))
        const { bartender } = await this.api.authBartender({
          bartenderId: Number(sessionBartender.id),
          password: sessionBartender.password,
          tableId: this.table.id,
        })
        let updatedTableIndex = this.tables.findIndex((t) => t.id === this.table.id)
        if (updatedTableIndex > -1) {
          this.tables[updatedTableIndex] = this.table
        }
        bartender.categories = this.bartenderAllowedCategories(bartender)
        sessionStorage.setItem('bartender', JSON.stringify({ id: sessionBartender.id, password: sessionBartender.password }))
        if (!this.table.status) {
          return this.showMessage('Mesa Pausada!')
        }
        this.bartender = bartender
        this.changeActiveCategory(bartender.categories.length ? bartender.categories[0].id : 0)
        this.activeCommand = this.activeCommand ?? this.table.activeCommands[0]
        if (this.activeCommand) {
          this.activeCommandId = this.activeCommand.id
          this.activeCommand.requests = this.activeCommand.requests.reverse()
        }
      } catch (error) {
        console.error(error)
        return this.showMessage('Mesa não encontrada ou indisponível')
      } finally {
        this.spinner = false
      }
    } else if (login) {
      this.setTable(table)
    }
  }

  public setTable(table: Table) {
    const authModal = this.matDialog.open(BartenderLoginComponent, {
      closeOnNavigation: true,
      data: {
        bartenders: this.bartenders,
        profile: this.profile,
        table,
        spinner: (value: boolean) => (this.spinner = value),
      },
      disableClose: window.innerWidth <= 768 ? true : false,
    })
    window.onpopstate = (e) => {
      e.preventDefault()
      if (this.table) {
        this.closeTable()
      }
      authModal.close()
    }

    authModal.afterClosed().subscribe((data: { bartender: BartenderType; table: Table }) => {
      if (data) {
        const { bartender, table } = data
        if (!bartender || !table) {
          return (this.spinner = false)
        }
        bartender.categories = this.bartenderAllowedCategories(bartender)
        if (this.persistBartender) {
          sessionStorage.setItem('bartender', JSON.stringify({ id: bartender.id, password: bartender.password }))
        } else {
          sessionStorage.removeItem('bartender')
        }
        this.table = new Table(table)
        let updatedTableIndex = this.tables.findIndex((t) => t.id === this.table.id)
        if (updatedTableIndex > -1) {
          this.tables[updatedTableIndex] = this.table
        }
        if (!table.status) {
          this.spinner = false
          return this.showMessage('Mesa Pausada!')
        }
        this.bartender = bartender
        this.changeActiveCategory(bartender.categories.length ? bartender.categories[0].id : 0)
        this.activeCommand = this.table.activeCommands[0]
        this.activeCommandId = this.activeCommand?.id
        this.spinner = false
      }
    })
  }

  public showMessage(text: string, cls: string = 'alert') {
    this.toastService.create(text, {
      additional: { distance: 400, showTop: true },
      cls,
      timeout: 2000,
    })
  }

  public currency(value: number) {
    return (value ? value : 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  public async createCommand() {
    if (this.newCommandInput || this.isEmptyCommand()) {
      if (!this.newCommand.trim()) {
        return this.toastService.create('Insira um nome válido para comanda', {
          additional: { distance: 400, showTop: true },
          cls: 'warning',
          timeout: 2000,
        })
      }
      this.spinner = true
      try {
        const response: { command: CommandType; tableOpened: TableOpened } = await this.api[
          this.profile.options.beta ? 'postCommandToNext' : 'postCommand'
        ](
          {
            tableId: this.table.id,
            name: this.newCommand,
            status: 1,
            slug: this.profile.slug,
          },
          true
        )
        const { command: commandResponse, tableOpened } = response

        commandResponse.requests = []
        const newCommand = new Command(commandResponse)

        if (this.table && !this.table.opened) {
          tableOpened.commands = []
          tableOpened.commands.push(newCommand)
          this.table.opened = new TableOpened(tableOpened)
        } else if (this.table && this.table.opened) {
          this.table.opened.commands.push(newCommand)
        }

        this.table.activeCommandsFilter()
        this.activeCommand = newCommand
        this.activeCommandId = newCommand.id
        this.toastService.create(`Comanda ${newCommand.name} criada com sucesso`, {
          additional: { distance: 400, showTop: true },
          cls: 'success',
          timeout: 1500,
        })
      } catch (error) {
        this.toastService.create(error.error.message || 'Algo inesperado ocorreu, tente novamente', {
          additional: { distance: 400, showTop: true },
          cls: 'alert',
          timeout: 1500,
        })
        if (error.error.paused) {
          let updatedTableIndex = this.tables.findIndex((t) => t.id === this.table.id)
          if (updatedTableIndex > -1) {
            this.tables[updatedTableIndex].status = false
          }
        }
        console.error(error)
      }
    }

    this.newCommand = ''
    this.newCommandInput = false
    this.spinner = false
  }

  public clearSearchButton() {
    const searchInput = document.getElementById('bartenderSearchInput')
    if (searchInput) {
      searchInput.addEventListener('clearclick', () => {
        this.search = ''
      })
    }
  }

  // Pega a luminosidade da cor e retorna uma número entre 0 a 255
  public Luminosity(color: string, packageA: boolean = false) {
    let r: any
    let g: any
    let b: any
    let lum: any
    let long: any
    let colorArr: any
    let background: any
    let colorS: any
    let arr = []

    colorArr = color.split('')
    long = colorArr.length > 4

    r = long ? parseInt(colorArr[1] + colorArr[2], 16) : parseInt(colorArr[1], 16) * 17
    g = long ? parseInt(colorArr[3] + colorArr[4], 16) : parseInt(colorArr[2], 16) * 17
    b = long ? parseInt(colorArr[5] + colorArr[6], 16) : parseInt(colorArr[3], 16) * 17
    lum = (r * 299 + g * 587 + b * 114) / 1000

    arr.push(r, g, b)

    if (!packageA) {
      background = color
      colorS = lum > 127.5 ? 'black' : 'white'
    } else {
      const filtrados = arr.filter((el) => el < 40)
      if (filtrados.length >= 2) {
        r < 40 && (r = 50)
        g < 40 && (g = 50)
        b < 40 && (b = 50)
      }
      lum = (r * 299 + g * 587 + b * 114) / 1000
      if (lum > 127.5) {
        r = r / 2
        g = g / 2
        b = b / 2

        lum = (r * 299 + g * 587 + b * 114) / 1000
        colorS = lum > 127.5 ? 'black' : 'white'
      } else {
        r = r + 0.3 * r
        g = g + 0.3 * g
        b = b + 0.3 * b
        lum = (r * 299 + g * 587 + b * 114) / 1000
        colorS = lum > 127.5 ? 'black' : 'white'
      }
      background = `rgb(${r}, ${g}, ${b})`
    }

    return {
      color: colorS,
      background,
    }
  }

  public complementTotalItens(complement: ComplementType) {
    const result = complement.itens.reduce((acc, item) => {
      acc += item.quantity
      return acc
    }, 0)
    return result
  }

  public verifyRequiredComplement(product: ProductType) {
    return product.complements.some((comp) => !!comp.required)
  }

  public copyObj(obj: any) {
    const copy = JSON.parse(JSON.stringify(obj))
    return copy
  }

  public increaseItem(item: any) {
    ++item.quantity
  }

  public decreaseItem(item: any) {
    if (item.quantity > 0) {
      --item.quantity
    }
  }

  public increaseProduct(product: any) {
    ++product.quantity
  }

  public decreaseProduct(product: any) {
    if (product.quantity > 1) {
      --product.quantity
    }
  }

  public increasePizza(flavor: any) {
    ++flavor.quantity
  }

  public decreasePizza(flavor: any) {
    if (flavor.quantity > 1) {
      --flavor.quantity
    }
  }

  public productValueWithComplements(product: any) {
    const totalComplements = product.complements.reduce((total, complement) => {
      complement.itens.forEach((item) => {
        total += item.value * item.quantity
      })
      return total
    }, 0)

    const result = ((product.promoteStatusTable ? product.promoteValueTable : product.valueTable) + totalComplements) * product.quantity
    return result
  }

  public denyAddItemToCart(product: ProductType) {
    if (this.verifyRequiredComplement(product)) {
      return product.complements
        .filter((c) => c.required)
        .every((complement) => complement.itens.reduce((totalQuantity, item) => (totalQuantity += item.quantity), 0) >= complement.min)
    }
  }

  public removeProductCart(index: number) {
    this.cart.splice(index, 1)
  }

  public removePizzaCart(index: number) {
    this.cartPizza.splice(index, 1)
  }

  public isEmptyCommand() {
    return !this.table?.activeCommands.length
  }

  public async sendRequestToADM() {
    try {
      await this.getTable(this.table, false)
      this.spinner = true
      const newRequest = await this.api.postRequest({
        code: 1,
        commandId: this.activeCommand.id,
        slug: this.profile.slug,
        client: {
          name: this.activeCommand.name,
          contact: '-',
        },
        bartenderId: this.bartender.id,
        cart: this.cart,
        cartPizza: this.cartPizza,
        type: 'T',
        packageDate: null,
        typeDelivery: 2,
        taxDeliveryValue: 0,
        timeDelivery: 0,
        total: this.cartService.totalCartValue(this.cart, this.cartPizza, {} as any),
      })
      this.activeCommand.requests.push(newRequest)
      const commandIndex = this.table.opened.commands.findIndex((c) => c.id === this.activeCommand.id)
      if (commandIndex > -1) {
        this.table.opened.commands[commandIndex] = this.activeCommand
      }
      this.table.activeCommandsFilter()
      this.cart = []
      this.cartPizza = []
      this.showMessage('Pedido registrado com sucesso!', 'success')
    } catch (error) {
      console.error(error)
      if (error.error.tableIsPaused) {
        let updatedTableIndex = this.tables.findIndex((t) => t.id === this.table.id)
        if (updatedTableIndex > -1) {
          this.tables[updatedTableIndex].status = false
        }
      }
      this.showMessage(error.error.message ?? 'Não foi possivel realizar o pedido')
    } finally {
      this.spinner = false
    }
  }

  public closeTable() {
    this.bartender = undefined
    this.activeCommand = undefined
    this.activeCommandId = undefined
    this.table = undefined
    this.changeDetector.detectChanges()
    this.tabView = 'order'
    // window.location.reload();
  }

  public getBartender(bartenderId: number) {
    const bartender = this.allBartenders.find((b) => b.id === bartenderId)
    return bartender
  }

  public getBartenderFormatedName(bartender: BartenderType) {
    return bartender.deleted_at ? bartender.name.replace(bartender.name.substring(bartender.name.length - 19), ' (Desativado)') : bartender.name
  }

  public bartenderAllowedCategories(bartender: BartenderType) {
    return this.profile.categories.filter((c: any) => !bartender.controls.blockedCategories?.includes(c.id))
  }

  public async cancelRequest(requestId: number, commandId: number) {
    try {
      this.spinner = true
      const response = await this.api.updateRequest({
        bartenderId: this.bartender.id,
        requestId,
        update: { status: 'canceled' },
      })
      if (response.status === 'canceled') {
        const commandIndex = this.table.activeCommands.findIndex((c) => c.id === commandId)
        if (commandIndex > -1) {
          this.table.activeCommands[commandIndex].requests = this.table.activeCommands[commandIndex].requests.filter((r) => r.id !== response.id)
        }
        this.activeCommand.requests = this.activeCommand.requests.filter((r) => r.id !== response.id)
      }
      this.showMessage(`Pedido WM${response.code}-${response.type} cancelado`, 'success')
    } catch (error) {
      console.error(error)
      this.showMessage(`${error.error.message ?? 'Não foi possível cancelar o pedido, tente novamente'}`)
    }
    this.spinner = false
  }

  public diffTime(time: string) {
    return formatDistanceToNow(new Date(time), {
      locale: ptBR,
      addSuffix: true,
    })
  }

  public toogleAccordionButton() {
    const header = document.querySelector('mat-expansion-panel-header') as HTMLElement
    if (header) {
      header.click()
    }
  }

  public trackBy(index: number, item: any): number {
    return item.id
  }

  public changeActiveCategory(categoryId: number) {
    if (!this.bartender.controls.blockedCategories?.includes(categoryId)) {
      this.activeCategory = categoryId
    }
  }

  public findCommandByIdOption(commandId: number): Command {
    return this.table.activeCommands.find((c) => c.id == commandId)
  }

  public toggleKeyboard(input: string) {
    this.inputKeyBoard = input
    this.keyBoardIsEnable = !this.keyBoardIsEnable
    if (!this.keyBoardIsEnable) {
      this.closeKeyboard()
    }
    setTimeout(() => {
      this[input].nativeElement.focus()
    }, 10)
  }

  public openKeyboard(input: string, control: string) {
    if (this.keyBoardIsEnable) {
      this._keyboardRef = this.keyboardService.open(navigator.language)
      this._keyboardRef.instance.setInputInstance(this[input])
      this._keyboardRef.instance.attachControl(this[control].control)
      setTimeout(() => {
        this[input].nativeElement.focus()
      }, 10)
    }
  }

  public closeKeyboard() {
    this._keyboardRef?.dismiss()
  }

  public logger(value: any, stringify = false) {
    console.log(stringify ? JSON.stringify(value) : value)
  }
}
