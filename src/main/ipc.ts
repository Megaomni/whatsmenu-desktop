import { BrowserWindow, app, dialog, ipcMain } from "electron";
import { whatsAppService } from ".";
import { ClientType } from "../@types/client";
import axios from "axios";

import path from "node:path";
import {
  deleteVoucherToNotify,
  getProfile,
  setCacheContactByWhatsapp,
  store,
  storeVoucherToNotify,
} from "./store";
import { Printer } from "../@types/store";
import { DateTime } from "luxon";
import { VoucherType } from "../@types/voucher";

ipcMain.on(
  "send-message",
  async (
    _,
    {
      contact,
      message,
      client,
    }: { contact: string; message: string; client?: ClientType }
  ) => {
    const botState = await whatsAppService.bot?.getState();
    try {
      if (botState === "CONNECTED") {
        const contactId = whatsAppService.checkNinthDigit(contact);
        whatsAppService.bot.sendMessage(contactId._serialized, message);
      } else {
        whatsAppService.messagesQueue.push({
          contact: `${contact}`,
          client,
          message,
        });
      }
    } catch (error) {
      console.error(error, "error");
      if (error instanceof Error) {
        if (error.cause === "checkNinthDigit") {
          dialog.showErrorBox("Ops!", error.message);
        }
      }
    }
  }
);

ipcMain.on("show-whatsapp", async (_, show) => {
  store.set("configs.whatsapp.showHiddenWhatsApp", show);
  app.relaunch();
});

ipcMain.on("executablePath", (_, executablePath) => {
  store.set(
    "configs.executablePath",
    executablePath.replaceAll("\\", "/").replaceAll("/", "\\")
  );
});

ipcMain.on("print", async (_, serializedPayload) => {
  const printers = store.get("configs.printing.printers") as Printer[];
  for (const printer of printers) {
    const isGeneric = printer.options.system_driverinfo
      .toLowerCase()
      .includes("generic");
    console.log(isGeneric, "isGeneric");
    const { margins, copies, silent, name, paperSize, scaleFactor } = printer;
    const win = new BrowserWindow({ show: false });
    // win.webContents.openDevTools({ mode: "right" });

    const { printTypeMode = "whatsmenu", ...payload } =
      JSON.parse(serializedPayload);
      
      if (printTypeMode === "html") {
        win.webContents.executeJavaScript(`
          const printBody = document.body
          if (${isGeneric}) {
            let link = document.getElementById('bootstrap-link')
            link.parentNode.removeChild(link)
          }
          printBody.innerHTML = ${JSON.stringify(payload.html)}
          `);
        }
          
    if(printTypeMode === 'whatsmenu') {
      try {
        payload.profile.options.print.width =
          paperSize !== 58 ? "302px" : "219px";
        payload.profile.options.print.textOnly = isGeneric;
        const { data } = await axios.post(
          "https://next.whatsmenu.com.br/api/printLayout",
          { ...payload, html: true, electron: true }
        );
        win.webContents.executeJavaScript(`
          const printBody = document.body
          printBody.innerHTML = ${JSON.stringify(
            data.reactComponentString[paperSize < 65 ? 58 : 80]
          )}
        `);
      } catch (error) {
        console.error(error);
      }
    }

    const printOptions: Electron.WebContentsPrintOptions = {
      deviceName: name,
      silent,
      margins,
      copies,
      scaleFactor,
    };
    win.webContents.addListener("did-finish-load", async () => {
      console.log(name, typeof paperSize);

      const height = Math.ceil(
        (await win.webContents.executeJavaScript(
          "document.body.offsetHeight"
        )) * 264.5833
      );
      setTimeout(() => {
        win.webContents.print(
          {
            ...printOptions,
            pageSize: {
              height: height < 4800000 ? height : 4800000,
              width: paperSize * 1000,
            },
          },
          (success, failureReason) => {
            console.log("Print Initiated in Main...");
            if (!success) console.error(failureReason);
          }
        );
      }, 2000);
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      win.webContents.loadURL(
        `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/print.html`
      );
    } else {
      win.webContents.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/print.html`
        )
      );
    }
  }

  return "shown print dialog";
});

ipcMain.on("storeProfile", (_, profile) => {
  store.set("configs.profile", profile);
});

ipcMain.on("getProfile", (event) => {
  const profile = getProfile();
  event.reply("onProfileChange", profile);
});

ipcMain.on("onCart", (_, cart: { id: number; client?: ClientType }) => {
  if (cart.client) {
    setCacheContactByWhatsapp(cart.client.whatsapp, {
      contact: cart.client.whatsapp,
      messageType: "welcome",
    });
  }
});

ipcMain.on("onVoucher", (_, voucher: VoucherType) => {
  const rememberDays = Math.floor(
    DateTime.fromISO(voucher.expirationDate).diff(
      DateTime.fromISO(voucher.created_at),
      "days"
    ).days / 2
  );

  if (!voucher.client?.vouchers?.some((v) => v.id === voucher.id)) {
    voucher.client.vouchers?.push(voucher);
  }

  storeVoucherToNotify({
    id: voucher.id,
    value: voucher.value,
    expirationDate: voucher.expirationDate,
    rememberDays,
    rememberDate: DateTime.fromISO(voucher.created_at)
      .plus({ days: rememberDays })
      .toISO(),
    afterPurchaseDate: DateTime.fromISO(voucher.created_at)
      .plus({ minutes: 20 })
      .toISO(),
    client: {
      whatsapp: voucher.client.whatsapp,
      name: voucher.client.name,
      vouchersTotal: voucher.client.vouchers?.reduce((total, voucher) => {
        (total += voucher.value), 0;
        return total || 0;
      }, 0),
    },
  });
});

ipcMain.on("removeVoucher", (_, voucher: VoucherType) => {
  deleteVoucherToNotify(voucher.id);
});

ipcMain.on("env", (event) => {
  event.returnValue = process.env;
});
