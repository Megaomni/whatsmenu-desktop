import { app, BrowserWindow, dialog, Menu, MenuItem } from "electron";
import { botWindow } from "../windows/bot-window";
import { addPrinter, deletePrinter, getPrinters, Printer, store, updatePrinter } from "./store";
import prompt from "electron-prompt"

const isMac = process.platform === 'darwin'

const copiesDialog = async (printerSelected: Printer) => {
  const copies = await prompt({
    title: 'Quantidade de Cópias',
    label: 'Quantidade de Cópias',
    value: '1',
    height: 200,
    buttonLabels: {
      ok: 'OK',
      cancel: 'Cancelar'
    }
  })
  store.set('configs.printing.printers', (store.get('configs.printing.printers') as Printer[]).filter(p => p.name === printerSelected.name).map(p => ({ ...p, copies: parseInt(copies) })))
}

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
  const clientPrinters = getPrinters()
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
          click: () => updatePrinter({ id: printer.id, silent: !printer.silent })
        },
        { type: 'separator' },
        {
          label: '58mm',
          type: 'radio',
          checked: printer.paperSize === 58,
          click: () => updatePrinter({ id: printer.id, paperSize: 58 })
        },
        {
          label: '80mm',
          type: 'radio',
          checked: printer.paperSize === 80,
          click: () => updatePrinter({ id: printer.id, paperSize: 80 })
        },
        { type: 'separator' },
        { label: `Cópias - ${printer.copies}`, click: () => copiesDialog(printer) },
        { type: 'separator' },
        { label: 'Excluir', click: () => deletePrinter(printer.id) },
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
      const printerDialog = await dialog.showMessageBox(window, {
        title: 'Impressoras Disponíveis',
        message: 'Selecione uma Impressora',
        checkboxLabel: 'Imprimir Automaticamente',
        checkboxChecked: true,
        detail: 'Selecione uma Impressora, caso não queira impressão automática desmarque a caixa "Imprimir Automaticamente"',
        type: 'question',
        buttons: ['cancel', ...printers.map(printer => printer.name)],
      })

      const printerSelected = printers.at(printerDialog.response - 1)

      if (printerDialog.response === 0 || clientPrinters.some(p => p.name === printerSelected!.name)) {
        return
      }

      const newPrinter =addPrinter({ ...printerSelected!, id: clientPrinters.length + 1, silent: printerDialog.checkboxChecked, paperSize: 58, copies: 1 })

      const paperSizeDialog = await dialog.showMessageBox(window, {
        title: 'Tamanho do Papel',
        message: 'Selecione o tamanho do papel',
        type: 'question',
        buttons: ['58mm', '80mm'],
      })
      
      switch (paperSizeDialog.response) {
        case 0:
          updatePrinter({ id: newPrinter.id, paperSize: 58 })
        break;
        case 1:
          updatePrinter({ id: newPrinter.id, paperSize: 80 })
        break;
      }
      
      await copiesDialog(newPrinter)
      
    }
  }
]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template as any[]))
}, 100)
