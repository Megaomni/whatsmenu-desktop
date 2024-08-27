import { ConfigEmission } from "@components/GroveNFe/ConfigEmission";
import { CreateCompany } from "@components/GroveNFe/CreateCompany";
import { ProfileOpeningHours } from "@components/Profile/OpeningHours";
import { AppContext } from "@context/app.ctx";
import Image from "next/image";
import { useContext, useState } from "react";
import { Button, Card, Col, Form, Modal, ModalBody, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function Grovenfe() {
  const { t } = useTranslation()
  const { profile } = useContext(AppContext)
  const grovenfe = profile.options.integrations?.grovenfe?.created_at

    const [grovenfePlan, setGrovenfePlan] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [modalCheckouGroveNfe, setModalCheckouGrovenfe] = useState(false)
    const [tabKey, setTabKey] = useState('addCompany')

    const aditional = (grovenfePlan: string) => {
        let value
        switch (grovenfePlan) {
            case 'plan100':
                value = 'R$ 0,78'
                break;
            case 'plan500':
                value = 'R$ 0,46'
                break;
            case 'plan1500':
                value = 'R$ 0,34'
                break;
            case 'plan5000':
                value = 'R$ 0,00'
            default:
                break;
        }
        return value
    }

    const signPlan = () => {
        try {

        } catch (error) {
        }
    }

    return (
        <>
            {/* <Card>
                <Card.Header className="ms-2 fw-bold fs-5">GroveNFE</Card.Header>
                <Card.Body >
                    <Row>
                        <Col md={6} className="mt-5">
                            <Image src="/images/grovenfe/grovenfe.png" alt="Logo da GroveNFE" width={400} height={100} />
                            <div>
                                <h3 className="bold fw-bold fs-1 text-start" style={{ color: '#000' }}>Emissão e Gestão Automática de Notas Fiscais Eletrônicas</h3>
                                <p style={{ color: '#86849C' }}>Chega de perder tempo lançando notas fiscais na mão. Defina automações e configure limites de acordo com o seu enquadramento CNPJ.</p>
                            </div>
                        </Col>
                        <Col md={6} className="m-0 p-0">
                            <img src="/images/grovenfe/grovenfe_lion.png" alt="Imagem de uma pessoa com um leão" />
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Footer>
                    <div>
                        <Row className="m-3 my-5">
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/fast-delivery 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Suporte Total para Operação Delivery</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/receipt 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Enviamos a Nota Fiscal para os seus Clientes na Hora</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/xml 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Envio Automático XML ao seu Contador</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/cancel-event 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Fechamento Mensal Automático</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/system-configuration 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Liberdade para Configurar Automações</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/operation 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Defina Limites por Forma de Pagamento</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/monitor 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Relatórios e Filtros Especiais</p>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-center">
                                <Image src="/images/grovenfe/shopping 1.png" alt="" width={50} height={50} />
                                <p className="text-center">Cancelamento de Notas Emitidas</p>
                            </Col>
                        </Row>
                    </div>
                    <div>
                        <h5 className="fw-bold fs-3 text-center mb-4">Escolha o seu pacote de entregas:</h5>
                        <div>
                            <Row className="d-flex justify-content-around">
                                <Col md={3} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }}>
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 100</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 97,00</span></p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 67,00</span></p>
                                        <Form.Check id="plan100" type="radio" inline label="Ativar este" checked={grovenfePlan === 'plan100'} onChange={() => setGrovenfePlan('plan100')}></Form.Check>
                                    </div>
                                </Col>
                                <Col md={3} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }} >
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 500</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 280,00</span> </p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 180,00</span></p>
                                        <Form.Check id="plan500" type="radio" inline label="Ativar este" checked={grovenfePlan === 'plan500'} onChange={() => setGrovenfePlan('plan500')}></Form.Check>
                                    </div>
                                </Col>
                                <Col md={3} className="m-0 p-0">
                                    <div className="text-center" style={{ border: '2px solid #B7B3D1', borderRadius: '20px', backgroundColor: '#F8F8F8' }}>
                                        <p className="fs-3 fw-bold mt-2 m-0 p-0" style={{ color: '#EA1D2C' }}>Plano 1.500</p>
                                        <p className="fw-bold m-0 p-0" style={{ color: '#AEAEAE' }}>De <span style={{ textDecoration: 'line-through' }}>R$ 560,00</span></p>
                                        <p className="fw-bold m-0 p-0 d-flex justify-content-center align-items-center">por<span className="fs-3 ps-1">R$ 360,00</span></p>
                                        <Form.Check id="plan1500" type="radio" inline label="Ativar este" checked={grovenfePlan === 'plan1500'} onChange={() => setGrovenfePlan('plan1500')}></Form.Check>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </Card.Footer>
            </Card>
            {grovenfePlan &&
                <footer className="d-flex flex-column align-items-center">
                    <p>*caso ultrapasse o limite do plano selecionado, cada nota adicional será cobrada {aditional(grovenfePlan)} na próxima fatura.</p>
                    <Form.Check label="Li e aceito os Termos de uso GroveNFe" inline onChange={(event) => setTermsAccepted(event?.target.checked)}></Form.Check>
                    <Button className="mt-3 p-2 px-3" style={{ backgroundColor: '#13c296', border: 'none' }} disabled={!termsAccepted} onClick={() => setModalCheckouGrovenfe(true)}>Quero Contratar</Button>
                </footer>
            }
            < Modal show={modalCheckouGroveNfe} onHide={() => setModalCheckouGrovenfe(false)} centered>
                <Modal.Body>
                    <div className="d-flex justify-content-between align-items-center px-2 border border-primary">
                        <h4 className="fw-bold text-black m-0">Checkout</h4>
                        <Image src="/images/grovenfe/grovenfe.png" alt="Logo da GroveNFE" width={100} height={30} />
                    </div>
                    <div className="mt-3" style={{ border: '1px solid', borderRadius: '30px' }}>
                        <header className="m-0 p-0" style={{ color: 'black', backgroundColor: '#BDC3C7' }}>Assinatura do Plano</header>
                        <Row className="m-0 p-0 mx-2">
                            <Col md={6}>
                                <Form.Check type="radio" label='Mensal' inline></Form.Check>
                            </Col>
                            <Col md={6} className="d-flex flex-column">
                                <span className="m-0 p-0 text-center" style={{ backgroundColor: '#13C296', color: 'white', borderRadius: '10px' }}>Recomendado</span>
                                <Form.Check type="radio" label='Anual' inline></Form.Check>
                            </Col>
                        </Row>
                        <header style={{ color: 'black', backgroundColor: '#BDC3C7' }}>Forma de Pagamento</header>
                        <Row className="m-0 p-0 mx-2">
                            <Col md={6}>
                                <Form.Check type="radio" label='PIX' inline></Form.Check>
                            </Col>
                            <Col md={6} className="d-flex flex-column">
                                <Form.Check type="radio" label='Cartão de Crédito' inline></Form.Check>
                            </Col>
                        </Row>
                        <div className="m-0 p-0 px-4 py-2 d-flex justify-content-between align-items-center" style={{ color: 'white', backgroundColor: 'black' }}>
                            <p className="m-0">Produto</p>
                            <p className="m-0">SubTotal</p>
                        </div>
                        <div className="m-0 p-0 px-4 d-flex justify-content-between align-items-center" style={{ border: '1px solid #DFE4EA' }}>
                            <p className="m-0">Plano selecionado</p>
                            <p className="m-0">Valor do plano</p>
                        </div><div className="m-0 p-0 px-4 d-flex justify-content-between align-items-center">
                            <p className="m-0">Total</p>
                            <p className="m-0">Valor total</p>
                        </div>
                    </div>
                </Modal.Body>


                <Modal.Footer>
                    <p className="text-center" style={{ color: '#8288A5' }}>Ao clicar no botão “Iniciar assinatura” abaixo, você concorda com nossos
                        <span>Termos de Uso</span> e com nossa <span>Declaração de Privacidade</span>, confirma ter mais
                        de 18 anos e aceita que a <span>WhatsMenu</span> renove automaticamente sua
                        assinatura e cobre o preço da assinatura (atualmente <span>R$ Dinâmico</span>/mês)
                        da sua forma de pagamento até você cancelar.Você pode cancelar quando
                        quiser para evitar cobranças futuras.Para cancelar, fale com o nosso
                        suporte via whatsapp.</p>
                    <Button className="w-100" style={{}} onClick={() => signPlan()}>Assinar Plano</Button>
                </Modal.Footer>

            </ Modal> */}

            <h1 className="fw-bold" style={{ color: '#012970' }}>
                {t('tax_settings')}
            </h1>
            <Tab.Container activeKey={tabKey} onSelect={(key) => setTabKey(key as string)}>
                <Row>
                    <Col>
                        <Nav
                            variant="tabs"
                            className="tab-nav-flex flex-row">
                            <Nav.Link
                                eventKey="addCompany"
                                className="position-relative"
                            >
                                <Nav.Link eventKey="addCompany" className="text-nowrap">{grovenfe ? t('edit_company') : t('add_company')}</Nav.Link>
                            </Nav.Link>
                            <Nav.Link
                                eventKey="configEmission"
                                className="position-relative"
                            >
                                <Nav.Link eventKey="configEmission" className="text-nowrap">
                                    {t('configure_emission')}
                                </Nav.Link>
                            </Nav.Link>
                        </Nav>
                        <Tab.Content>
                            <Tab.Pane eventKey="addCompany">
                                {<CreateCompany />}
                            </Tab.Pane>
                            <Tab.Pane eventKey="configEmission">
                                {<ConfigEmission />}
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </>
    )
}