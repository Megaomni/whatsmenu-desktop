import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";
import { CacheContact, Printer, VoucherNotification } from "../@types/store";
import { whatsmenu_api_v3 } from "../lib/axios";
import { DateTime } from "luxon";
import { AxiosResponse } from "axios";
import { vouchersToNotifyQueue } from "../lib/queue";

export interface Store {
  configs: {
    printing: {
      printers: Printer[];
    };
    whatsapp: {
      showHiddenWhatsApp: boolean;
    };
    executablePath?: string;
    profile: ProfileType | null;
    contacts_cache: CacheContact[];
    voucherToNotify: VoucherNotification[];
  };
}

export const store = new ElectronStore<Store>({
  watch: true,
  migrations: {
    "0.2.2": (store) => {
      store.set("configs.contacts_cache", []);
    },
    "0.2.4": (store) => {
      store.set("configs.voucherToNotify", []);
    },
  },
  defaults: {
    configs: {
      printing: {
        printers: [],
      },
      whatsapp: {
        showHiddenWhatsApp: false,
      },
      profile: null,
      contacts_cache: [],
      voucherToNotify: [],
    },
  },
});

export const getPrinters = () =>
  store.get<"configs.printing.printers", Printer[]>(
    "configs.printing.printers"
  );

export const getPrinter = (id: string) =>
  store
    .get<"configs.printing.printers", Printer[]>("configs.printing.printers")
    .find((p) => p.id === id);

export const addPrinter = (payload: Omit<Printer, "options">) => {
  store.set("configs.printing.printers", [...getPrinters(), payload]);
  return getPrinter(payload.id);
};
export const updatePrinter = (payload: Partial<Printer>) => {
  const printer = store
    .get<"configs.printing.printers", Printer[]>("configs.printing.printers")
    .find((p) => p.id === payload.id);
  if (printer) {
    const printers = getPrinters();
    const printersUpdated = printers.map((p) => {
      if (p.id === payload.id) {
        return {
          ...p,
          ...payload,
        };
      }
      return p;
    });
    store.set("configs.printing.printers", printersUpdated);
  }
};

export const deletePrinter = (id: string) =>
  store.set(
    "configs.printing.printers",
    (store.get("configs.printing.printers") as Printer[]).filter(
      (p) => p.id !== id
    )
  );

export const getProfile = () =>
  store.get<"configs.profile", ProfileType>("configs.profile");

export const setCacheContactList = (cacheContact: CacheContact) =>
  store.set("configs.contacts_cache", cacheContact);

export const getCacheContactList = () =>
  store.get<"configs.contacts_cache", Store["configs"]["contacts_cache"]>(
    "configs.contacts_cache"
  );

export const setCacheContactByWhatsapp = (
  whatsapp: string,
  payload: Partial<CacheContact>
) => {
  const cacheList = getCacheContactList();
  const isInList = cacheList.some((cached) => cached?.contact === whatsapp);
  const cacheListUpdated = isInList ? cacheList : [...cacheList, payload];
  store.set("configs.contacts_cache", cacheListUpdated);
};

export const findCacheContact = async (whatsapp: string) => {
  const cacheList = getCacheContactList();
  const profile = getProfile();
  whatsapp = whatsapp?.substring(2).replaceAll(/\D/g, "");
  let contact = whatsapp;
  let cache = cacheList.find((cached) => cached?.contact === whatsapp);
  if (whatsapp) {
    if (cache && cache.messageType === "welcome") {
      return cache;
    }

    if (contact) {
      if (!cache || cache.messageType === "cupomFirst") {
        let response: AxiosResponse;

        if (
          !cache ||
          (cache &&
            DateTime.fromISO(cache.created_at).diffNow("hours").hours >=
            cache.revalidateTime)
        ) {
          try {
            response = await whatsmenu_api_v3.get(
              `/findClient?whatsapp=${whatsapp}&profileId=${profile?.id}`
            );
          } catch (error) {
            return null;
          }
          if (response.data.client?.whatsapp) {
            contact = response.data.client?.whatsapp;
          }
          cache = {
            contact,
            messageType:
              !response.data.client?.last_requests.length &&
                profile?.firstOnlyCupom
                ? "cupomFirst"
                : "welcome",
            created_at: DateTime.local().toISO(),
            revalidateTime: 3,
          };
          store.set("configs.contacts_cache", [...cacheList, cache]);
        }
      }
    }
  }
  return cache;
};

/**
 * Armazena uma notificação de voucher na fila.
 *
 * @param {VoucherNotification} payload - A notificação de voucher a ser armazenada.
 * @return {Promise<void>} Uma promessa que é resolvida quando a notificação de voucher é armazenada.
 */
export const storeVoucherToNotify = (payload: VoucherNotification) =>
  vouchersToNotifyQueue.push(async () => {
    const currentVouchers = getVoucherToNotifyList() || [];
    const exists = currentVouchers.some((voucher) => voucher.id === payload.id);

    if (!exists) {
      store.set("configs.voucherToNotify", [...currentVouchers, payload]);
    }
  });

/**
 * Remove vouchers duplicados da chave "configs.voucherToNotify" no armazenamento.
 *
 * @return {void} Esta função não retorna nada.
 */
export const removeDuplicateVouchers = (): void => {
  const currentVouchers = getVoucherToNotifyList() || [];
  const uniqueVouchers = Array.from(
    new Map(currentVouchers.map((voucher) => [voucher.id, voucher])).values()
  );
  return store.set("configs.voucherToNotify", uniqueVouchers);
};

export const getVoucherToNotifyList = () => {
  const vouchersToNotify = store.get<
    "configs.voucherToNotify",
    VoucherNotification[]
  >("configs.voucherToNotify");
  if (!vouchersToNotify) {
    store.set("configs.voucherToNotify", []);
  }
  return store.get<"configs.voucherToNotify", VoucherNotification[]>(
    "configs.voucherToNotify"
  );
};

export const deleteVoucherToNotify = (id: number) =>
  store.set(
    "configs.voucherToNotify",
    getVoucherToNotifyList().filter((voucher) => voucher.id !== id)
  );

export const updateVoucherToNotify = (
  id: number,
  payload: Partial<VoucherNotification>
) => {
  store.set(
    "configs.voucherToNotify",
    getVoucherToNotifyList().map((voucher) => {
      if (voucher.id === id) {
        return {
          ...voucher,
          ...payload,
        };
      }
      return voucher;
    })
  );
};

console.log(store.path);
