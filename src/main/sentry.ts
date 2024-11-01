import * as Sentry from "@sentry/electron/main";
import { ipcMain } from "electron";
import { ProfileType } from "../@types/profile";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Adicione seu DSN no arquivo .env
  tracesSampleRate: 1.0, // Configuração de amostragem de transações, ajuste conforme necessário
});

ipcMain.on("storeProfile", (_, profile: ProfileType) => {
  Sentry.setUser(profile);
});
