import { describe, expect, it, vi } from "vitest";
import { ProfileType } from "../src/@types/profile";
import { integration_api, whatsmenu_api_v3 } from "../src/lib/axios";
import { getMerchantApi } from "../src/services/ifood";

import profileMock from "./mocks/profile.mock.json";

const profile = profileMock as unknown as ProfileType;

describe("IFood Service", () => {
  describe("getMerchantApi", () => {
    const whatsmenu_api_v3_spy = vi.spyOn(whatsmenu_api_v3, "get");
    const integration_api_spy = vi.spyOn(integration_api, "get");
    it("Não deve ser possível buscar a loja ifood sem um perfil", async () => {
      try {
        await getMerchantApi({ profile: undefined as ProfileType });
      } catch (error) {
        expect(error).instanceOf(Error);
        expect(error).toHaveProperty("message", "Perfil não encontrado!");
      }
    });
    it("Deve ser possível buscar a loja ifood atribuida a um perfil", async () => {
      try {
        whatsmenu_api_v3_spy.mockResolvedValue({ data: {} });
        await getMerchantApi({ profile });
        expect(whatsmenu_api_v3_spy).toHaveBeenCalledWith(
          `/merchant?slug=${profile.slug}`
        );
      } catch (error) {
        throw error;
      }
    });
  });

  // it("não deve ser possível buscar o merchant", async () => {
  //   try {
  //     const spy = vi.spyOn(whatsmenu_api_v3, "post")
  //     await getMerchantApi();
  //   } catch (error) {
  //     expect(error).rejects.toThrow();
  //     throw error
  //   }
  // });

  // it("deve ser possível setar o merchant pelo store" , async () => {
  //   try {
  //     const spy = vi.spyOn(store, "set")
  //     await getMerchantApi();
  //     expect(spy).toHaveBeenCalled();
  //   } catch (error) {
  //     throw error
  //   }
  // })

  // it("deve ser possível fazer o polling", async () => {
  //   try {
  //     const spy = vi.spyOn(axios, "post")
  //     await polling();
  //     expect(spy).toHaveBeenCalled();
  //   } catch (error) {
  //     throw error
  //   }
  // })

  // it('Deve ser possível enviar dados do polling para a API', async () => {
  //   try {
  //     const spy = vi.spyOn(whatsmenu_api_v3, "post")
  //     await polling();
  //     expect(spy).toHaveBeenCalled();
  //   } catch (error) {
  //     throw error
  //   }
  // })

  // it("Deve ser possível fazer conhecimento dos dados do polling para o ifood", async () => {
  //   try {
  //     const spy = vi.spyOn(axios, "get")
  //     await polling();
  //     expect(spy).toHaveBeenCalled();
  //   } catch (error) {
  //     throw error
  //   }
  // })
});
