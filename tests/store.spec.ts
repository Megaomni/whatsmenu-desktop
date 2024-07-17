import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import voucherToNotifyMock from "./mocks/voucherToNotify.json";
import { store, storeVoucherToNotify } from "../src/main/store";

describe.only("storeVoucherToNotify", () => {
  let getSpy: ReturnType<typeof vi.spyOn>;
  let setSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getSpy = vi.spyOn(store, "get");
    setSpy = vi.spyOn(store, "set");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("Deve adicionar um novo voucher se ele não existir", async () => {
    getSpy.mockReturnValue([]);
    storeVoucherToNotify(voucherToNotifyMock[0]);
    expect(setSpy).toHaveBeenCalledWith("configs.voucherToNotify", [
      voucherToNotifyMock[0],
    ]);
  });

  it("Não deve adicionar o voucher se ele já existir", async () => {
    getSpy.mockReturnValue([voucherToNotifyMock[0]]);
    storeVoucherToNotify(voucherToNotifyMock[0]);
    expect(setSpy).not.toHaveBeenCalled();
  });
});
