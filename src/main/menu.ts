import { app, Menu } from "electron";
import { botWindow } from "../windows/bot-window";
import { Printer, store } from "./store";

const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'fileMenu' }
  (isMac ? {
    label: 'Robô WhatsApp',
    submenu: [
      {
        label: 'Iniciar',
        click: () => botWindow.createWindow()
      }
    ]
  } : {
    label: 'Robô WhatsApp',
    click: () => botWindow.createWindow()
  }),
  {
    label: 'Impressão',
    submenu: [
      { 
        label: 'Impressoras',
        submenu: (store.get('configs.printing.printers') as Printer[]).map(printer => (
          {
            label: printer.name,
            type: "checkbox",
            checked: printer.silent,
            click: () => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).map(p => {
              if (p.name === printer.name) {
                p.silent = !p.silent
              }
              return p
            }))
          }
        ))
      }
    ]
  }
]


export const whatsmenu_menu = Menu.buildFromTemplate(template as any[])
if (isMac) {
  Menu.setApplicationMenu(whatsmenu_menu)
}