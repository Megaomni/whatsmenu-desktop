import { BrowserWindow, app, ipcMain, shell } from "electron";
import { whatsAppService } from ".";
import { ClientType } from "../@types/client";
import axios from "axios";
import path from "node:path";
import {
  deleteVoucherToNotify,
  getMerchant,
  getProfile,
  setCacheContactByWhatsapp,
  store,
  storeNewUserToNotify,
} from "./store";
import { Printer } from "../@types/store";
import { DateTime } from "luxon";
import { VoucherType } from "../@types/voucher";
import { whatsmenu_api_v3 } from "../lib/axios";
import { vouchersToNotifyQueue } from "../lib/queue";
import { printTest } from "../services/printService";

ipcMain.on(
  "send-message",
  async (
    _,
    {
      contact,
      message,
    }: {
      contact: string;
      message: string;
    }
  ) => {
    try {
      await whatsAppService.sendMessageToContact(contact, { text: message });
    } catch (error) {
      console.error("error: ", error);
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

// ipcMain.on("print", async (_, serializedPayload) => {
//   const printers = store.get("configs.printing.printers") as Printer[];
//   for (const printer of printers) {
//     const isGeneric = printer.options.system_driverinfo
//       .toLowerCase()
//       .includes("generic");
//     console.log(isGeneric, "isGeneric");
//     const { margins, copies, silent, name, paperSize, scaleFactor } = printer;
//     const win = new BrowserWindow({ show: false });

//     const { printTypeMode = "whatsmenu", ...payload } =
//       JSON.parse(serializedPayload);

// if (printTypeMode === "html") {
//   win.webContents.executeJavaScript(`
//       const printBody = document.body
//       if (${isGeneric}) {
//         let link = document.getElementById('bootstrap-link')
//         link.parentNode.removeChild(link)
//       } else {
//         printBody.style.height = '1400px' 
//       }
//       printBody.innerHTML = ${JSON.stringify(payload.html)}
//     `);
// }
// if (printTypeMode === "whatsmenu") {
//   try {
//     payload.profile.options.print.width =
//       paperSize !== 58 ? "302px" : "219px";
//     payload.profile.options.print.textOnly = isGeneric;
//     const { data } = await axios.post(
//       "https://ifood.whatsmenu.com.br/api/printLayout",
//       { ...payload, html: true, electron: true }
//     );
//     win.webContents.executeJavaScript(`
//       const printBody = document.body
//       let link = document.getElementById('bootstrap-link')
//       link.parentNode.removeChild(link)
//       printBody.innerHTML = ${JSON.stringify(
//       data.reactComponentString[paperSize < 65 ? 58 : 80]
//     )}
//     `);
//   } catch (error) {
//     console.error(error);
//   }
// }

//     const printOptions: Electron.WebContentsPrintOptions = {
//       deviceName: name,
//       silent,
//       margins,
//       copies,
//       scaleFactor,
//     };
//     win.webContents.addListener("did-finish-load", async () => {
//       console.log(name, typeof paperSize);

//       const height = Math.ceil(
//         (await win.webContents.executeJavaScript(
//           "document.body.offsetHeight"
//         )) * 264.5833
//       );
//       setTimeout(() => {
//         win.webContents.print(
//           {
//             ...printOptions,
//             pageSize: {
//               height: height < 4800000 ? height : 4800000,
//               width: paperSize * 1000,
//             },
//           },
//           (success, failureReason) => {
//             console.log("Print Initiated in Main...");
//             if (!success) console.error(failureReason);
//           }
//         );
//       }, 2000);
//     });

//     if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
//       win.webContents.loadURL(
//         `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/print.html`
//       );
//     } else {
//       win.webContents.loadFile(
//         path.join(
//           __dirname,
//           `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/print.html`
//         )
//       );
//     }
//   }

//   return "shown print dialog";
// });

ipcMain.on("storeProfile", (_, profile, updateBot = false) => {
  const oldProfile = getProfile();
  if (!updateBot && oldProfile) {
    profile.options.bot.whatsapp = oldProfile.options.bot.whatsapp;
  }
  store.set("configs.profile", profile);
});

ipcMain.on("storeMerchant", (_, merchant) => {
  store.set("configs.merchant", merchant);
});

ipcMain.on("getProfile", (event) => {
  const profile = getProfile();
  event.reply("onProfileChange", profile);
});

export const getVouchersFromDB = async (): Promise<VoucherType[]> => {
  const profile = getProfile();
  const { data } = await whatsmenu_api_v3.get(
    `/vouchers/${profile.id}/getByStatus/avaliable`
  );
  if (data.vouchers) {
    return data.vouchers as VoucherType[];
  }
}

ipcMain.on("getMerchant", (event) => {
  const merchant = getMerchant();
  event.reply("onMerchantChange", merchant);
});

ipcMain.on("onCart", async (_, cart: { id: number; client?: ClientType }) => {
  await printTest(cart);

  if (cart.client) {
    setCacheContactByWhatsapp(cart.client.whatsapp, {
      contact: cart.client.whatsapp,
      messageType: "welcome",
    });
  }
});

ipcMain.on("onVoucher", async (_, voucher: VoucherType) => {
  const allVouchers = await getVouchersFromDB();
  const vouchersFromUser = allVouchers.filter(
    (vouch) => vouch.clientId === voucher.clientId
  );

  vouchersFromUser.forEach((vouchFromDB) => {
    const rememberDays = Math.floor(
      DateTime.fromISO(vouchFromDB.expirationDate).diff(
        DateTime.fromISO(vouchFromDB.created_at),
        "days"
      ).days / 2
    );

    if (!voucher.client?.vouchers?.some((v) => v.id === voucher.id)) {
      voucher.client.vouchers.push(voucher);
    }

    const expirationDate = DateTime.fromISO(vouchFromDB.expirationDate).toISO();
    const rememberValue = DateTime.fromISO(vouchFromDB.created_at)
      .plus({ days: rememberDays })
      .toISO();
    const afterValue = DateTime.fromISO(vouchFromDB.created_at)
      .plus({ minutes: 20 })
      .toISO();

    storeNewUserToNotify({
      whatsapp: voucher.client.whatsapp,
      name: voucher.client.name,
      vouchersTotal: voucher.client.vouchers
        ?.filter((voucher) => voucher.status === "avaliable")
        .reduce((total, voucher) => {
          (total += voucher.value), 0;
          return total || 0;
        }, 0),
      vouchers: [
        {
          id: vouchFromDB.id,
          value: vouchFromDB.value,
          expirationDate: expirationDate,
          rememberDays,
          rememberDate:
            DateTime.fromISO(rememberValue).diffNow(["minutes"]).minutes <= 0
              ? null
              : rememberValue,
          afterPurchaseDate:
            DateTime.fromISO(afterValue).diffNow(["minutes"]).minutes <= 0
              ? null
              : afterValue,
        },
      ],
      voucherTwoFactor: [
        {
          id: vouchFromDB.id,
          expirationDate: false,
          rememberDate: DateTime.fromISO(rememberValue).diffNow(["minutes"]).minutes <= 0,
          afterPurchaseDate: DateTime.fromISO(afterValue).diffNow(["minutes"]).minutes <= 0
        },
      ],
    });
  });
});

ipcMain.on("removeVoucher", (_, voucherOrId: VoucherType | number) => {
  deleteVoucherToNotify(voucherOrId);
});

ipcMain.on("env", (event) => {
  event.returnValue = process.env;
});

ipcMain.on("openLink", (_, url) => {
  shell.openExternal(url);
});
