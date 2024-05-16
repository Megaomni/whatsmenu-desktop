export type Printer = Electron.PrinterInfo & {
  id: string
  silent: boolean
  paperSize: 58 | 80 | number
  copies: number
  margins: Electron.Margins,
  scaleFactor: number,
  options: {
    'printer-location': string,
    'printer-make-and-model': string,
    system_driverinfo: string
  }
}

export type CacheContact = { contact: string, messageType: 'welcome' | 'cupomFirst', revalidateTime?: number, created_at: string }