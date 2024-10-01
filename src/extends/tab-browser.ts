import { BaseWindowConstructorOptions, BrowserWindow } from "electron";
import { WebTabContentsView } from "./tab";
import { contextMenu } from "../main/menu";

type TabBrowserConstructorOptions = BaseWindowConstructorOptions & {
  tabs?: WebTabContentsView[];
};

export class TabBrowser extends BrowserWindow {
  tabs?: WebTabContentsView[];

  constructor({ tabs = [], ...options }: TabBrowserConstructorOptions) {
    super(options);
    this.tabs = tabs;

    for (const tab of this.tabs) {
      tab.setBounds({
        x: 0,
        y: 42,
        width: this.getBounds().width,
        height: this.getBounds().height - 42 - 48,
      });
      tab.webContents.on("context-menu", (event) => {
        event.preventDefault();
        contextMenu.popup();
      });
    }
  }

  /**
   * Retorna a guia atualmente visível da lista de guias.
   *
   * @return {WebTabContentsView | undefined} A guia atualmente visível, ou undefined se nenhuma guia estiver visível.
   */
  getCurrentTab(): WebTabContentsView | undefined {
    return this.tabs.find((tab) => tab.isVisible);
  }
}
