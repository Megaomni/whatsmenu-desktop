import { WebContentsView, WebContentsViewConstructorOptions } from "electron";

export class WebTabContentsView extends WebContentsView {
  id: string
  constructor({ id }: WebContentsViewConstructorOptions &{ id: string }) {
    super()
    this.id = id
  }
}