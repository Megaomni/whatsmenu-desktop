import { BrowserWindow, dialog, ipcMain } from "electron"
import { whatsAppService } from "."

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
  const printOptions = {
    silent: false,
    printBackground: true,
    color: true,
    margin: {
      marginType: "printableArea",
    },
    landscape: false,
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: "Page header",
    footer: "Page footer",
  };

  const win = new BrowserWindow({show: false});

  win.webContents.on("did-finish-load", () => {
    win.webContents.print(printOptions, (success, failureReason) => {
      console.log("Print Initiated in Main...");
      if (!success) console.log(failureReason);
    });
  });

  await win.loadURL(url);
  return "shown print dialog";
})