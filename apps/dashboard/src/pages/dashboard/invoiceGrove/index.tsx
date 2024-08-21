import React from 'react'
import { Container, Row, Col, Button, Card } from 'react-bootstrap'

const InvoicePage = () => {
  return (
    <Container className="p-0">
      {/* Seção de Plano Atual */}
      <Row className=" mb-4">
        <Col>
          <Card>
            <Card.Header
              className="d-flex justify-content-between align-items-center"
              style={{ backgroundColor: '#126DFC', color: 'white' }}
            >
              <div className="d-flex align-items-center m-auto">
                <strong>Plano Atual:</strong>
                <span className="fw-bold ms-2">Plano 100</span>{' '}
                <Button variant="link" className="fw-light ms-2 p-0 text-white">
                  Mudar
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ backgroundColor: '#E6E6E6' }}>
              <Row className="mb-3">
                <Col className="d-flex align-items-center" xs="8">
                  <strong style={{ color: '#126DFC' }}>Vencimento:</strong>{' '}
                  <strong className="ms-2">03/10/2024</strong>
                </Col>
                <Col xs="4" className="text-end">
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    style={{ marginLeft: 'auto' }}
                  >
                    Pagar
                  </Button>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col>
                  <strong style={{ color: '#126DFC' }}>Valor:</strong>{' '}
                  <strong>R$ 77,00</strong>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col>
                  <strong style={{ color: '#126DFC' }}>Adicionais:</strong>{' '}
                  <strong>R$ 10,00</strong>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col className="d-flex align-items-center" xs="6">
                  <strong className="text-nowrap" style={{ color: '#126DFC' }}>
                    Forma de Pagamento:
                  </strong>{' '}
                  <strong className="ms-2">Boleto</strong>
                </Col>
                <Col xs="6" className="text-end">
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    style={{ marginLeft: 'auto' }}
                  >
                    Mudar
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col>
                  <strong style={{ color: '#126DFC' }}>Total:</strong>{' '}
                  <strong>R$ 77,00</strong>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          <Button
            className="w-100 mt-3"
            style={{
              backgroundColor: '#13C296',
              color: 'white',
              border: 'none',
              marginTop: '-10px',
              height: '50px', // Ajustar a altura conforme a imagem
            }}
          >
            Pagar Agora
          </Button>
        </Col>
      </Row>

      {/* Seção de Histórico de Faturas */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Histórico de Faturas</Card.Title>
              <Row>
                <Col xs="12">
                  <div className="d-flex justify-content-between">
                    <span>Vencimento: 03/04/2022</span>
                    <span>Pagamento: 16/04/2022</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Valor: R$ 77,00</span>
                    <span>Serviços: GroveNFe</span>
                  </div>
                  <div className="mt-2 text-end">
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: '#13C296',
                        color: 'white',
                        border: 'none',
                        height: '35px', // Ajustar a altura conforme a imagem
                      }}
                    >
                      Pago
                    </Button>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xs="12">
                  <div className="d-flex justify-content-between">
                    <span>Vencimento: 03/02/2022</span>
                    <span>Pagamento: 25/02/2022</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Valor: R$ 67,00</span>
                    <span>Serviços: GroveNFe</span>
                  </div>
                  <div className="mt-2 text-end">
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: '#13C296',
                        color: 'white',
                        border: 'none',
                        height: '35px', // Ajustar a altura conforme a imagem
                      }}
                    >
                      Pago
                    </Button>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col xs="12">
                  <div className="d-flex justify-content-between">
                    <span>Vencimento: 03/01/2022</span>
                    <span>Pagamento: 19/01/2022</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Valor: R$ 67,00</span>
                    <span>Serviços: GroveNFe</span>
                  </div>
                  <div className="mt-2 text-end">
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: '#13C296',
                        color: 'white',
                        border: 'none',
                        height: '35px', // Ajustar a altura conforme a imagem
                      }}
                    >
                      Pago
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default InvoicePage
