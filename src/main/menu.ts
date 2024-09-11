import { app, BrowserWindow, dialog, Menu, MenuItem } from "electron";
import prompt from "electron-prompt";
import { Printer } from "../@types/store";
import {
  addPrinter,
  deletePrinter,
  getPrinters,
  store,
  updatePrinter,
} from "./store";

import { randomUUID } from "node:crypto";
import { mainWindow } from ".";

const isMac = process.platform === "darwin";

const copiesDialog = async (printerSelected: Printer) => {
  const copies = await prompt({
    title: "Quantidade de Cópias",
    label: "Quantidade de Cópias",
    inputAttrs: { type: "number" },
    value: printerSelected.copies ? printerSelected.copies.toString() : "1",
    height: 200,
    buttonLabels: {
      ok: "OK",
      cancel: "Cancelar",
    },
  });
  updatePrinter({
    id: printerSelected.id,
    copies: parseInt(copies) ?? printerSelected.copies,
  });
};

const scaleFactorDialog = async (printerSelected: Printer) => {
  const scaleFactor = await prompt({
    title: "Escala da impressão",
    label: "Escala em porcentagem",
    inputAttrs: { type: "number" },
    value: printerSelected ? printerSelected.scaleFactor.toString() : "100",
    height: 200,
    buttonLabels: {
      ok: "OK",
      cancel: "Cancelar",
    },
  });
  updatePrinter({
    id: printerSelected.id,
    scaleFactor: parseInt(scaleFactor) ?? printerSelected.scaleFactor,
  });
};

const paperSizeDialog = async (printerSelected: Printer) => {
  const paperSize = await prompt({
    title: "Largura do papel",
    label: "Valor e milimetros (mm)",
    inputAttrs: { type: "number" },
    value: printerSelected ? printerSelected.paperSize.toString() : "58",
    height: 200,
    buttonLabels: {
      ok: "OK",
      cancel: "Cancelar",
    },
  });
  updatePrinter({
    id: printerSelected.id,
    paperSize: parseInt(paperSize) ?? printerSelected.paperSize,
  });
};

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  // { role: 'fileMenu' }
  // (isMac ? {
  //   label: 'Robô WhatsApp',
  //   submenu: [
  //     {
  //       label: 'Iniciar',
  //       click: () => botWindow.createWindow()
  //     }
  //   ]
  // } : {
  //   label: 'Robô WhatsApp',
  //   click: () => botWindow.createWindow()
  // }),
  {
    label: "Impressão",
    submenu: [
      {
        label: "Impressoras",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        submenu: [],
      },
    ],
  },
  {
    label: "Ver",
    submenu: [
      {
        label: "Recarregar",
        click: () => {
          mainWindow.tabs.forEach((tab) => {
            if (tab.isVisible) {
              tab.webContents.reload();
            }
          });
        },
        accelerator: "CmdOrCtrl+R",
      },
      {
        label: "Forçar Recarregar",
        click: () => {
          mainWindow.tabs.forEach((tab) => {
            if (tab.isVisible) {
              tab.webContents.reloadIgnoringCache();
            }
          });
        },
        accelerator: "CmdOrCtrl+Shit+R",
      },
      {
        label: "Console",
        click: () => {
          mainWindow.tabs.forEach((tab) => {
            if (tab.isVisible) {
              if (!tab.webContents.isDevToolsOpened()) {
                tab.webContents.openDevTools({ activate: true, mode: "right" });
              } else {
                tab.webContents.closeDevTools();
              }
            }
          });
        },
        accelerator: "F12",
      },
    ] as unknown as MenuItem[],
  },
];

export const whatsmenu_menu = Menu.buildFromTemplate(template as any[]);

