import { BrowserWindow, app, dialog, ipcMain } from "electron";
import { whatsAppService } from ".";
import { botWindow } from "../windows/bot-window";
import { Printer, store } from "./store";
import { ClientType } from "../@types/client";
import { ProfileType } from "../@types/profile";


ipcMain.on(
  "send-message",
  async (_, { contact, message, client }: { contact: string; message: string, client?: ClientType }) => {
    const botState = await whatsAppService.bot?.getState()
    try {
      if (botState === 'CONNECTED') {
        const contactId = await whatsAppService.checkNinthDigit(contact, client);
        whatsAppService.bot.sendMessage(contactId._serialized, message);
      } else {
        whatsAppService.messagesQueue.push({
          contact: `${contact}`,
          client,
          message,
        });
        if (!botWindow.windowIsOpen) {
          botWindow.createWindow()
        }
      }
    } catch (error) {
      console.log(error, 'error');
      if (error instanceof Error) {
        if (error.cause === "checkNinthDigit") {
          dialog.showErrorBox("Ops!", error.message);
        }
      }
    }
  }
);

ipcMain.on('show-whatsapp', async (_, show) => {
  store.set('configs.whatsapp.showHiddenWhatsApp', show)
  app.relaunch()
  // await whatsAppService.bot?.destroy()
  // console.log(show, whatsAppService)
  // whatsAppService.initBot()
})

ipcMain.on('executablePath', (_, executablePath) => {
  console.log(executablePath, 'ipc');
  
  store.set('configs.executablePath', executablePath.replaceAll('\\', '/').replaceAll('/', '\\'))
})

ipcMain.on("print", async (_, url) => {
  const profile = store.get("configs.profile") as ProfileType;
  const printers = store.get("configs.printing.printers") as Printer[];
  for (const printer of printers) {
    const { margins, copies, silent, name, paperSize, scaleFactor, dpi } = printer
    const win = new BrowserWindow({ show: false });

    console.log(printer, 'printer');
    console.log(profile.options.print, 'profile');
  
    const printOptions: Electron.WebContentsPrintOptions = {
      deviceName: name,
      silent,
      margins,
      copies,
      dpi: {
        vertical: dpi,
      },
      scaleFactor
    };
    win.webContents.addListener("did-finish-load", async () => {
      await win.webContents.executeJavaScript(`
      // Encontrar o elemento style
      const styleElement = document.querySelector('style');

      if (styleElement) {
        // Sobrescrever os estilos existentes
        styleElement.innerHTML = \`
          \${styleElement.innerHTML}
          /* Adicione novos estilos ou sobrescreva os existentes aqui */

          *{
            font-weight: bolder !important;
          }

          .formated.print-row div {
            width: ${paperSize === 80 ? 100 : 65}mm !important;
          }

          .formated.print-row div p {
            &.complement-space {
              padding-left: ${paperSize === 80 ? 13 : 4}mm !important;
            }
      
            &.item-space {
              padding-left: ${paperSize === 80 ? 20 : 8}mm !important;
            }
      
            &.transshipment-space {
              padding-left: ${paperSize === 80 ? 9 : 5}mm !important;
            }
          }
        \`;
      }
    `);

      const height = Math.ceil(
        (await win.webContents.executeJavaScript(
          "document.body.offsetHeight"
        )) * 264.5833
      );
      win.webContents.print(
        {
          ...printOptions,
          pageSize: {
            height: height < 1600000 ? height : 1600000,
            width: (paperSize === 80 ? 72 : 57) * 1000,
          },
        },
        (success, failureReason) => {
          console.log("Print Initiated in Main...");
          if (!success) console.error(failureReason);
        }
      );
    });
  
    await win.loadURL(url);
  }
  return "shown print dialog";
});

ipcMain.on('storeProfile', (_, profile) => {
  store.set('configs.profile', profile)
})