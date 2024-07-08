import { getMerchantApi, polling } from "../src/services/ifood";
import { whatsmenu_api_v3 } from "../src/lib/axios";
import { describe, expect, it, vi } from "vitest";
import { store } from "../src/main/store";
import axios from "axios";
import { ProfileType } from "src/@types/profile";



describe("ifood Service", () => {
  it("deve ser possível buscar o merchant", async () => {
    try {
      const spy = vi.spyOn(whatsmenu_api_v3, "get")
      await getMerchantApi({ slug: "pizzaria-do-meu-amor" } as ProfileType);
      expect(spy).toHaveBeenCalled();
    } catch (error) {
      throw error
    }
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
