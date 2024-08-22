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
          <Col>
            <Card>
              <Card.Header
                className="d-flex justify-content-center align-items-center text-nowrap p-2"
                style={{
                  backgroundColor: '#126DFC',
                  color: 'white',
                }}
              >
                <h2 className="font-weight-bold fs-4 ms-3">Plano Atual:</h2>
                <p className="font-weight-bold m-auto ms-2">Plano 100</p>
                <Button variant="link" className="fw-light me-3  text-white">
                  Mudar
                </Button>
              </Card.Header>
              <Card.Body
                className="align-items-center text-nowrap"
                style={{ backgroundColor: '#E6E6E6' }}
              >
                <Col md={2} lg={3} className="d-flex">
                  <p style={{ color: '#126DFC' }} className="fw-bold">
                    Vencimento:
                  </p>
                  <p className="fw-bold ms-2">03/10/2024</p>
                  <Button
                    variant="link"
                    className="text-danger ms h-100 me-2 ms-auto p-0 text-end"
                  >
                    Pagar
                  </Button>
                </Col>
                <Col md={2} className="d-flex">
                  <p style={{ color: '#126DFC' }} className="fw-bold">
                    Valor:
                  </p>
                  <p className="fw-bold ms-2">R$67,00</p>
                </Col>
                <Col md={2} className="d-flex">
                  <p style={{ color: '#126DFC' }} className="fw-bold">
                    Adicionais:
                  </p>
                  <p className="fw-bold ms-2">R$10,00</p>
                </Col>
                <Col md={2} className="d-flex">
                  <p style={{ color: '#126DFC' }} className="fw-bold">
                    Formas de Pagamento:
                  </p>
                  <p className="fw-bold ms-2">Boleto</p>
                  <Button
                    variant="link"
                    className="text-danger h-100 me-2 ml-auto p-0 text-end"
                    style={{ marginLeft: 'auto' }}
                  >
                    Pagar
                  </Button>
                </Col>
                <Col md={2} className="d-flex">
                  <p style={{ color: '#126DFC' }} className="fw-bold">
                    Total:
                  </p>
                  <p className="fw-bold ms-2">R$77,00</p>
                </Col>
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
                <tr className="d-flex flex-column d-md-table">
                  <td className="p-0">
                    <div className="d-lg-none d-flex gap-2 p-2">
                      <span className="fw-bold">{t('due_date')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-lg-none d-flex gap-2 p-2">
                      <span className="fw-bold">{t('payment')}:</span>
                      <span>02/10/2024</span>
                    </div>
                    <div className="d-lg-none d-flex gap-2 p-2">
                      <span className="fw-bold">{t('value')}:</span>
                      <span>R$77,00</span>
                    </div>
                    <div className="d-lg-none d-flex gap-2 p-2">
                      <span className="fw-bold">{t('services')}:</span>
                      <span>GroveNFe</span>
                    </div>
                    <Button
                      className="d-lg-none d-flex mb-2 ms-2"
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
