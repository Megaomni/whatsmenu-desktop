import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { DateTime } from 'luxon'
import { UserType } from 'next-auth'
import { signIn, useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import { Button, Col, Container, Form, FormGroup, InputGroup, Modal, Row, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { BsFillArrowLeftCircleFill } from 'react-icons/bs'
import { FaCheck } from 'react-icons/fa'
import { z } from 'zod'
import { AppContext } from '../../../context/app.ctx'
import { Plan, SystemProduct } from '../../../types/plan'
import Profile from '../../../types/profile'
import { apiRoute, currency, mask } from '../../../utils/wm-functions'
import { Plans } from '../../Plans'
import { api } from 'src/lib/axios'

const PixNegotiationSchema = z.object({
  fee: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0.49 && val <= 0.99, {
      message: 'O valor deve estar entre 0.49 e 0.99',
    }),
  expiration_date: z.string().nullable(),
  profileId: z.number(),
})

type PixNegotiationSchemaInput = z.infer<typeof PixNegotiationSchema>

interface ClientConfigProps {
  returnList: any
  plans: Plan[]
  user: UserType
  systemProducts: SystemProduct[]
}

export function ClientConfig({ returnList, plans, ...props }: ClientConfigProps) {
  const { handleShowToast, handleConfirmModal, user: userContext } = useContext(AppContext)
  const { data: session } = useSession()

  const [user, setUser] = useState(props.user)
  const [installments, setInstallments] = useState<number>(1)

  const [invoiceItems, setInvoiceItems] = useState<
    {
      id: number
      value: number
      quantity: number
      service: string
      name: string
      price_id: string
    }[]
  >([])

  const [secretNumberInvalid, setSecretNumberInvalid] = useState<{
    type: string
    valid: boolean
  }>()

  const [emailInvalid, setEmailInvalid] = useState<boolean>()
  const [showConfirmationUnlinkAsaas, setShowConfirmationUnlinkAsaas] = useState(false)
  const [showConfirmationDeleteAddresses, setShowConfirmationDeleteAddresses] = useState(false)

  const lastPixNegotiation = user?.profile?.options?.asaas?.negotiation?.pix.at(-1)
  const pixFeeExpirationDayCount = lastPixNegotiation
    ? DateTime.fromFormat(lastPixNegotiation?.expiration_date!, 'yyyy-MM-dd HH:mm:ss').diffNow('days').days
    : 0

  const pixNegotiationForm = useForm<PixNegotiationSchemaInput>({
    resolver: zodResolver(PixNegotiationSchema),
    defaultValues: {
      fee: lastPixNegotiation?.fee,
      profileId: user.profile?.id ?? 0,
      expiration_date: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
    },
  })

  const handleDeleteAdresses = async () => {
    try {
      const profileId = user.profile?.id
      const { data } = await apiRoute('/adm/deleteAddresses', session, 'POST', { profileId })
      handleShowToast({
        type: 'success',
        title: 'Excluir Endereços',
        content: 'Endereços excluídos com sucesso!',
      })
      setUser({ ...user, ...data })
    } catch (error) {
      console.error(error)
      handleShowToast({
        type: 'erro',
        title: 'Excluir Endereços',
        content: 'Erro ao excluir endereços. Verifique o console para mais detalhes.',
      })
    }
  }

  const handleSetNewAsaasPixFee = async (data: PixNegotiationSchemaInput) => {
    data.expiration_date = DateTime.local().plus({ days: 90 }).toFormat('yyyy-MM-dd HH:mm:ss')
    try {
      const { data: pix } = await apiRoute('/dashboard/profile/addNewPixNegotiationAsaas', session, 'POST', data)
      setUser((state) => {
        if (state.profile && state.profile.options?.asaas?.negotiation) {
          state.profile.options?.asaas?.negotiation.pix.push(pix)
        }
        return state
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        type: 'erro',
        content: (error as AxiosError<any, any>)?.response?.data.message,
      })
      throw error
    }
  }

  const handleChange = (value: any, key: string) => {
    setUser({ ...user, [key]: value })
  }

  const handleSaveUser = async () => {
    const body = {
      id: user.id,
      name: user.name,
      email: user.email,
      secretNumber: user.secretNumber,
      whatsapp: user.whatsapp,
      due: user.due,
      obs: user.controls?.obs,
      password: user.password,
      canceled: user.controls?.canceled,
      disableInvoice: user.controls?.disableInvoice,
      beta: user.controls?.beta,
      print: user.controls?.print,
      attempts: user.controls?.attempts,
    }
    try {
      const { data } = await apiRoute('/adm/user', session, 'PATCH', body)
      setUser({ ...user, ...data.user })
      handleShowToast({
        type: 'success',
        title: 'Usuário',
        content: `Usuário ${data.user.id} atualizado com sucesso`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: 'Deu ruim',
        content: 'Falar com o pessoal do T.I',
      })
    }
  }

  const handleSaveUserProfile = async () => {
    if (user.profile) {
      const body = {
        id: user.profile.id,
        name: user.profile.name,
        status: user.profile.status,
        showTotal: user.profile.showTotal,
        km: user.profile.options.delivery.enableKm,
        whatsapp: user.profile.whatsapp,
        twoSend: !!user.profile.options.twoSend,
        onlinePix: user.profile.options.onlinePix,
        onlineCard: user.profile.options.onlineCard,
        inventoryControl: user.profile.options.inventoryControl,
        slug: user.profile.slug,
        legacyPix: user.profile.options.legacyPix,
      }
      try {
        const { data } = await apiRoute('/adm/profile', session, 'PATCH', body)
        user.profile = data.profile
        setUser(user)
        handleShowToast({
          type: 'success',
          title: 'Perfil do Usuário',
          content: `Perfil ${data.profile.id} atualizado com sucesso`,
        })
      } catch (error) {
        console.error(error)
        return handleShowToast({
          type: 'erro',
          title: 'Deu ruim',
          content: (error as AxiosError<Error, any>)?.response?.data.message.includes('slug')
            ? (error as AxiosError<Error, any>)?.response?.data.message
            : 'Falar com o pessoal do T.I',
        })
      }
    }
  }

  async function unlinkAsaas() {
    const body = {
      options: user.profile?.options,
      id: user.profile?.id,
    }
    try {
      const { data } = await apiRoute('/adm/asaas', session, 'POST', body)
      if (user.profile) {
        user.profile.options = data.options
      }
      setUser(user)
      handleShowToast({
        type: 'success',
        title: 'Perfil do Usuário',
        content: `Conta Asaas desvinculada do Perfil`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: 'Perfil do Usuário',
        content: `Não foi possível desvincular a Conta Asaas do Perfil`,
      })
    }
  }

  const handleEmitAddons = async () => {
    if (!invoiceItems?.length) {
      handleShowToast({
        type: 'alert',
        title: 'Adicionais',
        content: `Não há serviços para gerar`,
      })
      return
    }

    try {
      const { data } = await apiRoute('/dashboard/invoices/addon/emmit', session, 'POST', {
        items: invoiceItems,
        userId: user.id,
        installments,
      })
      user.invoices?.push(data.response)
      setUser(user)
      setInvoiceItems([])

      handleShowToast({
        type: 'success',
        title: 'Adicionais',
        content: `Boleto gerado com sucesso`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: 'Emitir Adicionais' })
    }
  }

  const handleDropInvoice = async (invoice: any) => {
    try {
      if (!user.controls.paymentInfo && !invoice.requests?.length) {
        handleShowToast({
          title: 'Baixa Invoice',
          content: 'Certifique-se que foi gerado um boleto para esta fatura',
        })

        return
      }
      const { data } = await apiRoute('/administrator-api/payment/paghiper/manualy-paid', session, 'PUT', {
        invoice: user.controls.paymentInfo ? invoice : invoice.requests[0],
      })

      invoice.status = 'paid'
      if (user.invoices) {
        setUser({
          ...user,
          invoices: [...user.invoices],
        })
      }
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: 'Baixa de Fatura' })
    }
  }

  const handleResetSecurityKey = async () => {
    try {
      await apiRoute('/dashboard/account/resetSecurityKey', session, 'PATCH', {
        userId: user.id,
      })
      handleShowToast({
        type: 'success',
        title: 'Resetar chave de segurança',
        size: 30,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: 'Resetar chave de segurança',
        size: 30,
      })
    }
  }

  const handleAddSupport = async () => {
    try {
      const { data } = await apiRoute('/adm/user/support/add', session, 'POST', { user: user.id })
      handleShowToast({ type: 'success', title: 'Atribuir Suporte' })
      setUser({ ...user, ...data })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: 'Atribuir Suporte' })
    }
  }

  const handleSwitchUser = async () => {
    sessionStorage.clear()
    try {
      const { data } = await api.get(`/login/switch/${user.id}?admId=${session?.user?.id}`)
      signIn('credentials', { switchUser: JSON.stringify(data) })
      handleShowToast({
        type: 'success',
        title: 'Logando...',
        content: 'Acessando conta do usuário',
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: 'Deu ruim' })
    }
  }

  const handleCancelUnlinkAsaas = () => setShowConfirmationUnlinkAsaas(false)
  const haldleCancelDeleteAddresses = () => setShowConfirmationDeleteAddresses(false)

  const handleShowModalConfirmationUnlinkAsaas = () => setShowConfirmationUnlinkAsaas(true)
  const handleShowModalConfirmationDeleteAddresses = () => setShowConfirmationDeleteAddresses(true)

  return (
    <>
      <Container fluid className="mx-0 p-0 text-nowrap">
        <Row>
          <Col className="ps-2 d-flex justify-content-between align-items-baseline">
            <Button onClick={returnList} variant="white" className="ps-0">
              <BsFillArrowLeftCircleFill size={30} />
              <span>Voltar para Lista</span>
            </Button>
            {user?.profile?.options?.asaas && <img src="/images/logo-asaas-2.svg" alt="Logo Asaas" />}
          </Col>
        </Row>
        <Row>
          <Col className="overflow-auto">
            {user.controls?.serviceStart && (
              <div className="bd-callout bd-callout-success d-inline-block py-2">
                <div className="d-flex gap-4 text-nowrap align-items-center fs-7">
                  <div>
                    <FaCheck fontSize={32} className="text-green-500" />
                  </div>
                  <div className="">
                    <h4>Cardápio</h4>
                    <span>Cliente contratou cadastro de cardápio</span>
                  </div>
                </div>
              </div>
            )}

            {user.controls?.salePrint && (
              <div className="bd-callout bd-callout-success d-inline-block py-2">
                <div className="d-flex gap-4 text-nowrap align-items-center fs-7">
                  <div>
                    <FaCheck fontSize={32} className="text-green-500" />
                  </div>
                  <div className="">
                    <h4>Impressora</h4>
                    <span>O cliente comprou impressora</span>
                  </div>
                </div>
              </div>
            )}
          </Col>
        </Row>
        <Row className="mt-5 w-100">
          <Col className="d-flex justify-content-between flex-column flex-md-row">
            <span>Dados do Usúario: {user.id}</span>
            {user.sellerId && (
              <span>
                Vendedor: <b>{user.seller?.name}</b>
              </span>
            )}
            {user.support && (
              <span>
                Suporte Responsável: <b>{user.support.name}</b>
              </span>
            )}
          </Col>
          {!user.support && (
            <Col md="4" className="d-flex justify-content-end position-relative my-3 my-md-0">
              <Button
                variant="warning text-white"
                className="position-absolute z-index"
                style={{ bottom: '-35px', right: '35px', zIndex: 10 }}
                onClick={handleAddSupport}
              >
                Atribuir Suporte
              </Button>
            </Col>
          )}
        </Row>
        <hr />
        <Row className="fs-7 fw-bold">
          <Col sm="12" md className="mb-2 mb-md-0">
            <FormGroup>
              <Form.Label>Nome</Form.Label>
              <Form.Control placeholder="Sem nome" value={user.name ?? ''} onChange={(e) => handleChange(e.target.value, 'name')} />
            </FormGroup>
          </Col>
          <Col sm="12" md className="mb-2 mb-md-0">
            <FormGroup>
              <Form.Label>E-mail</Form.Label>
              <div className="position-relative">
                <Form.Control
                  placeholder="Sem Email"
                  value={user.email ?? ''}
                  isInvalid={emailInvalid}
                  isValid={!emailInvalid}
                  onChange={(e) => {
                    setEmailInvalid(mask(e, 'email').valid)
                    handleChange(e.target.value, 'email')
                  }}
                />
                <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }} className="mt-2">
                  Email inválido
                </Form.Control.Feedback>
              </div>
            </FormGroup>
          </Col>
          <Col sm="12" md>
            <FormGroup>
              <Form.Label>CPF/CNPJ</Form.Label>
              <div className="position-relative">
                <Form.Control
                  placeholder="Sem CPF/CNPJ"
                  value={user.secretNumber ?? ''}
                  isInvalid={secretNumberInvalid && !secretNumberInvalid?.valid}
                  isValid={secretNumberInvalid?.valid}
                  onChange={(e) => {
                    const isValid = mask(e, 'cpf/cnpj')
                    setSecretNumberInvalid(isValid)
                    handleChange(e.target.value, 'secretNumber')
                  }}
                />
                <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }} className="mt-2">
                  {secretNumberInvalid?.type} inválido
                </Form.Control.Feedback>
              </div>
            </FormGroup>
          </Col>
        </Row>
        <Row className="mt-4 fs-7 fw-bold">
          <Col sm="12" md className="mb-2 mb-sm-0 ">
            <FormGroup>
              <Form.Label>WhatsApp</Form.Label>
              <Form.Control
                placeholder="Sem WhatsApp"
                value={user.whatsapp ?? ''}
                onChange={(e) => {
                  mask(e, 'tel')
                  handleChange(e.target.value, 'whatsapp')
                }}
              />
            </FormGroup>
          </Col>
          <Col sm="12" md>
            <FormGroup>
              <Form.Label>Data de Cadastro</Form.Label>
              <Form.Control placeholder="Sem Data" disabled value={DateTime.fromSQL(user.created_at).toFormat('dd/MM/yyyy hh:mm') ?? ''} />
            </FormGroup>
          </Col>
          <Col sm="12" md className="mb-2 mb-sm-0 ">
            <FormGroup>
              <Form.Label>Tentativas de Login</Form.Label>

              <Row>
                <Col>
                  <Form.Control placeholder="0" className="text-center" disabled readOnly type="text" value={user.controls.attempts} />
                </Col>
                {/* <Col sm='9'>
                  <Button variant="success" className="form-control"  onClick={() => resetAttempts()}>Resetar</Button>
                </Col> */}
              </Row>
            </FormGroup>
          </Col>
        </Row>
        <Row className="mt-4 fs-7">
          <Col sm="12" md className="d-flex">
            <Row className="fs-7 fw-bold">
              <Col className="mb-2 mb-md-0">
                <FormGroup>
                  <Form.Label>Vencimento</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Vazio"
                    value={user.due ?? ''}
                    min={1}
                    max={31}
                    onChange={(e) => {
                      e.target.value = Number(e.target.value) > 31 ? '31' : e.target.value
                      handleChange(e.target.value, 'due')
                    }}
                  />
                </FormGroup>
              </Col>
              <Col sm="12" md className="mb-2 mb-md-0">
                <FormGroup>
                  <Form.Label>Forma de Pagamento - Adm</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      setUser({
                        ...user,
                        controls: {
                          ...user.controls,
                          disableInvoice: !!Number(e.target.value),
                        },
                      })
                    }}
                    value={Number(user.controls?.disableInvoice ?? 0)}
                  >
                    <option value={0}>Boleto</option>
                    <option value={1}>Cartão</option>
                  </Form.Select>
                </FormGroup>
              </Col>
              {(userContext?.controls.type === 'adm' || userContext?.controls.type === 'manager') && (
                <Col sm="12" md className="mb-2 mb-md-0">
                  <FormGroup>
                    <Form.Label>Senha</Form.Label>
                    <Form.Control type="password" placeholder="Digite a nova senha" onChange={(e) => handleChange(e.target.value, 'password')} />
                  </FormGroup>
                </Col>
              )}
            </Row>
          </Col>
          <Col className="d-flex justify-content-around gap-2 fs-7 fw-bold flex-column flex-md-row  ">
            {(userContext?.controls.type === 'adm' || userContext?.controls.type === 'manager') && (
              <FormGroup className="d-flex flex-column flex-grow-1">
                <Form.Label>Chave de Segurança</Form.Label>
                <Button onClick={handleResetSecurityKey}>Resetar</Button>
              </FormGroup>
            )}
            <FormGroup className="d-flex flex-column flex-grow-1">
              <Form.Label>Acessar Painel</Form.Label>
              <Button
                onClick={handleSwitchUser}
                disabled={userContext?.controls?.type !== 'adm' && (user?.controls?.type === 'adm' || user?.controls?.type === 'manager')}
                title={
                  userContext?.controls?.type !== 'adm' && user?.controls?.type === 'adm'
                    ? 'Você não tem permissão para acessar uma conta Administradora'
                    : ''
                }
              >
                Acessar
              </Button>
            </FormGroup>
            <FormGroup className="d-flex flex-column flex-grow-1">
              <Form.Label>Limpar Endereços</Form.Label>
              <Button onClick={handleShowModalConfirmationDeleteAddresses}>Limpar</Button>
            </FormGroup>
          </Col>
        </Row>
        <Modal show={showConfirmationDeleteAddresses} onHide={haldleCancelDeleteAddresses} centered>
          <Modal.Header>
            <h4 className="m-0 p-0">Excluir Endereços</h4>
          </Modal.Header>
          <Modal.Body className="fs-5 m-0 p-0 p-4">Você deseja excluir os endereços desse cliente?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="btn-danger" onClick={haldleCancelDeleteAddresses}>
              Não
            </Button>
            <Button
              variant="success"
              onClick={() => {
                handleDeleteAdresses()
                haldleCancelDeleteAddresses()
              }}
            >
              Sim
            </Button>
          </Modal.Footer>
        </Modal>
        {(userContext?.controls?.type === 'adm' || userContext?.controls?.type === 'manager') && (
          <Row className="mt-4 fs-7 fw-bold">
            <Col>
              <FormGroup>
                <Form.Label>Cancelamento Usuário</Form.Label>
                <Form.Switch
                  label="Cancelar cobranças deste usuário?"
                  id="Cancelar cobranças deste usuário?"
                  className="text-wrap"
                  checked={user.controls?.canceled ?? false}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      controls: {
                        ...user.controls,
                        canceled: e.target.checked,
                      },
                    })
                  }
                />
              </FormGroup>
            </Col>
            <Col>
              <FormGroup>
                <Form.Label>
                  Versão Next <span className="text-uppercase">(teste)</span>
                </Form.Label>
                <Form.Switch
                  id="nextVersion"
                  label="Ativar"
                  className="text-wrap"
                  checked={user.controls?.beta}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      controls: {
                        ...user.controls,
                        beta: e.target.checked,
                      },
                    })
                  }
                />
              </FormGroup>
            </Col>
            <Col>
              <FormGroup>
                <Form.Label>
                  Impressão Automática pelo navegador <span className="text-uppercase">(teste)</span>
                </Form.Label>
                <Form.Switch
                  id="webPrint"
                  label="Ativar"
                  className="text-wrap"
                  checked={user.controls?.print?.web}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      controls: {
                        ...user.controls,
                        print: {
                          ...user?.controls?.print,
                          web: e.target.checked,
                        },
                      },
                    })
                  }
                />
              </FormGroup>
            </Col>
          </Row>
        )}
        <FormGroup className="fw-bold my-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={user.controls?.obs ?? ''}
            onChange={(e) =>
              setUser({
                ...user,
                controls: {
                  ...user.controls,
                  obs: e.target.value,
                },
              })
            }
          />
        </FormGroup>
        <Row>
          <Col className="d-flex gap-2 justify-content-end">
            <Button
              className="mt-3 flex-grow-1 flex-md-grow-0"
              variant="success"
              onClick={handleSaveUser}
              disabled={(secretNumberInvalid && !secretNumberInvalid?.valid) || emailInvalid}
            >
              Salvar
            </Button>
          </Col>
        </Row>
        <Row className="mt-3 mt-md-0">
          <Col className="text-start position-relative">
            <span className="position-absolute fw-bold" style={{ bottom: '-18px' }}>
              Perfil - {user.profile?.id ?? 'Não Cadastrado!'}
            </span>
          </Col>
        </Row>
        <hr />
        {user.profile && (
          <>
            <Row>
              <Col sm="6" className="my-2 my-lg-0">
                <Form.Label>
                  <b>Título</b>
                </Form.Label>
                <Form.Control defaultValue={user.profile.name} />
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Label>
                  <b>Whatsapp</b>
                </Form.Label>
                <Form.Control
                  value={user.profile.whatsapp}
                  onChange={(e) => setUser((prevUser) => ({ ...prevUser, profile: { ...(prevUser.profile as Profile), whatsapp: e.target.value } }))}
                />
              </Col>
              <Col sm>
                <Form.Label>
                  <b>SLUG</b>
                </Form.Label>
                <Form.Control
                  value={user.profile.slug}
                  onChange={(e) => setUser((prevUser) => ({ ...prevUser, profile: { ...(prevUser.profile as Profile), slug: e.target.value } }))}
                />
              </Col>
            </Row>
            <Row className="my-4 mx-2">
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Bloquear Perfil"
                  label="Bloquear Perfil"
                  checked={!user.profile.status}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: { ...user.profile, status: !e.target.checked },
                      })
                    }
                  }}
                />
                {/* <Form.Label>
                  <b>Status</b>
                </Form.Label>
                <Form.Select>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </Form.Select> */}
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Valor no Whatsapp?"
                  label="Valor no Whatsapp?"
                  checked={user.profile.showTotal}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          showTotal: e.target.checked,
                        },
                      })
                    }
                  }}
                />
                {/* <Form.Label>
                  <b>Valor no Whatsapp?</b>
                </Form.Label>
                <Form.Select>
                  <option value="">Sim</option>
                  <option value="">Não</option>
                </Form.Select> */}
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Habilitar frete por KM"
                  label="Habilitar frete por KM"
                  checked={user.profile.options.delivery.enableKm}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            delivery: {
                              ...user.profile.options.delivery,
                              enableKm: e.target.checked,
                            },
                          },
                        },
                      })
                    }
                  }}
                />
                {/* <Form.Label>
                  <b>Config.KM</b>
                </Form.Label>
                <Form.Select>
                  <option value="">Sim</option>
                  <option value="">Não</option>
                </Form.Select> */}
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Duplo envio Whatsapp"
                  label="Duplo envio Whatsapp"
                  checked={user.profile.options.twoSend ?? false}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            twoSend: e.target.checked,
                          },
                        },
                      })
                    }
                  }}
                />
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Habilitar Pix Online"
                  label="Habilitar Pix Online"
                  disabled={user.profile.options.legacyPix}
                  checked={user.profile.options.legacyPix ? false : user.profile.options.onlinePix ?? false}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            onlinePix: e.target.checked,
                          },
                        },
                      })
                    }
                  }}
                />
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Habilitar Cartão Online"
                  label="Habilitar Cartão Online"
                  disabled={user.profile.options.legacyPix}
                  checked={user.profile.options.legacyPix ? false : user.profile.options.onlineCard ?? false}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            onlineCard: e.target.checked,
                          },
                        },
                      })
                    }
                  }}
                />
              </Col>
              <Col sm className="my-2 my-lg-0">
                <Form.Switch
                  id="Pix antigo"
                  label="Pix antigo"
                  checked={user.profile.options.legacyPix ?? false}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            legacyPix: e.target.checked,
                          },
                        },
                      })
                    }
                  }}
                />
              </Col>
            </Row>
            <Row className="mt-3">
              <Col sm={12} className="d-flex gap-2 text-end justify-content-end">
                <Button
                  onClick={() => window.open(`${process.env.WHATSMENU_BASE_URL}/${user.profile?.slug}`, '_blank')}
                  disabled={(secretNumberInvalid && !secretNumberInvalid?.valid) || emailInvalid}
                >
                  Cardápio
                </Button>
                <Button variant="success" onClick={handleSaveUserProfile}>
                  Salvar
                </Button>
              </Col>
            </Row>
            {user?.profile?.options?.asaas && (
              <div className="mt-3">
                <Row xs="12" className="d-flex  gap-3">
                  <p className="fw-bold border-bottom flex-grow-1 m-0 ">Asaas</p>
                  <Col sm="6" className=" border-separator pe-4 pb-3">
                    <form onSubmit={pixNegotiationForm.handleSubmit(handleSetNewAsaasPixFee)} className="d-flex gap-3 align-items-center">
                      <Form.Label className="m-0 position-relative flex-grow-1">
                        <p>Taxa negociação</p>
                        <Form.Control
                          step="0.01"
                          type="number"
                          readOnly={pixFeeExpirationDayCount > 0}
                          className={`${pixNegotiationForm.formState.errors.fee && 'is-invalid'} position-relative`}
                          {...pixNegotiationForm.register('fee')}
                        />
                        <Form.Control.Feedback tooltip type="invalid">
                          {pixNegotiationForm?.formState?.errors?.fee?.message}
                        </Form.Control.Feedback>
                      </Form.Label>
                      {lastPixNegotiation && (
                        <>
                          {pixFeeExpirationDayCount > 0 ? (
                            <div className="my-auto mb-2">Expira em {Math.round(pixFeeExpirationDayCount)} dias</div>
                          ) : (
                            <div className="my-auto mb-2">Expirou a {Math.abs(Math.round(pixFeeExpirationDayCount))} dias</div>
                          )}
                        </>
                      )}
                      <Button type="submit" variant="success" className="mt-auto" disabled={pixFeeExpirationDayCount > 0}>
                        Salvar
                      </Button>
                    </form>
                  </Col>

                  <Col xs="1" className="p-0 m-0 ms-3">
                    <p>Desvincular Conta Asaas</p>
                    <Button onClick={handleShowModalConfirmationUnlinkAsaas}>Desvincular</Button>
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}

        {/* MODAL DE CONFIRMAÇÃO PARA DESVINCULAR CONTA ASAAS */}
        <Modal show={showConfirmationUnlinkAsaas} onHide={handleCancelUnlinkAsaas} centered>
          <Modal.Header>
            <h4 className="m-0 p-0">Conta Asaas</h4>
          </Modal.Header>
          <Modal.Body className="fs-5 m-0 p-0 p-4">Você deseja desvincular a conta Asaas desse cliente?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelUnlinkAsaas}>
              Não
            </Button>
            <Button
              variant="success"
              onClick={() => {
                unlinkAsaas()
                handleCancelUnlinkAsaas()
              }}
            >
              Sim
            </Button>
          </Modal.Footer>
        </Modal>

        {user && plans && (
          <Plans
            user={user}
            setUser={setUser}
            period={user.controls?.period}
            plans={plans}
            type="update"
            defaultPlan={user.plans.find((plan) => plan.type === 'register')}
            products={props.systemProducts}
          />
        )}
        <span className="fw-bold">Adicionais</span>
        <hr />
        {props.systemProducts.map((prod) => {
          const price = prod.operations.prices.find((price) => price.id === prod.default_price)
          const value = (price?.currencies[user?.controls?.currency ?? price?.default_currency].unit_amount ?? 0) / 100
          const productItem = invoiceItems.find((item) => item.id === prod.id)
          if (prod.service === 'menu' || prod.service === 'printer') {
            return (
              <Row key={prod.name} className="mb-2">
                <Col>
                  <Form.Switch
                    id={prod.name}
                    label={prod.name}
                    checked={!!productItem}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (price) {
                          setInvoiceItems((oldItems) => {
                            if (!oldItems.some((item) => item.id === prod.id)) {
                              oldItems.push({
                                id: prod.id,
                                name: prod.name,
                                service: prod.service,
                                quantity: 1,
                                price_id: price?.id,
                                value,
                              })
                            }

                            return [...oldItems]
                          })
                        }
                      } else {
                        setInvoiceItems((oldItems) => {
                          return oldItems.filter((item) => item.id !== prod.id)
                        })
                      }
                    }}
                    className="my-auto"
                  />
                </Col>
                {prod.service === 'printer' && (
                  <Col>
                    <InputGroup>
                      <InputGroup.Text>Quantidade</InputGroup.Text>
                      <Form.Control
                        type="number"
                        min={1}
                        value={productItem?.quantity ?? 1}
                        onChange={(e) => {
                          setInvoiceItems((oldItems) => {
                            const item = oldItems.find((item) => item.id === prod.id)
                            if (item) {
                              item.quantity = Number(e.target.value)
                            }

                            return [...oldItems]
                          })
                        }}
                      />
                      <InputGroup.Text>
                        {currency({ value: value * (productItem?.quantity ?? 1), currency: user?.controls?.currency })}
                      </InputGroup.Text>
                    </InputGroup>
                  </Col>
                )}
                <Col sm={4}>
                  <Form.Select
                    disabled={!invoiceItems.some((item) => item.id === prod.id)}
                    onChange={(e) => {
                      if (productItem) {
                        productItem.value = Number(e.target.value)
                        if (e.target.dataset.priceId) {
                          productItem.price_id = e.target.dataset.priceId
                        }
                        setInvoiceItems((oldItems) => [...oldItems])
                      }
                    }}
                  >
                    {prod.operations.prices.map((price) => {
                      const currencyMoney = price.currencies[user?.controls?.currency ?? 'brl']

                      return (
                        <option
                          key={price.id}
                          selected={price.id === prod.default_price}
                          value={currencyMoney.unit_amount / 100}
                          data-price-id={price.id}
                        >
                          {currency({ value: currencyMoney.unit_amount / 100, currency: user?.controls?.currency })}
                        </option>
                      )
                    })}
                  </Form.Select>
                </Col>
              </Row>
            )
          }
        })}
        <Row>
          <Col>
            <span>
              <b>Total</b>:{' '}
              {currency({ value: invoiceItems.reduce((acc, item) => acc + item.value * item.quantity, 0), currency: user?.controls?.currency })}
            </span>
          </Col>
        </Row>
        {/* <Row>
          <Col md className="d-flex">
            <Form.Switch
              id="Serviço de Cadastro"
              label="Serviço de Cadastro"
              checked={newAddons.menuService.status}
              onChange={(e) => {
                setNewAddons({
                  ...newAddons,
                  menuService: {
                    ...newAddons.menuService,
                    status: e.target.checked,
                  },
                });
              }}
              className="my-auto"
            />
          </Col>
          <Col md="4">
            <FormGroup>
              <Form.Label>Valor</Form.Label>
              <Form.Control
                disabled={!newAddons.menuService.status}
                value={newAddons.menuService.value}
                onChange={(e) => {
                  mask(e, "currency");
                  setNewAddons({
                    ...newAddons,
                    menuService: {
                      ...newAddons.menuService,
                      value: e.target.value,
                    },
                  });
                }}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col md className="d-flex">
            <Form.Switch
              id="Impressora Térmica Bluetooth"
              label="Impressora Térmica Bluetooth"
              checked={newAddons.printer.status}
              onChange={(e) => {
                setNewAddons({
                  ...newAddons,
                  printer: { ...newAddons.printer, status: e.target.checked },
                });
              }}
              className="my-auto"
            />
          </Col>
          <>
            <Col md>
              <FormGroup>
                <Form.Label>Quantidade</Form.Label>
                <Form.Control
                  type="number"
                  disabled={!newAddons.printer.status}
                  value={newAddons.printer.quantity}
                  onChange={(e) => {
                    setNewAddons({
                      ...newAddons,
                      printer: {
                        ...newAddons.printer,
                        quantity: Number(e.target.value),
                      },
                    });
                  }}
                />
              </FormGroup>
            </Col>
            <Col md>
              <FormGroup>
                <Form.Label>Valor</Form.Label>
                <Form.Control
                  readOnly
                  defaultValue={newAddons.printer.value.toFixed(2)}
                />
              </FormGroup>
            </Col>
          </>
        </Row> */}
        <Row>
          <Col className="d-flex align-items-end gap-2">
            <Button className="px-5" variant="success" onClick={handleEmitAddons} disabled={!invoiceItems?.length}>
              Emitir
            </Button>
            <div>
              <Form.Label>Quantidade de Parcelas</Form.Label>
              <Form.Select
                value={installments}
                onChange={(e) => {
                  setInstallments(Number(e.target.value))
                }}
              >
                {Array(12)
                  .fill('')
                  .map((item, index) => {
                    const newIndex = index + 1

                    return (
                      <option key={newIndex} value={newIndex}>
                        {newIndex}
                      </option>
                    )
                  })}
              </Form.Select>
            </div>
          </Col>
        </Row>
        <span className="fw-bold">Faturas</span>
        <hr />
        <Table responsive striped hover className="align-middle text-center">
          <thead>
            <tr>
              <th>ID da Transação</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th className="col-1">Ação</th>
            </tr>
          </thead>
          <tbody>
            {user.invoices?.map((invoice: any) => (
              <tr key={invoice.id}>
                <td>{invoice.requests && invoice.requests[0] && invoice.requests[0].transactionId ? invoice.requests[0].transactionId : '-'}</td>
                <td>{currency({ value: invoice.value, currency: user?.controls?.currency })}</td>
                <td>{DateTime.fromISO(invoice.expiration).toFormat('dd/MM/yyyy')}</td>
                <td>{invoice.status === 'pending' || invoice.status === 'canceled' ? 'Pendente' : 'Paga'}</td>
                <td>
                  <Button
                    variant={`${invoice.status === 'paid' || userContext.controls.type !== 'adm' ? 'outline-' : ''}success`}
                    disabled={invoice.status === 'paid' || userContext.controls.type !== 'adm'}
                    onClick={async () => {
                      try {
                        if (!user.controls.paymentInfo) {
                          await handleDropInvoice(invoice)
                        } else {
                          handleConfirmModal({
                            title: 'Aviso',
                            message: `Esta ação irá remover usuário da ${user.controls.paymentInfo.gateway}`,
                            actionConfirm: async () => {
                              await handleDropInvoice(invoice)
                            },
                          })
                        }
                      } catch (error) {
                        console.error(error)
                      }
                    }}
                  >
                    Baixa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </>
  )
}
