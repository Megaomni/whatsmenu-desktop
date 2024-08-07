import { CartPizza } from './../../cart-pizza'
import { CommandType } from './../../command-type'
import { CartType } from './../../cart-type'
import { TableType } from './../../table-type'
import { ClientType } from 'src/app/client-type'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Component, Inject, OnInit } from '@angular/core'
import { FeeType } from 'src/app/fee-type'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { ContextService } from 'src/app/services/context/context.service'
import { CartItem } from 'src/app/cart-request-type'
import { CartService } from 'src/app/services/cart/cart.service'

@Component({
  selector: 'app-table',
  templateUrl: './table-resume.component.html',
  styleUrls: ['./table-resume.component.scss'],
})
export class TableResumeComponent implements OnInit {
  clientData: ClientType
  table: TableType
  total: number
  totalCart: number
  totalCartPizza: number
  commands: CommandType[]
  allCommands: CommandType[]
  firstCommand: CommandType
  command: CommandType
  tableCarts: any[]
  resume: 'command' | 'table'
  cart: CartType[]
  newCart: CartType[]
  cartPizza: CartPizza[]
  newCartPizza: CartPizza[]

  faArrowLeft = faArrowLeft

  constructor(@Inject(MAT_DIALOG_DATA) public data, public context: ContextService, public cartService: CartService) {}

  ngOnInit(): void {
    this.cartPizza = this.data.table.commands[0].cartPizza
    this.command = this.data.table.commands
    this.clientData = this.data.clientData
    this.table = this.data.table
    this.table.fees = this.data.table.commands.reduce((fees: FeeType[], command) => {
      command.fees.forEach((fee) => {
        const haveFeeIndex = fees.findIndex((f) => f.code === fee.code)
        if (fee.status && fee.automatic) {
          if (haveFeeIndex !== -1) {
            if (fee.type === 'fixed') {
              fees[haveFeeIndex].quantity += fee.quantity
            }
          } else {
            fees.push({ ...fee })
          }
        }
      })
      return fees
    }, [])
    this.firstCommand = this.data.table.commands[0]
    this.allCommands = this.data.table.commands.filter((command: CommandType) => command.created_at >= this.firstCommand.created_at)
    this.commands = this.data.table.commands.filter(
      (command: CommandType) => command.status === 1 && command.created_at >= this.firstCommand.created_at
    )
    this.tableCarts = this.commands.reduce((acc, command) => {
      const activeCarts = command.carts.filter((cart) => cart.status !== 'canceled')
      return acc.concat(activeCarts)
    }, [])
    this.setTableCarts()
    this.resume = 'table'
  }

  public totalsWithoutCanceled() {
    let total
    if (this.cartPizza) {
      total = this.tableCarts.reduce((t, cart) => (t += cart.total), 0)
    } else {
      let withoutCanceled = this.command.carts.filter((cart) => cart.status !== 'canceled')
      total = withoutCanceled.reduce((t, cart) => (t += cart.total), 0)
    }

    return total
  }

  public setTableCarts() {
    this.cart = this.tableCarts.reduce((acc, cart) => {
      return acc.concat(cart.itens)
    }, [])

    this.cart = this.reduceCart(this.cart)
    this.cartPizza = this.tableCarts.reduce((acc, cart) => {
      return acc.concat(cart.itens)
    }, [])
    this.cartPizza = this.reduceCartPizza(this.cartPizza)

    this.totalCartPizza = this.getTotalCartPizza(this.cartPizza)

    this.totalCart = this.getTotalCart(this.cart)
    this.total = this.totalCart
  }

  public isEmpty(obj: object) {
    if (obj) {
      return Object.keys(obj).length === 0
    } else {
      return true
    }
  }

  public calcProductTotalValue(product: CartType): number {
    let valueTable = product.details.value
    valueTable *= product.quantity

    if (product.details.flavors) {
      product.details.flavors.forEach((comp) => {
        comp.complements.forEach((itns) => {
          valueTable += itns.itens.reduce((a, b) => a + b.value * b.quantity * product.quantity, 0)
        })
      })
    }

    if (product.details.implementations) {
      product.details.implementations.forEach((implementation) => {
        valueTable += implementation.value
      })
    }

    if (product.details.complements.length) {
      product.details.complements.forEach((complement) => {
        valueTable += complement.itens.reduce((a, b) => a + b.value * b.quantity * product.quantity, 0)
      })
    }

    return valueTable
  }

  public changeResume(resume: 'command' | 'table', commandId: number = null) {
    this.resume = resume
    if (resume === 'table') {
      return this.setTableCarts()
    }
    if (commandId) {
      this.command = this.setCommandCarts(commandId)
      this.cart = this.command.carts
      this.cartPizza = this.command.cartPizza
      this.total = this.command.carts.reduce((t, totals) => t + totals.total, 0)
    } else {
      this.total = this.totalCart + this.totalCartPizza
    }
  }

