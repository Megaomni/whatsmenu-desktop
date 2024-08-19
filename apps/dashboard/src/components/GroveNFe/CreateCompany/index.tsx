import {  useState } from "react";
import { Button, Card, Col, Form, FormGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { useForm } from "react-hook-form";

export function CreateCompany() {
    const { register, handleSubmit } = useForm();
    const [toggleNaturalPerson, setToggleNaturalPerson] = useState(false)
    
    const [advancedSettings, setAdvancedSettings] = useState(false)
    const toggleAdvancedSettings = () => setAdvancedSettings(!advancedSettings)

    const [advancedSettingsNfce, setAdvancedSettingsNfce] = useState(false)
    const toggleAdvancedSettingsNfce = () => setAdvancedSettingsNfce(!advancedSettingsNfce)

    const [nfce, setNfce] = useState(false)

    function CreateCompany(data: any) {
        console.log(data);
    }

    // arquivo_certificado_base64  ,  senha_certificado	

    return (
        <>
            <form id="createCompany" onSubmit={handleSubmit(CreateCompany)}>
                <Card>
                    <Card.Header className="m-2 p-2 fw-bold fs-5">Nova Empresa</Card.Header>
                    <Card.Body>
                        <Row>
                            <Form.Switch className="ms-3 mb-3" label="Pessoa Física" onChange={(event) => setToggleNaturalPerson(event.target.checked)}>
                            </Form.Switch>
                            <Col md={6} className="mb-3">
                                <FormGroup>
                                    <Form.Label>{toggleNaturalPerson ? 'CPF' : 'CNPJ'}</Form.Label>
                                    <Form.Control required type="text" {...register('cnpj', { required:'CNPJ obrigatório' })}></Form.Control>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Form.Label>{toggleNaturalPerson ? 'Nome' : 'Razão Social'}</Form.Label>
                                    <Form.Control type="text" {...register('nome', { required:'Nome obrigatório' })}></Form.Control>
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


                            <Nav className="tab-nav-flex m-0 p-0 gap-3">
                                <Nav.Item>
                                    <Nav.Link className="m-0 p-0 mb-3" style={{ color: '#637381' }} eventKey='identification'>Identificação</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='contact'>Contato</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='address'>Endereço</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='responsable'>Responsável</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='accounting'>Contabilidade</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='tokens'>Tokens</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0 text-nowrap" style={{ color: '#637381' }} eventKey='docFiscal'>Documentos Fiscais</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className="m-0 p-0" style={{ color: '#637381' }} eventKey='config'>Configurações</Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <Tab.Content className="mt-4">
                                <Tab.Pane eventKey='identification'>
                                    <Button style={{ backgroundColor: '#13C296', border: 'none' }} >Anexar Logo da Empresa</Button>
                                    <Row>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Nome Fantasia</Form.Label>
                                            <Form.Control {...register('nome_fantasia', { required:'Nome Fantasia obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Inscrição Estadual</Form.Label>
                                            <Form.Control {...register('inscricao_estadual', { required:'Inscrição Estadual obrigatória' })}></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Inscrição Municipal</Form.Label>
                                            <Form.Control {...register('inscricao_municipal')}></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Regime Tributário</Form.Label>
                                            <Form.Select {...register('regime_tributario', {required:'Regime Tributário obrigatório'})}>
                                                <option value="" disabled> Selecione uma opção</option>
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
                                            <Form.Control {...register('email', { required:'Email obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Telefone</Form.Label>
                                            <Form.Control {...register('telefone', { required:'Telefone obrigatório' })}></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='address'>
                                    <Row>
                                        <Col md={2}>
                                            <Form.Label className="m-0 p-0 mt-4">CEP</Form.Label>
                                            <Form.Control {...register('cep', { required:'CEP obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Logradouro</Form.Label>
                                            <Form.Control {...register('Logradouro', { required:'Logradouro obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Número</Form.Label>
                                            <Form.Control {...register('number', { required:'Numero obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Complemento</Form.Label>
                                            <Form.Control {...register('complement')}></Form.Control>
                                        </Col>
                                        <Col xs={6} md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Bairro</Form.Label>
                                            <Form.Control {...register('neighborhood', { required:'Bairro obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Municipio</Form.Label>
                                            <Form.Control {...register('municipio', { required:'Municipio obrigatório' })}></Form.Control>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Label className="m-0 p-0 mt-4">Uf</Form.Label>
                                            <Form.Select {...register('uf', { required:'Uf obrigatório' })}>
                                                <option value="" disabled> Selecione o estado</option>
                                                <option value="AC">Acre (AC)</option>
                                                <option value="AL">Alagoas (AL)</option>
                                                <option value="AP">Amapá (AP)</option>
                                                <option value="AM">Amazonas (AM)</option>
                                                <option value="BA">Bahia (BA)</option>
                                                <option value="CE">Ceará (CE)</option>
                                                <option value="DF">Distrito Federal (DF)</option>
                                                <option value="ES">Espírito Santo (ES)</option>
                                                <option value="GO">Goiás (GO)</option>
                                                <option value="MA">Maranhão (MA)</option>
                                                <option value="MT">Mato Grosso (MT)</option>
                                                <option value="MS">Mato Grosso do Sul (MS)</option>
                                                <option value="MG">Minas Gerais (MG)</option>
                                                <option value="PA">Pará (PA)</option>
                                                <option value="PB">Paraíba (PB)</option>
                                                <option value="PR">Paraná (PR)</option>
                                                <option value="PE">Pernambuco (PE)</option>
                                                <option value="PI">Piauí (PI)</option>
                                                <option value="RJ">Rio de Janeiro (RJ)</option>
                                                <option value="RN">Rio Grande do Norte (RN)</option>
                                                <option value="RS">Rio Grande do Sul (RS)</option>
                                                <option value="RO">Rondônia (RO)</option>
                                                <option value="RR">Roraima (RR)</option>
                                                <option value="SC">Santa Catarina (SC)</option>
                                                <option value="SP">São Paulo (SP)</option>
                                                <option value="SE">Sergipe (SE)</option>
                                                <option value="TO">Tocantins (TO)</option>
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
                                <Tab.Pane eventKey='docFiscal' style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                    <Form.Switch label='NFCe' {...register('habilita_nfce')} className="mt-3 mb-3"  onChange={(event) => {
                                        setNfce(event?.target.checked)
                                    }}></Form.Switch>
                                    {nfce &&
                                        <Row className="d-flex">
                                            <div >
                                                <p className="m-0 p-0 fw-bold">Homologação</p>
                                                <Row >
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2">Série</Form.Label>
                                                        <Form.Control {...register('serie_nfce_homologacao')}></Form.Control></Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">Próximo número</Form.Label>
                                                        <Form.Control {...register('proximo_numero_nfce_homologacao')}></Form.Control>
                                                    </Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">ID Token Homol.</Form.Label>
                                                        <Form.Control {...register('id_token_nfce_homologacao')}></Form.Control>
                                                    </Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">CSC Homol.</Form.Label>
                                                        <Form.Control {...register('csc_nfce_homologacao')}></Form.Control>
                                                    </Col>
                                                </Row>
                                            </div>
                                            <div className="mt-2">
                                                <p className="m-0 p-0 fw-bold">Produção</p>
                                                <Row>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2">Série</Form.Label>
                                                        <Form.Control defaultValue="1" {...register('serie_nfce_producao')}></Form.Control></Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">Próximo número</Form.Label>
                                                        <Form.Control defaultValue="1" {...register('proximo_numero_nfce_producao')}></Form.Control>
                                                    </Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">ID Token Prod.</Form.Label>
                                                        <Form.Control {...register('id_token_nfce_producao', { required: 'Este campo é obrigatório' })}></Form.Control>
                                                    </Col>
                                                    <Col xs={6} md={3}>
                                                        <Form.Label className="m-0 p-0 mt-2 pb-2 text-nowrap">CSC Prod.</Form.Label>
                                                        <Form.Control {...register('csc_nfce_producao', { required: 'Este campo é obrigatório' })}></Form.Control>
                                                    </Col>
                                                </Row>
                                            </div>
                                            <div>
                                                <div className="mt-3">
                                                    <p onClick={() => toggleAdvancedSettingsNfce()} style={{ color: 'red', textDecoration: 'underline' }}>Configurações avançadas</p>
                                                    {advancedSettingsNfce &&
                                                        <div className="d-flex align-itens-center">
                                                            <Form.Switch className="d-flex align-items-center" {...register('habilita_contingencia_offline_nfce')}></Form.Switch>
                                                            <Form.Label className="ms-3">(NFCe) Hbilita contingência offline</Form.Label>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </Row>}
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
                                                <Form.Switch className="d-flex align-items-center"></Form.Switch>
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
            
            <div className="d-flex justify-content-end p-3 m-0 position-fixed bottom-0" style={{ background: '#DFE6E9', width: '103vw', marginLeft:'-1.5rem !important' }}>
                <Button className="flex w-100" type="submit" form="createCompany" style={{backgroundColor:'#13C296', border:'none'}}>
                    Criar
                </Button>
            </div>
        </>
    )
}
