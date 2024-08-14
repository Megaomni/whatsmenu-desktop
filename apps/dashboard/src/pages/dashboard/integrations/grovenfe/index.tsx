import { Card, Col, Row } from "react-bootstrap";

export default function Grovenfe() {
    return (
        <>
            <Card>
                <Card.Header className="ms-3">GroveNFE</Card.Header>
                <Card.Body >
                    <Row>
                        <Col md={6}>
                            <img src="/img/grovenfe.png" alt="Logo da GroveNFE" />
                            <div>
                                <h3 className="bold fw-bold fs-1 text-start" style={{ color: '#000' }}>Emissão e Gestão Automática de Notas Fiscais Eletrônicas</h3>
                                <p style={{ color: '#86849C' }}>Chega de perder tempo lançando notas fiscais na mão. Defina automações e configure limites de acordo com o seu enquadramento CNPJ.</p>
                            </div>
                        </Col>
                        <Col md={6}>
                            <img src="/img/grovenfe_lion.png" alt="Imagem de uma pessoa com um leão" />
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Footer>
                    <div>
                        <Row>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Suporte Total para Operação Delivery</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Enviamos a Nota Fiscal para os seus Clientes na Hora</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Envio Automático XML ao seu Contador</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Fechamento Mensal Automático</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Liberdade para Configurar Automações</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Defina Limites por Forma de Pagamento</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Relatórios e Filtros Especiais</p>
                            </Col>
                            <Col md={3}>
                                <img src="" alt="" />
                                <p className="text-center">Cancelamento de Notas Emitidas</p>
                            </Col>
                        </Row>
                    </div>
                    <div>
                        <h5 className="fw-bold fs-3 text-center mb-4">Escolha o seu pacote de entregas:</h5>
                        <div>
                            <Row className="d-flex justify-content-around">
                                <Col md={2} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }}>
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 100</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 97,00</span></p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 67,00</span></p>
                                    </div>
                                </Col>
                                <Col md={2} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }} >
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 500</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 280,00</span> </p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 180,00</span></p>
                                    </div>
                                </Col>
                                <Col md={2} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }}>
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 1.500</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 560,00</span></p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 360,00</span></p>
                                    </div>
                                </Col>
                                <Col md={2} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }}>
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }} >Plano 5.000</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 2.200,00 </span></p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 1.700,00</span></p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Card.Footer>
            </Card>
        </>
    )
}