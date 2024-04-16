import { BrowserWindow, dialog, ipcMain } from "electron";
import { whatsAppService } from ".";
import { Printer, store } from "./store";
import { botWindow } from "../windows/bot-window";

ipcMain.on(
  "send-message",
  async (_, { contact, message }: { contact: string; message: string }) => {
    const botState = await whatsAppService.bot?.getState()
    try {
      if (botState === 'CONNECTED') {
        const chat = await whatsAppService.checkNinthDigit(contact)
        if (chat) {
          chat.sendMessage(message);
        } else {
          whatsAppService.bot.sendMessage(`${contact}@c.us`, message);
        }
      } else {
        whatsAppService.messagesQueue.push({
          contact: `${contact}`,
          message,
        });
        if (!botWindow.windowIsOpen) {
          botWindow.createWindow()
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.cause === "checkNinthDigit") {
          dialog.showErrorBox("Ops!", error.message);
        }
      }
    }
  }
);

ipcMain.on("print", async (_, url) => {
  const printers = store.get("configs.printing.printers") as Printer[];
  for (const printer of printers) {
    const { margins, copies, silent, name, paperSize, scaleFactor } = printer
    const win = new BrowserWindow({ show: false });
  
    const printOptions: Electron.WebContentsPrintOptions = {
      deviceName: name,
      silent,
      margins,
      copies,
      dpi: {
        vertical: 203,
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
