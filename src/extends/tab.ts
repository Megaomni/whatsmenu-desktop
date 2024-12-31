import { WebContentsView, WebContentsViewConstructorOptions } from "electron";
import { env } from "../environments";

export class WebTabContentsView extends WebContentsView {
  id: string;
  isVisible?: boolean;
  constructor({
    id,
    isVisible = true,
    ...config
  }: WebContentsViewConstructorOptions & { id: string; isVisible?: boolean }) {
    super(config);
    this.id = id;
    this.isVisible = isVisible;
  }

  needToLoad = true;

  setVisible(visible: boolean): void {
    super.setVisible(visible);
    this.isVisible = visible;
  }

  render(slug: string, tab: string) {
    if (this.isVisible && this.needToLoad) {
      this.webContents.loadURL(`${env.WM_STORE}/${slug}${tab}`);
      this.needToLoad = false;
    }
  }
}
