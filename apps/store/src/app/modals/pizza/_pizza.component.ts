import { DialogConfirmDateComponent } from './../dialog-confirm-date/dialog-confirm-date.component'
import { CategoryType } from './../../category-type'
import { ControlDialogFlavorsComponent } from './../../pizza/control-dialog-flavors/control-dialog-flavors.component'
import { Component, OnInit, Inject, ViewChild, AfterViewChecked, AfterViewInit, AfterContentInit, AfterContentChecked } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { NgbNav } from '@ng-bootstrap/ng-bootstrap'

import { CartFlavorPizzaType, CartPizza } from 'src/app/cart-pizza'
import { CartRequestType } from 'src/app/cart-request-type'
import { faArrowLeft, faCircleMinus, faCirclePlus, faMinusCircle, faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons'
import { PizzaProductType, PizzaFlavorType, PizzaImplementationType, PizzaSizeType } from './../../pizza-product-type'
import { ClientType } from 'src/app/client-type'
import { AlertComponent } from '../alert/alert.component'
import { ApiService } from 'src/app/services/api/api.service'
import { DateTime } from 'luxon'
// import { DialogConfirmComponent } from '../dialog-confirm/dialog-confirm.component';
import * as moment from 'moment'
import { CartService } from 'src/app/services/cart/cart.service'
import { ComplementItemType, ComplementType } from 'src/app/product-type'
import { ItemRequiredComponent } from '../product/item-required/item-required.component'
import { ProfileType } from 'src/app/profile-type'
declare const fbq: any

@Component({
  selector: 'app-pizza',
  template: '',
  styleUrls: ['./pizza.component.scss'],
})
export class _PizzaComponent implements OnInit, AfterContentChecked {
  @ViewChild('nav') nav: NgbNav
  @ViewChild('implementationNav') implementationNav: NgbNav
  @ViewChild('complementNav') complementNav: NgbNav

  pizza: PizzaProductType
  implementationCount: number
  complementCount: number
  cart: CartFlavorPizzaType
  cartOriginal: CartPizza[]
  clientData: ProfileType
  countFlavors: number
  sizeName: string
  cover: string
  categoryName: string
  category: CategoryType
  filter: string
  allPizzas: PizzaFlavorType[] = []
  viewContentAlternate: string
  sizeContent: PizzaSizeType
  disponibility: boolean
  leftArrow = faArrowLeft
  plusCircle = faPlusCircle
  value: number = 1
  minusCircle = faMinusCircle
  selectedProducts: any[]
  tabs = []
  selectedCrust: any[]
  multipleBorders: boolean
  maxComplementsQuantity = new Map()

  magnifying = faSearch

  table = this.data.table

  radio = -1
  active = 1
  step = 'flavors'

  singleImplementation = true
  singleComplement = true

  outlineCirclePlus = faCirclePlus
  outlineCircleMinus = faCircleMinus

  // Variaveis de encomendas
  datesAndHours = {}
  constructor(
    public dialogRef: MatDialogRef<any>,
    public api: ApiService,
    public cartService: CartService,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.clientData = this.data.clientData
    this.cartOriginal = this.data.cartOriginal
    this.multipleBorders = this.clientData.options.pizza.multipleBorders
    this.pizza = this.jsonCopy(this.data.pizza)
    this.complementCount = this.cartService.sumComplementTotalItens(this.pizza.complements).length
    this.implementationCount = this.pizza.implementations.length
    this.countFlavors = this.data.flavors
    this.sizeName = this.data.size
    this.sizeContent = this.data.sizeContent
    this.cover = this.data.cover
    this.categoryName = this.data.categoryName
    this.category = this.data.category
    this.allPizzas = this.pizza.flavors
    this.viewContentAlternate = this.data.viewContentAlternate
    this.disponibility = this.data.disponibility
    this.active = 1

    if (this.data.datesAndHours) {
      this.datesAndHours = this.data.datesAndHours
    }
    this.tabs = new Array(this.countFlavors).fill(1).map((item, index) => index + 1)

    this.initPizzaUpdate(this.data.editPizza)

    // tslint:disable-next-line: no-unused-expression
    document.getElementById('totalItem') &&
      document.getElementById('totalItem').addEventListener('change', (e: any) => {
        if (isNaN(e.target.value) || e.target.value === '0') {
          this.cart.quantity = 1
        }
      })

    // console.log({
    //   countFlavors: this.countFlavors,
    //   table: this.table,
    //   sizeName: this.sizeName,
    //   disponibility: this.disponibility
    // });
  }

  ngAfterContentChecked(): void {
    this.cart.flavors = this.cart.flavors.map((flavor) => {
      if (flavor?.blocked) {
        flavor = undefined
      }
      return flavor
    })
  }

  retrievePizzaValue() {
    const cart = { ...this.cart }
    cart.flavors = cart.flavors.filter((flavor) => flavor)
    return this.cartService.itemValueWithComplements({ item: cart, valueType: this.data.cartRequest?.type, type: 'pizza', multiplyByQuantity: true })
  }

  initPizzaUpdate(pizza?: any) {
    if (pizza) {
      pizza = JSON.parse(JSON.stringify(pizza))
    }
    this.pizza.flavors.forEach((flavor) => {
      const updatedFlavor = pizza?.flavors.find((fl) => fl.code === flavor.code)
      flavor.complements = updatedFlavor?.complements || this.jsonCopy(this.pizza.complements)
      flavor.implementations = updatedFlavor?.implementations || []
    })

    this.cart = {
      obs: pizza?.obs || '',
      flavors: pizza?.flavors || new Array(this.countFlavors).fill(undefined),
      value: pizza?.value || 0,
      implementations: pizza?.implementations || [],
      id: this.data.id,
      categoryId: this.data.categoryId,
      quantity: pizza?.quantity || 1,
      sizes: pizza?.sizes || [],
      status: true,
      size: this.data.size,
      sizeCode: this.data.sizeContent.code,
      flavorCode: null,
      complements: pizza?.complements || this.jsonCopy(this.pizza.complements),
    }

    this.resetComplementCount()
  }

  resetComplementCount() {
    this.cart.complements.forEach((complement) => {
      this.maxComplementsQuantity.set(complement.id, {
        max: complement.max,
        min: complement.min,
        current: this.cartService.complementTotalItens(complement) || 0,
        required: complement.required,
        name: complement.name,
      })
    })

    this.cart.flavors.forEach((flavor) => {
      flavor?.complements.forEach((complement) => {
        const number = complement.itens.reduce((accumulator, currentValue) => accumulator + (currentValue.quantity || 0), 0)
        const currentComplements = this.maxComplementsQuantity.get(complement.id)
        this.maxComplementsQuantity.set(complement.id, { ...currentComplements, current: currentComplements.current + number })
      })
    })
  }

  jsonCopy(data: any) {
    return JSON.parse(JSON.stringify(data))
  }

  public addFlavorToCart(flavor: PizzaFlavorType) {
    if (this.cart.flavors.length < this.countFlavors) {
      this.cart.flavors.push(flavor)
      this.setValuePizza()
    }
  }

  public rmFlavorFromCart(flavor: PizzaFlavorType) {
    const index = this.cart.flavors.findIndex((f) => f.code === flavor.code)
    this.cart.flavors.splice(index, 1)
    this.setValuePizza()
  }

  public countQuantityItemOfCart(flavor: PizzaFlavorType) {
    return this.cart.flavors.filter((f) => f.code === flavor.code).length
  }

  increment() {
    this.value++
  }

  decrement() {
    this.value--
  }

  private setValuePizza() {
    const table = this.api.getCookie('table')

    if (this.clientData.options.pizza.higherValue) {
      this.cart.value = 0

      this.cart.flavors.forEach((flavor) => {
        if (table) {
          if (this.cart.value < flavor.valuesTable[this.sizeName]) {
            this.cart.value = flavor.valuesTable && Number(flavor.valuesTable[this.sizeName])
          }
        } else {
          if (this.cart.value < flavor.values[this.sizeName]) {
            this.cart.value = Number(flavor.values[this.sizeName])
          }
        }
      })

      this.cart.value += this.cart.implementations.reduce((a, b) => a + b.value, 0)
    } else {
      if (table) {
        this.cart.value =
          this.cart.flavors.reduce((a, b) => {
            return a + (b.valuesTable && b.valuesTable[this.sizeName] / this.countFlavors)
          }, 0) + this.cart.implementations.reduce((a, b) => a + b.value, 0)
      } else {
        this.cart.value =
          this.cart.flavors.reduce((a, b) => a + b.values[this.sizeName] / this.countFlavors, 0) +
          this.cart.implementations.reduce((a, b) => a + b.value, 0)
      }
    }
  }

  public addImplementation(item: PizzaImplementationType, index: number) {
    if (this.cart.implementations[0]) {
      if (this.cart.implementations[0].code === item.code) {
        this.cart.implementations = []
        this.radio = -1
      } else {
        this.cart.implementations = []
        this.cart.implementations.push(item)
        this.radio = index
        // this.setValuePizza();
      }
    } else {
      // this.cart.implementations = [];
      this.cart.implementations.push(item)
      this.radio = index
    }
    this.setValuePizza()
    // console.log(this.cart.implementations);
  }

  /*   public addFlavor(item: PizzaFlavorType, index: number) {
      if (this.pizza.flavors[0]) {
        if (this.pizza.flavors[0].code === item.id) {
  
          this.pizza.flavors = [];
          this.radio = -1;
  
        } else {
          this.cart.flavors = [];
          this.cart.flavors.push(item);
          this.radio = index;
          // this.setValuePizza();
        }
      } else {
        // this.cart.implementations = [];
        this.pizza.flavors.push(item);
        this.radio = index;
      }
      this.setValuePizza();
      // console.log(this.cart.implementations);
    } */

  public getPizzaName(): string {
    this.filterFlavors()
    return `${this.categoryName} ${this.sizeName} ${this.countFlavors} ${this.countFlavors === 1 ? 'sabor' : 'sabores'}`.toUpperCase()
  }

  async getCommand() {
    const command = sessionStorage.getItem('command')
    if (command !== null) {
      const req = await this.api.getCommand(JSON.parse(command).id, this.clientData.slug)
      if (req.status !== 0) {
        sessionStorage.setItem('command', JSON.stringify(req))
      } else {
        sessionStorage.removeItem('command')
      }
    }
  }

  public async checkPizzaDisponibility() {
    return await this.api.checkProductDisponibility(
      this.clientData.slug,
      'pizza',
      this.pizza.id,
      { packageType: (this.viewContentAlternate === 'P' || this.viewContentAlternate === 'package'), cart: this.cart, packageDate: DateTime.fromFormat(this.data.cartRequest.packageDate, 'yyyy-MM-dd HH:mm:ss').toISO() },
      this.cart.size,
      this.cart.flavors,
      this.cart.implementations,
      this.cart.complements
    )
  }

  public verifyAvailableFlavors(product?: PizzaFlavorType, editIndex?: number, flavorNumber?: number) {
    if (!this.clientData.options.inventoryControl) {
      return true
    }
    if (typeof editIndex === 'number') {
      this.cartOriginal.splice(editIndex, 1)
    }

    const cartFlavors = this.cartOriginal.reduce((array, item) => {
      const flavorsWithMultiplier = item.flavors.map((flavor) => ({ ...flavor, quantity: item.quantity }))
      return array.concat(flavorsWithMultiplier)
    }, [])

    const groupedFlavors = cartFlavors.reduce((grouped, flavor) => {
      const existingFlavor = grouped.find((f) => f.code === flavor.code)
      if (existingFlavor) {
        existingFlavor.quantity += flavor.quantity
      } else {
        grouped.push({
          name: flavor.name,
          code: flavor.code,
          quantity: flavor.quantity,
          amount: flavor?.amount,
          bypass_amount: flavor?.bypass_amount,
        })
      }
      return grouped
    }, [])

    if (product?.code) {
      if (product?.amount === 0 && !product.bypass_amount) return false

      const identifiedFlavor = groupedFlavors.find((flavor) => flavor?.code === product.code)
      const itemFlavors = this.pizza.flavors
        .filter((f) => f?.code === identifiedFlavor?.code)
        .map((flavor) => ({ ...flavor, quantity: identifiedFlavor?.quantity || 0 }))

      if (identifiedFlavor?.bypass_amount || typeof identifiedFlavor?.amount !== 'number') return true
      if (identifiedFlavor.code === product.code) {
        return !(
          identifiedFlavor.quantity + (itemFlavors.find((flavor) => flavor.code === identifiedFlavor.code)?.quantity || 0) >
          identifiedFlavor.amount
        )
      } else {
        return !(
          identifiedFlavor.quantity + (itemFlavors.find((flavor) => flavor.code === identifiedFlavor.code)?.quantity || 0) >
          identifiedFlavor.amount
        )
      }
    }
  }

  public verifyCurrentPizzaFlavorQuantity() {
    // console.log('teste jason');

    if (!this.clientData.options.inventoryControl) return { availability: true }
    // console.log('teste jason2');
    const currentCartFlavors = this.cart.flavors.map((flavor) => {
      if (flavor) return { ...flavor, quantity: this.cart.quantity }
    })
    if (!currentCartFlavors.length) return
    const mappedCart = []
    currentCartFlavors.forEach((flavor) => {
      const existingFlavor = mappedCart.find((f) => f.code === flavor?.code)
      if (existingFlavor?.quantity) {
        existingFlavor.quantity += flavor.quantity || 0
      } else {
        mappedCart.push({ ...flavor, quantity: flavor?.quantity || 0 })
      }
    })

    mappedCart.filter((flavor) => flavor.quantity > 0).sort((a, b) => a.quantity - b.quantity)
    const unavailableFlavors = mappedCart.filter((flavor) => flavor.amount < flavor.quantity && !flavor.bypass_amount)
    if (unavailableFlavors.length) {
      const unavailableFlavorsList = unavailableFlavors
        .map((flavor) => {
          const availableAmount = flavor.amount || 0
          const flavorName = flavor.name || 'Sabor'
          return `<li>${flavorName}, apenas ${availableAmount} disponíveis</li>`
        })
        .join('')
      const message = `<div><h2>Sabores Indisponíveis</h2><ul>${unavailableFlavorsList}</ul></div>`
      return { availability: false, message }
    }
    return { availability: true }
  }

  public sendAlert(message: string) {
    this.matDialog.open(AlertComponent, {
      data: {
        message,
        noReload: true,
      },
    })
  }

  public async close(buttonP?: boolean) {
    const checkProductDisponibility = await this.checkPizzaDisponibility()

    if (!checkProductDisponibility.disponibility) {
      const message = `<h2>Produto Indisponível</h2><p>${checkProductDisponibility.message}</p>`
      this.matDialog.open(AlertComponent, {
        data: {
          message,
        },
      })
      this.dialogRef.close()
      return false
    }

    const flavors = this.cart.flavors.map((flavor) => flavor.name)
    await this.getCommand()
    const command = JSON.parse(sessionStorage.getItem('command'))
    const table = this.api.getCookie('table')

    if (this.clientData.options.tracking && this.clientData.options.tracking.pixel) {
      fbq('track', 'AddToCart', {
        content_name: `Pizza ${this.sizeName} ${this.countFlavors} ${this.countFlavors === 1 ? 'Sabor' : 'Sabores'} (${flavors})`,
        content_category: this.categoryName,
        content_ids: [this.pizza.id],
        content_type: 'product',
        value: this.cart.value,
        currency: 'BRL',
      })
    }

    if (buttonP) {
      const packageLocal = localStorage.getItem('packageDate')
      if (packageLocal === null) {
        const dialogDate = this.matDialog.open(DialogConfirmDateComponent, {
          data: {
            clientData: this.clientData,
            time: moment(),
            datesAndHours: this.datesAndHours,
          },
          maxWidth: '100vw',
          width: window.innerWidth < 700 ? '100vw' : '400px',
          height: window.innerWidth < 700 ? '100vh' : '800px',
        })

        dialogDate.afterClosed().subscribe((time: moment.Moment) => {
          if (!time) {
            return
          }
          // localStorage.setItem('schedule', 'true')
          localStorage.setItem('packageDate', time.toLocaleString())
          this.data.time(time)
          this.close()
        })
      } else {
        this.close()
      }

      return
    }

    if (this.cart.flavors.length === this.countFlavors) {
      // localStorage.setItem('schedule', 'false')
      // const contentButtons = document.querySelector('.content_tab').childNodes
      //   contentButtons.forEach((el: any) => {
      //     if (el.id !== localStorage.getItem('viewContentAlternate')) {
      // this.matDialog.open(DialogConfirmDateComponent, {
      //         data
      //       })
      //     }
      //   })

      this.dialogRef.close({
        item: this.cart,
      })

      if (table) {
        if (!command) {
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
      }
    } else {
      this.matDialog.open(ControlDialogFlavorsComponent, {
        data: { flavors: this.countFlavors },
      })
    }
  }

  public filterFlavors() {
    let filtered: PizzaFlavorType[] = this.pizza.flavors
    const filter =
      this.filter &&
      this.filter
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    if (filter) {
      filtered = this.pizza.flavors.filter((pizza) => {
        if (pizza.description == null) {
          pizza.description = '' // Seta description como string vazia caso seja null
        }

        if (
          pizza.name
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(filter) ||
          pizza.description
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .includes(filter)
        ) {
          return pizza
        }
      })
    }
    return filtered
  }

  public safariTrash() {
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

  public nextDate(nextDateCategory: any, categoryOff: boolean) {
    let result = 0
    let from: string

    if (categoryOff) {
      return 'Indisponível'
    }

    if (nextDateCategory) {
      result = Number(nextDateCategory.id) - DateTime.local().weekday
      if (result < 0) {
        result = Number(nextDateCategory.id) + (7 - DateTime.local().weekday)
      }
    }

    from = nextDateCategory.time.from.split(':')

    return result === 0
      ? `Disponível a partir de: ${DateTime.fromObject({ hour: Number(from[0]), minute: Number(from[1]) }).toFormat('T')}`
      : `Disponível a partir de: ${DateTime.local().plus({ day: result }).toFormat('dd/MM')}`
  }

  alertPizza() {
    this.matDialog.open(AlertComponent, {
      data: {
        message: `Desculpe, o tamanho de pizza ${this.sizeContent.name} está indisponível`,
        noReload: true,
      },
    })

    this.dialogRef.close()
  }

  onProductSelected(product: any, tabIndex: number) {
    this.selectedProducts[tabIndex] = product
  }

  public logger(...itemArr: any[]) {
    console.log(itemArr)
  }

  setActiveTab(tabId: number) {
    if (tabId > this.tabs.length) return
    let navigation
    switch (this.step) {
      case 'flavors':
        navigation = this.nav
        break
      case 'implementations':
        navigation = this.implementationNav
        break
      case 'complements':
        navigation = this.complementNav
        break
      default:
        navigation = this.nav
        break
    }
    navigation.select(tabId)
    const navItem = document.getElementById(tabId.toString()) as HTMLLIElement
    navItem.scrollIntoView({ behavior: 'smooth', inline: 'start' })
    this.active = tabId
    setTimeout(() => {
      const navbar = document.getElementById('pizzaAnchor' + this.active) as HTMLLIElement
      navbar?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'start' })
    }, 400)
  }

  setActiveStep(step: string) {
    const navbar = document.getElementById('pizzaAnchor' + (this.active + 1)) as HTMLLIElement
    navbar?.scrollIntoView({ behavior: 'smooth' })
    this.active = 1
    if (!this.pizza.complements.length && !this.pizza.implementations.length) {
      return this.saveToCart()
    }

    switch (step) {
      case 'implementations':
        if (!this.pizza.implementations.length) return (this.step = 'complements')
        break
      case 'complements':
        if (!this.pizza.complements.length) return this.saveToCart()
      default:
        break
    }
    this.step = step

    return
  }

  toggleSingleComplement(boolean: boolean) {
    this.singleComplement = boolean
    if (this.singleComplement) {
      this.complementNav.select('singleComplement')
    } else {
      this.complementNav.select(1)
    }
  }

  toggleSingleImplementation(boolean: boolean) {
    this.singleImplementation = boolean
    this.cart.implementations = []
    this.cart.flavors.forEach((flavor) => (flavor.implementations = []))
    if (this.singleImplementation) {
      this.implementationNav.select('singleImplementation')
    } else {
      this.implementationNav.select(1)
    }
  }

  public updatePizzaFlavor(event: any) {
    console.log(event)
  }

  public stringifyFlavor(flavor: any) {
    return JSON.stringify(flavor)
  }

  public parseFlavor(flavor: string) {
    return JSON.parse(flavor)
  }

  public verifyAvailableQuantity() {
    if (!this.clientData.options.inventoryControl) return true
    const menuItems = this.clientData.categories.filter((cat) => cat.type === 'pizza').flatMap((item) => item.product)
    const item = menuItems.find((item) => item?.id === this.pizza?.id)

    if (typeof item.amount !== 'number') return true
    if (item.bypass_amount) return true

    const originalQuantity = this.cartOriginal.find((originalCartItem) => originalCartItem.id === item.id)?.quantity || 0

    if (this.cart.quantity + (this.data.editPizza ? 0 : originalQuantity) > item.amount) return false
    else return true
  }

  verifyAvailableComplements(item: ComplementItemType) {
    let complement = this.cartOriginal.concat(this.cart).flatMap((cartItem) => cartItem.flavors.flatMap((flavor) => flavor.complements))

    let flavorsComplements = this.cartOriginal.concat(this.cart).flatMap((cartItem) =>
      cartItem.flavors.flatMap((flavor) =>
        flavor.complements.flatMap((complement) =>
          complement.itens.map((itm) => ({
            ...itm,
            quantity: itm.quantity * cartItem.quantity,
          }))
        )
      )
    )

    let quantity = flavorsComplements.reduce((prevC, obj) => prevC + (obj.quantity || 0), 0)

    if (quantity === complement[0].max) {
      return undefined
    } else {
      return true
    }
  }

  public async saveToCart() {
    if (!this.messageItemRequired()) return
    const disponibility = await this.checkPizzaDisponibility()
    const availability = this.cartService.verifyCartFlavorAvailability(this.cartOriginal, this.cart, 'greater')
    if (!disponibility.disponibility || !availability?.availability)
      return this.matDialog.open(AlertComponent, {
        data: {
          title: 'Indisponível',
          message: disponibility.message || availability?.message,
          textButton: 'Voltar ao produto',
          noReload: true,
        },
      })
    this.dialogRef.close({ item: this.cart, edit: this.data.editPizza })
  }

  public verifyFlavors() {
    return this.cart.flavors.every((flavor) => flavor?.code)
  }

  public enableNextStep() {
    const isImplementationsWithMultipleFlavors = this.step === 'implementations' && this.clientData.options.pizza.multipleBorders
    const isComplementsWithMultipleFlavors = this.step === 'complements' && this.clientData.options.pizza.multipleComplements
    if (isImplementationsWithMultipleFlavors && !(this.active === this.tabs.length)) return false
    if (isComplementsWithMultipleFlavors && !(this.active === this.tabs.length)) return false
    return !this.enableTabButton()
  }

  public enableTabButton() {
    const isImplementationsWithMultipleBorders = this.step === 'implementations' && this.clientData.options.pizza.multipleBorders
    const isComplementsWithMultipleFlavors = this.step === 'complements' && this.clientData.options.pizza.multipleComplements
    if (isImplementationsWithMultipleBorders && this.active === this.tabs.length) return false
    if (isComplementsWithMultipleFlavors && this.active === this.tabs.length) return false
    if (this.step === 'complements') {
      return this.clientData.options.pizza.multipleComplements
    }
    if (this.step === 'implementations') {
      return this.clientData.options.pizza.multipleBorders
    }
    return this.active < this.tabs.length
  }

  public updateComplementQuantity(complement: ComplementType, update: 'increase' | 'decrease', item?: ComplementItemType) {
    const currentValue = this.maxComplementsQuantity.get(complement.id)
    this.maxComplementsQuantity.set(complement.id, {
      ...currentValue,
      current: update === 'increase' ? currentValue.current + 1 : currentValue.current - 1,
    })
    if (this.verifyAvailableComplements(item)) return false
  }

  public messageItemRequired() {
    const complements = this.pizza.complements.filter((complement) => complement.required === 1)

    if (!complements.length) {
      return true
    }
    // const allComplements = complements.map(complement => complement.id);
    let cartComplements = []
    this.maxComplementsQuantity.forEach((complement) => {
      if (complement.required) {
        cartComplements.push(complement)
      }
    })
    const testMin = cartComplements.filter((c) => c.current < c.min, 0)

    if (testMin.length > 0) {
      let messages = '<h2>Complete os complementos:</h2><ul style="list-style: none;">'
      testMin.forEach((c) => (messages += `<li><b>${c.name}:</b> mínimo ${c.min} ${c.min === 1 ? 'item' : 'itens'}</li>`))
      messages += '</ul>'
      const completeAlert = this.matDialog.open(AlertComponent, {
        data: {
          message: messages,
          noReload: true,
        },
      })
      return false
    }

    return true
  }

  public flavorBlockAdd(block: boolean, flavorIndex: number, flavorCode: string) {
    if (block && this.cart.flavors[flavorIndex] && this.cart.flavors[flavorIndex].code === flavorCode) {
      this.cart.flavors[flavorIndex].blocked = true
    }
    return block
  }
}
