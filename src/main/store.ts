import ElectronStore from "electron-store";

export type Printer = Electron.PrinterInfo & {
  id: string
  silent: boolean
  paperSize: 58 | 80
  copies: number
}
export interface Store {
  configs: {
    printing: {
      printers: Printer[]
    }
  }
}

export const store = new ElectronStore<Store>({
  defaults: {
    configs: {
      printing: {
        printers: []
      }
    }
  }
});

export const getPrinters = () => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers')

export const getPrinter = (id: string) => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers').find(p => p.id === id)

export const addPrinter = (payload: Printer) => {
  console.log(getPrinters())
  store.set('configs.printing.printers', [
    ...getPrinters(),
    payload
  ])
  return getPrinter(payload.id)
}
export const updatePrinter = (payload: Partial<Printer>) => {
  const printer = store.get<'configs.printing.printers', Printer[]>('configs.printing.printers').find(p => p.id === payload.id)
  if (printer) {
    const printers = getPrinters()
    const printersUpdated = printers.map(p => {
      if (p.id === payload.id) {
        return {
          ...p,
          ...payload
        }
      }
      return p
    })
    store.set('configs.printing.printers', printersUpdated)
  }
}

export const deletePrinter = (id: string) => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).filter(p => p.id !== id))

console.log(store.path);
