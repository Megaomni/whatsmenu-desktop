import { describe, expect, it, vi } from "vitest";
import { ProfileType } from "../src/@types/profile";
import { MerchantType } from "../src/@types/merchant";
import { integration_api, whatsmenu_api_v3 } from "../src/lib/axios";
import { getMerchantApi, polling, pollingAcknowledgment } from "../src/services/ifood";

import profileMock from "./mocks/profile.mock.json";
import merchantMock from "./mocks/merchant.mock.json";
import axios from "axios";

const profile = profileMock as unknown as ProfileType;
const merchant = merchantMock as unknown as MerchantType;

describe("IFood Service", () => {
  const whatsmenu_api_v3_spy = vi.spyOn(whatsmenu_api_v3, "get");
  const integration_api_spy = vi.spyOn(integration_api, "get");
  const axios_get = vi.spyOn(axios, "get");
  const axios_post = vi.spyOn(axios, "post");

  describe("getMerchantApi", () => {

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

  describe("polling", () => {

    it('deve ser possível enviar dados do polling para o reconhecimento do ifood', async () => {
      try {
        axios_post.mockResolvedValue({ data: {} });
        await pollingAcknowledgment([], merchant);
        expect(axios_post).toHaveBeenLastCalledWith(
          `https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment`, 
          [],
          {
            headers: {
              Authorization: `Bearer ${merchant?.token}`
            }
          }
        )
      } catch (error) {
        throw error
      }
    })

  })

});
