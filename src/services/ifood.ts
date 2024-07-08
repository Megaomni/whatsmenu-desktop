import axios from "axios";
import { MerchantType } from "../@types/merchant";
import { ProfileType } from "../@types/profile";
import { integration_api, whatsmenu_api_v3 } from "../lib/axios";
import { store } from "../main/store";
import { io } from "../services/ws_integration";

let pollingData;

export const getMerchantApi = async ({
  profile,
}: {
  profile: ProfileType | null;
}) => {
  try {
    if (!profile) {
      throw new Error("Perfil não encontrado!");
    }
    const { data } = await whatsmenu_api_v3.get(
      `/merchant?slug=${profile.slug}`
    );
    store.set("configs.merchant", data);
  } catch (error) {
    throw error;
  }
};

export const polling = async ({
  merchant,
  profile,
}: {
  profile: ProfileType | null;
  merchant: MerchantType | null;
}) => {
  try {
    if (!profile) {
      throw new Error("Perfil não encontrado!");
    }
    if (!merchant) {
      throw new Error("Loja ifood não encontrada!");
    }
    const { data } = await axios.get(
      "https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS",
      {
        headers: {
          Authorization: `Bearer ${merchant.token}`,
          "x-polling-merchants": `${merchant.merchantId}`,
        },
      }
    );

    pollingData = data;
    if (pollingData.length > 0) {
      sendPollingDataApi(pollingData, profile.id, profile.slug);
      pollingAcknowledgment(pollingData, merchant);
    }
  } catch (error) {
    throw error;
  }
};

export const sendPollingDataApi = async (
  pollingData: [],
  id: number,
  slug: string
) => {
  try {
    let returnOrders;
    if (pollingData.length > 0) {
      returnOrders = await whatsmenu_api_v3.post("ifood/polling", {
        pollingData,
        id,
        slug,
      });
    }
    if (returnOrders) {
      io.to(`ifood:${slug}`).emit("newOrderIfood", returnOrders.data);
    }
  } catch (error) {
    throw error;
  }
};

export const pollingAcknowledgment = async (
  pollingData: [],
  merchant: MerchantType
) => {
  try {
    await axios.post(
      "https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment",
      pollingData,
      {
        headers: {
          Authorization: `Bearer ${merchant?.token}`,
        },
      }
    );
  } catch (error) {
    throw error;
  }
};
