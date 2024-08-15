import { Button, Card, Col, Form, FormGroup, Row, Tab, Tabs } from "react-bootstrap";

export function CreateCompany() {
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
                                <Button style={{ backgroundColor: '#13C296', border: 'none' }} >Anexar Certificado</Button>
                            </Col>
                        </Row>

                    </Card.Body>
                </Card>

                <Card>
                    <Card.Body>
                        <Tabs className="d-flex flex-wrap overflow-auto" style={{ display: 'flex !important' }}>
                            <Tab eventKey='identification' title='Identificação'></Tab>
                            <Tab eventKey='contact' title='Contato'></Tab>
                            <Tab eventKey='address' title='Endereço'></Tab>
                            <Tab eventKey='responsable' title='Responsável'></Tab>
                            <Tab eventKey='accounting' title='Contabilidade'></Tab>
                            <Tab eventKey='tokens' title='Tokens'></Tab>
                            <Tab eventKey='docFiscal' title='Documentos Fiscais'></Tab>
                            <Tab eventKey='config' title='Configurações'></Tab>
                        </Tabs>
                    </Card.Body>
                </Card>
            </form>
        </>
    )
}