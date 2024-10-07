import { dialog, screen } from "electron"
import path from "node:path"
import { whatsAppService } from "../../main"
import { WebTabContentsView } from "../../extends/tab"

export const create_bot_tab = () => {
  
  const tab = new WebTabContentsView({
    id: "bot",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    tab.webContents.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/bot.html`);
  } else {
    tab.webContents.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/bot.html`
      )
    );
  }
  tab.setVisible(false)

  tab.webContents.on('did-finish-load', async () => {
    await whatsAppService.connect();
    whatsAppService.socket.ev.on('connection.update', ({ qr }) => {
      tab.webContents.send("onqrcode", qr);
      tab.webContents.send("log", qr);
    })

    whatsAppService.socket.ev.on('connection.update', ({ connection }) => {
      switch (connection) {
        case "close":
          tab.webContents.send("ondisconnected", "Conexão encerrada");
          console.log("Conexão encerrada");
          
          break;
        case "open":
          tab.webContents.send("onready");
          console.log("Conexão aberta");
          
          break; 
        case "connecting":
          tab.webContents.send("onloading", { percent: 50, message: 'carregando mensagens' });
          console.log("Carregando");
          
          break;
      }
      connection === "open" && tab.webContents.send("onready");
    })

    whatsAppService.socket.ev
    // whatsAppService.initBot()
    //   .then(() => {
    //     whatsAppService.bot.on("ready", () => {
    //       if (!whatsAppService.firstConection) {
    //         tab.webContents.send("onready");
    //       } else {
    //         whatsAppService.events.on("ready", () => {
    //           tab.webContents.send("onready");
    //         });
    //       }
    //     });
    
    //     whatsAppService.bot.on("qr", (qr) => {
    //       tab.webContents.send("onqrcode", qr);
    //       tab.webContents.send("log", qr);
    //     });
    
    //     whatsAppService.bot.on("loading_screen", (percent, message) => {
    //       tab.webContents.send("onloading", { percent, message });
    //     });
    
    //     whatsAppService.bot.on("disconnected", (reason) => {
    //       tab.webContents.send("ondisconnected", reason);
    //     });
    
    //     whatsAppService.bot.initialize().catch((err) => {
    //       console.error(err);
    //       tab.webContents.send("error", err);
    //       dialog.showErrorBox("Ops!", err);
    //     });
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     tab.webContents.send("error", err);
    //     dialog.showErrorBox("Ops!", err);
    //   })
  })

  return tab
}
