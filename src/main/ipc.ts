import axios from "axios";
import { BrowserWindow, app, ipcMain, shell } from "electron";
import { DateTime } from "luxon";
import path from "node:path";
import { whatsAppService } from ".";
import { ClientType } from "../@types/client";
import { Printer } from "../@types/store";
import { VoucherType } from "../@types/voucher";
import { whatsmenu_api_v3 } from "../lib/axios";
import { PrintPayloadType, printService } from "../services/printService";
import {
  deleteVoucherToNotify,
  getCategories,
  getIsMultiplePrinters,
  getLegacyPrint,
  getMerchant,
  getPrinterLocations,
  getProfile,
  removePrinterLocation,
  setCacheContactByWhatsapp,
  setPrinterLocation,
  store,
  storeNewUserToNotify,
  updatePrinterLocation,
} from "./store";
import { PrintEnvironmentConfig } from "../react/types_print-environment";
import { PosPrinter } from "electron-pos-printer";

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

const CSS = `<head>
  <style>
    * {
      padding: 0;
      margin: 0;
      font-weight: bolder;
    }

    body {
      margin: 0;
    }

    .print-root {
      margin: 0;
    }

    *.text-only,
    *.title {
      display: inherit !important;
      white-space: normal !important;
    }

    *.formated.layout-80mm {
      font-size: 16pt;
    }
    *.formated.layout-58mm {
      width: 48mm;
    }

    *.formated {
      white-space: pre-wrap !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .formated.print-title {
      margin: 0 !important;
      text-align: center;
    }

    .formated.print-title.layout-58mm {
      white-space: normal !important;
      font-size: 16pt;
    }
    .formated.print-title.layout-80mm {
      white-space: normal !important;
      font-size: 16pt;
    }

    .formated.print-row div {
      display: flex;
      overflow: hidden;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .formated.print-row.layout-58mm div p.complement-space {
      padding-left: 4mm;
    }

    .formated.print-row.layout-58mm div p.transshipment-space {
      padding-left: 5mm;
    }

    .formated.print-row.layout-58mm div p.item-space {
      padding-left: 8mm;
    }

    .formated.print-row.layout-80mm div p.complement-space {
      padding-left: 13mm;
    }

    .formated.print-row.layout-80mm div p.transshipment-space {
      padding-left: 9mm;
    }

    .formated.print-row.layout-80mm div p.item-space {
      padding-left: 20mm;
    }
  </style>

  <link
    id="bootstrap-link"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
    rel="stylesheet"
    integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
    crossorigin="anonymous"
  />
  
  <script
    id="bootstrap-script"
    src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
    crossorigin="anonymous"
  ></script>
</head>`;

