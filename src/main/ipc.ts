import { BrowserWindow, app, ipcMain, shell } from "electron";
import { DateTime } from "luxon";
import path from "node:path";
import { whatsAppService } from ".";
import { ClientType } from "../@types/client";
import { Printer } from "../@types/store";
import { VoucherType } from "../@types/voucher";
import { whatsmenu_api_v3 } from "../lib/axios";
import {
  PrintPayloadType,
  // printService
} from "../services/printService";
import {
  deleteVoucherToNotify,
  getCategories,
  getMerchant,
  getPrinterLocations,
  getPrinters,
  getProfile,
  removePrinterLocation,
  setCacheContactByWhatsapp,
  setPrinterLocation,
  store,
  storeNewUserToNotify,
  updatePrinter,
  updatePrinterLocation,
} from "./store";
import { PrintEnvironmentConfig } from "../react/types_print-environment";
// import { PosPrinter } from "electron-pos-printer";
import { printToString, NotePrint, ProductionPrint } from "../../packages/print-component";
import Cart from "../../packages/entities/cart";
import Profile from "../../packages/entities/profile";
import Table from "../../packages/entities/table";
import Command from "../../packages/entities/command";

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

const payloadEnvSplit = (payload: PrintPayloadType, envId: number): string | PrintPayloadType => {
  const { cart, table, command, printType } = payload;

  const environment = getPrinterLocations().find((env) => env.id === envId);

  if (environment.type === "fiscal") {
    if (printType === "command" && command.carts.some((cart) => cart.print !== 0)) {
      return payload;
    }

    if (printType === "table" && table.opened.commands[0].carts.some((cart) => cart.print !== 0)) {
      return payload;
    }
  }

  if (
    !environment ||
    (environment.type === "production" && environment.categories.length < 1) ||
    (environment.type === "production" && cart.print !== 0) ||
    (environment.type === "production" && printType) ||
    (environment.type === "fiscal" && cart.type === "T" && cart.print === 0)
  ) {
    return ""
  }

  if (environment.type === "fiscal" || cart.print !== 0) {
    return payload
  }

  const storedCategories = getCategories();
  const allProductsFromCategories: number[] = [];

  environment.categories.map((category) => {
    const foundCategory = storedCategories.find((cat) => cat.id === category.id);
    if (foundCategory) {
      foundCategory.products.map((product) => {
        allProductsFromCategories.push(product.id);
      })
      if (foundCategory.pizzaProduct) {
        allProductsFromCategories.push(foundCategory.pizzaProduct.id);
      }
    }
  })

  const newProducts = cart.itens.filter((item) => item.productId && allProductsFromCategories.includes(item.productId));
  const newPizzas = cart.itens.filter((item) => item.pizzaId && allProductsFromCategories.includes(item.pizzaId));
  const newCartItems = [...newProducts, ...newPizzas];

  if (newCartItems.length < 1) {
    return ""
  }

  return {
    ...payload,
    cart: {
      ...cart,
      itens: newCartItems
    }
  }
};

