import React from 'react'
import { Container, Row, Col, Button, Card, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Title } from '../../../components/Partials/title'

interface InvoicesProps {}
export default function InvoicesGroveNFe({}: InvoicesProps) {
  const { t } = useTranslation()
  return (
    <>
      <Title
        title="Faturas NFe"
        componentTitle="Faturas NFe"
        className="text-color-1 titlegrovenfecolor mt-4"
      />
      <Container className="m-auto p-1">
        {/* Seção de Plano Atual */}
        <Row className="mb-4">
          <Card>
            <Card.Header
              className="d-flex align-items-center justify-content-center gap-3"
              style={{
                backgroundColor: '#126DFC',
                color: 'white',
              }}
            >
              <h2 className="font-weight-bold fs-4">Plano Atual:</h2>
              <span className="font-weight-bold">Plano 100</span>
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
                  <span className="fw-bold ms-2">03/10/2024</span>
                </Col>
                <Col lg className="">
                  <span style={{ color: '#126DFC' }} className="fw-bold">
                    Valor:
                  </span>
                  <span className="fw-bold ms-2">R$67,00</span>
                </Col>
                <Col lg className="">
                  <span style={{ color: '#126DFC' }} className="fw-bold">
                    Adicionais:
                  </span>
                  <span className="fw-bold ms-2">R$10,00</span>
                </Col>
                <Col lg className="align-items-center">
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
                </Col>
                <Col lg className="d-flex">
                  <span style={{ color: '#126DFC' }} className="fw-bold">
                    Total:
                  </span>
                  <span className="fw-bold ms-2">R$77,00</span>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          <Col md={2} className="d-flex ms-auto">
            <Button
              className="fw-bold w-100 p-3 text-end"
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
          <Card.Body>
            <Table responsive className="table-striped table">
              <thead className="table-header">
                <tr>
                  <th>{t('due_date')}</th>
                  <th>{t('payment')}</th>
                  <th>{t('value')}</th>
                  <th>{t('services')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row">
                  <td>
                    <span className="fw-bolder">02/10/2024</span>
                  </td>
                  <td>
                    <span className="fw-bolder">02/10/2024</span>
                  </td>
                  <td>
                    <span className="fw-bolder">R$77,00</span>
                  </td>
                  <td>
                    <span className="fw-bolder">GroveNFe</span>
                  </td>
                  <td>
                    <Button
                      className="d-flex ms-auto"
                      variant="success"
                      style={{ backgroundColor: '#13c296', border: 'none' }}
                    >
                      Pago
                    </Button>
                  </td>
                </tr>
                <tr className="table-row">
                  <td>
                    <span className="fw-bolder">02/10/2024</span>
                  </td>
                  <td>
                    <span className="fw-bolder">02/10/2024</span>
                  </td>
                  <td>
                    <span className="fw-bolder">R$77,00</span>
                  </td>
                  <td>
                    <span className="fw-bolder">GroveNFe</span>
                  </td>
                  <td>
                    <Button
                      className="d-flex ms-auto"
                      variant="success"
                      style={{ backgroundColor: '#13c296', border: 'none' }}
                    >
                      Pago
                    </Button>
                  </td>
                </tr>
                <tr className="d-md-none d-lg-none">
                  <td className="p-0">
                    <div className=" d-flex gap-2 p-2">
                      <span className="fw-bold">{t('due_date')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('payment')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('value')}:</span>
                      <span>R$77,00</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('services')}:</span>
                      <span>GroveNFe</span>
                    </div>
                    <Button
                      className="d-flex ms-2"
                      variant="success"
                      style={{ backgroundColor: '#13c296', border: 'none' }}
                    >
                      Pago
                    </Button>
                  </td>
                </tr>
                <tr className="d-md-none d-lg-none">
                  <td className="p-0">
                    <div className=" d-flex gap-2 p-2">
                      <span className="fw-bold">{t('due_date')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('payment')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('value')}:</span>
                      <span>R$77,00</span>
                    </div>
                    <div className="d-flex gap-2 p-2">
                      <span className="fw-bold">{t('services')}:</span>
                      <span>GroveNFe</span>
                    </div>
                    <Button
                      className="d-flex ms-2"
                      variant="success"
                      style={{ backgroundColor: '#13c296', border: 'none' }}
                    >
                      Pago
                    </Button>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </>
  )
}
