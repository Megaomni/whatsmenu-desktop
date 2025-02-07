import ElectronStore from "electron-store";
import { ProfileType } from "../@types/profile";
import { CacheContact, OldVoucher, Printer, VoucherNotification, VoucherObj, VoucherTwoFactorObj } from "../@types/store";
import { whatsmenu_api_v3 } from "../lib/axios";
import { DateTime } from "luxon";
import { AxiosResponse } from "axios";
import { vouchersToNotifyQueue } from "../lib/queue";
import { MerchantType } from "../@types/merchant";
import { VoucherType } from "../@types/voucher";
import { getVouchersFromDB } from "./ipc";
import { ClientType } from "../@types/client";
import { PrintEnvironmentConfig } from "../react/types_print-environment";

export interface Store {
  configs: {
    printing: {
      locations: PrinterLocation[];
      proPrint: boolean;
      useMultiplePrinters: boolean;
      printers: Printer[];
      legacyPrint: boolean;
    };
    productCategories: { id: number; name: string; }[];
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

interface CategoriesLocation {
  id: number;
  name: string;
}

export interface PrinterLocation {
  id: number;
  type: "fiscal" | "production";
  name: string;
  categories: CategoriesLocation[];
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
    "1.6.0": (store) => {
      store.set("configs.printing.locations", [
        {
          id: 1,
          type: "fiscal",
          name: "Caixa",
          categories: []
        },
      ])
      store.set("configs.productCategories", []);
    },
    "1.6.1": (store) => {
      store.set("configs.printing.proPrint", false);
    },
  },
  defaults: {
    configs: {
      printing: {
        locations: [
          {
            id: 1,
            type: "fiscal",
            name: "Caixa",
            categories: []
          },
        ],
        proPrint: false,
        useMultiplePrinters: false,
        printers: [],
        legacyPrint: false,
      },
      productCategories: [],
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

export type categoryType = {
  id: number;
  name: string;
  products: { id: number; categoryId: number }[];
  pizzaProduct: any;
};

export const setCategories = async () => {
  try {
    const profile = getProfile();
    const { data } = await whatsmenu_api_v3.get(`/categories/${profile?.id}`);

    store.set("configs.productCategories", data);
  } catch (error) {
    console.error(error);
  }
}

export const getCategories = () => {
  const categories = store.get<"configs.productCategories", categoryType[]>(
    "configs.productCategories"
  );
  return categories;
}

export const getProPrint = () =>
  store.get<"configs.printing.proPrint", boolean>("configs.printing.proPrint");

export const setProPrint = (proPrint: boolean) =>
  store.set("configs.printing.proPrint", proPrint);

export const setPrinterLocation = (location: PrintEnvironmentConfig) => {
  const { type, name } = location;
  const categories = !location.categories || type === "fiscal" ? [] : location.categories;
  const locations = getPrinterLocations();
  store.set("configs.printing.locations", [...locations, { id: locations[locations.length - 1].id + 1, type, name, categories }]);
}

export const removePrinterLocation = (id: number) => {
  const locations = getPrinterLocations();
  if (id === 1) return;
  const printersWithoutLocation = getPrinters().map((printer) => {
    if (printer.options["printer-location"].includes(id)) {
      return { ...printer, options: { ...printer.options, "printer-location": printer.options["printer-location"].filter((location) => location !== id) } }
    }
    return printer
  });
  const listWithoutLocation = locations.filter((location) => location.id !== id);
  updateAllPrinters(printersWithoutLocation);
  store.set("configs.printing.locations", listWithoutLocation);
}

export const updatePrinterLocation = (location: PrintEnvironmentConfig) => {
  const { id, type, name } = location;
  const categories = !location.categories || type === "fiscal" ? [] : location.categories;
  const locations = getPrinterLocations();
  const locationsUpdated = locations.map((location) => {
    if (location.id === id) {
      return { ...location, type, name, categories };
    }
    return location;
  });
  store.set("configs.printing.locations", locationsUpdated);
}

export const getPrinterLocations = () => {
  const locations = store.get<"configs.printing.locations", PrinterLocation[]>(
    "configs.printing.locations",
  );
  return locations;
}

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
  const printer = getPrinter(payload.id);
  updatePrinter({
    id: printer.id,
    options: {
      ...printer.options,
      "printer-location": [1],
    },
  });
  return printer;
};

export const convertPrinterLocation = () => {
  const printers = getPrinters();
  const printersUpdated = printers.map((printer) => {
    if (typeof printer.options["printer-location"] === "string") {
      return {
        ...printer,
        options: {
          ...printer.options,
          "printer-location": [1],
        },
      };
    } else {
      return printer;
    }
  });
  updateAllPrinters(printersUpdated);
}

const updateAllPrinters = (printers: Printer[]) => {
  store.set("configs.printing.printers", printers);
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
        expirationDate: DateTime.fromISO(oldVoucher.expirationDate).toISO(),
        rememberDays: oldVoucher.rememberDays,
        rememberDate: DateTime.fromISO(oldVoucher.rememberDate).diffNow(["minutes"]).minutes <= 0
          ? null : oldVoucher.rememberDate,
        afterPurchaseDate: DateTime.fromISO(oldVoucher.afterPurchaseDate).diffNow(["minutes"]).minutes <= 0
          ? null : oldVoucher.afterPurchaseDate
      },
    ],
    voucherTwoFactor: [
      {
        id: oldVoucher.id,
        expirationDate: false,
        rememberDate: DateTime.fromISO(oldVoucher.rememberDate).diffNow(["minutes"]).minutes <= 0,
        afterPurchaseDate: DateTime.fromISO(oldVoucher.rememberDate).diffNow(["minutes"]).minutes <= 0
      }
    ]
  }
}

