import { NotePrint, NotePrintProps } from "@components/Modals/PrinterRequests/NotePrint";
import { Document, Page, StyleSheet, Text, renderToBuffer } from "@react-pdf/renderer";
import { NextApiRequest, NextApiResponse } from "next";

import Cart from "../../types/cart";
import Command from "../../types/command";
import Table from "../../types/table";

/** Layout text-only de impressão */
export default async function PrintLayout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { cart, profile, table, printType, command } = JSON.parse(req.body)

      profile.options.print.textOnly = false
      const props: NotePrintProps = { cart: new Cart(cart), profile: profile, table: table ? new Table(table) : table, command: command ? new Command(command) : command, printType, pdf: true,  }

      const pdfBuffer = await renderToBuffer(
        <Document>
          <Page style={{ transform: 'scale(0.65)', transformOrigin: 'left top' }}>
            <NotePrint {...props} />
          </Page>
        </Document>
      )

      res.setHeader('Content-Type', 'application/pdf');

      return res.send(pdfBuffer)

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