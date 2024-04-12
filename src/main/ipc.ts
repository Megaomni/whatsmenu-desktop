import { BrowserWindow, dialog, ipcMain } from "electron"
import { whatsAppService } from "."
import { Printer, store } from "./store"

ipcMain.on('send-message', async (_, {contact, message}: {contact: string, message: string}) => {
  try {
    if (whatsAppService.bot) {
      const validatedContact = await whatsAppService.checkNinthDigit(contact)
      whatsAppService.bot.sendMessage(`${validatedContact}`, message)
    } else {
      await whatsAppService.initBot()
      whatsAppService.messagesQueue.push({ contact: `${contact}@c.us`, message })
      await whatsAppService.bot.initialize()
    } 
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.cause === 'checkNinthDigit') {
        dialog.showErrorBox('Ops!', error.message)
      }
    }
  }
})

ipcMain.on('print', async (_, url) => {
  const printers = store.get('configs.printing.printers') as Printer[]
  for (const printer of printers) {
    const win = new BrowserWindow({show: false});
  
    const printOptions: Electron.WebContentsPrintOptions = {
      silent: printer.silent,
      dpi: {
        vertical: 203
      },
      margins: {
        marginType: 'none'
      },
    };
    win.webContents.addListener("did-finish-load", async () => {
      console.log(printer.paperSize, printer.name);
      
      const height = Math.ceil(await win.webContents.executeJavaScript('document.body.offsetHeight') * 264.5833)
      win.webContents.print({
        ...printOptions,
        deviceName: printer.name,
        pageSize: {
          height: height > 1600000 ? height : 1600000,
          width: 80 * 1000
        }
      }, (success, failureReason) => {
        console.log("Print Initiated in Main...");
        if (!success) console.log(failureReason);
      });
    });
  
    await win.loadURL(url);
  }
  return "shown print dialog";
})