import React, { Fragment, useContext, useEffect, useState } from 'react'
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Table,
  Badge,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Title } from '../../../components/Partials/title'
import { groveNfeApi } from 'src/lib/axios'
import { AppContext } from '@context/app.ctx'
import { DateTime } from 'luxon'

interface InvoicesProps {}
export default function InvoicesGroveNFe({}: InvoicesProps) {
  const { t } = useTranslation()
  const { profile, currency } = useContext(AppContext)
  const [invoices, setInvoices] = useState<any[]>([])
  useEffect(() => {
    if (profile && profile.options.integrations.grovenfe) {
      groveNfeApi
        .get(
          `/v1/invoices/list/${profile.options.integrations.grovenfe.company_id}`
        )
        .then((response) => {
          const invoices = response.data.invoices.reverse()
          setInvoices(response.data.invoices)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }, [profile])
  console.log(invoices)
  return (
    <>
      <Container className="p-1">
        <Title
          title="Faturas NFe"
          componentTitle="Faturas NFe"
          className="text-color-1 titlegrovenfecolor mb-3"
        />
        {/* Seção de Plano Atual */}
        <Row className="">
          <Col>
            <Card className="">
              <Card.Header
                className="d-flex align-items-center justify-content-center gap-3"
                style={{
                  backgroundColor: '#126DFC',
                  color: 'white',
                }}
              >
                <h2 className="font-weight-bold fs-4">Plano Atual:</h2>
                <span className="font-weight-bold">
                  {profile.options.integrations.grovenfe.plan.name}
                </span>
                <Button variant="link" className="fw-bold btn-sm text-white">
                  Mudar
                </Button>
              </Card.Header>
              <Card.Body
                className="align-items-center text-nowrap"
                style={{ backgroundColor: '#E6E6E6' }}
              >
                <Row className="text-md-center">
                  <Col lg className="">
                    <span style={{ color: '#126DFC' }} className="fw-bold">
                      Vencimento:
                    </span>
                    <span className="fw-bold ms-2">
                      {DateTime.fromISO(invoices[0]?.expiration_date).toFormat(
                        'dd/MM/yyyy'
                      )}
                    </span>
                  </Col>
                  <Col lg className="">
                    <span style={{ color: '#126DFC' }} className="fw-bold">
                      Valor:
                    </span>
                    <span className="fw-bold ms-2">
                      {currency({ value: invoices[0]?.value })}
                    </span>
                  </Col>
                  <Col lg className="">
                    <span style={{ color: '#126DFC' }} className="fw-bold">
                      Adicionais:
                    </span>
                    <span className="fw-bold ms-2">R$0,00</span>
                  </Col>
                  {/* <Col lg className="align-items-center">
                    <span style={{ color: '#126DFC' }} className="fw-bold">
                      Forma de Pag.:
                    </span>
                    <span className="fw-bold ms-2">
                      Boleto
                      <a
                        className="fw-bold text-lg-start fw-bold ms-2"
                        style={{ color: '#FF3355' }}
                      >
                        Mudar
                      </a>
                    </span>
                  </Col> */}
                  <Col lg className="d-flex">
                    <span style={{ color: '#126DFC' }} className="fw-bold">
                      Total:
                    </span>
                    <span className="fw-bold ms-2">
                      {currency({ value: invoices[0]?.value })}
                    </span>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md={2} className="d-flex ms-auto">
            <Button
              className="fw-bold w-100 mb-3 p-3 text-end"
              style={{
                backgroundColor: '#13c296',
                color: 'white',
                border: 'none',
              }}
            >
              Pagar Agora
            </Button>
          </Col>
        </Row>
        {/* Seção de Histórico de Faturas */}
        <Card>
          <Card.Header>
            <h4>Histórico de Faturas</h4>
          </Card.Header>
          <Card.Body className="p-0">
            <Table striped>
              <thead className="table-header">
                <tr>
                  <th>{t('due_date')}</th>
                  <th>{t('payment')}</th>
                  <th>{t('value')}</th>
                  <th>{t('services')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(1).map((invoice) => (
                  <Fragment key={invoice.id}>
                    <tr className="table-row">
                      <td>
                        <span className="fw-bolder">
                          {DateTime.fromISO(invoice.expiration_date).toFormat(
                            'dd/MM/yyyy'
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bolder">
                          {invoice.transactions[0]?.paid_at
                            ? DateTime.fromISO(
                                invoice.transactions[0]?.paid_at
                              ).toFormat('dd/MM/yyyy')
                            : 'Não Pago'}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bolder">
                          {currency({ value: invoice.value })}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bolder">GroveNFe</span>
                      </td>
                      <td className="col-1">
                        {invoice.transactions[0]?.status === 'paid' ? (
                          <span
                            className="fw-bolder d-block rounded px-2 py-2 text-center text-end text-white"
                            style={{
                              backgroundColor: '#13c296',
                            }}
                          >
                            Pago
                          </span>
                        ) : (
                          <span
                            className="fw-bolder d-block rounded px-2 py-2 text-center text-end text-white"
                            style={{
                              backgroundColor: '#FF3355',
                            }}
                          >
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                    {/* Mobile */}
                    <tr className="d-md-none d-lg-none">
                      <td className=" p-3">
                        <div className=" d-flex gap-2 p-2">
                          <span className="fw-bold">{t('due_date')}:</span>
                          <span>
                            {DateTime.fromISO(invoice.expiration_date).toFormat(
                              'dd/MM/yyyy'
                            )}
                          </span>
                        </div>
                        <div className="d-flex gap-2 p-2">
                          <span className="fw-bold">{t('payment')}:</span>
                          <span>
                            {invoice.transactions[0]?.paid_at
                              ? DateTime.fromISO(
                                  invoice.transactions[0]?.paid_at
                                ).toFormat('dd/MM/yyyy')
                              : 'Não Pago'}
                          </span>
                        </div>
                        <div className="d-flex gap-2 p-2">
                          <span className="fw-bold">{t('value')}:</span>
                          <span>{currency({ value: invoice.value })}</span>
                        </div>
                        <div className="d-flex mb-2 gap-2 p-2">
                          <span className="fw-bold">{t('services')}:</span>
                          <span>GroveNFe</span>
                        </div>
                        {invoice.transactions[0]?.status === 'paid' ? (
                          <span
                            className="fw-bolder rounded px-4 py-2 text-center text-white"
                            style={{
                              backgroundColor: '#13c296',
                            }}
                          >
                            Pago
                          </span>
                        ) : (
                          <span
                            className="fw-bolder rounded px-1 py-2 text-center text-white"
                            style={{
                              backgroundColor: '#FF3355',
                            }}
                          >
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}
