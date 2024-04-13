import { app, BrowserWindow, dialog, Menu, MenuItem } from "electron";
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        submenu: []
      }
    ]
  },
  { role: 'toggleDevTools'},
]

export const whatsmenu_menu = Menu.buildFromTemplate(template as any[])

setInterval(async () => {
  const clientPrinters = store.get('configs.printing.printers') as Printer[]
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  template.at(1).submenu.at(0).submenu = [...clientPrinters.map(printer => (
    {
      label: printer.name,
      submenu:[
        { 
          label: 'Imprimir Automaticamente',
          type: "checkbox",
          checked: printer.silent,
          click: () => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).map(p => {
            if (p.name === printer.name) {
              p.silent = !p.silent
            }
            return p
          }))
        },
        { type: 'separator' },
        {
          label: '58mm',
          type: 'radio',
          checked: printer.paperSize === 58,
          click: () => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).map(p => {
            if (p.name === printer.name) {
              p.paperSize = 58
            }
            return p
          }))
        },
        {
          label: '80mm',
          type: 'radio',
          checked: printer.paperSize === 80,
          click: () => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).map(p => {
            if (p.name === printer.name) {
              p.paperSize = 80
            }
            return p
          }))
        },
        { type: 'separator' },
        { label: 'Excluir', click: () => store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).filter(p => p.name !== printer.name)) }
      ],
      
    }
  )),
  { type: 'separator' }, 
  {
    label: '+ Adicionar Impressora',
    click: async (_: MenuItem, window: BrowserWindow) => {
      const printers = (await window.webContents.getPrintersAsync()).filter(printer => !clientPrinters.some(p => p.name === printer.name))
      if (!printers.length) {
        return dialog.showMessageBox(window, {
          title: 'Impressoras Disponíveis',
          message: 'Nenhuma Impressora Disponível',
          type: 'info',
          buttons: ['OK'],
        })
      }
      return dialog.showMessageBox(window, {
        title: 'Impressoras Disponíveis',
        message: 'Selecione uma Impressora',
        checkboxLabel: 'Imprimir Automaticamente',
        checkboxChecked: true,
        detail: 'Selecione uma Impressora e clique em Imprimir Automaticamente',
        type: 'question',
        buttons: ['cancel', ...printers.map(printer => printer.name)],
      }).then(({ response, checkboxChecked }) => {
        if (response === 0 || clientPrinters.some(p => p.name === printers.at(response - 1)!.name)) {
          return
        }
        store.set('configs.printing.printers', [...(store.get('configs.printing.printers') as Printer[]), { ...printers.at(response - 1)!, silent: checkboxChecked, paperSize: 58 }])
      })
    }
  }
]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template as any[]))
}, 100)
