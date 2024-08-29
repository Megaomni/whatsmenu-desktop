import { AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";
import { BsFilePdf } from "react-icons/bs";
import Stripe from "stripe";
import { Title } from "../../../components/Partials/title";
import { PaymentCard } from "../../../components/Profile/StepCard";
import { AppContext } from "../../../context/app.ctx";
import { stripe } from "../../../payment/stripe";
import { SystemProduct } from "../../../types/plan";
import { Plan } from "../../../types/plan";
import { apiRoute, currency } from "../../../utils/wm-functions";

export interface InvoicesProps {
  data: {
    dayDue: number;
    due: string;
    invoices: Invoice[];
    invoiceOpened: Invoice[] | null;
    invoicesAddons: Invoice[];
  };
  systemProducts: SystemProduct[]
}

export interface Invoice {
  id: number;
  userId: number;
  status: string;
  pdf: string | null;
  type: string;
  expiration: string;
  installments?: number;
  value: number;
  itens: Item[] | string[];
  created_at: string;
  updated_at: string;
  requests: any[];
}

export interface Item {
  id: number;
  name: string;
  service: string;
  plan_id?: number;
  category?: string;
  price_id: string;
  value: number;
  quantity: number;
  quantityDiscount: number
}

export default function Invoices({
  data: { dayDue, due, invoices, invoiceOpened, invoicesAddons },
  systemProducts,
}: InvoicesProps) {
  const { data: session } = useSession();
  const { invoicePending, plans, user } = useContext(AppContext);
  const [allInvoicesPending, setAllInvoicesPending] = useState<Invoice[]>([]);
  const handleTranslateStatus = (invoice: Invoice) => {
    let translate;
    switch (invoice.status) {
      case "paid":
      case "completed":
        translate = "Pago";
        break;

      case "canceled":
        if (invoice.type === 'addon') {
          translate = "Cancelado"
          break;
        }

      case "pending":
        translate = "Pendente";
        break;

      case "refunded":
        translate = "Estornado";
        break;

      case "processing":
        translate = "Em Analise";
        break;

      case "reserved":
        translate = "Aguardando Confirmação";
        break;
    }
    return translate;
  };

  useEffect(() => {
    const invoicesPending = invoices?.filter(inv => inv.status === 'pending') ?? [];
    const invoicesOpenedPending = invoiceOpened?.filter(inv => inv.status === 'pending') ?? [];
    const invoicesAddonsPending = invoicesAddons?.filter(inv => inv.status === 'pending') ?? [];
    setAllInvoicesPending([...invoicesPending, ...invoicesOpenedPending, ...invoicesAddonsPending]);

  }, [invoices, invoiceOpened, invoicesAddons]);

  return <>
    {
      user?.controls?.disableInvoice && user?.controls?.paymentInfo?.gateway ?
        <PaymentCard invoices={allInvoicesPending ?? []} systemProducts={systemProducts} plans={plans} />
        :
        <>
          <Title title="Faturas" componentTitle="Faturas" className="mb-4" />
          <h3>
            Sua Mensalidade vence todo dia{" "}
            <span className="text-red-500">{dayDue}</span> de cada mês
          </h3>
          <Card>
            <Card.Header>
              <h4>Faturas em Aberto</h4>
            </Card.Header>
            <Card.Body>
              {invoiceOpened ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Serviços</th>
                      <th>Status</th>
                      <th className="col-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOpened?.map((invoice: Invoice, index) => {
                      return invoice.value ? (
                        <tr key={invoice.id}>
                          <td>
                            {DateTime.fromISO(invoice.expiration).toFormat(
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td>{currency({ value: invoice.value, currency: user?.controls?.currency })}</td>
                          <td>
                            {invoice.itens
                              ?.map(
                                (item) => {


                                  if (typeof item !== "string") {

                                    return <>{`${item.name} - ${currency({ value: Number(item.value), currency: user?.controls?.currency })}`}<br /></>
                                  } else {
                                    const regex = /([a-zA-Z]+)(\W+)(\d+.\d+)/
                                    const possiblePrice = regex.exec(item)
                                    if (possiblePrice) {
                                      const price = possiblePrice.find((item: any) => !isNaN(item));
                                      return `${invoice.type !== "addon" ? "Plano " : ""}${price} - ${currency({ value: Number(price), currency: user?.controls?.currency })}`
                                    }
                                  }
                                }
                              )}
                          </td>
                          <td>{handleTranslateStatus(invoice)}</td>
                          {(invoice.status === "pending" || invoice.status === "canceled")
                            ? (
                              <td>
                                <Button
                                  as="a"
                                  href={
                                    invoicePending?.invoice?.invoiceId === invoice.id
                                      ? invoicePending?.invoice?.paghiper[0]?.create_request?.bank_slip?.url_slip
                                      : ""
                                  }
                                  target="_blank"
                                >
                                  Gerar Boleto
                                </Button>
                              </td>
                            ) : null}
                        </tr>
                      ) : null;
                    })}
                    {invoicesAddons?.map((invoice: Invoice, index) =>
                      invoice.value ? (
                        <tr key={invoice.id}>
                          <td>
                            {DateTime.fromISO(invoice.expiration).toFormat(
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td>{currency({ value: invoice.value, currency: user?.controls?.currency })}</td>
                          <td>
                            {invoice.itens
                              ?.map(
                                (item) =>
                                  `${invoice.type !== "addon" ? "Plano " : ""}${typeof item === "string" ? item : item.name
                                  }`
                              )
                              .join(", ")}
                          </td>
                          <td>{handleTranslateStatus(invoice)}</td>
                          <td>
                            {invoice.status === "pending" ? (
                              <Button
                                as="a"
                                href={
                                  invoice.requests[0]?.paghiper && invoice.requests[0]?.paghiper[0].create_request
                                    .bank_slip.url_slip
                                }
                                target="_blank"
                              >
                                Gerar Boleto
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </Table>
              ) : (
                <h2 className="text-center">
                  Não há faturas em aberto no momento.
                </h2>
              )}
            </Card.Body>
          </Card>
        </>
    }
    <Card>
      <Card.Header>
        <h4>Histórico de Faturas Pagas</h4>
      </Card.Header>
      <Card.Body>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Pagamento</th>
              <th>Valor</th>
              <th>Serviços</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  {DateTime.fromISO(invoice.expiration).toFormat(
                    "dd/MM/yyyy"
                  )}
                </td>
                <td>
                  {DateTime.fromSQL(invoice.updated_at).toFormat(
                    "dd/MM/yyyy"
                  )}
                </td>
                <td>{currency({ value: invoice.value, currency: user?.controls?.currency })}</td>
                <td className="text-wrap">
                  {invoice.itens?.map(
                    (item: any) =>
                      `${typeof item === "string" ? item : item.name
                      }`
                  )
                    .join(", ")}
                </td>
                <td>
                  <Button variant={`${invoice.status === "paid" && !user?.controls?.disableInvoice ? "outline-primary" : "primary"}`}
                    onClick={() => {
                      if (invoice.pdf && user?.controls?.disableInvoice) {
                        window.open(invoice.pdf)
                      }
                    }}
                  >
                    {invoice.status === "paid" && invoice.pdf && user?.controls?.disableInvoice && <BsFilePdf title="Visualizar PDF" />}
                    {handleTranslateStatus(invoice)}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  </>;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const session = await getSession({ req });
    const { data } = await apiRoute("/dashboard/invoices/list", session);
    const { data: systemProducts } = await apiRoute("/api/v2/systemProducts", session) as AxiosResponse<Array<SystemProduct>>;
    
    return {
      props: {
        systemProducts,
        data
      },
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};
