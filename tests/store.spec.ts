import { describe, expect, it, vi, MockedFunction, beforeEach } from "vitest";
import {
  storeVoucherToNotify,
  getVoucherToNotifyList,
  store,
} from "../../whatsmenu-desktop/src/main/store";
import { VoucherNotification } from "../../whatsmenu-desktop/src/@types/store";

vi.mock("../../whatsmenu-desktop/src/main/store", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../whatsmenu-desktop/src/main/store")
  >();
  return {
    ...actual,
    getVoucherToNotifyList: vi.fn(),
    store: {
      set: vi.fn(),
    },
  };
});

describe("storeVoucherToNotify", () => {
  let mockPayload: VoucherNotification;
  let mockCurrentVouchers: VoucherNotification[];

  beforeEach(() => {
    mockPayload = {
      id: 1,
      value: 100,
      client: {
        name: "Cliente Teste",
        whatsapp: "123456789",
        vouchersTotal: 0,
      },
      afterPurchaseDate: "2023-07-01T00:00:00Z",
      rememberDate: "2023-07-02T00:00:00Z",
      rememberDays: 30,
      expirationDate: "2023-07-03T00:00:00Z",
    };

    mockCurrentVouchers = [
      {
        id: 2,
        value: 200,
        client: {
          name: "Cliente Exemplo",
          whatsapp: "987654321",
          vouchersTotal: 0,
        },
        afterPurchaseDate: "2023-07-05T00:00:00Z",
        rememberDate: "2023-07-06T00:00:00Z",
        rememberDays: 60,
        expirationDate: "2023-07-07T00:00:00Z",
      },
    ];

    (
      getVoucherToNotifyList as MockedFunction<typeof getVoucherToNotifyList>
    ).mockReturnValue(mockCurrentVouchers);
  });

  it("Deve adicionar um novo voucher se ele não existir", async () => {
    await storeVoucherToNotify(mockPayload);
    const expectedVouchers = [...mockCurrentVouchers, mockPayload];

    console.log("Expected vouchers:", expectedVouchers);
    console.log("Store set calls:", (store.set as vi.Mock).mock.calls);

    expect(store.set).toHaveBeenCalledWith(
      "configs.voucherToNotify",
      expectedVouchers
    );
  });

  it("Não deve adicionar o voucher se ele já existir", async () => {
    (
      getVoucherToNotifyList as MockedFunction<typeof getVoucherToNotifyList>
    ).mockReturnValueOnce([mockPayload]);

    await storeVoucherToNotify(mockPayload);

    expect(store.set).not.toHaveBeenCalled();
  });
});
