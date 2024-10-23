// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";
import WAWebJS from "whatsapp-web.js";
import { ClientType } from "../@types/client";
import { ProfileType } from "../@types/profile";
import { VoucherType } from "../@types/voucher";
import { Env } from "../environments";
import { MerchantType } from "../@types/merchant";

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
      reason: WAWebJS.WAState | "NAVIGATION",
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
  onCart: (cart: { id: number; client?: ClientType }) =>
    ipcRenderer.send("onCart", cart),
  onVoucher: (voucher: VoucherType) => ipcRenderer.send("onVoucher", voucher),
  removeVoucher: (voucher: VoucherType) =>
    ipcRenderer.send("removeVoucher", voucher),

  storeProfile: (profile: ProfileType) =>
    ipcRenderer.send("storeProfile", profile),
  storeMerchant: (merchant: MerchantType) =>
    ipcRenderer.send("storeMerchant", merchant),
  getProfile: () => ipcRenderer.send("getProfile"),
  getMerchant: () => ipcRenderer.send("getMerchant"),
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
