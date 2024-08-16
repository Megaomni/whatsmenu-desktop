import { useState } from "react";
import { Button, Card, Col, Form, FormGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";

export function CreateCompany() {
    const [advancedSettings, setAdvancedSettings] = useState(false)

    const toggleAdvancedSettings = () => setAdvancedSettings(!advancedSettings)
    return (
        <>
            <form>
                <Card>
                    <Card.Header className="m-2 p-2 fw-bold fs-5">Nova Empresa</Card.Header>
                    <Card.Body>
                        <Row>
                            <Form.Switch className="ms-3 mb-3" label="Pessoa Física"></Form.Switch>
                            <Col md={6} className="mb-3">
                                <FormGroup>
                                    <Form.Label>CNPJ</Form.Label>
                                    <Form.Control></Form.Control>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Form.Label>Razão Social</Form.Label>
                                    <Form.Control></Form.Control>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <p>Certificado:</p>
                                <Button style={{ backgroundColor: '#13C296', border: 'none', cursor: 'grab' }} >Anexar Certificado</Button>
                            </Col>
                        </Row>

                    </Card.Body>
                </Card>

                <Card>
                    <Card.Body>
                        <Tab.Container>


                            <Nav className="d-flex flex-row overflow-auto m-0 p-0" style={{ whiteSpace: 'nowrap' }}>
                                <Nav.Item >
                                    <Nav.Link eventKey='identification'>Identificação</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='contact'>Contato</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='address'>Endereço</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='responsable'>Responsável</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='accounting'>Contabilidade</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='tokens'>Tokens</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='docFiscal'>Documentos Fiscais</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link eventKey='config'>Configurações</Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <Tab.Content className="mt-4">
                                <Tab.Pane eventKey='identification'>
                                    <Button style={{ backgroundColor: '#13C296', border: 'none' }} >Anexar Logo da Empresa</Button>
                                    <Row>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Nome Fantasia</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Inscrição Estadual</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Inscrição Municipal</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Regime Tributário</Form.Label>
                                            <Form.Select>
                                                <option value="1"> Simples Nacional</option>
                                                <option value="2">Simples Nacional - Excesso de sublimite de receita bruta</option>
                                                <option value="3">Regime Normal</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='contact'>
                                    <Row>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Email</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Telefone</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='address'>
                                    <Row>
                                        <Col md={2}>
                                            <Form.Label className="m-0 p-0 mt-4">CEP</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Logradouro</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Número</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Complemento</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col xs={6} md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Bairro</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Municipio</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="m-0 p-0 mt-4">Uf</Form.Label>
                                            <Form.Select>
                                                <option value="1"> Simples Nacional</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='responsable'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Nome do Responsável</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">CPF do Responsável</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='accounting'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">CPF/CNPJ</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='tokens'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Token de Homologação</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Token de Produção</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='docFiscal'>
                                    <Form.Switch label='NFe' className="pb-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='NFCe' className="pb-3 mt-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='NFSe' className="pb-3 mt-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='CTe' className="pb-3 mt-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='MDFe' className="pb-3 mt-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='Recebimento de NFes' className="pb-3 mt-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}></Form.Switch>
                                    <Form.Switch label='Recebimento de CTes' className="pb-3 mt-3"></Form.Switch>
                                </Tab.Pane>
                                <Tab.Pane eventKey='config'>
                                    <div className="d-flex align-itens-center" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Form.Switch className="d-flex align-items-center" ></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(Todos os documentos) Enviar email ao destinatário - Produção</Form.Label>
                                    </div>
                                    <div className="d-flex align-itens-center" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Form.Switch className="d-flex align-items-center" ></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(Todos os documentos) Enviar email ao destinatário - Homologação</Form.Label>
                                    </div>
                                    <div className="d-flex align-itens-center" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Form.Switch className="d-flex align-items-center" ></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(NFe, NFCe) Discrimina impostos</Form.Label>
                                    </div>
                                    <div className="mt-3">
                                        <p className="ms-3" onClick={() => toggleAdvancedSettings()} style={{ color: 'red', textDecoration: 'underline' }}>Configurações avançadas</p>
                                        {advancedSettings &&
                                            <div className="d-flex align-itens-center">

                                                <Form.Switch className="d-flex align-items-center" style={{ backgroundColor: 'red', borderColor: 'red !important', boxShadow: 'none' }}></Form.Switch>
                                                <Form.Label className="ms-3">Mostrar badge Focus NFe na DANFSe</Form.Label>
                                            </div>
                                        }
                                    </div>
                                </Tab.Pane>

                            </Tab.Content>



                        </Tab.Container>
                    </Card.Body>
                </Card>
            </form >
        </>
    )
}