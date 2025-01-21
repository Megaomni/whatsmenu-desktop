import { BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import path from "path";

export const printModal = () => {
    const window = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    isDev && window.webContents.openDevTools();

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        window.webContents.loadURL(
            `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/print-config.html`
        );
    } else {
        window.webContents.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/print-config.html`
            )
        );
    }

    return window;
}
