import { describe, it, vi, expect } from "vitest";
import * as storeModule from "../../whatsmenu-desktop/src/main/store";
import voucherToNotifyMock from "./mocks/voucherToNotify.json";

describe.only("storeVoucherToNotify", () => {
  it.only("Deve adicionar um novo voucher se ele não existir", async () => {
    const mock = vi
      .spyOn(storeModule, "getVoucherToNotifyList")
      .mockReturnValue([]);

    storeModule.storeVoucherToNotify(voucherToNotifyMock[0]);
  });

  // it("Não deve adicionar o voucher se ele já existir", async () => {
  //   (
  //     getVoucherToNotifyList as MockedFunction<typeof getVoucherToNotifyList>
  //   ).mockReturnValueOnce([mockPayload]);

  //   await storeVoucherToNotify(mockPayload);

  //   expect(store.set).not.toHaveBeenCalled();
  // });
});
