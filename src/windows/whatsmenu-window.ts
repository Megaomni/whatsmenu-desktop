import { BrowserWindow, screen } from 'electron';
import path from 'path';

export const whatsmenuWindow = {

  /**
   * Create a new BrowserWindow with specified width and height, load a URL, set a menu, and return the window.
   *
   * @return {BrowserWindow} The newly created BrowserWindow
   */
  createWindow(): BrowserWindow {
    const mainScreen = screen.getPrimaryDisplay()
    const { width, height } = mainScreen.size
    const window = new BrowserWindow({
      width,
      height,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    window.loadURL('https://whatsmenu-adm-front-git-bot-grove-company.vercel.app/')
    // window.loadURL('http://localhost:3000')
    window.webContents.openDevTools()
    // window.setMenu(Menu.buildFromTemplate([
    //   { label: 'Robô Whatsapp', click: () => botWindow.createWindow() },
    // ]))
    return window
  }
}