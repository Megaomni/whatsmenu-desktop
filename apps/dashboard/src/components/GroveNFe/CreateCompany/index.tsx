import { AppContext } from "@context/app.ctx";
import { zodResolver } from "@hookform/resolvers/zod";
import { mask } from "@utils/wm-functions";
import axios from "axios";
import i18n from "i18n";
import {  useContext, useState } from "react";
import { Button, Card, Col, Form, FormGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { api } from "src/lib/axios";
import { z } from 'zod'

const createCompanySchema = z.object({
    cnpj: z.string({
        required_error: 'CNPJ obrigatório',
        // invalid_type_error: 'CNPJ inválido'
    }).min(10, 'CNPJ inválido'),
    nome: z.string().min(1, 'Digite um nome'),
    // arquivo_certificado_base64: z.string().base64(),
    // senha_certificado: z.string().min(1, 'Senha obrigatória'),
    arquivo_logo_base64: z.string().base64().optional(),
    nome_fantasia: z.string({
        required_error: 'Nome fantasia obrigatório',
    }).min(1, 'Digite um nome fantasia'),
    inscricao_estadual: z.coerce.number({
        required_error: 'Inscricão estadual obrigatório',
    }).min(9, 'Inscricão estadual inválido'),
    inscricao_municipal: z.coerce.number().optional(),
    regime_tributario: z.enum(['1', '2', '3']),
    email: z.coerce.string().email('Formato de e-mail inválido'),
    telefone: z.string().min(10, 'Telefone inválido'),
    cep: z.string().min(8, 'CEP inválido'),
    Logradouro: z.string().min(5, 'Logradouro obrigatório'),
    number: z.coerce.number().min(1, 'Número obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro obrigatório'),
    municipio: z.string().min(1, 'Município obrigatório'),
    uf: z.string().min(2, 'UF obrigatório'),
    nome_responsavel: z.string().optional(),
    cpf_responsavel: z.string().optional(),
    cpf_cnpj_contabilidade: z.coerce.number().optional(),
    habilita_nfce: z.boolean(),
    serie_nfce_homologacao: z.coerce.number().optional(),
    proximo_numero_nfce_homologacao: z.coerce.number().optional(),
    id_token_nfce_homologacao: z.coerce.number().optional(),
    csc_nfce_homologacao: z.string().optional(),
    serie_nfce_producao : z.coerce.number().optional(),
    proximo_numero_nfce_producao: z.coerce.number().optional(),
    id_token_nfce_producao : z.coerce.number().optional(),
    csc_nfce_producao: z.string().optional(),
    habilita_contingencia_offline_nfce: z.boolean().optional(),
    enviar_email_destinatario: z.boolean().optional(),
    enviar_email_homologacao: z.boolean().optional(),
    discrimina_impostos: z.boolean().optional(),
    mostrar_danfse_badge: z.boolean().optional(),
})

type CreateCompanyFormData = z.infer<typeof createCompanySchema>

export function CreateCompany() {
    const { register, handleSubmit, getValues, setValue ,formState: { errors } } = useForm<CreateCompanyFormData>({
        resolver: zodResolver(createCompanySchema),
    });
  const { setProfile, profile } = useContext(AppContext)

    const [tabKey, setTabKey] = useState('identification')
    
    const [toggleNaturalPerson, setToggleNaturalPerson] = useState(false)
    
    const [advancedSettings, setAdvancedSettings] = useState(false)
    const toggleAdvancedSettings = () => setAdvancedSettings(!advancedSettings)

    const [advancedSettingsNfce, setAdvancedSettingsNfce] = useState(false)
    const toggleAdvancedSettingsNfce = () => setAdvancedSettingsNfce(!advancedSettingsNfce)

    const [nfce, setNfce] = useState(false)

    async function CreateCompany(company: any) {
        company.cnpj = Number(company.cnpj.replace(/[^\d]/g, ''))
        company.telefone = Number(company.telefone.replace(/[^\d]/g, ''))
        company.cep = Number(company.cep.replace(/[^\d]/g, ''))

        console.log('empresa',company);
        try {
            // const {data} = await axios.post(`${process.env.GROVE_NFE_URL}/v1/companies`, company, {
            //     headers: {
            //         Authorization: `Bearer ${process.env.GROVE_NFE_TOKEN}`,
            //     }
            // })
            const {data: profileData} = await api.patch('/dashboard/integrations/grovenfe')

            console.log('profile',profileData);
            
            
            // console.log('url',data);
            
        } catch (error) {
            console.error(error);
            throw error
        }
    }

    // arquivo_certificado_base64  ,  senha_certificado	
    // console.log('erros', errors);
    // console.log('valores', getValues());
    
    return (
        <>
            <form id="createCompany" onSubmit={handleSubmit(CreateCompany)}>
                <Card>
                    <Card.Header className="m-2 p-2 fw-bold fs-5">Nova Empresa</Card.Header>
                    <Card.Body>
                        <Row>
                            <Form.Switch className="ms-3 mb-3" label="Pessoa Física" 
                            onChange={(event) => {
                                setToggleNaturalPerson(event.target.checked)}
                            }
                            >
                            </Form.Switch>
                            <Col md={6} className="mb-3">
                                <FormGroup>
                                    <Form.Label>{toggleNaturalPerson ? 'CPF' : 'CNPJ'}</Form.Label>
                                    <Form.Control
                                    {...register('cnpj')}
                                    onChange={event => {
                                        console.log('lingua',i18n.language);
                                        console.log(mask(event, 'cpf/cnpj'));
                                    }}
                                    ></Form.Control>
                                    {errors.cnpj && <span className="text-danger">{errors.cnpj.message}</span>}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Form.Label>{toggleNaturalPerson ? 'Nome' : 'Razão Social'}</Form.Label>
                                    <Form.Control type="text" {...register('nome')}></Form.Control>
                                    {errors.nome && <span className="text-danger">{errors.nome.message}</span>}

                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <p>Certificado:</p>
                                <Button style={{ backgroundColor: '#13C296', border: 'none', position: 'relative' }} >
                                    Anexar Certificado
                                    {/* <input type="file" style={{  position: 'absolute', display: 'none' }}></input> */}
                                </Button>
                            </Col>
                        </Row>

                    </Card.Body>
                </Card>

                <Card>
                    <Card.Body>
                        <Tab.Container 
                        activeKey={tabKey} 
                        onSelect={(key) => setTabKey(key)}>
                            <Nav className="tab-nav-flex m-0 p-0 gap-3">
                                <Nav.Item>
                                    <Nav.Link 
                                    className={`m-0 p-0 pb-1 mb-3 pb-1 ${tabKey === 'identification' ? 'active-mini-tab' : 'no-active-mini-tab'}`} 
                                    eventKey='identification'>
                                        Identificação
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link 
                                    className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'contact' ? 'active-mini-tab' : 'no-active-mini-tab'}`} 
                                    eventKey='contact'>
                                        Contato
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link 
                                    className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'address' ? 'active-mini-tab' : 'no-active-mini-tab'}`} 
                                    eventKey='address'>
                                        Endereço
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'responsable' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='responsable'>Responsável</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'accounting' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='accounting'>Contabilidade</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'tokens' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='tokens'>Tokens</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 text-nowrap ${tabKey === 'docFiscal' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='docFiscal'>Documentos Fiscais</Nav.Link>
                                </Nav.Item>
                                <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'config' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='config'>Configurações</Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <Tab.Content className="mt-4">
                                <Tab.Pane eventKey='identification'>
                                arquivo_logo_base64
                                    <Button style={{ backgroundColor: '#13C296', border: 'none' }} >Anexar Logo da Empresa</Button>
                                    <Row>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Nome Fantasia</Form.Label>
                                            <Form.Control {...register('nome_fantasia', { required:'Nome Fantasia obrigatório' })}></Form.Control>
                                            {errors.nome_fantasia && <span className="text-danger">{errors.nome_fantasia.message}</span>}

                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Inscrição Estadual</Form.Label>
                                            <Form.Control {...register('inscricao_estadual', { required:'Inscrição Estadual obrigatória' })}></Form.Control>
                                            {errors.inscricao_estadual && <span className="text-danger">{errors.inscricao_estadual.message}</span>}

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
                                            {errors.email && <span className="text-danger">{errors.email.message}</span>}

                                        </Col>
                                        <Col md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Telefone</Form.Label>
                                            <Form.Control 
                                                maxLength={11} 
                                                {...register('telefone')} 
                                                onChange={event => {
                                                    event.target.value = event.target.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                                                }}
                                                ></Form.Control>
                                            {errors.telefone && <span className="text-danger">{errors.telefone.message}</span>}

                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='address'>
                                    <Row>
                                        <Col md={2}>
                                            <Form.Label className="m-0 p-0 mt-4">CEP</Form.Label>
                                            <Form.Control 
                                                maxLength={8} 
                                                {...register('cep', { required:'CEP obrigatório' })}
                                                onChange={event => {
                                                    mask(event, 'cep')
                                                }}
                                                ></Form.Control>
                                            {errors.cep && <span className="text-danger">{errors.cep.message}</span>}

                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Logradouro</Form.Label>
                                            <Form.Control {...register('Logradouro')}></Form.Control>
                                            {errors.Logradouro && <span className="text-danger">{errors.Logradouro.message}</span>}

                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Número</Form.Label>
                                            <Form.Control {...register('number')}></Form.Control>
                                            {errors.number && <span className="text-danger">{errors.number.message}</span>}

                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Complemento</Form.Label>
                                            <Form.Control {...register('complemento')}></Form.Control>
                                        </Col>
                                        <Col xs={6} md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Bairro</Form.Label>
                                            <Form.Control {...register('bairro')}></Form.Control>
                                            {errors.bairro && <span className="text-danger">{errors.bairro.message}</span>}

                                        </Col>
                                        <Col xs={6} md={3}>
                                            <Form.Label className="m-0 p-0 mt-4">Municipio</Form.Label>
                                            <Form.Control {...register('municipio')}></Form.Control>
                                            {errors.municipio && <span className="text-danger">{errors.municipio.message}</span>}

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
                                            {errors.uf && <span className="text-danger">{errors.uf.message}</span>}
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='responsable'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">Nome do Responsável</Form.Label>
                                            <Form.Control {...register('nome_responsavel')}></Form.Control>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">CPF do Responsável</Form.Label>
                                            <Form.Control {...register('cpf_responsavel')}></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey='accounting'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">CPF/CNPJ</Form.Label>
                                            <Form.Control {...register('cpf_cnpj_contabilidade')}></Form.Control>
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
                                        <Form.Switch className="d-flex align-items-center" {...register('enviar_email_destinatario')}></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(Todos os documentos) Enviar email ao destinatário - Produção</Form.Label>
                                    </div>
                                    <div className="d-flex align-itens-center" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Form.Switch className="d-flex align-items-center" {...register('enviar_email_homologacao')}></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(Todos os documentos) Enviar email ao destinatário - Homologação</Form.Label>
                                    </div>
                                    <div className="d-flex align-itens-center" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Form.Switch className="d-flex align-items-center" {...register('discrimina_impostos')}></Form.Switch>
                                        <Form.Label className="ms-3 mt-3">(NFe, NFCe) Discrimina impostos</Form.Label>
                                    </div>
                                    <div className="mt-3">
                                        <p className="ms-3" onClick={() => toggleAdvancedSettings()} style={{ color: 'red', textDecoration: 'underline' }}>Configurações avançadas</p>
                                        {advancedSettings &&
                                            <div className="d-flex align-itens-center">
                                                <Form.Switch className="d-flex align-items-center" {...register('mostrar_danfse_badge')}></Form.Switch>
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
            
            {!errors && 
            <div className="d-flex justify-content-end p-3 m-0 position-fixed bottom-0" style={{ background: '#DFE6E9', width: '103vw', marginLeft:'-1.5rem !important' }}>
                <Button className="flex w-100" type="submit" form="createCompany" style={{backgroundColor:'#13C296', border:'none'}}>
                    Criar
                </Button>
            </div>
            }
        </>
    )
}
