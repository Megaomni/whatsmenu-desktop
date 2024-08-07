import { ClientType } from './../client-type'
import { CommandType } from 'src/app/command-type'
import { TableType } from './../table-type'
import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core'
import { ApiService } from '../services/api/api.service'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'
import { AlertComponent } from '../modals/alert/alert.component'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, AfterViewInit {
  @ViewChild('newCommandNameInput') newCommandNameInput: ElementRef
  constructor(public dialogRef: MatDialogRef<any>, private api: ApiService, private matDialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data) {}

  tableCommands: string[]
  newCommand: boolean
  newCommandName: string
  command: string
  commandId: number
  slug: string
  enableSend: boolean
  clientData: ClientType

  faArrowLeft = faArrowLeft

  ngOnInit(): void {
    this.clientData = this.data.clientData
    this.tableCommands = this.data.table.commands.filter((command: CommandType) => command.status === 1) ?? []
    this.newCommand = false
    this.command = ''
    this.commandId = null
    this.newCommandName = ''
    this.slug = this.api.getCookie('slug')
    this.enableSend = true
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.newCommandNameInput && this.newCommandNameInput.nativeElement.focus()
    }, 1000)
  }

  validation(command: string, commandId: number) {
    this.command = command
    this.commandId = commandId
  }

  clearCommand() {
    this.command = ''
    return true
  }

  async getCommand() {
    const req = await this.api.getCommand(this.commandId, this.slug)
    sessionStorage.setItem('command', JSON.stringify(req))
    this.dialogRef.close({ send: true })
  }

  async createCommand() {
    try {
      if (this.enableSend) {
        this.enableSend = false
        setTimeout(async () => {
          this.enableSend = true
        }, 3000)

        const table: TableType = await this.api.getTable(this.data.table.id)
        if (!table.status) {
          sessionStorage.removeItem(`@whatsmenu-${this.slug}:tableOpenedId}`)
          this.matDialog.open(AlertComponent, {
            closeOnNavigation: true,
            data: {
              title: 'Desculpe está mesa se encontra desativada!',
              message: `<strong>No momento, está mesa não está disponivel para novos pedidos</strong><br>`,
            },
          })
          this.api.deleteCookie('table')
          this.dialogRef.close({ toDelivery: true })
          return
        }

        const commandDone = {
          tableId: this.data.table.id,
          name: this.newCommandName,
          status: 1,
          slug: this.clientData.slug,
        }

        let reqCommand: CommandType
        if (this.clientData.options.beta) {
          const { command } = await this.api.postCommandToNext(commandDone)
          reqCommand = command
        } else {
          const { command } = await this.api.postCommand(commandDone)
          reqCommand = command
        }

        sessionStorage.setItem('command', JSON.stringify(reqCommand))
        localStorage.removeItem(`table_cart_${this.clientData.slug}`)
        this.dialogRef.close({ send: true, command: reqCommand})
      }
    } catch (error) {
      if (error.status === 403) {
        this.matDialog.open(AlertComponent, {
          closeOnNavigation: true,
          data: {
            title: 'Desculpe está comanda já existe!',
            message: `<strong>${error.error.message}<br>Por favor utilize um nome diferente.</strong><br>`,
          },
        })
      }
      console.error(error)
      throw error
    }
  }
}
