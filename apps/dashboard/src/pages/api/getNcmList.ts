import { NextApiRequest, NextApiResponse } from "next";

export default async function getNcmList(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == 'GET') {
    const response = await fetch('https://brasilapi.com.br/api/ncm/v1')
    const data = await response.json()
    return res.json(data)
  }
}