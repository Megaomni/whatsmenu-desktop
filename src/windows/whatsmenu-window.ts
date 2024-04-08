import { BrowserWindow, Menu, screen } from 'electron';
import path from 'path';
import { botWindow } from './bot-window';

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

    window.loadURL('https://next.whatsmenu.com.br')
    window.setMenu(Menu.buildFromTemplate([
      { label: 'Robô Whatsapp', click: () => botWindow.createWindow() },
    ]))
    return window
  }
}