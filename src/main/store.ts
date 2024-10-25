import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";
import { CacheContact, Printer, VoucherNotification, VoucherObj } from "../@types/store";
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

export const setContactWelcomeMessage = (cacheContact: CacheContact) => {
  const allContacts = getCacheContactList();
  const cacheFiltered = allContacts.filter(
    (contact) => contact?.contact !== cacheContact?.contact
  )
  const selectedContact = allContacts.find(
    (contact) => contact?.contact === cacheContact?.contact
  );
  store.set("configs.contacts_cache", [
    ...cacheFiltered,
    {
      ...selectedContact,
      messageType: "welcome",
    },
  ]);
}

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

const storeVoucherToNotify = (
  whatsapp: string,
  totalPrice: number,
  payload: VoucherObj
) => {
  const currentVouchers = getVoucherToNotifyList();
  const userFound = currentVouchers.find((voucher) => voucher.whatsapp === whatsapp);
  const newTotalUser = {
    ...userFound,
    vouchersTotal: totalPrice,
  };
  const voucherExists = userFound.vouchers.some((voucher) => voucher.id === payload.id);

  if (!voucherExists) {
    newTotalUser.vouchers.push(payload);
  }

  const updatedVouchers = currentVouchers.map((voucher) => voucher.whatsapp === whatsapp ? newTotalUser : voucher);

  store.set("configs.voucherToNotify", updatedVouchers);
};

/**
 * Armazena uma notificação de voucher na fila.
 *
 * @param {VoucherNotification} payload - A notificação de voucher a ser armazenada.
 * @return {Promise<void>} Uma promessa que é resolvida quando a notificação de voucher é armazenada.
 */
export const storeNewUserToNotify = (payload: VoucherNotification) =>
  vouchersToNotifyQueue.push(async () => {
    const currentVouchers = getVoucherToNotifyList();
    const exists = currentVouchers.some((voucher) => voucher.whatsapp === payload.whatsapp);

    if (exists) {
      const currUser = currentVouchers.find((voucher) => voucher.whatsapp === payload.whatsapp);
      const total = currUser.vouchers.reduce((total, voucher) => total + voucher.value, 0);
      storeVoucherToNotify(
        payload.whatsapp,
        total,
        payload.vouchers[0]
      );
    } else {
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
  const uniqueVouchers = currentVouchers.filter((user) => {
    return Array.from(
      new Map(user.vouchers.map((voucher) => [voucher.id, voucher])).values()
    );
  });
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

export const deleteVoucherToNotify = (id: number) => {
  const currentVouchers = getVoucherToNotifyList();
  const foundUser = currentVouchers.find((user) => user.vouchers.some((voucher) => voucher.id === id));
  const listWithoutExpiredVoucher = foundUser.vouchers.filter((voucher) => voucher.id !== id);
  const newTotal = listWithoutExpiredVoucher.reduce((total, voucher) => total + voucher.value, 0);
  const updatedUser = {
    ...foundUser,
    vouchersTotal: newTotal,
    vouchers: listWithoutExpiredVoucher,
  }
  const listWithoutuser = currentVouchers.filter((user) => user.whatsapp !== foundUser.whatsapp);
  if (updatedUser.vouchers.length === 0) {
    store.set("configs.voucherToNotify", listWithoutuser);
  } else {
    const updatedList = currentVouchers.map((user) => user.whatsapp === foundUser.whatsapp ? updatedUser : user);
    store.set("configs.voucherToNotify", updatedList);
  }
}

export const updateVoucherToNotify = (
  id: number,
  payload: "rememberDate" | "expirationDate" | "afterPurchaseDate"
) => {
  const currentVouchers = getVoucherToNotifyList();
  const foundUser = currentVouchers.find((user) => user.vouchers.some((v) => v.id === id));
  const foundVoucher = foundUser.vouchers.find((voucher) => voucher.id === id);
  delete foundVoucher[payload];
  const updatedUser = {
    ...foundUser,
    vouchers: foundUser.vouchers.map((voucher) => voucher.id === id ?
      foundVoucher : voucher),
  }
  const updatedVouchers = currentVouchers.map((user) => user.whatsapp === foundUser.whatsapp ? updatedUser : user);
  store.set(
    "configs.voucherToNotify",
    updatedVouchers
  );
};

console.log(store.path);
