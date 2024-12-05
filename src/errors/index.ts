import * as Sentry from "@sentry/electron/main";

export class WhatsMenuDesktopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = super.name;
    Sentry.captureException(this);
  }
}
