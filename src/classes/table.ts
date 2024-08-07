import Command from './command'

export interface AdmTableType {
  id?: number
  profileId: number
  name: string
  status: boolean
  tablesOpened?: TableOpenedType[]
  opened?: TableOpenedType
  deleted_at: string | null
}

export default class Table {
  id?: number
  profileId: number
  name: string
  status: boolean
  tablesOpened?: TableOpened[]
  opened?: TableOpened
  activeCommands: Command[]
  deleted_at: string | null
  printMode = false
  awaiting_date?: string

  constructor(table: AdmTableType) {
    this.id = table.id
    this.profileId = table.profileId
    this.name = table.name
    this.status = table.status
    this.tablesOpened = table.tablesOpened?.map((t) => new TableOpened(t))
    this.opened = table.opened && new TableOpened(table.opened)
    this.activeCommands =
      this.opened?.commands.filter((command) => {
        if (command.status) {
          return { ...command, carts: command.carts.filter((r) => r.status !== 'canceled') }
        }
      }) ?? []
    this.deleted_at = table.deleted_at
  }

  public activeCommandsFilter = () => {
    this.activeCommands =
      this.opened?.commands.filter((command) => {
        if (command.status) {
          return { ...command, carts: command.carts.filter((r) => r.status !== 'canceled') }
        }
      }) ?? []
  }

  public haveRequests = () => {
    return !!this.activeCommands?.some((command) => command.haveRequests())
  }

  public haveCarts = () => {
    return !!this.opened?.commands?.some((command) => command.haveCarts())
  }

  public getStatus = () => {
    if (!this.status) {
      return 'paused'
    }
    return this.activeCommands.length ? 'busy' : 'default'
  }
}

export interface TableOpenedType {
  id: number
  tableId: number
  status: boolean
  fees: any[]
  formsPayment: any[]
  commands: Command[]
  perm?: string
  created_at?: string
  updated_at?: string
}

export class TableOpened {
  id: number
  tableId: number
  status: boolean
  fees: any[]
  formsPayment: any[]
  commands: Command[]
  perm?: string
  created_at?: string
  updated_at?: string

  constructor(tableOpened: TableOpenedType) {
    this.id = tableOpened.id
    this.tableId = tableOpened.tableId
    this.status = tableOpened.status
    this.commands = tableOpened.commands?.map((command) => new Command(command)) ?? []
    this.fees = this.getUpdatedFees()
    this.formsPayment = tableOpened.formsPayment.filter((f) => {
      if (f.payment === 'pix') {
        return f.paid
      }
      return true
    })
    this.perm = tableOpened.perm
    this.created_at = tableOpened.created_at
    this.updated_at = tableOpened.updated_at
  }

  public allFormsPayment = () => {
    if (!this.formsPayment.length && this.commands.some((c) => (c.formsPayment.length && !c.status))) {
      return this.commands.reduce((result: any[], command) => result.concat(command.formsPayment), [])
    } else {
      return this.formsPayment.concat(this.commands.reduce((result: any[], command) => result.concat(command.formsPayment), []))
    }
  }

  public allFeesById = (feeId: number) => {
    return this.commands.reduce((fees: any[], command) => {
      const haveFee = command.fees.find((fee) => fee.id === feeId)
      if (haveFee) {
        fees.push(haveFee)
      }
      return fees
    }, [])
  }

  public getUpdatedFees = (filter = false, all = false) => {
    const fees = (filter ? this.commands.filter((c) => c.status) : this.commands).reduce((fees: any[], command) => {
      if (command.haveCarts()) {
        command.fees.forEach((fee) => {
          if (all ?? !fee.deleted_at) {
            const haveFee = fees.find((f) => f.code === fee.code)
            if (!haveFee) {
              if (fee.quantity) {
                fee.quantity = fee.automatic ? fee.quantity : 0
              }
              fees.push({ ...fee })
            } else {
              if (fee.quantity && fee.type === 'fixed') {
                ;(haveFee.quantity as number) += fee.automatic ? fee.quantity : 0
              }
            }
          }
        })
      }
      return fees
    }, [])
    return fees
  }

  public getTotalValue = (only: '' | 'table' | 'fee' | 'tableFee' | 'formsPayment' | 'lack' | 'paid' = '', value = 0, report = false) => {
    const tableTotal = this.commands.reduce((result, command) => Number(Math.fround(result + command.getTotalValue('command')).toFixed(2)), 0)
    const feeTotal = this.getUpdatedFees(false, true).reduce((feeTotal, fee) => {
      if (fee.status) {
        if (fee.type === 'percent' && fee.automatic) {
          feeTotal += (fee.value / 100) * tableTotal
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0
        }
      }
      return Number(Math.fround(feeTotal).toFixed(2))
    }, 0)
    const formsPaymentTotal = (report ? this.formsPayment : this.allFormsPayment()).reduce(
      (formsPaymentTotal, formPayment) => Number(Math.fround(formsPaymentTotal + formPayment.value).toFixed(2)),
      0
    )

    const total = tableTotal + feeTotal + formsPaymentTotal
    switch (only) {
      case '':
        return total
      case 'fee':
        return feeTotal
      case 'tableFee':
        return tableTotal + feeTotal
      case 'formsPayment':
        return formsPaymentTotal
      case 'table':
        return tableTotal
      case 'lack':
        return Number(Math.fround(Math.max(tableTotal + feeTotal - formsPaymentTotal - value, 0)).toFixed(2))
      case 'paid':
        return Number(Math.fround(formsPaymentTotal + value).toFixed(2))
    }
  }

  public getRequests = () => {
    return this.commands.reduce((requests: Request[], command) => {
      command.requests.forEach((request) => {
        if (request.status !== 'canceled') {
          requests.push(request)
        }
      })
      return requests
    }, [])
  }
}
