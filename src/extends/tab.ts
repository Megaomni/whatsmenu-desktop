import { WebContentsView, WebContentsViewConstructorOptions } from "electron";

export class WebTabContentsView extends WebContentsView {
  id: string
  isVisible?: boolean
  constructor({ id, isVisible = true, ...config }: WebContentsViewConstructorOptions & { id: string, isVisible?: boolean }) {
    super(config)
    this.id = id
    this.isVisible = isVisible
  }

  setVisible(visible: boolean): void {
    super.setVisible(visible)
    this.isVisible = visible
  }
}