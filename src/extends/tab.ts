import { WebContentsView, WebContentsViewConstructorOptions } from "electron";

export class WebTabContentsView extends WebContentsView {
  id: string
  constructor({ id, ...config }: WebContentsViewConstructorOptions & { id: string }) {
    super(config)
    this.id = id
  }
}