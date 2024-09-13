import { AppContext } from '@context/app.ctx'
import { zodResolver } from '@hookform/resolvers/zod'
import { mask } from '@utils/wm-functions'
import axios from 'axios'
import { useContext, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormGroup,
  Image,
  Nav,
  Row,
  Tab,
} from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { groveNfeApi } from 'src/lib/axios'
import { z } from 'zod'
import { BsCheckCircle } from 'react-icons/bs'

const createCompanySchema = z.object({
  cnpj: z
    .string({
      required_error: 'CNPJ obrigatório',
      // invalid_type_error: 'CNPJ inválido'
    })
    .min(10, 'CNPJ inválido'),
  nome: z.string().min(1, 'Digite um nome'),
  arquivo_certificado_base64: z.object({}).optional(),
  senha_certificado: z.string().min(1, 'Senha obrigatória').optional(),
  arquivo_logo_base64: z.object({}).optional(),
  nome_fantasia: z
    .string({
      required_error: 'Nome fantasia obrigatório',
    })
    .min(1, 'Digite um nome fantasia'),
  inscricao_estadual: z.coerce
    .number({
      required_error: 'Inscricão estadual obrigatório',
    })
    .min(9, 'Inscricão estadual inválido'),
  inscricao_municipal: z.coerce.number().optional(),
  regime_tributario: z.enum(['1', '2', '3']),
  email: z.coerce.string().email('Formato de e-mail inválido'),
  email_contabilidade: z.coerce.string().email('Formato de e-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  cep: z.string().min(8, 'CEP inválido'),
  logradouro: z.string().min(5, 'Logradouro obrigatório'),
  numero: z.coerce.number().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  municipio: z.string().min(1, 'Município obrigatório'),
  uf: z.string().min(2, 'UF obrigatório'),
  nome_responsavel: z.string().optional(),
  cpf_responsavel: z.string().optional(),
  cpf_cnpj_contabilidade: z.coerce
    .string()
    .optional()
    .transform((value) => {
      if (value) {
        return Number(value.replace(/\D+/g, ''))
      }
    }),
  habilita_nfce: z.boolean().refine((value) => value === true, {
    message: 'Habilite para emitir NFCe',
  }),
  serie_nfce_homologacao: z.coerce.number().optional(),
  proximo_numero_nfce_homologacao: z.coerce.number().optional(),
  id_token_nfce_homologacao: z.coerce.number().optional(),
  csc_nfce_homologacao: z.string().optional(),
  serie_nfce_producao: z.coerce.number().optional(),
  proximo_numero_nfce_producao: z.coerce.number().optional(),
  id_token_nfce_producao: z.coerce.number().min(1, 'Token do CSC obrigatório'),
  csc_nfce_producao: z
    .string({
      required_error: 'Código de Segurança do Contribuinte obrigatório',
    })
    .min(1, 'Código de Segurança do Contribuinte obrigatório'),
  habilita_contingencia_offline_nfce: z.boolean().optional(),
  enviar_email_destinatario: z.boolean().optional(),
  enviar_email_homologacao: z.boolean().optional(),
  discrimina_impostos: z.boolean().optional(),
  mostrar_danfse_badge: z.boolean().optional(),
})

type CreateCompanyFormData = z.infer<typeof createCompanySchema>

export function CreateCompany() {
  const { t } = useTranslation()
  const buttonFooter = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    formState,
    reset,
    watch,
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
  })
  const { setProfile, profile } = useContext(AppContext)
  const grovenfe = profile.options.integrations?.grovenfe?.created_at

  const [tabKey, setTabKey] = useState<string | null>('identification')

  const [advancedSettings, setAdvancedSettings] = useState(false)
  const toggleAdvancedSettings = () => setAdvancedSettings(!advancedSettings)

  const [advancedSettingsNfce, setAdvancedSettingsNfce] = useState(false)
  const toggleAdvancedSettingsNfce = () =>
    setAdvancedSettingsNfce(!advancedSettingsNfce)

  const [nfce, setNfce] = useState(false)
  const [cnpjMasked, setCnpjMasked] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [cepMasked, setCepMasked] = useState('')
  const [inputCertificateCompany, setInputCertificateCompany] =
    useState<File | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [certificateBase64, setCertificateBase64] = useState<string | null>(
    null
  )

  const [certificateName, setCertificateName] = useState('')

  const createCompanyGroveNfe = async (company: any) => {
    company.cnpj = Number(company.cnpj.replace(/[^\d]/g, ''))
    company.telefone = Number(company.telefone.replace(/[^\d]/g, ''))
    company.cep = Number(company.cep.replace(/[^\d]/g, ''))
    company.arquivo_certificado_base64 = certificateBase64

    const body = {
      ...company,
      plan_id: 1,
      external_id: profile.id,
    }

    const haveIntegration = Boolean(profile?.options?.integrations?.grovenfe)
    let url = '/v1/companies'
    let method: 'put' | 'post' = 'post'
    if (haveIntegration) {
      url = `/v1/companies/${profile?.options?.integrations?.grovenfe?.company_id}`
      method = 'put'
    }

    try {
      const { data } = await groveNfeApi[method](url, body)

      if (data) {
        setProfile((prevProfile) => ({
          ...prevProfile!,
          options: {
            ...prevProfile!.options,
            integrations: {
              ...prevProfile!.options.integrations,
              grovenfe: {
                ...prevProfile!.options.integrations?.grovenfe,
                created_at: data.company.created_at,
              },
            },
          },
        }))
      }
      company.cnpj = cnpjMasked
      company.telefone = phoneMasked
      company.cep = cepMasked
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  useEffect(() => {
    if (profile.options.integrations?.grovenfe?.company_id) {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_GROVE_NFE_URL}/v1/companies/${profile.options.integrations.grovenfe.company_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROVE_NFE_TOKEN}`,
            },
          }
        )
        .then(({ data }) => {
          reset({
            cnpj: data.company.docNumber
              .replace(/(\d{2})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1/$2')
              .replace(/(\d{4})(\d{1,2})$/, '$1-$2'),
            nome: data.focus_company_data.nome,
            nome_fantasia: data.focus_company_data.nome_fantasia,
            inscricao_estadual: data.company.aditionalInfo.inscricao_estadual,
            inscricao_municipal: data.company.aditionalInfo.inscricao_municipal,
            regime_tributario: data.company.aditionalInfo.regime_tributario,
            email: data.focus_company_data.email,
            email_contabilidade: data.company.aditionalInfo.email_contabilidade,
            telefone: data.company.phone.replace(
              /(\d{2})(\d{5})(\d{4})/,
              '($1) $2-$3'
            ),
            cep: data.company.address.zip_code.replace(
              /^(\d{5})(\d)/g,
              '$1-$2'
            ),
            logradouro: data.focus_company_data.logradouro,
            numero: data.focus_company_data.numero,
            complemento: data.focus_company_data.complemento,
            bairro: data.focus_company_data.bairro,
            municipio: data.focus_company_data.municipio,
            uf: data.focus_company_data.uf,
            nome_responsavel: data.focus_company_data.nome_responsavel,
            cpf_responsavel: data.focus_company_data.cpf_responsavel,
            cpf_cnpj_contabilidade:
              data.company.aditionalInfo.cpf_cnpj_contabilidade,
            habilita_nfce: data.company.aditionalInfo.habilita_nfce,
            enviar_email_destinatario:
              data.focus_company_data.enviar_email_destinatario,
            discrimina_impostos: data.company.aditionalInfo.discrimina_impostos,
            habilita_contingencia_offline_nfce:
              data.focus_company_data.habilita_contingencia_offline_nfce,
            mostrar_danfse_badge:
              data.company.aditionalInfo.mostrar_danfse_badge,
            serie_nfce_producao: data.company.aditionalInfo.serie_nfce_producao,
            proximo_numero_nfce_producao:
              data.company.aditionalInfo.proximo_numero_nfce_producao,
            id_token_nfce_producao:
              data.company.aditionalInfo.id_token_nfce_producao,
            csc_nfce_producao: data.company.aditionalInfo.csc_nfce_producao,
          })
        })
    }
  }, [])

  useEffect(() => {
    if (
      errors.cep ||
      errors.logradouro ||
      errors.bairro ||
      errors.municipio ||
      errors.numero
    ) {
      setTabKey('address')
    }

    if (errors.email || errors.telefone || errors.email_contabilidade) {
      setTabKey('contact')
    }

    if (errors.nome_fantasia || errors.inscricao_estadual) {
      setTabKey('identification')
    }
  }, [errors])

  const convertFileToBase64 = ({
    file,
    eventName,
  }: {
    file: File
    eventName: string
  }) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          let base64 = String(reader.result).split(',')[1]
          if (eventName === 'inputLogoCompany') {
            setLogoBase64(base64 as string)
          }
          if (eventName === 'certificateCompany') {
            setCertificateBase64(base64 as string)
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <form id="createCompany" onSubmit={handleSubmit(createCompanyGroveNfe)}>
        <Card>
          <Card.Header className="fw-bold fs-5 m-2 p-2">
            {t('company')}
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4} className="mb-3">
                <FormGroup>
                  <Form.Label>{t('ein')}</Form.Label>
                  <Form.Control
                    {...register('cnpj')}
                    defaultValue={cnpjMasked}
                    onChange={(event) => {
                      mask(event, 'cpf/cnpj')
                      setCnpjMasked(event.target.value)
                    }}
                  ></Form.Control>
                  {errors.cnpj && (
                    <span className="text-danger">{errors.cnpj.message}</span>
                  )}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Form.Label>{t('company_name')}</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('nome')}
                  ></Form.Control>
                  {errors.nome && (
                    <span className="text-danger">{errors.nome.message}</span>
                  )}
                </FormGroup>
              </Col>
            </Row>
            <Row className="mt-4 gap-3">
              <Col md={4}>
                <span>{t('certificate')}:</span>
                <div
                  className="d-flex justify-content-center align-items-center my-2 rounded"
                  style={{ border: '1px dashed #ccc', height: '120px' }}
                >
                  {!watch('arquivo_certificado_base64') ? (
                    <p className="m-0 p-3 text-center">
                      Carregue seu certificado na extensão PFX ou P12!
                    </p>
                  ) : (
                    <div className="text-center">
                      <BsCheckCircle
                        className="mt-2 text-green-500"
                        style={{ height: '2rem', width: '2rem' }}
                      />
                      <p className="text-success">
                        Certificado carregado com sucesso
                      </p>
                      <p
                        className="text-sm text-gray-600"
                        style={{
                          fontSize: '0.70rem',
                          color: '#4a5568',
                        }}
                      >
                        {certificateName}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  className="bg-success text-white"
                  style={{
                    border: 'none',
                    position: 'relative',
                    width: '100%',
                  }}
                >
                  {t('attach_certificate')}
                  <input
                    type="file"
                    {...register('arquivo_certificado_base64')}
                    name="certificateCompany"
                    onChange={(e) => {
                      if (e.target.files) {
                        setInputCertificateCompany(e.target.files[0])
                        convertFileToBase64({
                          file: e.target.files[0],
                          eventName: e.target.name,
                        })
                        setCertificateName(e.target.files[0].name)
                      }
                    }}
                    style={{
                      opacity: 0,
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                    }}
                  />
                </Button>
                <p className="fs-7 mt-1">
                  *Caso não tenha o arquivo, solicite ao seu contador
                </p>
              </Col>
              <Col md={4}>
                <Form.Label>{t('certificate_password')}</Form.Label>
                <Form.Control
                  type="text"
                  {...register('senha_certificado')}
                ></Form.Control>
                {errors.senha_certificado && (
                  <span className="text-danger">
                    {errors.senha_certificado.message}
                  </span>
                )}
                <p className="fs-7">*Solicite ao seu contador</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <Tab.Container
              activeKey={tabKey as string}
              onSelect={(key) => setTabKey(key)}
            >
              <Nav className="tab-nav-flex m-0 gap-3 p-0">
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 pb-1 ${tabKey === 'identification' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="identification"
                  >
                    {t('identification')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 ${tabKey === 'contact' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="contact"
                  >
                    {t('contact')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 ${tabKey === 'address' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="address"
                  >
                    {t('address')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 ${tabKey === 'responsable' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="responsable"
                  >
                    {t('responsable')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 ${tabKey === 'accounting' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="accounting"
                  >
                    {t('accounting')}
                  </Nav.Link>
                </Nav.Item>
                {/* <Nav.Item >
                                    <Nav.Link className={`m-0 p-0 pb-1 mb-3 ${tabKey === 'tokens' ? 'active-mini-tab' : 'no-active-mini-tab'}`} eventKey='tokens'>
                                        {t('tokens')}</Nav.Link>
                                </Nav.Item> */}
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 text-nowrap p-0 pb-1 ${tabKey === 'docFiscal' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="docFiscal"
                  >
                    {t('tax_documents')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    className={`m-0 mb-3 p-0 pb-1 ${tabKey === 'config' ? 'active-mini-tab' : 'no-active-mini-tab'}`}
                    eventKey="config"
                  >
                    {t('settings')}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="identification">
                  {/* arquivo_logo_base64
                                <Figure>
                                    <Figure.Image
                                      width={600}
                                      // height={450}
                                      alt="Imagem da Logo do Empresa"
                                      src={
                                        imageLogo
                                      }
                                      id="logoCompany"
                                      style={{
                                        maxHeight: 270,
                                      }}
                                    />
                                  </Figure>
                                    <Button style={{ position: 'relative' }} variant="success">
                                        {t('attach_company_logo')}
                                        <input
                                      type="file"
                                      accept="image/*"
                                      {...register('arquivo_logo_base64')}
                                      name="inputLogoCompany"
                                      onChange={(e) => {
                                          
                                          if(e.target.files) {
                                              console.log(e.target.files[0]);
                                              if (e.target.files[0].name) {
                                                  setImageLogo(e.target.files[0].name)
                                              }
                                            setInputLogoCompany(e.target.files[0])
                                            convertFileToBase64({file: e.target.files[0], eventName: e.target.name})
                                          }
                                      }}
                                      style={{
                                        opacity: 0,
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                      }}
                                    />
                                        </Button> */}
                  <Row>
                    <Col md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('trade_name')}
                      </Form.Label>
                      <Form.Control
                        {...register('nome_fantasia', {
                          required: 'Nome Fantasia obrigatório',
                        })}
                      ></Form.Control>
                      {errors.nome_fantasia && (
                        <span className="text-danger">
                          {errors.nome_fantasia.message}
                        </span>
                      )}
                    </Col>
                    <Col md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('state_registration')}
                      </Form.Label>
                      <Form.Control
                        maxLength={13}
                        {...register('inscricao_estadual', {
                          required: 'Inscrição Estadual obrigatória',
                        })}
                      ></Form.Control>
                      {errors.inscricao_estadual && (
                        <span className="text-danger">
                          {errors.inscricao_estadual.message}
                        </span>
                      )}
                    </Col>
                    <Col md={3}>
                      <Form.Label maxlength={11} className="m-0 mt-4 p-0">
                        {t('municipal_registration')}
                      </Form.Label>
                      <Form.Control
                        {...register('inscricao_municipal')}
                      ></Form.Control>
                    </Col>
                    <Col md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('tax_regime')}
                      </Form.Label>
                      <Form.Select
                        {...register('regime_tributario', {
                          required: 'Regime Tributário obrigatório',
                        })}
                      >
                        <option value="" disabled>
                          {t('select_an_option')}
                        </option>
                        <option value="1">{t('simple_national')}</option>
                        <option value="2">
                          {t('simple_national')} -{' '}
                          {t('Excess_gross_revenue_sublimit')}
                        </option>
                        <option value="3">{t('normal_regime')}</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="contact">
                  <Row>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('email')}
                      </Form.Label>
                      <Form.Control {...register('email')}></Form.Control>
                      {errors.email && (
                        <span className="text-danger">
                          {errors.email.message}
                        </span>
                      )}
                    </Col>
                    <Col md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('phone_number')}
                      </Form.Label>
                      <Form.Control
                        maxLength={11}
                        {...register('telefone')}
                        onChange={(event) => {
                          event.target.value = event.target.value.replace(
                            /(\d{2})(\d{5})(\d{4})/,
                            '($1) $2-$3'
                          )
                          setPhoneMasked(event.target.value)
                        }}
                      ></Form.Control>
                      {errors.telefone && (
                        <span className="text-danger">
                          {errors.telefone.message}
                        </span>
                      )}
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="address">
                  <Row>
                    <Col md={2}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('zip_code')}
                      </Form.Label>
                      <Form.Control
                        maxLength={8}
                        {...register('cep', { required: 'CEP obrigatório' })}
                        onChange={(event) => {
                          mask(event, 'cep')
                          setCepMasked(event.target.value)
                        }}
                      ></Form.Control>
                      {errors.cep && (
                        <span className="text-danger">
                          {errors.cep.message}
                        </span>
                      )}
                    </Col>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('street')}
                      </Form.Label>
                      <Form.Control {...register('logradouro')}></Form.Control>
                      {errors.logradouro && (
                        <span className="text-danger">
                          {errors.logradouro.message}
                        </span>
                      )}
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('number')}
                      </Form.Label>
                      <Form.Control {...register('numero')}></Form.Control>
                      {errors.numero && (
                        <span className="text-danger">
                          {errors.numero.message}
                        </span>
                      )}
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('complement')}
                      </Form.Label>
                      <Form.Control {...register('complemento')}></Form.Control>
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('neighborhood')}
                      </Form.Label>
                      <Form.Control {...register('bairro')}></Form.Control>
                      {errors.bairro && (
                        <span className="text-danger">
                          {errors.bairro.message}
                        </span>
                      )}
                    </Col>
                    <Col xs={6} md={3}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('municipality')}
                      </Form.Label>
                      <Form.Control {...register('municipio')}></Form.Control>
                      {errors.municipio && (
                        <span className="text-danger">
                          {errors.municipio.message}
                        </span>
                      )}
                    </Col>
                    <Col md={2}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('fu')}
                      </Form.Label>
                      <Form.Select
                        {...register('uf', { required: 'Uf obrigatório' })}
                      >
                        <option value="" disabled>
                          {' '}
                          Selecione o estado
                        </option>
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
                      {errors.uf && (
                        <span className="text-danger">{errors.uf.message}</span>
                      )}
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="responsable">
                  <Row>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('responsible_name')}
                      </Form.Label>
                      <Form.Control
                        {...register('nome_responsavel')}
                      ></Form.Control>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('responsible_ssn')}
                      </Form.Label>
                      <Form.Control
                        {...register('cpf_responsavel')}
                      ></Form.Control>
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey="accounting">
                  <Row>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        {t('ssn_ein')}
                      </Form.Label>
                      <Form.Control
                        {...register('cpf_cnpj_contabilidade')}
                      ></Form.Control>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="m-0 mt-4 p-0">
                        Email contabilidade
                      </Form.Label>
                      <Form.Control
                        {...register('email_contabilidade')}
                      ></Form.Control>
                      {errors.email_contabilidade && (
                        <span className="text-danger">
                          {errors.email_contabilidade.message}
                        </span>
                      )}
                    </Col>
                  </Row>
                </Tab.Pane>
                {/* <Tab.Pane eventKey='tokens'>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Label className="m-0 p-0 mt-4">{t('production_token')}</Form.Label>
                                            <Form.Control></Form.Control>
                                        </Col>
                                    </Row>
                                </Tab.Pane> */}
                <Tab.Pane
                  eventKey="docFiscal"
                  style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}
                >
                  <Form.Switch
                    label="NFCe"
                    {...register('habilita_nfce')}
                    className="mb-3 mt-3"
                    onChange={(event) => {
                      setNfce(event?.target.checked)
                    }}
                  ></Form.Switch>
                  {errors.habilita_nfce && (
                    <span className="text-danger">
                      {errors.habilita_nfce.message}
                    </span>
                  )}
                  {nfce && (
                    <Row className="d-flex">
                      <div className="mt-2">
                        <p className="fw-bold m-0 p-0">{t('production')}</p>
                        <Row>
                          <Col xs={6} md={3}>
                            <Form.Label className="m-0 mt-2 p-0 pb-2">
                              {t('series')}
                            </Form.Label>
                            <Form.Control
                              defaultValue="1"
                              {...register('serie_nfce_producao')}
                            ></Form.Control>
                          </Col>
                          <Col xs={6} md={3}>
                            <Form.Label className="m-0 mt-2 text-nowrap p-0 pb-2">
                              {t('next_number')}
                            </Form.Label>
                            <Form.Control
                              defaultValue="1"
                              {...register('proximo_numero_nfce_producao')}
                            ></Form.Control>
                          </Col>
                          <Col xs={6} md={3}>
                            <Form.Label className="m-0 mt-2 text-nowrap p-0 pb-2">
                              {t('security_code_production')}
                            </Form.Label>
                            <Form.Control
                              {...register('csc_nfce_producao')}
                            ></Form.Control>
                            {errors.csc_nfce_producao && (
                              <span className="text-danger">
                                {errors.csc_nfce_producao.message}
                              </span>
                            )}
                          </Col>
                          <Col xs={6} md={3}>
                            <Form.Label className="m-0 mt-2 text-nowrap p-0 pb-2">
                              {t('id_production_token')}
                            </Form.Label>
                            <Form.Control
                              {...register('id_token_nfce_producao')}
                            ></Form.Control>
                            {errors.id_token_nfce_producao && (
                              <span className="text-danger">
                                {errors.id_token_nfce_producao.message}
                              </span>
                            )}
                          </Col>
                        </Row>
                      </div>
                    </Row>
                  )}
                </Tab.Pane>
                <Tab.Pane eventKey="config">
                  {/* <div
                    className="d-flex align-itens-center"
                    style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}
                  >
                    <Form.Switch
                      className="d-flex align-items-center"
                      {...register('enviar_email_destinatario')}
                    ></Form.Switch>
                    <Form.Label className="ms-3 mt-3">
                      ({t('all_documents')}) {t('send_email_to_recipient')} -{' '}
                      {t('production')}
                    </Form.Label>
                  </div> */}
                  <div
                    className="d-flex align-itens-center"
                    style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}
                  >
                    <Form.Switch
                      className="d-flex align-items-center"
                      {...register('discrimina_impostos')}
                    ></Form.Switch>
                    <Form.Label className="ms-3 mt-3">
                      ({t('electronic_fiscal_note')},{' '}
                      {t('electronic_consumer_fiscal_note')}){' '}
                      {t('discriminate_taxes')}
                    </Form.Label>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </form>

      <div
        ref={buttonFooter}
        className={`${formState.dirtyFields.nome ? 'btn-footer-show' : 'btn-footer'} d-flex justify-content-end position-fixed w-100 bottom-0 m-0 p-3`}
        style={{
          left: '0 ',
          right: '0 ',
        }}
      >
        <Button
          className="flex-grow-1 flex-md-grow-0"
          type="submit"
          form="createCompany"
          variant="success"
        >
          {grovenfe ? t('update') : t('create')}
        </Button>
      </div>
    </>
  )
}
