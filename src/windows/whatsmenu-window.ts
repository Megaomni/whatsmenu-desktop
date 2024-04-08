import { BrowserWindow, Menu } from 'electron';
import path from 'path';
import { botWindow } from './bot-window';

export const whatsmenuWindow = {
  createWindow() {
    // Create the browser window.
    const window = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    window.loadURL('https:next.whatsmenu.com.br')
    window.setMenu(Menu.buildFromTemplate([
      { label: 'Robô Whatsapp', click: () => botWindow.createWindow() },
    ]))
    return window
  }
}