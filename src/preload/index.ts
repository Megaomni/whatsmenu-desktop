// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";
import { ClientType } from "../@types/client";
import { ProfileType } from "../@types/profile";
import { VoucherType } from "../@types/voucher";
import { Env } from "../environments";
import { MerchantType } from "../@types/merchant";
import { PrintEnvironmentConfig, ProductCategory } from "../react/types_print-environment";
import { Printer } from "../@types/store";

export const WhatsAppBotApi = {
  // Events
  onqrcode: (
    callback: (event: Electron.IpcRendererEvent, qrcode: string) => void,
  ) => ipcRenderer.on("onqrcode", callback),
  onloading: (
    callback: (
      event: Electron.IpcRendererEvent,
      value: { percent: number; message: string },
    ) => void,
  ) => ipcRenderer.on("onloading", callback),
  onready: (callback: (event: Electron.IpcRendererEvent) => void) =>
    ipcRenderer.on("onready", callback),
  ondisconnected: (
    callback: (
      event: Electron.IpcRendererEvent,
      reason: "NAVIGATION",
    ) => void,
  ) => ipcRenderer.on("ondisconnected", callback),
  onmessagesend: (
    callback: (event: Electron.IpcRendererEvent, client: ClientType) => void,
  ) => ipcRenderer.once("onmessagesend", callback),

  // Methods
  sendMessage: (contact: string, message: string) =>
    ipcRenderer.send("send-message", { contact, message }),
  showWhatsapp: (show: boolean) => ipcRenderer.send("show-whatsapp", show),
  setExecutablePath: (executablePath: string) => {
    ipcRenderer.send("executablePath", executablePath);
  },
};

export const WhatsMenuPrintApi = {
  print: (url: string) => ipcRenderer.send("print", url),
};

export const DesktopApi = {
  onProfileChange: (
    callback: (event: Electron.IpcRendererEvent, profile: ProfileType) => void,
  ) => ipcRenderer.on("onProfileChange", callback),
  onCategoriesChange: (
    callback: (event: Electron.IpcRendererEvent, categories: ProductCategory[]) => void,
  ) => ipcRenderer.on("onCategoriesChange", callback),
  onPrinterLocationsChange: (
    callback: (event: Electron.IpcRendererEvent, locations: PrintEnvironmentConfig[]) => void,
  ) => ipcRenderer.on("onPrinterLocationsChange", callback),
  onPrinterChange: (
    callback: (event: Electron.IpcRendererEvent, printers: Printer[]) => void,
  ) => ipcRenderer.on("onPrinterChange", callback),
  onCart: (cart: { id: number; client?: ClientType }) =>
    ipcRenderer.send("onCart", cart),
  onSubmitPrint: (location: PrintEnvironmentConfig) =>
    ipcRenderer.send("onSubmitPrint", location),
  onRemovePrint: (id: number) =>
    ipcRenderer.send("onRemovePrint", id),
  onUpdatePrint: (location: PrintEnvironmentConfig) =>
    ipcRenderer.send("onUpdatePrint", location),
  onUpdatePrinter: (printer: Partial<Printer>) =>
    ipcRenderer.send("onUpdatePrinter", printer),
  onVoucher: (voucher: VoucherType) =>
    ipcRenderer.send("onVoucher", voucher),
  removeUsedVoucher: (voucher: VoucherType) =>
    ipcRenderer.send("removeUsedVoucher", voucher),
  removeCanceledVoucher: (voucherId: number) =>
    ipcRenderer.send("removeCanceledVoucher", voucherId),
  setUserControls: (userControls: any) =>
    ipcRenderer.send("setUserControls", userControls),
  storeProfile: (profile: ProfileType, updateBot: boolean) =>
    ipcRenderer.send("storeProfile", profile, updateBot),
  storeMerchant: (merchant: MerchantType) =>
    ipcRenderer.send("storeMerchant", merchant),
  getProfile: () => ipcRenderer.send("getProfile"),
  getMerchant: () => ipcRenderer.send("getMerchant"),
  getCategories: () => ipcRenderer.send("getCategories"),
  getPrinterLocations: () => ipcRenderer.send("getPrinterLocations"),
  getAllPrinters: () => ipcRenderer.send("getAllPrinters"),
  /**
   * Abre um link no navegador padrão.
   *
   * @param {string} url - A URL a ser aberta.
   * @return {void}
   */
  openLink: (url: string): void => {
    ipcRenderer.send("openLink", url);
  },
};
//   storeProfile: (profile: ProfileType) => ipcRenderer.send('storeProfile', profile),
//   storeMerchant: (merchant: MerchantType) => ipcRenderer.send('storeMerchant', merchant),
//   getProfile: () => ipcRenderer.send('getProfile'),
//   onMerchantChange: (callback: (event: Electron.IpcRendererEvent, merchant: MerchantType) => void) => ipcRenderer.on('onMerchantChange', callback),
//   getMerchant: () => ipcRenderer.send('getMerchant'),
// }

export const TabsApi = {
  setActiveTab: (tab: string) => ipcRenderer.send("setActiveTab", tab),
};

export const envPreload = (): Env => ipcRenderer.sendSync("env");

contextBridge.exposeInMainWorld("isElectron", true);
contextBridge.exposeInMainWorld("WhatsAppBotApi", WhatsAppBotApi);
contextBridge.exposeInMainWorld("WhatsMenuPrintApi", WhatsMenuPrintApi);
contextBridge.exposeInMainWorld("DesktopApi", DesktopApi);
contextBridge.exposeInMainWorld("TabsApi", TabsApi);
contextBridge.exposeInMainWorld("env", envPreload);

ipcRenderer.on("log", (event, log) => {
  console.log(log);
});

ipcRenderer.on("error", (event, error) => {
  console.error(error);
});

ipcRenderer.on("warn", (event, error) => {
  console.warn(error);
});
