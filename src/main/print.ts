import { BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import path from "path";

let printWindow: BrowserWindow = null;

/**
 * Abre uma janela modal para configuração de impressão.
 *
 * Se a janela de impressão já existir e não tiver sido destruída, foca nela.
 * Se a janela estiver minimizada, restaura-a. Caso contrário, cria uma nova
 * janela de impressão e a abre com o conteúdo da página de configuração
 * de impressão.
 *
 * @returns {BrowserWindow} A janela de impressão criada ou recuperada.
 */
export const printModal = () => {
    if (printWindow && !printWindow.isDestroyed()) {
        if (printWindow.isMinimized()) printWindow.restore();
        printWindow.focus();
        return printWindow;
    }

    printWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // isDev && printWindow.webContents.openDevTools();

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        printWindow.webContents.loadURL(
            `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/views/print-config.html`
        );
    } else {
        printWindow.webContents.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/src/views/print-config.html`
            )
        );
    }

    printWindow.on('closed', () => {
        printWindow = null;
    });

    return printWindow;
};