import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";
import { CacheContact, Printer } from "../@types/store";
import { whatsmenu_api_v3 } from "../lib/axios";

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
    contacts_cache: CacheContact[]
  }
}

export const store = new ElectronStore<Store>({
  watch: true,
  migrations: {
    '0.2.2': (store) => {
      store.set('configs.contacts_cache', [])
    }
  },
  defaults: {
    configs: {
      printing: {
        printers: []
      },
      whatsapp: {
        showHiddenWhatsApp: false
      },
      profile: null,
      contacts_cache: []
    }
  }
});

export const getPrinters = () => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers')

export const getPrinter = (id: string) => store.get<'configs.printing.printers', Printer[]>('configs.printing.printers').find(p => p.id === id)

export const addPrinter = (payload: Omit<Printer, 'options'>) => {
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

export const getProfile = () => store.get<'configs.profile', ProfileType>('configs.profile')

export const setCacheContactList = (cacheContact: CacheContact) => store.set('configs.contacts_cache', cacheContact)

export const getCacheContactList = () => store.get<'configs.contacts_cache', Store['configs']['contacts_cache']>('configs.contacts_cache')

export const setCacheContactByWhatsapp = (whatsapp: string, payload: Partial<CacheContact>) => {
  const cacheList = getCacheContactList()
  const cacheListUpdated = cacheList.map(cached => {
    if (cached.contact === whatsapp) {
      return {
        ...cached,
        ...payload
      }
    }
    return cached
  })
  store.set('configs.contacts_cache', cacheListUpdated)
}

export const findCacheContact = async (whatsapp: string) => {
  const cacheList = getCacheContactList()
  const profile = getProfile()
  whatsapp = whatsapp?.substring(2).replaceAll(/\D/g, '')
  let cache = cacheList.find(cached => cached.contact === whatsapp)
  if (whatsapp) {
    if (cache && cache.messageType === 'welcome') {
      return cache
    }
    const { data } = await whatsmenu_api_v3.get(`/findClient?whatsapp=${whatsapp}&profileId=${profile?.id}`)
    const contact = data.client?.whatsapp ?? whatsapp
    if (contact) {
      if (!cache) {
        cache = { contact: data.client?.whatsapp ?? whatsapp, messageType: !data.client?.lastRequests.length && profile?.firstOnlyCupom ? 'cupomFirst' : 'welcome' }
        store.set('configs.contacts_cache', [...cacheList, cache])
      } else {
        cache.messageType = !data.client?.lastRequests.length && profile?.firstOnlyCupom ? 'cupomFirst' : 'welcome'
        store.set('configs.contacts_cache', cacheList)
      }
    }
  }
  return cache
}

console.log(store.path);
