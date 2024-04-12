import ElectronStore from "electron-store";

export interface Store {
  configs: {
    print: {
      silent: boolean
    }
  }
}

export const store = new ElectronStore<Store>({
  defaults: {
    configs: {
      print: {
        silent: false
      }
    }
  }
});

console.log(store.path);
