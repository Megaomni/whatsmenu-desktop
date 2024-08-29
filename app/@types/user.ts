export interface UserControls {
  beta: boolean
  type: string
  print: {
    app: boolean
  }
  period: string
  attempts: number
  recovery?: {
    date?: string
    token?: string | null
  }
  salePrint: boolean
  lastAccess: {
    ip: string
    date: string
    userAgent: string
  }
  firstAccess: string
  nextInvoice: any
  salePrintQTD: number
  serviceStart: boolean
  lastAdmAccess: Array<{
    date: string
    admId: string
  }>
  disableInvoice: boolean
  bilhetParcelament: boolean
  forceSecurity?: boolean
  lastBlock?: { ip: string; userAgent: string; date: string }
  lastUpdatePassword?: string
}
