import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ApiService } from 'src/app/services/api/api.service'
import { ContextService } from 'src/app/services/context/context.service'
import { ToastService } from 'src/app/services/ngb-toast/toast.service'
import Table from 'src/classes/table'
import { BartenderLoginComponent } from '../../modals/bartender-login/bartender-login.component'

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss', '../../pdv.component.scss'],
})
export class TablesComponent implements OnInit {
  @Input() pageType: 'pdv' | 'bartender'
  @Output() activeTab = new EventEmitter<'counter' | 'table' | 'tables'>()
  constructor(public context: ContextService, public api: ApiService, public toastService: ToastService, private matDialog: MatDialog) {}

  ngOnInit(): void {}

  public waitingService() {
    const tables = this.context.tables
    const queue = this.context.profile.options.queues?.bartender?.sort((a, b) => {
      if (a.created_at < b.created_at) {
        return 1
      } else if (a.created_at > b.created_at) {
        return 0
      } else {
        return -1
      }
    }) ?? []
    // const callBartender = queue.map((e) => e.tableId)
    const waiting = tables.filter((e) => {
      const q = queue.find((t) => t.tableId === e.id)
      if (q) {
        e.awaiting_date = q.created_at
        return true
      }
    })
    const awaitingBartender = waiting.sort((a, b) => {
      if (a.awaiting_date < b.awaiting_date) {
        return -1
      } else if (a.awaiting_date > b.awaiting_date) {
        return 1
      } else {
        return 0
      }
    })

    return awaitingBartender
  }

  public getTableStatusColor(table: Table): 'default' | 'paused' | 'busy' | 'waiting' {
    if (!table.status) {
      return 'paused'
    }
    if (table.opened) {
      return 'busy'
    }
    if (this.waitingService().includes(table)) {
      return 'waiting'
    }
    return 'default'
  }

  public emitTable(table: Table): void {
    this.context.activeCommandId = table.opened?.commands[0]?.id
    this.context.activeTableId = table.id
    this.activeTab.emit('table')
  }

  public async setActiveTable(table: Table): Promise<void> {
    if (this.context.profile.options.queues?.bartender.some(q => q.tableId === table.id)) {
      this.context.profile.options = await this.api.deleteCallBartender(this.context.profile.slug, table.id)
    }

    const sessionBartenderId = sessionStorage.getItem('bartenderId')
    const result = await this.api.getTable(table.id)
    let tableUpdate = this.context.tables.find((t) => t.id === result.id)
    if (tableUpdate) {
      tableUpdate = new Table(result)
    }
    if (this.pageType === 'pdv' || (sessionBartenderId && this.context.profile.options.table.persistBartender)) {
      switch (this.pageType) {
        case 'pdv':
          this.emitTable(table)
          break
        case 'bartender':
          if (result.status) {
            this.emitTable(table)
          } else {
            return this.toastService.show('Mesa pausada', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
          }
          break
        default:
          break
      }
    } else {
      this.matDialog
        .open(BartenderLoginComponent, {
          maxWidth: '100vw',
          data: { tableId: table.id },
          height: window.innerWidth < 600 ? '100vh' : '40vh',
          width: window.innerWidth < 600 ? '100vw' : '500px',
          disableClose: true,
        })
        .afterClosed()
        .subscribe(
          ({ authenticated, table }) => {
            if (authenticated && table.status) {
              this.emitTable(table)
            } else {
              return this.toastService.show('Mesa pausada', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
            }
          },
          (err) => {
            console.error(err)
          }
        )
    }
  }

  public orderTables() {
    const tableIdQueue = this.context.profile.options.queues?.bartender.map((e) => e.tableId)
    const tables = this.context.tables.filter((e) => !tableIdQueue?.includes(e.id))

    // ORDENANDO MESAS
    const numeric = tables
      ?.filter((a) => !isNaN(parseFloat(a.name)))
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
    const alphabetic = tables
      ?.filter((a) => isNaN(parseFloat(a.name)))
      .sort((a, b) => {
        let c = parseInt(a.name.replace(/\D/gim, ''))
        let d = parseInt(b.name.replace(/\D/gim, ''))
        return c - d
      })

    return [...numeric, ...alphabetic]
  }
}