  public reduceCart(cart: CartType[]) {
    cart = JSON.parse(JSON.stringify(cart))

    cart.forEach((newProduct, newIndex, newCart: any) => {
      if (this.isEmpty(newProduct)) {
        return
      }
      newCart.forEach((product, index) => {
        if (this.isEmpty(product) || newProduct.valueTable !== product.valueTable) {
          return
        }
        if (index !== newIndex) {
          if (newProduct.id === product.id && newProduct.complements.length === product.complements.length) {
            if (newProduct.complements.length === 0 && product.complements.length === 0 && newProduct.valueTable !== 0 && product.valueTable !== 0) {
              newProduct.quantity += product.quantity
              newCart[index] = {}
              return
            }
            newProduct.complements.forEach((newComplement) => {
              product.complements.forEach((complement) => {
                if (newComplement.id === complement.id && newComplement.itens.length === complement.itens.length) {
                  const allItensCode = newComplement.itens.every((newItem) => {
                    return complement.itens.some((item) => item.code === newItem.code)
                  })

                  if (allItensCode) {
                    newComplement.itens.forEach((newItem) => {
                      complement.itens.forEach((item) => {
                        if (newItem.code === item.code) {
                          newItem.quantity += item.quantity
                        }
                      })
                    })
                    newProduct.valueTable > 0 && (newProduct.quantity += product.quantity)
                    newCart[index] = {}
                  }
                }
              })
            })
          }
        }
      })
    })

    cart = cart.filter((product) => !this.isEmpty(product))

    return cart
  }

  public reduceCartPizza(cartPizza) {
    cartPizza = JSON.parse(JSON.stringify(cartPizza))

    cartPizza.forEach((newPizza, newIndex, newCartPizza: any) => {
      if (this.isEmpty(newPizza)) {
        return
      }

      newCartPizza.forEach((pizza, index) => {
        if (newIndex !== index) {
          if (this.isEmpty(pizza)) {
            return
          }

          if (
            newPizza.details.flavors?.length === pizza.details.flavors?.length &&
            newPizza.details.implementations?.length === pizza.details.implementations?.length
          ) {
            const allFlavorsCode = newPizza.details.flavors?.every((newFlavor) => {
              return pizza.details.flavors?.some((flavor) => newFlavor.code === flavor.code)
            })

            const allImplementationsCode = newPizza.details.implementations?.every((newImplemntation) => {
              return pizza.details.implementations?.some((implementation) => newImplemntation.code === implementation.code)
            })

            if (allFlavorsCode && allImplementationsCode) {
              newPizza.quantity += pizza.quantity
              newCartPizza[index] = {}
            }
          }
        }
      })
    })

    cartPizza = cartPizza.filter((pizza) => !this.isEmpty(pizza))

    return cartPizza
  }

  public getTotalCartPizza(cartPizza) {
    return cartPizza.reduce((total: number, pizza): number => {
      total += pizza.details.value * pizza.quantity
      return total
    }, 0)
  }

  public getTotalCart(cart) {
    return cart.reduce((total: number, product: CartType): number => {
      return (total += this.calcProductTotalValue(product))
    }, 0)
  }

  public getTotalCommand(command: CommandType): number {
    command = this.setCommandCarts(command.id)
    let totalCommands = command.carts.reduce((t, elements) => {
      if (elements.status === null) {
        t += elements.total
      }
      return t
    }, 0)
    return totalCommands
  }

  public setCommandCarts(commandId: number): CommandType {
    let command = this.allCommands.find((command) => command.id === commandId)
    let withoutCanceled = command.carts.filter((cart) => cart.status !== 'canceled')

    command.cart = withoutCanceled.reduce((c, cart) => {
      return this.reduceCart(c.concat(cart.itens.filter((item: CartItem) => item.type)))
    }, [])

    // command.cartPizza = command.carts.reduce((cartPizza, cart) => {
    //   return this.reduceCartPizza(cartPizza.concat(cart.itens.filter((item: CartItem) => item.type === 'pizza')))
    // }, [])

    command.total = withoutCanceled.reduce((t, totals) => t + totals.total, 0)

    return command
  }

  public formatFeeValue(fee: FeeType, type: 'command' | 'table') {
    if (fee.type === 'fixed') {
      return fee.value * fee.quantity
    }
    if (fee.type === 'percent') {
      return parseFloat(((fee.value / 100) * (type === 'table' ? this.totalsWithoutCanceled() : this.command.total)).toFixed(2))
    }
  }

  public feesTotalValue(fees: FeeType[]) {
    return fees?.reduce((feeTotal, f) => (feeTotal += this.formatFeeValue(f, this.resume)), 0)
  }

  public logger(obj: any) {
    console.log(obj)
  }
}