ipcMain.on("print", async (_, serializedPayload) => {
  const printers = store.get("configs.printing.printers") as Printer[];
  for (const printer of printers) {
    const isGeneric = printer.options.system_driverinfo
      .toLowerCase()
      .includes("generic");
    console.log(isGeneric, "isGeneric");
    const { margins, copies, silent, name, paperSize, scaleFactor } = printer;

    const win = new BrowserWindow({ show: false });

    const { printTypeMode = "whatsmenu", ...payload } =
      JSON.parse(serializedPayload);

    if (printTypeMode === "html") {
      const fiscalEnvironments = getPrinterLocations().filter(
        (location) => location.type === "fiscal"
      )

      const isFiscal = fiscalEnvironments.some((env) =>
        printer.options["printer-location"].some((loc) => loc === env.id)
      );

      if (!isFiscal) continue;

      win.webContents.executeJavaScript(`
          const printBody = document.body
          if (${isGeneric}) {
            let link = document.getElementById('bootstrap-link')
            link.parentNode.removeChild(link)
          } else {
            printBody.style.height = '1400px' 
          }
          printBody.innerHTML = ${JSON.stringify(payload.html)}
        `);

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

    if (printTypeMode === "whatsmenu") {
      for (const envId of printer.options["printer-location"]) {
        const window = new BrowserWindow({ show: false });
        const foundLocation = getPrinterLocations().find(
          (location) => location.id === envId
        )
        if (!foundLocation) continue;

        const envPayload = payloadEnvSplit(payload, envId);

        if (typeof envPayload === "string") continue;

        try {
          envPayload.profile.options.print.width =
            paperSize !== 58 ? "302px" : "219px";
          envPayload.profile.options.print.textOnly = isGeneric;
          const data = printToString(
            foundLocation.type === "production" ? ProductionPrint : NotePrint,
            {
              cart: new Cart(envPayload.cart as any),
              profile: new Profile(envPayload.profile as any),
              printType: envPayload.printType,
              table: envPayload.table ? new Table(envPayload.table as any) : undefined,
              command: envPayload.command ? new Command(envPayload.command as any) : undefined,
              electron: true,
              html: true,
              motoboys: []
            }
          )

          window.webContents.executeJavaScript(`
                const printBody = document.body
                let link = document.getElementById('bootstrap-link')
                link.parentNode.removeChild(link)
                printBody.innerHTML = ${JSON.stringify(
            data[paperSize < 65 ? 58 : 80]
          )}
            `);
        } catch (error) {
          console.error(error);
        }

        const printOptions: Electron.WebContentsPrintOptions = {
          deviceName: name,
          silent,
          margins,
          copies,
          scaleFactor,
        };
        window.webContents.addListener("did-finish-load", async () => {
          console.log(name, typeof paperSize);

          const height = Math.ceil(
            (await window.webContents.executeJavaScript(
              "document.body.offsetHeight"
            )) * 264.5833
          );
          setTimeout(() => {
            window.webContents.print(
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
          window.webContents.loadURL(
            `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/print.html`
          );
        } else {
          window.webContents.loadFile(
            path.join(
              __dirname,
              `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/print.html`
            )
          );
        }
      }
    }
  }

  return "shown print dialog";
});

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

ipcMain.on("getMerchant", (event) => {
  const merchant = getMerchant();
  event.reply("onMerchantChange", merchant);
});

ipcMain.on("getProfile", (event) => {
  const profile = getProfile();
  event.reply("onProfileChange", profile);
});

ipcMain.on("getCategories", (event) => {
  const categories = getCategories();
  event.reply("onCategoriesChange", categories);
});

ipcMain.on("getPrinterLocations", (event) => {
  const printerLocations = getPrinterLocations();
  event.reply("onPrinterLocationsChange", printerLocations);
});

ipcMain.on("getAllPrinters", (event) => {
  const allPrinters = getPrinters();
  event.reply("onPrinterChange", allPrinters);
});

export const getVouchersFromDB = async (id?: number): Promise<VoucherType[]> => {
  const profile = getProfile();
  if (!id) {
    const { data } = await whatsmenu_api_v3.get(
      `/vouchers/${profile.id}/getByStatus/avaliable`
    );
    if (data.vouchers) {
      return data.vouchers as VoucherType[];
    }
  }

  if (id) {
    const { data } = await whatsmenu_api_v3.get(
      `/vouchers/${profile.id}/getByStatus/avaliable/${id}`
    );
    if (data.vouchers) {
      return data.vouchers as VoucherType[];
    }
  }
  return [];
}

ipcMain.on("onCart", async (_, cart: { id: number; client?: ClientType }) => {
  if (cart.client) {
    setCacheContactByWhatsapp(cart.client.whatsapp, {
      contact: cart.client.whatsapp,
      messageType: "welcome",
    });
  }
});

ipcMain.on("onSubmitPrint", async (_, location: PrintEnvironmentConfig) => {
  setPrinterLocation(location);
});

ipcMain.on("onRemovePrint", async (_, id: number) => {
  removePrinterLocation(id);
});

ipcMain.on("onUpdatePrint", async (_, location: PrintEnvironmentConfig) => {
  updatePrinterLocation(location);
});

ipcMain.on("onUpdatePrinter", async (_, printer: Partial<Printer>) => {
  updatePrinter(printer);
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
