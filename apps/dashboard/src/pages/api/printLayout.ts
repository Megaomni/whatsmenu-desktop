import { NextApiRequest, NextApiResponse } from "next";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
// import { TextOnly, PropsType } from "../../components/Modals/PrinterRequests/TextOnly";
import { NotePrint, NotePrintProps } from "@components/Modals/PrinterRequests/NotePrint";
import Cart from "../../types/cart";
import Table from "../../types/table";
import Command from "../../types/command";
 
/** Layout text-only de impressão */
export default async function PrintLayout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { cart, profile, table, printType, command, html = false, electron = false} = req.body
      if (!electron) {
        profile.options.print.textOnly = true 
      }
      const props: Partial<NotePrintProps> = { cart: new Cart(cart), profile: profile, table: table ? new Table(table) : table, command: command ? new Command(command) : command, printType, electron }
      const layout58 = renderToString(createElement(NotePrint, { ...props, paperSize: 58 } as any))
      const layout80 = renderToString(createElement(NotePrint, { ...props, paperSize: 80 } as any))
      const reactComponentString: { [key: string]: string } = {
        58: html ? layout58 : layout58.replace(/<[^>]+>/g, '').replaceAll('\u00A0', ' ').match(/.{1,32}/gmu)?.join('\n') || '',
        80: html ? layout80 : layout80.replace(/<[^>]+>/g, '').replaceAll('\u00A0', ' ').match(/.{1,48}/gmu)?.join('\n') || '',
        requestId: cart.id
      }
      
      return res.json({ reactComponentString })
    } catch (error) {
      console.error(error);
      throw error
    }
  } else {
    res.redirect(303, '/api/printLayout')
    // res.json({})

    return res.status(405).json({ message: 'Method not Allowed' })
  }
}