import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Command from 'src/classes/command';
import Table, { TableOpened } from 'src/classes/table';
import { profile } from 'src/test/utils/profile';
import { CartFlavorPizzaType, CartPizza } from '../cart-pizza';
import { CartRequestType } from '../cart-request-type';
import { CartType } from '../cart-type';
import { CupomType } from '../cupom';
import { CartFormPaymentType } from '../formpayment-type';
import { ProfileType } from '../profile-type';
import { ContextService } from '../services/context/context.service';
import { CartRepeatComponent } from './modals/cart-repeat/cart-repeat.component';
import { ClientSearchListComponent } from './modals/client-search-list/client-search-list.component';
import { ClientStoreComponent } from './modals/client-store/client-store.component';
import { PaymentComponent } from './modals/payment/payment.component';

import { PdvComponent } from './pdv.component';
import { client } from 'src/test/utils/client';
import { DateTime } from 'luxon';

describe('PdvComponent', () => {
  let component: PdvComponent;
  let fixture: ComponentFixture<PdvComponent>;
  let openDialogSpy: jasmine.Spy
  let clients

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PdvComponent],
      providers: [{
        provide: ContextService,
      }],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.context.profile = (profile as unknown) as ProfileType
    openDialogSpy = spyOn(component['matDialog'], 'open')
    clients = [
      {
        name: 'Fabiano Bezerra',
        whatsapp: '13900000000',
        email: 'fabiano@grovecompany.com',
        date_last_request: null,
        deleted_at: null,
        addresses: []
      },
      {
        name: 'Jason Rabelo',
        whatsapp: '13910000000',
        email: 'jason@grovecompany.com',
        date_last_request: null,
        deleted_at: null,
        addresses: []
      }
    ]
    component.cartRequest.type = 'D'
  });

  afterEach(() => {
    localStorage.clear()
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // setActiveTab
  it('should be possible set a activeTab', () => {
    const tab = 'counter'
    component.setActiveTab(tab)
    expect(component.activeTab).toEqual(tab)
  })

  // localCarts
  it('must be possible to store the carts in localStorage and recover when changing the order type from delivery/package to table and vice versa', () => {
    const product = component.context.profile.categories.flatMap(category => category.products).filter(product => product)[0]
    const pizzaProduct = component.context.profile.categories.filter(category => category.type === 'pizza').flatMap(category => category.product).find(product => product.flavors.length > 0)
    const pizza = component.cartService.pizzaMenuFormat(pizzaProduct)[0]
    let changeEvent: NgbNavChangeEvent = { activeId: 'counter', nextId: 'tables', preventDefault: () => { } }

    const getLocalCarts = (type: 'delivery' | 'table') => {
      let cart, cartPizza;
      if (type = 'delivery') {
        cart = JSON.parse(localStorage.getItem('cart_delivery')) ?? []
        cartPizza = JSON.parse(localStorage.getItem('cartPizza_delivery')) ?? []
      }
      if (type = 'table') {
        cart = JSON.parse(localStorage.getItem('cart_table')) ?? []
        cartPizza = JSON.parse(localStorage.getItem('cartPizza_table')) ?? []
      }

      return { cart, cartPizza }
    }

    component.cart.push(product as CartType)
    component.cartPizza.push(pizza)
    component.localCarts(changeEvent)
    expect(component.cart).toEqual(jasmine.objectContaining(getLocalCarts('table').cart))
    expect(component.cartPizza).toEqual(jasmine.objectContaining(getLocalCarts('table').cartPizza))
    changeEvent = { ...changeEvent, activeId: 'tables', nextId: 'counter' }
    component.cart.push(product as CartType)
    component.cartPizza.push(pizza)
    component.localCarts(changeEvent)
    expect(component.cart).toEqual(jasmine.objectContaining(getLocalCarts('delivery').cart))
    expect(component.cartPizza).toEqual(jasmine.objectContaining(getLocalCarts('delivery').cartPizza))
    changeEvent = { ...changeEvent, activeId: 'counter', nextId: 'table' }
    component.cart = []
    component.cartPizza = []
    component.localCarts(changeEvent)
    expect(component.cart).toEqual(jasmine.objectContaining(getLocalCarts('table').cart))
    expect(component.cartPizza).toEqual(jasmine.objectContaining(getLocalCarts('table').cartPizza))
  })

  // openCashierLogin
  it('should be possible to render the cashier-login modal', () => {
    const open = true
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          open
        })
      })
    component.openCashierLogin()
    expect(openDialogSpy).toHaveBeenCalled()
  })

  // openCashier
  it('should be possible to render the cashier modal there is a bartender logged in', () => {
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    component.openCashier()
    expect(openDialogSpy).toHaveBeenCalled()
  })

  // openClientRegister
  it('should be possible to render the client-store modal to create a new client', () => {
    const client = clients[0]
    const data: { type: 'update' | 'create' } = { type: 'create' }
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          client
        })
      })
    component.openClientRegister(data)
    expect(openDialogSpy).toHaveBeenCalledWith(ClientStoreComponent, jasmine.objectContaining({ data }))
    expect(component.client).toEqual(client)
  })

  it('should be possible to render the client-store modal to update a client', () => {
    const client = clients[0]
    const data: { type: 'update' | 'create' } = { type: 'update' }
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          client
        })
      })
    component.client = { name: 'update', addresses: [] }
    component.openClientRegister(data)
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.client).toEqual(client)
  })

  // openCartType
  it('should be possible to render the client-store modal', () => {
    const type = 'P'
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          type
        })
      } as MatDialogRef<typeof component>)
    component.openCartType()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.cartRequest.type).toEqual(type)
  })

  // openCartRepeat
  it('should be possible to render the cart-repeat modal and render cart type on confirm', () => {
    const client = clients[0]
    const request = {}
    const cart: CartType[] = [component.context.profile.categories.flatMap(category => category.products)[0] as CartType]
    const cartPizza: CartPizza[] = [component.context.profile.categories.flatMap(category => category.product)[1] as CartPizza]
    const openNewCartSpy = spyOn(component, 'openNewCart')
    let confirm = true
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          confirm,
          cart,
          cartPizza
        })
      } as MatDialogRef<typeof component>)
    component.openCartRepeat(client, request)
    expect(openDialogSpy).toHaveBeenCalledWith(CartRepeatComponent, jasmine.objectContaining({ data: { client, request, cartRequest: component.cartRequest } }))
    expect(component.cart).toEqual(jasmine.objectContaining(cart))
    expect(component.cartPizza).toEqual(jasmine.objectContaining(cartPizza))
    expect(openNewCartSpy).toHaveBeenCalled()
  })

  it('should be possible to render the cart-repeat modal and not render cart type on dismiss', () => {
    const client = clients[0]
    const request = {}
    const cart: CartType[] = [component.context.profile.categories.flatMap(category => category.products)[0] as CartType]
    const cartPizza: CartPizza[] = [component.context.profile.categories.flatMap(category => category.product)[1] as CartPizza]
    const openNewCartSpy = spyOn(component, 'openNewCart')
    let confirm = false
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          confirm,
          cart,
          cartPizza
        })
      } as MatDialogRef<typeof component>)
    component.openCartRepeat(client, request)
    expect(openDialogSpy).toHaveBeenCalledWith(CartRepeatComponent, jasmine.objectContaining({ data: { client, request, cartRequest: component.cartRequest } }))
    expect(component.cart).not.toEqual(jasmine.objectContaining(cart))
    expect(component.cartPizza).not.toEqual(jasmine.objectContaining(cartPizza))
    expect(openNewCartSpy).not.toHaveBeenCalled()
  })

  // openNewCart
  it('should be possible to render the cart-resume modal', () => {
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    const cart: CartType[] = [component.context.profile.categories.flatMap(category => category.products).filter(products => products)[0] as CartType]
    const cartPizza: CartFlavorPizzaType[] = [component.context.profile.categories.flatMap(category => category.product).filter(product => product)[1] as CartFlavorPizzaType]
    const cupom: CupomType = {
      id: 1,
      code: 'TESTE',
      profileId: 1,
      status: true,
      minValue: 1,
      type: 'value',
      value: 10
    }
    const afterClosedProps = { client: undefined, packageHours: {}, cupom, packageDate: null, addressId: null }
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(afterClosedProps)
      } as MatDialogRef<typeof component>)

    component.cart = cart
    component.cartPizza = cartPizza
    component.openNewCart()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.client).toEqual(afterClosedProps.client)
    expect(component.packageHours).toEqual(afterClosedProps.packageHours)
    expect(component.cupom).toEqual(afterClosedProps.cupom)
    expect(component.cartRequest.packageDate).toEqual(afterClosedProps.packageDate)
    expect(component.cartRequest.addressId).toEqual(afterClosedProps.addressId)
  })

  it('should not be able to render cart-resume modal if carts are empty', () => {
    const toastServicetSpy = spyOn(component.toastService, 'show')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(true)
      } as MatDialogRef<typeof component>)

    component.openNewCart()
    expect(openDialogSpy).not.toHaveBeenCalled()
    expect(toastServicetSpy).toHaveBeenCalledWith(jasmine.stringMatching('Carrinho Vazio!'), jasmine.objectContaining({}))
  })

  it('should be open the payment modal when confirm', () => {
    const cart: CartType[] = [component.context.profile.categories.flatMap(category => category.products)[0] as CartType]
    const cartPizza: CartFlavorPizzaType[] = [component.context.profile.categories.flatMap(category => category.product)[1] as CartFlavorPizzaType]
    const openPaymentSpy = spyOn(component, 'openPayment')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          toPayment: true,
        })
      } as MatDialogRef<typeof component>)

    component.cart = cart
    component.cartPizza = cartPizza
    component.openNewCart()
    expect(openPaymentSpy).toHaveBeenCalledWith({ client: component.client, cartRequest: component.cartRequest })
  })

  it('should be send request to server when confirm and request type is "T"', () => {
    const cart: CartType[] = [component.context.profile.categories.flatMap(category => category.products)[0] as CartType]
    const cartPizza: CartFlavorPizzaType[] = [component.context.profile.categories.flatMap(category => category.product)[1] as CartFlavorPizzaType]
    const storeCartSpy = spyOn(component, 'storeCart')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(true)
      } as MatDialogRef<typeof component>)

    component.cart = cart
    component.cartPizza = cartPizza
    component.cartRequest.type = 'T'
    component.openNewCart()
    expect(storeCartSpy).toHaveBeenCalled()
  })

  // openNewCommand
  it('should be possible to render the newcommand modal', () => {
    const postCommandSpy = spyOn(component.api, 'postCommand')
    const afterClosedProps = client as any
    afterClosedProps.createCommand = true
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(afterClosedProps)
      } as MatDialogRef<typeof component>)
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    component.context.activeTableId = component.context.profile.tables[0].id
    component.openNewCommand()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(postCommandSpy).toHaveBeenCalledWith({
      name: afterClosedProps.name,
      status: 1,
      slug: component.context.profile.slug,
      tableId: component.context.activeTableId,
      cashierId: component.context.profile.cashiers.find(cashier => cashier.bartenderId === component.context.activeBartender.id)?.id
    })
  })

  // openCommands
  it('should be possible to render the commands modal', () => {
    const command = new Command(component.context.profile.tables[0].opened.commands[0])
    command.carts = [{}]
    const openPaymentSpy = spyOn(component, 'openPayment')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          command
        })
      } as MatDialogRef<typeof component>)

    component.openCommands()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(openPaymentSpy).toHaveBeenCalledWith({ cartRequest: component.cartRequest, tableType: 'command' })
  })

  // openPayment
  it('should not be possible to render the payment modal if the table has no carts', () => {
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    const table = component.context.tables[0]
    component.context.activeTableId = table.id
    table.opened.commands.forEach(command => {
      command.carts = []
    })
    const data: { client?: any, cartRequest?: CartRequestType, cupom?: CupomType | null, tableType?: 'command' | 'table' } = { tableType: 'table' }
    const closeTableSpy = spyOn(component, 'closeTable')
    component.openPayment(data)
    expect(closeTableSpy).toHaveBeenCalled()
  })

  it('should be possible to render the payment modal and go back to cart', () => {
    const afterClosedProps = {
      goBack: true,
      finishCartRequest: false,
      formsPayment: [],
    }
    const data: { client?: any, cartRequest?: CartRequestType, cupom?: CupomType | null, tableType?: 'command' | 'table' } = {}
    const openNewCartSpy = spyOn(component, 'openNewCart')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(afterClosedProps)
      } as MatDialogRef<typeof component>)

    component.openPayment(data)
    expect(openDialogSpy).toHaveBeenCalledWith(PaymentComponent, jasmine.objectContaining({ data: { ...data, cartRequest: component.cartRequest, cupom: component.cupom } }))
    expect(openNewCartSpy).toHaveBeenCalled()
    expect(component.cartRequest.formsPayment).toEqual(afterClosedProps.formsPayment)
  })

  it('should be possible to render the payment modal and finsh request', () => {
    const afterClosedProps = {
      goBack: false,
      finishCartRequest: true,
      formsPayment: [{}],
    }
    const data: { client?: any, cartRequest?: CartRequestType, cupom?: CupomType | null, tableType?: 'command' | 'table' } = { tableType: 'command' }
    const storeCartSpy = spyOn(component, 'storeCart')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of(afterClosedProps)
      } as MatDialogRef<typeof component>)

    component.openPayment(data)
    expect(openDialogSpy).toHaveBeenCalledWith(PaymentComponent, jasmine.objectContaining({ data: { ...data, cartRequest: component.cartRequest, cupom: component.cupom } }))
    expect(afterClosedProps.formsPayment.length).toBeGreaterThanOrEqual(1)
    expect(storeCartSpy).toHaveBeenCalled()
    expect(component.cartRequest.formsPayment).toEqual(afterClosedProps.formsPayment as CartFormPaymentType[])
  })

  // openSwitchTable
  it('should be possible to render the switch-table modal', () => {
    const data: { newTableId: number, oldTableId: number, commandsIds: number[] } = {
      newTableId: 1,
      oldTableId: 1,
      commandsIds: []
    }
    const changeTableSpy = spyOn(component.api, 'changeTable')
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          data
        })
      } as MatDialogRef<typeof component>)

    component.openSwitchTable()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(changeTableSpy).toHaveBeenCalledWith(jasmine.objectContaining({ data }))
  })

  // openAddress
  it('should be possible to render the client-address modal', () => {
    const address = { id: 1 }
    component.client = clients[1]
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          address
        })
      } as MatDialogRef<typeof component>)

    component.openAddress()
    expect(openDialogSpy).toHaveBeenCalled()
    expect(component.cartRequest.addressId).toEqual(address.id)
    expect(component.client.addresses).toContain(address)
  })

  // checkCashier
  it('it should be possible to check if the cashier is open more than 24 hours and close if exists', async () => {
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    component.context.activeBartender.controls.activeCashier = { ...component.context.activeBartender.controls.activeCashier, created_at: '2022-01-01 10:00:00' }
    const openAlertSpy = spyOn(component, 'openAlert')
    component.checkCashier()
    expect(openAlertSpy).toHaveBeenCalled()
  })

  it('it should be possible to check if the cashier is open more than 24 hours and open cashier modal', async () => {
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    component.context.activeBartender.controls.activeCashier = { ...component.context.activeBartender.controls.activeCashier, created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss') }
    const openCashierSpy = spyOn(component, 'openCashier')
    component.checkCashier(true)
    expect(openCashierSpy).toHaveBeenCalled()
  })

  // getClientBy
  it('should be possible to search for a client by his whatsapp', async () => {
    const client = clients[0]
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          client
        })
      } as MatDialogRef<typeof component>)
    component.filter = 'whatsapp'
    const clientSearchSpy = spyOn(component.api, 'clientSearch').and.returnValue(clients as any)
    const openCartTypeSpy = spyOn(component, 'openCartType').and.returnValue(clients as any)
    await component.getClientBy(new Event('preventDefault'))
    expect(clientSearchSpy).toHaveBeenCalled()
    expect(component.client).toEqual(client)
    expect(component.cartRequest.addressId).toEqual(client.addresses[0] ? client.addresses[0].id : null)
    expect(openCartTypeSpy).toHaveBeenCalled()
  })

  it('should be possible to search clients by name and list them', async () => {
    const client = clients[0]
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          client
        })
      } as MatDialogRef<typeof component>)
    component.filter = 'name'
    const clientSearchSpy = spyOn(component.api, 'clientSearch').and.returnValue(clients as any)
    const openCartTypeSpy = spyOn(component, 'openCartType').and.returnValue(clients as any)
    await component.getClientBy(new Event('preventDefault'))
    expect(clientSearchSpy).toHaveBeenCalled()
    expect(openDialogSpy).toHaveBeenCalledWith(ClientSearchListComponent, jasmine.objectContaining({ data: { clients } }))
    expect(component.client).toEqual(client)
    expect(component.cartRequest.addressId).toEqual(client.addresses[0] ? client.addresses[0].id : null)
    expect(openCartTypeSpy).toHaveBeenCalled()
  })

  it('should be possible to search clients by name and not list them if the search result is 1', async () => {
    clients = [clients[0]]
    const client = clients[0]
    openDialogSpy = openDialogSpy.and
      .returnValue({
        afterClosed: () => of({
          client
        })
      } as MatDialogRef<typeof component>)
    component.filter = 'name'
    const clientSearchSpy = spyOn(component.api, 'clientSearch').and.returnValue(clients as any)
    const openCartTypeSpy = spyOn(component, 'openCartType').and.returnValue(clients as any)
    await component.getClientBy(new Event('preventDefault'))
    expect(clientSearchSpy).toHaveBeenCalled()
    expect(openDialogSpy).not.toHaveBeenCalledWith(ClientSearchListComponent, jasmine.objectContaining({ data: { clients } }))
    expect(component.client).toEqual(client)
    expect(component.cartRequest.addressId).toEqual(client.addresses[0] ? client.addresses[0].id : null)
    expect(openCartTypeSpy).toHaveBeenCalled()
  })

  // storeCart
  it('should be possible send cart to server', async () => {
    component.context.activeBartender = component.context.profile.bartenders.find(bartender => bartender.controls.type !== 'default')
    component.cartRequest.bartenderId = component.context.activeBartender.id
    const toastServicetSpy = spyOn(component.toastService, 'show')
    const storeCartSpy = spyOn(component.api, 'storeCart').and.returnValue({} as any)
    const clearAllSpy = spyOn(component, 'clearAll')
    const cupomValueSpy = spyOn(component.cartService, 'cupomValue')
    const cartItemSpy = spyOn(component.cartService, 'cartItem')
    await component.storeCart()
    expect(cupomValueSpy).toHaveBeenCalledWith(component.cupom, component.cartRequest)
    expect(cartItemSpy).toHaveBeenCalledWith(component.cart, component.cartPizza, component.cartRequest.type)
    expect(storeCartSpy).toHaveBeenCalledWith({ slug: component.context.profile.slug, clientId: component.client?.id, itens: component.cartService.cartItem(component.cart, component.cartPizza, component.cartRequest.type), cartRequest: component.cartRequest })
    expect(clearAllSpy).toHaveBeenCalled()
    expect(toastServicetSpy).toHaveBeenCalledWith(jasmine.stringMatching('Pedido registrado com sucesso!'), jasmine.objectContaining({}))
  })

  // closeTable
  it('should be possible close a table', async () => {
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    component.context.getActiveTable().opened = new TableOpened({
      commands: [],
      fees: [],
      formsPayment: [],
      id: 1,
      status: true,
      tableId: component.context.getActiveTable().id,
    })

    const closeTableSpy = spyOn(component.api, 'closeTable')
    await component.closeTable()
    expect(closeTableSpy).toHaveBeenCalled()
    expect(component.context.getActiveTable().opened).toBe(undefined)
  })

  // tablesStatus
  it('should be possible update table status', async () => {
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    const status = !component.context.getActiveTable().status
    const tablesStatusSpy = spyOn(component.api, 'tablesStatus').and.returnValue({ ...component.context.getActiveTable(), status } as any)
    await component.tablesStatus()
    expect(tablesStatusSpy).toHaveBeenCalled()
    expect(component.context.getActiveTable().status).toEqual(status)
  })

  // cancelCart
  it('should be possible cancel a cart', async () => {
    component.context.tables = component.context.profile.tables.map(table => new Table(table))
    component.context.activeTableId = component.context.tables[0].id
    const cart = { status: null, id: 1 }
    const cancelCartSpy = spyOn(component.api, 'changeCartStatus').and.returnValue({ ...cart, status: 'canceled' } as any)
    await component.cancelCart(cart)
    expect(cancelCartSpy).toHaveBeenCalled()
    expect(cart.status).not.toEqual(null)
  })

  // clearCarts
  it('should be possible clear carts', () => {
    component.clearCarts()
    expect(component.cart.length).toEqual(0)
    expect(component.cartPizza.length).toEqual(0)
    expect(localStorage.getItem('cart_delivery')).toBe(null)
    expect(localStorage.getItem('cartPizza_delivery')).toBe(null)
    expect(localStorage.getItem('cart_table')).toBe(null)
    expect(localStorage.getItem('cartPizza_table')).toBe(null)
  })

  // requestDate
  it('should be possible to get a formatted date from the server for MM/dd/yyyy', () => {
    const dateInputFommat = new Date().toISOString().split('T').join(' ').split('Z').join('')
    const dateOutputFommat = new Date().toLocaleString().split(',')[0]
    expect(component.requestDate(dateInputFommat)).toEqual(dateOutputFommat)
  })

  // clearAll
  it('should be possible clear all request data', () => {
    component.clearAll()
    const expectCondition = Object.entries(component.cartRequest).every(([key, value]) => {
      if (key === 'type') {
        return true
      }
      if (!value || (Array.isArray(value) && !value.length)) {
        return true
      }
    })
    expect(expectCondition).toBeTrue()
    expect(component.cupom).toBe(null)
    expect(component.client).toBe(null)
  })
});
