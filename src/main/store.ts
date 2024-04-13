import ElectronStore from "electron-store";

export type Printer = Electron.PrinterInfo & {
  silent: boolean,
  paperSize: 58 | 80
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

console.log(store.path);
