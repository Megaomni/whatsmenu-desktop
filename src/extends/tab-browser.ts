import { BaseWindowConstructorOptions, BrowserWindow } from "electron";
import { WebTabContentsView } from "../extends/tab";

type TabBrowserConstructorOptions = BaseWindowConstructorOptions & {
  tabs?: WebTabContentsView[];
};

export class TabBrowser extends BrowserWindow {
  tabs?: WebTabContentsView[];

  constructor({ tabs = [], ...options }: TabBrowserConstructorOptions) {
    super(options);
    this.tabs = tabs;
    this.webContents.openDevTools = (options) => {
      console.log(options, 'aqui');
      
    }
  }

}
