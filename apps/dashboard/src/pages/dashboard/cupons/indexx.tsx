import React from 'react'
import { Container, Row, Col, Button, Card } from 'react-bootstrap'

  return (
    <Container className="p-0">
      {/* Seção de Plano Atual */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header
              className="d-flex justify-content-between align-items-center text-nowrap m-auto"
              style={{ backgroundColor: '#126DFC', color: 'white' }}
            >
              <div className="d-flex align-items-center m-auto">
                <strong>Plano Atual:</strong>
                <span className="fw-bold ms-2">Plano 100</span>
                <Button variant="link" className="fw-light ms-2 p-0 text-white">
                  Mudar
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ backgroundColor: '#E6E6E6' }}>
              <Col className="d-flex align-items-center" xs={8} md={2}>
                <strong style={{ color: '#126DFC' }}>Vencimento:</strong>
                <strong className="ms-2">03/10/2024</strong>
              </Col>
              <Col md={2} xs={4} className="text-end">
                <Button
                  variant="link"
                  className="text-danger p-0"
                  style={{ marginLeft: 'auto' }}
                >
                  Pagar
                </Button>
              </Col>
        </Row>
              <Row>
              <Col md={2}>
                <strong style={{ color: '#126DFC' }}>Valor:</strong>
                <strong className="m-2">R$ 77,00</strong>
              </Col>
              <Col md={2}>
                <strong style={{ color: '#126DFC' }}>Adicionais:</strong>
                <strong className="m-2">R$ 10,00</strong>
              </Col>
              <Col className="d-flex align-items-center" xs={6} md={2}>
                <strong className="text-nowrap" style={{ color: '#126DFC' }}>
                  Forma de Pagamento:
                </strong>
                <strong className="ms-2">Boleto</strong>
              </Col>
              <Col xs={6} md={2} className="text-end">
                <Button
                  variant="link"
                  className="text-danger p-0"
                  style={{ marginLeft: 'auto' }}
                >
                  Mudar
                </Button>
              </Col>
                <Col md={2}>
                  <strong style={{ color: '#126DFC' }}>Total:</strong>
                  <strong className="m-2">R$ 77,00</strong>
                </Col>
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
          <h3 className="fw-bold mt-3">Histórico de faturas</h3>
        </Col>
      </Row>
    </Container>
  )
}