const formatVouchFromDB = (vouchFromDB: VoucherType, client: ClientType): VoucherNotification => {
  const rememberDays = Math.floor(
    DateTime.fromISO(vouchFromDB.expirationDate).diff(
      DateTime.fromISO(vouchFromDB.created_at),
      "days"
    ).days / 2
  );

  const rememberValue = DateTime.fromISO(vouchFromDB.created_at)
    .plus({ days: rememberDays })
    .toISO();

  const afterValue = DateTime.fromISO(vouchFromDB.created_at)
    .plus({ minutes: 20 })
    .toISO();

  return {
    whatsapp: client.whatsapp,
    name: client.name,
    vouchersTotal: vouchFromDB.value,
    vouchers: [
      {
        id: vouchFromDB.id,
        value: vouchFromDB.value,
        expirationDate: DateTime.fromISO(vouchFromDB.expirationDate).toISO(),
        rememberDays,
        rememberDate: DateTime.fromISO(rememberValue).diffNow(["minutes"]).minutes <= 0
          ? null : rememberValue,
        afterPurchaseDate: DateTime.fromISO(afterValue).diffNow(["minutes"]).minutes <= 0
          ? null : afterValue
      },
    ],
    voucherTwoFactor: [
      {
        id: vouchFromDB.id,
        expirationDate: false,
        rememberDate: DateTime.fromISO(rememberValue).diffNow(["minutes"]).minutes <= 0,
        afterPurchaseDate: DateTime.fromISO(afterValue).diffNow(["minutes"]).minutes <= 0
      }
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
  payload: VoucherObj
) => {
  const currentVouchers = getVoucherToNotifyList();
  const userFound = currentVouchers.find((voucher) => voucher.whatsapp === whatsapp);
  if (userFound) {
    const voucherExists = userFound.vouchers.some((voucher) => voucher.id === payload.id);

    if (!voucherExists) {
      userFound.vouchers.push(payload);
    }

    userFound.vouchersTotal = userFound.vouchers.reduce((total, voucher) => total + voucher.value, 0);
  } else {
    currentVouchers.push({
      whatsapp,
      name: userFound?.name,
      vouchersTotal: payload.value,
      vouchers: [payload],
      voucherTwoFactor: [
        {
          id: payload.id,
          expirationDate: false,
          rememberDate: payload.rememberDate === null ? false : true,
          afterPurchaseDate: payload.afterPurchaseDate === null ? false : true
        }
      ]
    })
  }

  const updatedVouchers = currentVouchers.map((voucher) => voucher.whatsapp === whatsapp ? userFound : voucher);

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
    const updatedVouchers = [...currentVouchers]

    allVouchers.forEach((voucherToAdd) => {
      const exists = currentVouchers.some((voucher) => voucher.whatsapp === voucherToAdd.whatsapp);
      if (exists) {
        const updatedUsers = storeVoucherToNotify(
          voucherToAdd.whatsapp,
          voucherToAdd.vouchers[0]
        );
        store.set("configs.voucherToNotify", updatedUsers);
      } else {
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

const deleteExpiredVoucher = (id: number) => {
  const currentVouchers = getVoucherToNotifyList();
  const foundUser = currentVouchers.find((user) => user.vouchers.some((voucher) => voucher.id === id));
  if (!foundUser) {
    return;
  }
  const listWithoutExpiredVoucher = foundUser.vouchers.filter((voucher) => voucher.id !== id);
  const listWithoutExpiredTwoFactor = foundUser.voucherTwoFactor.filter((voucher) => voucher.id !== id);
  const newTotal = listWithoutExpiredVoucher.reduce((total, voucher) => total + voucher.value, 0);
  const updatedUser = {
    ...foundUser,
    vouchersTotal: newTotal,
    vouchers: listWithoutExpiredVoucher,
    voucherTwoFactor: listWithoutExpiredTwoFactor
  }
  const listWithoutuser = currentVouchers.filter((user) => user.whatsapp !== foundUser.whatsapp);
  if (updatedUser.vouchers.length === 0) {
    store.set("configs.voucherToNotify", listWithoutuser);
  } else {
    const updatedList = currentVouchers.map((user) => user.whatsapp === foundUser.whatsapp ? updatedUser : user);
    store.set("configs.voucherToNotify", updatedList);
  }
}

const deleteUsedVouchers = async (voucherFromDB: VoucherType, client: ClientType) => {
  const currentVouchers = getVoucherToNotifyList();
  const vouchersFromUser = await getVouchersFromDB(voucherFromDB.clientId);

  if (vouchersFromUser) {
    const newFormatvoucher = formatVouchFromDB(vouchersFromUser[vouchersFromUser.length - 1], client);
    const updatedList = currentVouchers.filter((user) => user.whatsapp !== newFormatvoucher.whatsapp);
    store.set("configs.voucherToNotify", updatedList);
  }
}

export const deleteVoucherToNotify = (voucherOrId: number | VoucherType) => {
  if (typeof voucherOrId === 'number') {
    deleteExpiredVoucher(voucherOrId);
  } else {
    deleteUsedVouchers(voucherOrId, voucherOrId.client);
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

export const updateTwoFactor = (
  id: number,
  payload: Partial<VoucherTwoFactorObj>
) => {
  const currentVouchers = getVoucherToNotifyList();
  const foundUser = currentVouchers.find((user) => user.vouchers.some((v) => v.id === id));
  const foundVoucher = foundUser.voucherTwoFactor.find((voucher) => voucher.id === id);
  const updatedVouch = { ...foundVoucher, ...payload };
  const updatedUser = {
    ...foundUser,
    voucherTwoFactor: foundUser.voucherTwoFactor.map((voucher) => voucher.id === id ?
      updatedVouch : voucher),
  }
  const updatedVouchers = currentVouchers.map((user) => user.whatsapp === foundUser.whatsapp ? updatedUser : user);
  store.set(
    "configs.voucherToNotify",
    updatedVouchers
  );
};

export const convertToTwoFactor = () => {
  const currentVouchers = getVoucherToNotifyList();
  const alreadyConverted = currentVouchers.every((user) => user.voucherTwoFactor && user.voucherTwoFactor.length === user.vouchers.length);
  if (alreadyConverted) {
    return;
  }
  const convertedVouchers = currentVouchers.map((user) => {
    if (user.voucherTwoFactor && user.voucherTwoFactor.length === user.vouchers.length) {
      return user;
    }
    const twoFactor: VoucherTwoFactorObj[] = []
    user.vouchers.forEach((voucher) => {
      twoFactor.push({
        id: voucher.id,
        expirationDate: false,
        rememberDate: voucher.rememberDate === null ? true : false,
        afterPurchaseDate: voucher.afterPurchaseDate === null ? true : false
      })
    })
    return { ...user, voucherTwoFactor: twoFactor }
  })
  store.set("configs.voucherToNotify", convertedVouchers);
}

export const fetchVouchers = async () => {
  const allVouchersFromDB = await getVouchersFromDB();
  const vouchersFormatedFromDB = allVouchersFromDB.map((voucher) => formatVouchFromDB(voucher, voucher.client));
  const vouchersToNotify: VoucherNotification[] = [];
  vouchersFormatedFromDB.forEach((voucher) => {
    const userFound = vouchersToNotify.find((user) => user.whatsapp === voucher.whatsapp);
    if (!userFound) {
      vouchersToNotify.push({
        whatsapp: voucher.whatsapp,
        name: voucher.name,
        vouchersTotal: voucher.vouchers[0].value,
        vouchers: [...voucher.vouchers],
        voucherTwoFactor: [...voucher.voucherTwoFactor],
      });
    } else {
      userFound.vouchersTotal += voucher.vouchers[0].value;
      userFound.vouchers.push(...voucher.vouchers);
      userFound.voucherTwoFactor.push(...voucher.voucherTwoFactor);
    }
  });
  store.set("configs.voucherToNotify", vouchersToNotify);
}

console.log(store.path);
