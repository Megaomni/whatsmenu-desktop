import Queue from "queue";

export const vouchersToNotifyQueue = new Queue({
  concurrency: 1,
  autostart: true,
});