const updateMenu = async () => {
  const clientPrinters = getPrinters();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  template.at(0).submenu.at(0).submenu = [
    ...clientPrinters.map((printer) => ({
      label: printer.name,
      submenu: [
        {
          label: "Imprimir Automaticamente",
          type: "checkbox",
          checked: printer.silent,
          click: () =>
            updatePrinter({ id: printer.id, silent: !printer.silent }),
        },
        { type: "separator" },
        {
          label: "58mm",
          type: "radio",
          checked: printer.paperSize === 58,
          click: () => updatePrinter({ id: printer.id, paperSize: 58 }),
        },
        {
          label: "80mm",
          type: "radio",
          checked: printer.paperSize === 80,
          click: () => updatePrinter({ id: printer.id, paperSize: 80 }),
        },
        {
          label: `Customizado ${
            printer.paperSize !== 80 && printer.paperSize !== 58
              ? " - " + printer.paperSize + "mm"
              : ""
          }`,
          type: "radio",
          checked: printer.paperSize !== 80 && printer.paperSize !== 58,
          click: () => paperSizeDialog(printer),
        },
        { type: "separator" },
        {
          label: `Cópias - ${printer.copies}`,
          click: () => copiesDialog(printer),
        },
        { type: "separator" },
        {
          label: `Sem Margem`,
          type: "radio",
          checked: printer.margins?.marginType === "none",
          click: () =>
            updatePrinter({ id: printer.id, margins: { marginType: "none" } }),
        },
        {
          label: `Margem Mínima`,
          type: "radio",
          checked: printer.margins?.marginType === "custom",
          click: () =>
            updatePrinter({
              id: printer.id,
              margins: {
                marginType: "custom",
                top: 0,
                right: 0,
                bottom: 1,
                left: 15,
              },
            }),
        },
        { type: "separator" },
        {
          label: `Escala - ${printer.scaleFactor}%`,
          click: () => scaleFactorDialog(printer),
        },
        { type: "separator" },
        { label: "Excluir", click: () => deletePrinter(printer.id) },
      ],
    })),
    { type: "separator" },
    {
      label: "+ Adicionar Impressora",
      click: async (_: MenuItem, window: BrowserWindow) => {
        const printers = (await window.webContents.getPrintersAsync()).filter(
          (printer) => !clientPrinters.some((p) => p.name === printer.name)
        );
        if (!printers.length) {
          return dialog.showMessageBox(window, {
            title: "Impressoras Disponíveis",
            message: "Nenhuma Impressora Disponível",
            type: "info",
            buttons: ["OK"],
          });
        }
        const printerDialog = await dialog.showMessageBox(window, {
          title: "Impressoras Disponíveis",
          message: "Selecione uma Impressora",
          checkboxLabel: "Imprimir Automaticamente",
          checkboxChecked: true,
          detail:
            'Selecione uma Impressora, caso não queira impressão automática desmarque a caixa "Imprimir Automaticamente"',
          type: "question",
          buttons: ["cancel", ...printers.map((printer) => printer.name)],
        });

        const printerSelected = printers.at(printerDialog.response - 1);

        if (
          printerDialog.response === 0 ||
          clientPrinters.some((p) => p.name === printerSelected!.name)
        ) {
          return;
        }

        const newPrinter = addPrinter({
          ...printerSelected!,
          id: randomUUID(),
          silent: printerDialog.checkboxChecked,
          paperSize: 58,
          copies: 1,
          margins: { marginType: "none" },
          scaleFactor: 100,
        });

        const paperSizeDialog = await dialog.showMessageBox(window, {
          title: "Tamanho do Papel",
          message: "Selecione o tamanho do papel",
          type: "question",
          buttons: ["58mm", "80mm"],
        });

        switch (paperSizeDialog.response) {
          case 0:
            updatePrinter({ id: newPrinter.id, paperSize: 58 });
            break;
          case 1:
            updatePrinter({ id: newPrinter.id, paperSize: 80 });
            break;
        }

        await copiesDialog(newPrinter);
      },
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template as any[]));
};

setTimeout(() => {
  updateMenu();
}, 1000);
store.onDidAnyChange(() => updateMenu());

export const contextMenu = Menu.buildFromTemplate([
  {
    label: "Recarregar",
    accelerator: "F5",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.reload();
    },
  },
  {
    label: "Recarregar (Ignorar Cache)",
    accelerator: "Shift+F5",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.reloadIgnoringCache();
    },
  },
  {
    label: "Alternar Ferramentas de Desenvolvedor",
    accelerator: "F12",
    click: () => {
      if (!mainWindow.getCurrentTab()?.webContents.isDevToolsOpened()) {
        mainWindow.getCurrentTab()?.webContents.openDevTools({ mode: "right" });
      } else {
        mainWindow.getCurrentTab()?.webContents.closeDevTools();
      }
    },
  },
  { type: "separator" },
  {
    label: "Copiar",
    accelerator: "CmdOrCtrl+C",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.copy();
    },
  },
  {
    label: "Recortar",
    accelerator: "CmdOrCtrl+X",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.cut();
    },
  },
  {
    label: "Colar",
    accelerator: "CmdOrCtrl+V",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.paste();
    },
  },
  {
    label: "Selecionar Tudo",
    accelerator: "CmdOrCtrl+A",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.selectAll();
    },
  },
  { type: "separator" },
  {
    label: "Desfazer",
    accelerator: "CmdOrCtrl+Z",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.undo();
    },
  },
  {
    label: "Refazer",
    accelerator: "CmdOrCtrl+Shift+Z",
    click: () => {
      mainWindow.getCurrentTab()?.webContents.redo();
    },
  },
]);
