import { BrowserWindow, dialog } from "electron";
import path from "path";
import { whatsAppService } from "../main";
import isDev from "electron-is-dev";

let window: BrowserWindow;
let forceClose = false;

const botWindow = {
  async createWindow() {

    // Create the browser window.
    if (!window) {
      window = new BrowserWindow({
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
        },
      });
      isDev && window.webContents.openDevTools();

      await whatsAppService.initBot();

      whatsAppService.bot.on("ready", () => {
        if (!whatsAppService.firstConection) {
          window.webContents.send("onready");
        } else {
          whatsAppService.events.on("ready", () => {
            window.webContents.send("onready");
          });
        }
      });

      whatsAppService.bot.on("qr", (qr) => {
        window.webContents.send("onqrcode", qr);
        window.webContents.send("log", qr);
      });

      whatsAppService.bot.on("loading_screen", (percent, message) => {
        window.webContents.send("onloading", { percent, message });
      });

      whatsAppService.bot.on("disconnected", (reason) => {
        window.webContents.send("ondisconnected", reason);
      });

      whatsAppService.bot.initialize().catch((err) => {
        console.error(err);
        window.webContents.send("error", err);
        dialog.showErrorBox("Ops!", err);
      });

      window.on("close", (e) => {
        if (!forceClose) {
          e.preventDefault();
          window.hide();
        }
      });

      window.maximize();
    } else {
      window.restore();
      window.focus();
    }

    return window;
  },
  windowIsOpen: !!window,
  forceCloseWindow: () => (forceClose = true),
};

export { botWindow };
