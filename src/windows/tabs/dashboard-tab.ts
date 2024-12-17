import { DateTime } from "luxon";
import path from "node:path";
import { WeekDayType } from "../../@types/week";
import { WebTabContentsView } from "../../extends/tab";
import { getMerchant, getProfile, store } from "../../main/store";
import { getMerchantApi, polling } from "../../services/ifood";
import { MerchantType } from "../../@types/merchant";
import { env } from "../../environments";

export const create_dashboard_tab = () => {
  const tab = new WebTabContentsView({
    id: "dashboard",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  let pollingInterval: NodeJS.Timeout | null = null;

  tab.webContents.on("did-finish-load", () => {
    const profile = getProfile()
    let merchant: MerchantType;
    let open = false;
    if (profile) {
      const day = DateTime.local().setZone(profile.timeZone).toISO();
      const today = DateTime.fromISO(day, { zone: profile.timeZone })
        .toFormat("EEEE")
        .toLowerCase();
      const convert = (text: string) => parseFloat(text.replace(":", "."));

      if (!profile.week[today]) {
        open = false;
      }
      const now = parseFloat(
        DateTime.local().setZone(profile.timeZone).toFormat("HH.mm"),
      );
      const filter = profile.week[today].filter(
        (d: WeekDayType) => now >= convert(d.open) && now <= convert(d.close),
      );

      if (filter.length) {
        open = true;
      }

      store.onDidAnyChange((newValue) => {
        const newProfile = newValue.configs.profile;
        if (newValue.configs.profile.options?.integrations?.ifood) {
          getMerchantApi({ profile: newProfile });
          merchant = getMerchant();
          if (open && merchant && newProfile.options.integrations.ifood.merchantId) {
            if (pollingInterval) {
              clearInterval(pollingInterval);
            }
            pollingInterval = setInterval(
              () => polling({ merchant, profile: newProfile }),
              30 * 1000,
            );
          }
        }
      });
    }
  });
  tab.webContents.loadURL(env.WM_DASHBOARD);

  return tab;
};
