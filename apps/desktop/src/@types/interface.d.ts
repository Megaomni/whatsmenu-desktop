import {
  DesktopApi,
  TabsApi,
  WhatsAppBotApi,
  WhatsMenuPrintApi,
  envPreload,
} from "../preload";

declare global {
  interface Window {
    isElectron: boolean;
    WhatsAppBotApi: typeof WhatsAppBotApi;
    WhatsMenuPrintApi: typeof WhatsMenuPrintApi;
    DesktopApi: typeof DesktopApi;
    TabsApi: typeof TabsApi;
    env: typeof envPreload;
  }
}
