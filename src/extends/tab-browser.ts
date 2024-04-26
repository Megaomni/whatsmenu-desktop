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

    for (const tab of this.tabs) {
      tab.setBounds({ x: 0, y: 42, width: this.getBounds().width, height: this.getBounds().height - 42 - 48 });
    }
  }

}
