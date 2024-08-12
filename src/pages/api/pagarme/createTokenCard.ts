import { NextApiRequest, NextApiResponse } from "next";
import { apiRoute } from "../../../utils/wm-functions";

export default async function tokenizeCard(req: NextApiRequest, res: NextApiResponse) {
    const data = req.body;
    data.type = 'card';

    const { data: result } = await apiRoute('https://api.pagar.me/core/v5/tokens?appId=pk_test_ovA7rmxf4hg4p1KZ', null, 'POST', data, {
        accept: 'application/json', 'content-type': 'application/json'
    });

    return res.json(result)
}