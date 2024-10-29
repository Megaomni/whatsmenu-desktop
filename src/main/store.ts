import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";
import { CacheContact, OldVoucher, Printer, VoucherNotification, VoucherObj } from "../@types/store";
import { whatsmenu_api_v3 } from "../lib/axios";
import { DateTime } from "luxon";
import { AxiosResponse } from "axios";
import { vouchersToNotifyQueue } from "../lib/queue";
import { MerchantType } from "../@types/merchant";

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
    merchant: MerchantType | null;
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
    "0.4.5": (store) => {
      store.set("configs.merchant", null);
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
      merchant: null,
      contacts_cache: [],
      voucherToNotify: [],
    },
  },
});

export const getPrinters = () =>
  store.get<"configs.printing.printers", Printer[]>(
    "configs.printing.printers",
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
      (p) => p.id !== id,
    ),
  );

export const getProfile = () =>
  store.get<"configs.profile", ProfileType>("configs.profile");
export const getMerchant = () =>
  store.get<"configs.merchant", MerchantType>("configs.merchant");

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
    "configs.contacts_cache",
  );

export const setCacheContactByWhatsapp = (
  whatsapp: string,
  payload: Partial<CacheContact>,
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
              `/findClient?whatsapp=${whatsapp}&profileId=${profile?.id}`,
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

function isOldVoucher(voucher: VoucherNotification | OldVoucher): voucher is OldVoucher {
  return 'client' in voucher;
}

function isVoucherNotification(voucher: VoucherNotification | OldVoucher): voucher is VoucherNotification {
  return 'vouchers' in voucher;
}

export const getVoucherToNotifyList = () => {
  const vouchersToNotify = store.get<
    "configs.voucherToNotify",
    (VoucherNotification | OldVoucher)[]
  >("configs.voucherToNotify");
  if (!vouchersToNotify) {
    store.set("configs.voucherToNotify", []);
  }
  return vouchersToNotify.filter(isVoucherNotification);
};

const getOldVoucherList = () => {
  const vouchersToNotify = store.get<
    "configs.voucherToNotify",
    (VoucherNotification | OldVoucher)[]
  >("configs.voucherToNotify");
  if (!vouchersToNotify) {
    store.set("configs.voucherToNotify", []);
  }
  return vouchersToNotify.filter(isOldVoucher);
};

const formatOldVoucher = (oldVoucher: OldVoucher): VoucherNotification => {
  return {
    whatsapp: oldVoucher.client.whatsapp,
    name: oldVoucher.client.name,
    vouchersTotal: oldVoucher.client.vouchersTotal,
    vouchers: [
      {
        id: oldVoucher.id,
        value: oldVoucher.value,
        expirationDate: oldVoucher.expirationDate,
        rememberDays: oldVoucher.rememberDays,
        rememberDate: DateTime.fromISO(oldVoucher.rememberDate).diffNow(["minutes"]).minutes <= 0
          ? null : oldVoucher.rememberDate,
        afterPurchaseDate: DateTime.fromISO(oldVoucher.afterPurchaseDate).diffNow(["minutes"]).minutes <= 0
          ? null : oldVoucher.afterPurchaseDate
      },
    ]
  }
}

const checkOldVouchers = () => {
  const currentOldVouchers = getOldVoucherList();
  const oldVoucherExists = currentOldVouchers.length > 0;
  let updatedVouchers = [] as VoucherNotification[];
  if (oldVoucherExists) {
    currentOldVouchers.forEach((voucher) => {
      updatedVouchers = [
        ...updatedVouchers,
        formatOldVoucher(voucher)
      ];
    })
  }
  return updatedVouchers
};

const storeVoucherToNotify = (
  whatsapp: string,
  price: number,
  payload: VoucherObj
) => {
  const currentVouchers = getVoucherToNotifyList();
  const userFound = currentVouchers.find((voucher) => voucher.whatsapp === whatsapp);
  const prevTotal = userFound.vouchers.reduce((total, voucher) => total + voucher.value, 0);
  const newTotalUser = {
    ...userFound,
    vouchersTotal: prevTotal,
  };
  const voucherExists = userFound.vouchers.some((voucher) => voucher.id === payload.id);

  if (!voucherExists) {
    newTotalUser.vouchers.push(payload);
  }

  const updatedVouchers = currentVouchers.map((voucher) => voucher.whatsapp === whatsapp ? newTotalUser : voucher);

  removeDuplicateUsers();
  removeDuplicateVouchers();
  return updatedVouchers;
  // store.set("configs.voucherToNotify", updatedVouchers);
};

/**
 * Armazena uma notificação de voucher na fila.
 *
 * @param {VoucherNotification} payload - A notificação de voucher a ser armazenada.
 * @return {Promise<void>} Uma promessa que é resolvida quando a notificação de voucher é armazenada.
 */
export const storeNewUserToNotify = (payload: VoucherNotification) => {
  const currentVouchers = getVoucherToNotifyList();
  vouchersToNotifyQueue.push(async () => {
    const formatedVouchers = checkOldVouchers();
    const allVouchers = [...formatedVouchers, payload];
    console.log("allVouchers", allVouchers);
    const updatedVouchers = [...currentVouchers]

    allVouchers.forEach((voucherToAdd) => {
      const exists = currentVouchers.some((voucher) => voucher.whatsapp === voucherToAdd.whatsapp);
      console.log("Agora está rodando o voucher do ", voucherToAdd.name);
      console.log("Este é o voucher completo ", voucherToAdd);
      if (exists) {
        console.log("O voucher do ", voucherToAdd.name, " caiu no if");
        const updatedUsers = storeVoucherToNotify(
          voucherToAdd.whatsapp,
          voucherToAdd.vouchers[0].value,
          voucherToAdd.vouchers[0]
        );
        store.set("configs.voucherToNotify", updatedUsers);

      } else {
        console.log("O voucher do ", voucherToAdd.name, " caiu no else");
        updatedVouchers.push(voucherToAdd);
        store.set("configs.voucherToNotify", updatedVouchers);
      }
    })
  })
  removeDuplicateUsers();
  removeDuplicateVouchers();
};

export const removeDuplicateUsers = () => {
  const currentVouchers = getVoucherToNotifyList();
  const uniqueUsers = Array.from(
    new Map(currentVouchers.map(user => [user.whatsapp, user])).values()
  );
  return store.set("configs.voucherToNotify", uniqueUsers);
}

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
  payload: Partial<VoucherObj>
) => {
  const currentVouchers = getVoucherToNotifyList();
  const foundUser = currentVouchers.find((user) => user.vouchers.some((v) => v.id === id));
  const foundVoucher = foundUser.vouchers.find((voucher) => voucher.id === id);
  const updatedVouch = { ...foundVoucher, ...payload };
  const updatedUser = {
    ...foundUser,
    vouchers: foundUser.vouchers.map((voucher) => voucher.id === id ?
      updatedVouch : voucher),
  }
  const updatedVouchers = currentVouchers.map((user) => user.whatsapp === foundUser.whatsapp ? updatedUser : user);
  store.set(
    "configs.voucherToNotify",
    updatedVouchers
  );
};

console.log(store.path);
