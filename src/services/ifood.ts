import axios from "axios";
import { MerchantType } from "../@types/merchant";
import { ProfileType } from "../@types/profile";
import { integration_api, whatsmenu_api_v3 } from "../lib/axios";
import { store } from "../main/store";
import { io } from "../services/ws_integration";

let pollingData;

export const getMerchantApi = async ({ profile }: { profile: ProfileType }) => {
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
  profile: ProfileType;
  merchant: MerchantType;
}) => {
  try {
    const { data } = await integration_api.get(
      "https://merchant-api.ifood.com.br/events/v1.0/events:polling?groups=ORDER_STATUS",
      {
        headers: {
          Authorization: `Bearer ${merchant?.token}`,
          "x-polling-merchants": `${merchant?.merchantId}`,
        },
      }
    );

    pollingData = data;
    if (pollingData.length > 0) {
      sendPollingDataApi(pollingData, profile.id, profile.slug);
      pollingAcknowledgment(pollingData, merchant);
    }
  } catch (error) {
    if (error.response.status === 401) {
      console.log("DEU 401 TOKEN EXPIRADO");
      attToken(profile);
    }
    if (error.response) {
      console.error(
        "Server responded with status code:",
        error.response.status
      );
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error creating request:", error.message);
    }
    throw error;
  }
};

const sendPollingDataApi = async (
  pollingData: [],
  id: number,
  slug: string
) => {
  try {
    let returnOrders;
    console.log("vai enviar o polling pra API");
    console.log("PEDIDOS PARA POLLING", pollingData);
    if (pollingData.length > 0) {
      returnOrders = await whatsmenu_api_v3.post("ifood/polling", {
        pollingData,
        id,
        slug,
      });
    }
    if (returnOrders) {
      io.to(`ifood:${profile?.slug}`).emit("newOrderIfood", returnOrders.data);
    }
  } catch (error) {
    console.error("erro ao enviar dados do Polling para API integração", error);
  }
};

export const pollingAcknowledgment = async (pollingData: [], merchant: MerchantType) => {
  try {
    console.log("VAI FAZER O RECONHECIMENTO DO POLLING");
    const { data } = await axios.post(
      "https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment",
      pollingData,
      {
        headers: {
          Authorization: `Bearer ${merchant?.token}`,
        },
      }
    );
  } catch (error) {
    console.error("erro ao fazer o reconhecimento pelo ifood", error);
  }
};

export const attToken = async (profile: ProfileType) => {
  try {
    console.log("VAI GERAR UM NOVO TOKEN");

    const { data } = await integration_api.post("/ifood/refreshToken", {
      id: profile.id,
    });

    if (data) {
      console.log("GERADO TOKEN");
    } else {
      console.log("NÃO GEROU O TOKEN");
    }
  } catch (error) {
    if (error.response) {
      console.error(
        "Server responded with status code:",
        error.response.status
      );
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error creating request:", error.message);
    }
    throw error;
  }
  const { data } = await integration_api.post(
    "/ifood/refreshToken",
    profile.id
  );
  console.log("DATA DO ATT TOKEN", data);

  if (data) {
    console.log("GERADO TOKEN");
  } else {
    console.log("NÃO GEROU O TOKEN");
  }

  merchant.token = data.accessToken;
  merchant.refresh_token = data.refreshToken;

  store.set("configs.merchant", merchant);
};
