import { BrowserWindow, screen } from "electron";
import isDev from "electron-is-dev";
import path from "path";
import { whatsmenu_menu } from "../main/menu";
import { registerShortCuts } from "../main/shortcuts";

let forceClose = false;

export const whatsmenuWindow = {
  forceCloseWindow: () => (forceClose = true),
  /**
   * Create a new BrowserWindow with specified width and height, load a URL, set a menu, and return the window.
   *
   * @return {BrowserWindow} The newly created BrowserWindow
   */
  createWindow(): BrowserWindow {
    const mainScreen = screen.getPrimaryDisplay();
    const { width, height } = mainScreen.size;
    const window = new BrowserWindow({
      width,
      height,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });

    window.maximize();
    // window.loadURL('https://next.whatsmenu.com.br/')
    window.loadURL("http://localhost:3000");
    isDev && window.webContents.openDevTools();
    window.setMenu(whatsmenu_menu);
    window.webContents.on("did-create-window", (win) => win.maximize());
    registerShortCuts(window);
    window.on("close", (e) => {
      if (!forceClose) {
        e.preventDefault();
        window.hide();
      }
    });
    return window;
  },
};
