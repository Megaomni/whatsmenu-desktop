import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";

export type Printer = Electron.PrinterInfo & {
  id: string
  silent: boolean
  paperSize: 58 | 80
  copies: number
  margins: Electron.Margins,
  scaleFactor: number,
  dpi: number,
}
export interface Store {
  configs: {
    printing: {
      printers: Printer[]
    }
    whatsapp: {
      showHiddenWhatsApp: boolean
    },
    executablePath?: string,
    profile: ProfileType | null
  }
}

export const store = new ElectronStore<Store>({
  defaults: {
    configs: {
      printing: {
        printers: []
      },
      whatsapp: {
        showHiddenWhatsApp: false
      },
      profile: null
    }
  }
});

export const getPrinters = () => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers')

export const getPrinter = (id: string) => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers').find(p => p.id === id)

export const addPrinter = (payload: Printer) => {
  store.set('configs.printing.printers', [
    ...getPrinters(),
    payload
  ])
  return getPrinter(payload.id)
}
export const updatePrinter = (payload: Partial<Printer>) => {
  const profile = store.get("configs.profile") as ProfileType;
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
    // console.log(printersUpdated, 'printersUpdated');
    printersUpdated.map((prints) => {
      console.log(prints.paperSize, 'paperSize');
      if(prints.paperSize === 80) {
        profile.options.print.width = '302px'
      } else {
        profile.options.print.width = '219px'
      }
    })
    store.set('configs.printing.printers', printersUpdated)
  }
}

export const deletePrinter = (id: string) => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).filter(p => p.id !== id))

console.log(store.path);