const payloadEnvSplit = (payload: PrintPayloadType, envId: number): string | PrintPayloadType => {
  const { cart } = payload;
  const environment = getPrinterLocations().find((env) => env.id === envId);
  if (!environment || environment.categories.length < 1) return "";
  if (environment.type === "fiscal") return payload;
  const storedCategories = getCategories();
  const allProductsFromCategories: number[] = [];

  environment.categories.map((category) => {
    const foundCategory = storedCategories.find((cat) => cat.name === category);
    if (foundCategory) {
      foundCategory.products.map((product) => {
        allProductsFromCategories.push(product.id);
      })
    }
  })

  const newCartItems = cart.itens.filter((item) => item.productId && allProductsFromCategories.includes(item.productId));

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
  const legacy = getLegacyPrint();
  const isEnvPrint = getIsMultiplePrinters();
  for (const printer of printers) {
    const isGeneric = printer.options.system_driverinfo
      .toLowerCase()
      .includes("generic");
    console.log(isGeneric, "isGeneric");
    const { margins, copies, silent, name, paperSize, scaleFactor } = printer;
    const win = new BrowserWindow({ show: false });

    const { printTypeMode = "whatsmenu", ...payload } =
      JSON.parse(serializedPayload);

    if (legacy || printTypeMode === "html") {
      if (printTypeMode === "html") {
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
      }
      if (printTypeMode === "whatsmenu") {
        if (isEnvPrint) {
          const locations = printer.options["printer-location"];
          if (locations.length < 1) return;
          locations.map(async (envId) => {
            const envPayload = payloadEnvSplit(payload, envId);
            if (typeof envPayload === "string") return;
            try {
              envPayload.profile.options.print.width =
                paperSize !== 58 ? "302px" : "219px";
              envPayload.profile.options.print.textOnly = isGeneric;
              const { data } = await axios.post(
                "https://ifood.whatsmenu.com.br/api/printLayout",
                { ...envPayload, html: true, electron: true }
              );
              win.webContents.executeJavaScript(`
                const printBody = document.body
                let link = document.getElementById('bootstrap-link')
                link.parentNode.removeChild(link)
                printBody.innerHTML = ${JSON.stringify(
                data.reactComponentString[paperSize < 65 ? 58 : 80]
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
          })
        } else {
          try {
            payload.profile.options.print.width =
              paperSize !== 58 ? "302px" : "219px";
            payload.profile.options.print.textOnly = isGeneric;
            const { data } = await axios.post(
              "https://ifood.whatsmenu.com.br/api/printLayout",
              { ...payload, html: true, electron: true }
            );
            win.webContents.executeJavaScript(`
              const printBody = document.body
              let link = document.getElementById('bootstrap-link')
              link.parentNode.removeChild(link)
              printBody.innerHTML = ${JSON.stringify(
              data.reactComponentString[paperSize < 65 ? 58 : 80]
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
      }
    }

    if (!legacy && printTypeMode === "whatsmenu") {
      const printOptions: Electron.WebContentsPrintOptions = {
        deviceName: name,
        silent,
        margins,
        copies,
        scaleFactor,
      };

      if (isEnvPrint) {
        try {
          const locations = printer.options["printer-location"];
          if (locations.length < 1) return;
          locations.map(async (envId) => {
            const envPayload = payloadEnvSplit(payload, envId);
            if (typeof envPayload === "string") return;
            const { data } = await axios.post(
              "https://ifood.whatsmenu.com.br/api/printLayout",
              { ...envPayload, html: true, electron: true }
            );


            await PosPrinter.print([
              {
                type: "text",
                value: `${CSS}
                ${data.reactComponentString[80]}`,
                style: {
                  fontWeight: "bold",
                  fontSize: "15px",
                  marginLeft: `${margins.left}px`,
                  marginRight: `${margins.right}px`,
                  marginTop: `${margins.top}px`,
                  marginBottom: `${margins.bottom}px`,
                  fontFamily: "monospace",
                }
              }
            ], {
              printerName: printOptions.deviceName,
              preview: false,
              silent: printOptions.silent,
              pageSize: paperSize > 59 ? "80mm" : "58mm",
              margin: '0 0 0 0',
              boolean: undefined
            }).catch((error) =>
              console.error("Erro na impressão:", error)
            );
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        try {
          const { data } = await axios.post(
            "https://ifood.whatsmenu.com.br/api/printLayout",
            { ...payload, html: true, electron: true }
          );


          await PosPrinter.print([
            {
              type: "text",
              value: data.reactComponentString[58],
              style: {
                fontWeight: "bold",
                fontSize: "15px",
                marginLeft: `${margins.left}px`,
                marginRight: `${margins.right}px`,
                marginTop: `${margins.top}px`,
                marginBottom: `${margins.bottom}px`,
                fontFamily: "monospace",
              }
            }
          ], {
            printerName: printOptions.deviceName,
            preview: false,
            silent: printOptions.silent,
            pageSize: paperSize > 59 ? "80mm" : "58mm",
            margin: '0 0 0 0',
            boolean: undefined
          }).catch((error) =>
            console.error("Erro na impressão:", error)
          );

        } catch (error) {
          console.error(error);
        }
      }





      // const printOptions: Electron.WebContentsPrintOptions = {
      //   deviceName: name,
      //   silent,
      //   margins,
      //   copies,
      //   scaleFactor,
      // };

      // if (isEnvPrint) {
      //   const locations = printer.options["printer-location"];
      //   if (locations.length < 1) return;
      //   locations.map(async (envId) => {
      //     const envPayload = payloadEnvSplit(payload, envId);
      //     if (typeof envPayload === "string") return;
      //     await printService(envPayload, printOptions, paperSize, isGeneric);
      //   });
      // } else {
      //   try {
      //     await printService(payload, printOptions, paperSize, isGeneric);
      //   } catch (error) {
      //     console.error(error);
      //   }
      // }
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

export const getVouchersFromDB = async (): Promise<VoucherType[]> => {
  const profile = getProfile();
  const { data } = await whatsmenu_api_v3.get(
    `/vouchers/${profile.id}/getByStatus/avaliable`
  );
  if (data.vouchers) {
    return data.vouchers as VoucherType[];
  }
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
