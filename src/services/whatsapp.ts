<<<<<<< HEAD
// import { Notification } from "electron";
// import isDev from "electron-is-dev";
import { whatsAppService } from "../main";
import {
  deleteVoucherToNotify,
  // findCacheContact,
  getProfile,
  getVoucherToNotifyList,
  // removeDuplicateUsers,
  // removeDuplicateVouchers,
  // store,
  updateVoucherToNotify,
} from "./../main/store";

// import { EventEmitter } from "node:events";
=======
import { whatsAppService } from "../main";
import {
  deleteVoucherToNotify,
  fetchVouchers,
  getProfile,
  getVoucherToNotifyList,
  updateTwoFactor,
  updateVoucherToNotify,
} from "./../main/store";
>>>>>>> 4d7d347a0b72a595a8a67b9bdca86dc5cef66099
import { ClientType } from "../@types/client";

import { DateTime } from "luxon";
import { VoucherNotification } from "../@types/store";
import { vouchersToNotifyQueue } from "../lib/queue";
import { botMessages } from "../utils/bot-messages";
import { formatDDIBotMessage } from "../utils/ddi-bot-message";

export class WhatsApp {
  messagesQueue: Array<{
    contact: string;
    message: string;
    client?: ClientType;
  }> = [];
<<<<<<< HEAD
=======

>>>>>>> 4d7d347a0b72a595a8a67b9bdca86dc5cef66099

  async sendQueuedmessages() {
    setTimeout(async () => {
      for (const messageQueued of this.messagesQueue) {
        const { contact, message } = messageQueued;
        const [{ jid }] = await whatsAppService.checkNumber(contact);

        if (jid === "Número não está no whatsapp") {
          return;
        }

        try {
          setTimeout(() => {
            whatsAppService.sendMessageToContact(jid, { text: message });
          }, 1000);
        } catch (error) {
          console.error(error);
        }
        this.messagesQueue.slice(this.messagesQueue.indexOf(messageQueued), 1);
      }
    }, 5 * 1000);
  }

  async cashbackCron() {
    const removeExpiredVouchers = async () => {
      getVoucherToNotifyList().forEach((user) => {
        user.vouchers.filter(
          (voucher) =>
            voucher.expirationDate === null
        ).forEach((voucher) => deleteVoucherToNotify(voucher.id));
      })
    };

    const cronLoop = async (messageType: keyof typeof botMessages.cashback) => {
      const profile = getProfile();
      const vouchersFromAllUsers = getVoucherToNotifyList();
      const language = profile.options.locale.language;

      let list: VoucherNotification[] = [];
      switch (messageType) {
        case "afterPurchase":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.afterPurchaseDate !== null &&
                DateTime.fromISO(voucher.afterPurchaseDate).diffNow(["minutes"])
                  .minutes <= 0
              )
          );
          break;
        case "remember":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.rememberDate !== null &&
                DateTime.fromISO(voucher.rememberDate).diffNow(["days"])
                  .days <= 0
              )
          );
          break;
        case "expiration":
          list = vouchersFromAllUsers.filter(
            (user) =>
              user.vouchers.some((voucher) =>
                voucher.expirationDate !== null &&
                DateTime.fromISO(voucher.expirationDate).diffNow(["days"])
                  .days <= 0
              )
          );
          break;
        default:
          break;
      }

      for await (const user of list) {
        const { ddi } = formatDDIBotMessage({ language });
        const [{ jid }] = await whatsAppService.checkNumber(`${ddi}${user.whatsapp}`);
        const voucher = user.vouchers.find((v) => v[`${messageType}Date`] <= DateTime.local().toISO());
        const voucherFactor = user.voucherTwoFactor.find((v) => v.id === voucher?.id);
        let messageSent = false;

        if (
          voucher[`${messageType}Date`] === null ||
          voucherFactor[`${messageType}Date`] === true ||
          jid === "Número não está no whatsapp"
        ) {
          return;
        } else {
          await whatsAppService.sendMessageToContact(
            jid,
            { text: botMessages.cashback[messageType]({ user, voucher, profile }) }
          );
          messageSent = true;
          switch (messageType) {
            case "afterPurchase":
              updateVoucherToNotify(voucher.id, {
                afterPurchaseDate: null,
              });
              break;
            case "remember":
              updateVoucherToNotify(voucher.id, {
                rememberDate: null
              });
              break;
            case "expiration":
              updateVoucherToNotify(voucher.id, {
                expirationDate: null
              });
              break;
            default:
              break;
          }
          if (messageSent) {
            updateTwoFactor(voucher.id, {
              [`${messageType}Date`]: true
            });
          }
        }
      }
    };

    let isProcessing = false;

    setInterval(async () => {
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      try {
        vouchersToNotifyQueue.push(async () => {
          await removeExpiredVouchers();
          await cronLoop("afterPurchase");
          await cronLoop("remember");
          await cronLoop("expiration");
        });
      } catch (error) {
        console.error(error);
      } finally {
        isProcessing = false;
      }
    }, 1000 * 60);
    return;
  }
}
