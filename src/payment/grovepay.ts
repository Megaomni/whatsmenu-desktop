import axios, { AxiosResponse } from "axios";
import { Session } from "next-auth"
import { apiRoute } from "../utils/wm-functions"
import GatewayStrategy, { RecipientInformation } from "./strategy/gateway-strategy";

export default class StrategyGrovepay implements GatewayStrategy {
    session: Session | null;
    headers: any;

    constructor(userSession: Session | null,) {
        this.session = userSession;
    }

    public async addRecipient(data: RecipientInformation) {
        return await apiRoute("/api/v2/business/grovepay/recipient", this.session, "POST", data);
    }

    public async getRecipient() {
        return await apiRoute("/api/v2/business/grovepay/recipient", this.session, "GET");
    }
}
