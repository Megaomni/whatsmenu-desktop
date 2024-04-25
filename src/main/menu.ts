import { app, BrowserWindow, dialog, Menu, MenuItem } from "electron";
import { botWindow } from "../windows/bot-window";
import { addPrinter, deletePrinter, getPrinters, Printer, store, updatePrinter } from "./store";
import prompt from "electron-prompt"
import { ProfileType } from "../@types/profile";

import { randomUUID } from "node:crypto";

const profile = store.get('configs.profile') as ProfileType
const isMac = process.platform === 'darwin'

const copiesDialog = async (printerSelected: Printer) => {
  const copies = await prompt({
    title: 'Quantidade de Cópias',
    label: 'Quantidade de Cópias',
    inputAttrs: { type: 'number' },
    value: printerSelected.copies ? printerSelected.copies.toString() : '1',
    height: 200,
    buttonLabels: {
      ok: 'OK',
      cancel: 'Cancelar'
    }
  })
  updatePrinter({ id: printerSelected.id, copies: parseInt(copies) ?? printerSelected.copies })
}

const scaleFactorDialog = async (printerSelected: Printer) => {
  const copies = await prompt({
    title: 'Escala da impressão',
    label: 'Escala em porcentagem',
    inputAttrs: { type: 'number' },
    value: printerSelected ? printerSelected.scaleFactor.toString() : '100',
    height: 200,
    buttonLabels: {
      ok: 'OK',
      cancel: 'Cancelar'
    }
  })
  updatePrinter({ id: printerSelected.id, scaleFactor: parseInt(copies) ?? printerSelected.scaleFactor })}

const dpiDialog = async (printerSelected: Printer) => {
  const copies = await prompt({
    title: 'Dpi da impressão',
    label: 'Dpi da impressão',
    inputAttrs: { type: 'number' },
    value: printerSelected ? printerSelected.dpi.toString() : '203',
    height: 200,
    buttonLabels: {
      ok: 'OK',
      cancel: 'Cancelar'
    }
  })
  updatePrinter({ id: printerSelected.id, dpi: parseInt(copies) ?? printerSelected.dpi })
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
  { label: 'Ver', submenu: [
    { role: 'reload', label: 'Recarregar' },
    { role: 'forceReload', label: 'Forçar Recarregar' },
    { role: 'toggleDevTools', label: 'Console' },
  ] as MenuItem[] },
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
        { label: `Sem Margem`, type: 'radio', checked: printer.margins?.marginType === 'none',click: () => updatePrinter({ id: printer.id, margins: { marginType: 'none' }}) },
        { label: `Margem Mínima`, type: 'radio', checked: printer.margins?.marginType === 'custom',click: () => updatePrinter({ id: printer.id, margins: { marginType: 'custom', top: 0, right: 0, bottom: 1, left: 15 }}) },
        { type: 'separator' },
        { label: `Escala - ${printer.scaleFactor}%`, click: () => scaleFactorDialog(printer) },
        { type: 'separator' },
        { label: `DPi - ${printer.dpi}`, click: () => dpiDialog(printer) },
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

      const newPrinter = addPrinter({ ...printerSelected!, id: randomUUID(), silent: printerDialog.checkboxChecked, paperSize: 58, copies: 1, margins: { marginType: 'none' }, scaleFactor: 100, dpi: 203 })

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
