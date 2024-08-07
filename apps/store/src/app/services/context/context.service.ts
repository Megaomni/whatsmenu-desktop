import { Injectable } from '@angular/core'
import Command from 'src/classes/command'
import Table from 'src/classes/table'
import { BartenderType } from '../../bartender-type'
import { CartRequestType } from '../../cart-request-type'
import { CupomType } from '../../cupom'
import { ProfileType } from '../../profile-type'
import { CashierType } from 'src/app/cashier-type'
import { DeliveryType } from 'src/app/delivery-type'
import { AddressType } from 'src/app/address-type'
import { ApiService } from '../api/api.service'
import { ProfileOptionsType } from 'src/app/client-type'

@Injectable({
  providedIn: 'root',
})
export class ContextService {
  profile: ProfileType
  isSafari: boolean
  isMobile: boolean

  // PDV
  tables: Table[]
  activeTableId: number | null
  activeCommandId: number
  activeBartender: BartenderType | null
  activeCashier: CashierType
  packageLabel: string
  api: ApiService

  constructor() {
    this.isSafari = this.safariTrash()
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/.test(navigator.userAgent)
  }

  /** Formata um numero para moeda R$ */
  public currency(value: number, withOutSymbol = false): string {
    return (value ? value : 0)
      .toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
      .replace(withOutSymbol ? /^-?\d*\.?\d+$/ : '', '')
  }

  /** Retorna mesa de acordo com a variavel activeTableId */
  public getActiveTable(): Table {
    const table = this.tables?.find((t) => t.id === this.activeTableId)
    return table
  }

  public superNormalize(string: string) {
    if (!string) return
    return string
      .normalize('NFD')
      .replace(/([^a-zA-Z0-9_-])/g, '')
      .toLowerCase()
  }

  public plansType() {
    const clientType = this.profile.plans
    const availablePlans = ['basic', 'package', 'table']
    const usedPlans = clientType.filter((plan) => availablePlans.includes(plan))
    return usedPlans
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

  /** Retorna comanda de acordo com a variavel activeCommandId da mesa ativa */
  public getActiveCommand(): Command | undefined {
    const table = this.getActiveTable()
    if (table && table.opened) {
      return table.opened.commands.find((command) => command.id === this.activeCommandId)
    }
  }

  public updateActiveCommand(command: Command) {
    const table = this.getActiveTable()
    const commandId = this.getActiveCommand().id
    const index = table.opened.commands.findIndex((command) => command.id === commandId)
    table.opened.commands[index] = command
  }

  /** Efeito coleteral após encerrar uma comanda. Obs: a propriedade opened será undefined se não houver mais comandas ativas quando essa função for chamada */
  public closeCommandEffect(command: Command) {
    const haveCommand = this.getActiveTable().opened?.commands.find((c) => c.id === command?.id)
    if (!this.getActiveTable().opened?.commands.filter((c) => c.status).length) {
      this.getActiveTable().opened = undefined
    }
    if (haveCommand) {
      haveCommand.status = command.status
    }
  }

  /**  Pega a luminosidade da cor e retorna uma número entre 0 a 255*/
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

  public getActiveCashierCarts() {
    return this.activeCashier.carts || []
  }

  public calculateTaxDelivery(
    addressData: AddressType | null,
    clientData: ProfileType,
    delivery: DeliveryType,
    cupom?: CupomType,
    cupomIsValid?: boolean
  ): number {
    if (!addressData) {
      return
    }

    let tax
    if (clientData.typeDelivery === 'km' && addressData.street) {
      const taxValues = clientData.taxDelivery.filter((tax) => tax.distance * 1000 > addressData.distance)
      if (taxValues.length) {
        tax = taxValues[0].value
      } else {
      }
    } else {
      const city = addressData && clientData.taxDelivery.find((t) => t.city === addressData.city)
      if (city) {
        let neighborhood = city.neighborhoods?.find((n) => n.name === addressData.neighborhood)
        if (neighborhood) {
          delivery.formPayment = undefined
          delivery.transshipment = undefined
          tax = neighborhood.value
        }
      }
    }
    if (clientData.typeDelivery != 'km') {
      return cupom?.type === 'freight' && cupomIsValid ? 0 : tax
    }
    return cupom?.type === 'freight' && cupomIsValid ? 0 : JSON.parse(JSON.stringify(Number(tax)))
  }

  public calculateDeliveryEstimates(delivery: DeliveryType | AddressType) {
    if (!delivery) {
      return undefined
    }

    if (this.profile.typeDelivery === 'km') {
      const taxValues = this.profile.taxDelivery.sort((a, b) => a.distance - b.distance).find((tax) => delivery.distance / 1000 >= tax.distance);
      if (taxValues) {
        return { time: taxValues.time, value: taxValues.value }
      }
    } else {
      const city = delivery && this.profile.taxDelivery.find((t) => t.city === delivery.city)

      if (city) {
        const tax = city.neighborhoods.find((n) => n.name === delivery.neighborhood)

        if (tax) return { time: tax.time, value: tax.value }
      }
    }
  }
}
