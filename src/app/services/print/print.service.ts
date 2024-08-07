import { Injectable } from '@angular/core'
import Command from 'src/classes/command'
import Table from 'src/classes/table'
import { ProfileType } from '../../profile-type'
import { ApiService } from '../api/api.service'
import { WebsocketService } from '../websocket/websocket.service'

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  constructor(private api: ApiService, private websocket: WebsocketService) {}

  private printGeneric(profile: ProfileType, reactComponentString: { 58: string; 80: string; requestId: number }) {
    if (profile.options.print.app) {
      this.websocket.emit('directPrint', `print:${profile.slug}`, reactComponentString)
    } else {
      const printTable = document.getElementById('print-table')
      if (printTable) {
        printTable.innerText = '\n' + reactComponentString[profile.options.print.width === '219px' ? 58 : 80]
        const printWindow = window.open()
        printWindow.document.body.appendChild(printTable.cloneNode(true))
        printWindow.onafterprint = () => printWindow.close()
        printWindow.print()
      }
    }
  }

  private printPDF(data: string) {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    iframe.style.display = 'none'
    iframe.src = data
    iframe.onload = () => {
      iframe.contentWindow.print()
    }
  }

  public async printTable({ table, profile }: { table: Table; profile: ProfileType }) {
    const cart = { ...table.opened.commands.flatMap((c) => c.carts)[0] }
    if ('WhatsMenuPrintApi' in window) {
      ;(window.WhatsMenuPrintApi as any).print(
        JSON.stringify({
          cart,
          profile,
          table,
          printType: 'table',
        })
      )
      return
    }
    if (profile.options.print.textOnly || profile.options.print.app) {
      const { reactComponentString } = await this.api[profile.options.print.textOnly || profile.options.print.app ? 'printLayout' : 'printLayoutPDF'](
        { table, profile, printType: 'table', cart }
      )
      this.printGeneric(profile, reactComponentString)
    } else {
      const result = await this.api.printLayoutPDF({ table, profile, printType: 'table', cart })
      this.printPDF(result)
    }
  }

  public async printCommand({ table, command, profile }: { table: Table; command: Command; profile: ProfileType }) {
    const cart = { ...command.carts[0], command }
    if ('WhatsMenuPrintApi' in window) {
      ;(window.WhatsMenuPrintApi as any).print(
        JSON.stringify({
          cart,
          profile,
          table,
          command,
          printType: 'command',
        })
      )
      return
    }
    if (profile.options.print.textOnly || profile.options.print.app) {
      const { reactComponentString } = await this.api[profile.options.print.textOnly || profile.options.print.app ? 'printLayout' : 'printLayoutPDF'](
        { table, profile, printType: 'command', cart, command }
      )
      this.printGeneric(profile, reactComponentString)
    } else {
      const result = await this.api.printLayoutPDF({ table, profile, printType: 'command', cart, command })
      this.printPDF(result)
    }
  }

  public async printCashierResume({ elementId }: { elementId: string }) {
    if ('WhatsMenuPrintApi' in window) {
      const html = document.getElementById(elementId)?.innerHTML
      ;(window.WhatsMenuPrintApi as any).print(
        JSON.stringify({
          html,
          printTypeMode: 'html',
        })
      )
      return
    }
  }
}
