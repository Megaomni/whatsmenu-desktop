import { Button, Card, Col, Form, FormGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";

export function ConfigEmission() { 
    return (
        <>
        <form>
            <Card>
                <Card.Header className="m-2 p-2 fw-bold fs-5">Emissão NFCe</Card.Header>
                <Card.Body>
                    <h5 className="fw-bold" style={{ color: '#000' }}>Defina padrões para emissão automática de suas notas fiscais.</h5>
                    <p style={{color: '#9894A4'}}>*sempre que necessário você poderá emitir manualmente alem do padrão definido.</p>
                    <Row>
                        <Col md={2}>
                        <Form.Label>Dinheiro</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="p-0 m-0 mt-3 mb-2">Pix</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="p-0 m-0 mt-3 mb-2">Crédito Maquininha</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="p-0 m-0 mt-3 mb-2">Crédito Online</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="p-0 m-0 mt-3 mb-2">Dinheiro</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="p-0 m-0 mt-3 mb-2">Débito Maquininha</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Mês</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="p-0 m-0 mt-2 mb-2">Média Diária</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                    </Row>
                </Card.Body>
            </Card>

                <Card.Body className="mt-2" style={{ backgroundColor: '#EDEDF7', color: '#000' }}>
                    <h3 className="fw-bold">Não perca prazos!</h3>
                    <p>Enviaremos mensalmente o fechamento fiscal (XML) para sua contabilidade.</p>
                    <Form.Label>Email do Contador</Form.Label>
                    <Form.Control></Form.Control>
                    <p className="mt-3" style={{textDecoration:'line-through'}}>R$ 39,90/mês</p>
                    <h4 style={{color:'#0075FF'}}>*Serviço adicional<span className="fw-bold"> Grátis </span>para Lojistas WhatsMenu!</h4>
                </Card.Body>

                <Card.Footer className="mt-3 p-0">
                    <Card.Header className="fw-bold">Alteraçãoo do Plano</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>Plano Atual</p>
                                    <h4 className="fw-bold m-0 p-0">Plano 100</h4>
                                    <p className="m-0 p-0">R$ 67,00</p>
                                </div>
                            </Col>
                            <Col>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>Vencimento do Plano</p>
                                    <p className="m-0 p-0">03/08/2024</p>
                                </div>
                            </Col>
                            <Col className='mt-3'>
                                <Button className="w-100">Alterar Plano</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card.Footer>
        </form>
        
        </>
    )
}
