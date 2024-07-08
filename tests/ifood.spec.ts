import { getMerchantApi } from "../src/services/ifood";
import { whatsmenu_api_v3 } from "../src/lib/axios";
import { describe, expect, it, vi } from "vitest";



describe("ifood Service", () => {
  it("deve ser possível buscar o merchant", async () => {
    try {
      const spy = vi.spyOn(whatsmenu_api_v3, "get")
      await getMerchantApi();
      expect(spy).toHaveBeenCalled();
    } catch (error) {
      console.log(error)
    }
  });
});
