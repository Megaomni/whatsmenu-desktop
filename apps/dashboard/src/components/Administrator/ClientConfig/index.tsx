import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import i18n from 'i18n'
import { DateTime } from 'luxon'
import { UserType } from 'next-auth'
import { signIn, useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import {
  Button,
  Col,
  Container,
  Form,
  FormGroup,
  InputGroup,
  Modal,
  Row,
  Table,
} from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsFillArrowLeftCircleFill } from 'react-icons/bs'
import { FaCheck } from 'react-icons/fa'
import { api } from 'src/lib/axios'
import { z } from 'zod'
import { AppContext } from '../../../context/app.ctx'
import { Plan, SystemProduct } from '../../../types/plan'
import Profile from '../../../types/profile'
import { apiRoute, mask } from '../../../utils/wm-functions'
import { Plans } from '../../Plans'
//
const PixNegotiationSchema = z.object({
  fee: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0.49 && val <= 0.99, {
      message: i18n.t('must_be_between'),
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

export function ClientConfig({
  returnList,
  plans,
  ...props
}: ClientConfigProps) {
  const { t } = useTranslation()
  const {
    handleShowToast,
    handleConfirmModal,
    user: userContext,
    currency,
  } = useContext(AppContext)
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
  const [showConfirmationUnlinkAsaas, setShowConfirmationUnlinkAsaas] =
    useState(false)
  const [showConfirmationDeleteAddresses, setShowConfirmationDeleteAddresses] =
    useState(false)

  const lastPixNegotiation =
    user?.profile?.options?.asaas?.negotiation?.pix.at(-1)
  const pixFeeExpirationDayCount = lastPixNegotiation
    ? DateTime.fromFormat(
        lastPixNegotiation?.expiration_date!,
        'yyyy-MM-dd HH:mm:ss'
      ).diffNow('days').days
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
      const { data } = await apiRoute('/adm/deleteAddresses', session, 'POST', {
        profileId,
      })
      handleShowToast({
        type: 'success',
        title: t('delete_addresses'),
        content: i18n.t(''),
      })
      setUser({ ...user, ...data })
    } catch (error) {
      console.error(error)
      handleShowToast({
        type: 'erro',
        title: i18n.t('delete_addresses'),
        content: i18n.t('error_deleting_addresses'),
      })
    }
  }

  const handleSetNewAsaasPixFee = async (data: PixNegotiationSchemaInput) => {
    data.expiration_date = DateTime.local()
      .plus({ days: 90 })
      .toFormat('yyyy-MM-dd HH:mm:ss')
    try {
      const { data: pix } = await apiRoute(
        '/dashboard/profile/addNewPixNegotiationAsaas',
        session,
        'POST',
        data
      )
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
        title: i18n.t('user'),
        content: `${i18n.t('user')} ${data.user.id} ${i18n.t('sucess_updated')}`,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: i18n.t('something_wrong'),
        content: i18n.t('talk_it_team'),
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
        locale: {
          language: user.profile.options.locale?.language || 'pt-BR',
          currency: user.profile.options.locale?.currency || 'BRL',
        },
      }
      try {
        const { data } = await apiRoute('/adm/profile', session, 'PATCH', body)
        user.profile = data.profile
        setUser(user)
        handleShowToast({
          type: 'success',
          title: i18n.t('user_profile'),
          content: `${i18n.t('profile')} ${data.profile.id} ${i18n.t('sucess_updated')}`,
        })
      } catch (error) {
        console.error(error)
        return handleShowToast({
          type: 'erro',
          title: i18n.t('something_wrong'),
          content: (
            error as AxiosError<Error, any>
          )?.response?.data.message.includes('slug')
            ? (error as AxiosError<Error, any>)?.response?.data.message
            : i18n.t('talk_it_team'),
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
        title: i18n.t('user_profile'),
        content: i18n.t('asaas_account_disconnected'),
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: i18n.t('user_profile'),
        content: i18n.t('unable_disconnect_asaas_account'),
      })
    }
  }

  const handleEmitAddons = async () => {
    if (!invoiceItems?.length) {
      handleShowToast({
        type: 'alert',
        title: i18n.t('add_ons'),
        content: i18n.t('there_no_services_generate'),
      })
      return
    }

    try {
      const { data } = await apiRoute(
        '/dashboard/invoices/addon/emmit',
        session,
        'POST',
        {
          items: invoiceItems,
          userId: user.id,
          installments,
        }
      )
      user.invoices?.push(data.response)
      setUser(user)
      setInvoiceItems([])

      handleShowToast({
        type: 'success',
        title: i18n.t('add_ons'),
        content: i18n.t('boleto_generated'),
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: i18n.t('issue_add_ons') })
    }
  }

  const handleDropInvoice = async (invoice: any) => {
    try {
      if (!user.controls.paymentInfo && !invoice.requests?.length) {
        handleShowToast({
          title: 'Baixa Invoice',
          content: i18n.t('make_sure_boleto_generated'),
        })

        return
      }
      const { data } = await apiRoute(
        '/administrator-api/payment/paghiper/manualy-paid',
        session,
        'PUT',
        {
          invoice: user.controls.paymentInfo ? invoice : invoice.requests[0],
        }
      )

      invoice.status = 'paid'
      if (user.invoices) {
        setUser({
          ...user,
          invoices: [...user.invoices],
        })
      }
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: i18n.t('invoice_settlement'),
      })
    }
  }

  const handleResetSecurityKey = async () => {
    try {
      await apiRoute('/dashboard/account/resetSecurityKey', session, 'PATCH', {
        userId: user.id,
      })
      handleShowToast({
        type: 'success',
        title: i18n.t('reset_security_key'),
        size: 30,
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({
        type: 'erro',
        title: i18n.t('reset_security_key'),
        size: 30,
      })
    }
  }

  const handleAddSupport = async () => {
    try {
      const { data } = await apiRoute(
        '/adm/user/support/add',
        session,
        'POST',
        { user: user.id }
      )
      handleShowToast({ type: 'success', title: i18n.t('assign_support') })
      setUser({ ...user, ...data })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: i18n.t('assign_support') })
    }
  }

  const handleSwitchUser = async () => {
    sessionStorage.clear()
    try {
      const { data } = await api.get(
        `/login/switch/${user.id}?admId=${session?.user?.id}`
      )
      signIn('credentials', { switchUser: JSON.stringify(data) })
      handleShowToast({
        type: 'success',
        title: i18n.t('logging_in'),
        content: i18n.t('acessing_user_account'),
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: i18n.t('something_wrong') })
    }
  }

  const YourComponent = () => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-BR')

    const onlanguagechange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLanguage = event.target.value
      setSelectedLanguage(newLanguage)
    }
  }

  const handleCancelUnlinkAsaas = () => setShowConfirmationUnlinkAsaas(false)
  const haldleCancelDeleteAddresses = () =>
    setShowConfirmationDeleteAddresses(false)

  const handleShowModalConfirmationUnlinkAsaas = () =>
    setShowConfirmationUnlinkAsaas(true)
  const handleShowModalConfirmationDeleteAddresses = () =>
    setShowConfirmationDeleteAddresses(true)
  return (
    <>
      <Container fluid className="mx-0 text-nowrap p-0">
        <Row>
          <Col className="d-flex justify-content-between align-items-baseline ps-2">
            <Button onClick={returnList} variant="white" className="ps-0">
              <BsFillArrowLeftCircleFill size={30} />
              <span>{t('back_to_list')}</span>
            </Button>
            {user?.profile?.options?.asaas && (
              <img src="/images/logo-asaas-2.svg" alt="Logo Asaas" />
            )}
          </Col>
        </Row>
        <Row>
          <Col className="overflow-auto">
            {user.controls?.serviceStart && (
              <div className="bd-callout bd-callout-success d-inline-block py-2">
                <div className="d-flex align-items-center fs-7 gap-4 text-nowrap">
                  <div>
                    <FaCheck fontSize={32} className="text-green-500" />
                  </div>
                  <div className="">
                    <h4>{t('menu')}</h4>
                    <span>{t('client_contracted_menu_registration')}</span>
                  </div>
                </div>
              </div>
            )}

            {user.controls?.salePrint && (
              <div className="bd-callout bd-callout-success d-inline-block py-2">
                <div className="d-flex align-items-center fs-7 gap-4 text-nowrap">
                  <div>
                    <FaCheck fontSize={32} className="text-green-500" />
                  </div>
                  <div className="">
                    <h4>{t('printer')}</h4>
                    <span>{t('client_purchased_printer')}</span>
                  </div>
                </div>
              </div>
            )}
          </Col>
        </Row>
        <Row className="w-100 mt-5">
          <Col className="d-flex justify-content-between flex-column flex-md-row">
            <span>
              {t('user_data')}: {user.id}
            </span>
            {user.sellerId && (
              <span>
                {t('salesperson')}: <b>{user.seller?.name}</b>
              </span>
            )}
            {user.support && (
              <span>
                {t('responsible_support')}: <b>{user.support.name}</b>
              </span>
            )}
          </Col>
          {!user.support && (
            <Col
              md="4"
              className="d-flex justify-content-end position-relative my-md-0 my-3"
            >
              <Button
                variant="warning text-white"
                className="position-absolute z-index"
                style={{ bottom: '-35px', right: '35px', zIndex: 10 }}
                onClick={handleAddSupport}
              >
                {t('assign_support')}
              </Button>
            </Col>
          )}
        </Row>
        <hr />
        <Row className="fs-7 fw-bold">
          <Col sm="12" md className="mb-md-0 mb-2">
            <FormGroup>
              <Form.Label>{t('name')}</Form.Label>
              <Form.Control
                placeholder={t('no_name')}
                value={user.name ?? ''}
                onChange={(e) => handleChange(e.target.value, 'name')}
              />
            </FormGroup>
          </Col>
          <Col sm="12" md className="mb-md-0 mb-2">
            <FormGroup>
              <Form.Label>E-mail</Form.Label>
              <div className="position-relative">
                <Form.Control
                  placeholder={t('no_email')}
                  value={user.email ?? ''}
                  isInvalid={emailInvalid}
                  isValid={!emailInvalid}
                  onChange={(e) => {
                    setEmailInvalid(mask(e, 'email').valid)
                    handleChange(e.target.value, 'email')
                  }}
                />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  style={{ zIndex: 0 }}
                  className="mt-2"
                >
                  {t('invalid_email')}
                </Form.Control.Feedback>
              </div>
            </FormGroup>
          </Col>
          <Col sm="12" md>
            <FormGroup>
              <Form.Label>{t('ssn_ein')}</Form.Label>
              <div className="position-relative">
                <Form.Control
                  placeholder={t('no_ssn_ein')}
                  value={user.secretNumber ?? ''}
                  isInvalid={secretNumberInvalid && !secretNumberInvalid?.valid}
                  isValid={secretNumberInvalid?.valid}
                  onChange={(e) => {
                    const isValid = mask(e, 'cpf/cnpj')
                    setSecretNumberInvalid(isValid)
                    handleChange(e.target.value, 'secretNumber')
                  }}
                />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  style={{ zIndex: 0 }}
                  className="mt-2"
                >
                  {secretNumberInvalid?.type} {t('invalid')}
                </Form.Control.Feedback>
              </div>
            </FormGroup>
          </Col>
        </Row>
        <Row className="fs-7 fw-bold mt-4">
          <Col sm="12" md className="mb-sm-0 mb-2 ">
            <FormGroup>
              <Form.Label>WhatsApp</Form.Label>
              <Form.Control
                placeholder={t('no_whatsapp')}
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
              <Form.Label>{t('registration_date')}</Form.Label>
              <Form.Control
                placeholder={t('no_date')}
                disabled
                value={
                  DateTime.fromSQL(user.created_at).toFormat(
                    `${t('date_format')} HH:mm'`
                  ) ?? ''
                }
              />
            </FormGroup>
          </Col>
          <Col sm="12" md className="mb-sm-0 mb-2 ">
            <FormGroup>
              <Form.Label>{t('login_attempts')}</Form.Label>

              <Row>
                <Col>
                  <Form.Control
                    placeholder="0"
                    className="text-center"
                    disabled
                    readOnly
                    type="text"
                    value={user.controls.attempts}
                  />
                </Col>
                {/* <Col sm='9'>
                  <Button variant="success" className="form-control"  onClick={() => resetAttempts()}>Resetar</Button>
                </Col> */}
              </Row>
            </FormGroup>
          </Col>
        </Row>
        <Row className="fs-7 mt-4">
          <Col sm="12" md className="d-flex">
            <Row className="fs-7 fw-bold">
              <Col className="mb-md-0 mb-2">
                <FormGroup>
                  <Form.Label>{t('due_date')}</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Vazio"
                    value={user.due ?? ''}
                    min={1}
                    max={31}
                    onChange={(e) => {
                      e.target.value =
                        Number(e.target.value) > 31 ? '31' : e.target.value
                      handleChange(e.target.value, 'due')
                    }}
                  />
                </FormGroup>
              </Col>
              <Col sm="12" md className="mb-md-0 mb-2">
                <FormGroup>
                  <Form.Label>{t('payment_method')} - Adm</Form.Label>
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
                    <option value={1}>{t('card')}</option>
                  </Form.Select>
                </FormGroup>
              </Col>
              {(userContext?.controls.type === 'adm' ||
                userContext?.controls.type === 'manager') && (
                <Col sm="12" md className="mb-md-0 mb-2">
                  <FormGroup>
                    <Form.Label>{t('password')}</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder={t('enter_new_password')}
                      onChange={(e) => handleChange(e.target.value, 'password')}
                    />
                  </FormGroup>
                </Col>
              )}
            </Row>
          </Col>
          <Col className="d-flex justify-content-around fs-7 fw-bold flex-column flex-md-row gap-2  ">
            {(userContext?.controls.type === 'adm' ||
              userContext?.controls.type === 'manager') && (
              <FormGroup className="d-flex flex-column flex-grow-1">
                <Form.Label>{t('security_key')}</Form.Label>
                <Button onClick={handleResetSecurityKey}>{t('reset')}</Button>
              </FormGroup>
            )}
            <FormGroup className="d-flex flex-column flex-grow-1">
              <Form.Label>{t('access_panel')}</Form.Label>
              <Button
                onClick={handleSwitchUser}
                disabled={
                  userContext?.controls?.type !== 'adm' &&
                  (user?.controls?.type === 'adm' ||
                    user?.controls?.type === 'manager')
                }
                title={
                  userContext?.controls?.type !== 'adm' &&
                  user?.controls?.type === 'adm'
                    ? i18n.t('not_have_permission_adm')
                    : ''
                }
              >
                {t('acess')}
              </Button>
            </FormGroup>
            <FormGroup className="d-flex flex-column flex-grow-1">
              <Form.Label>{t('clear_addresses')}</Form.Label>
              <Button onClick={handleShowModalConfirmationDeleteAddresses}>
                {t('clear')}
              </Button>
            </FormGroup>
          </Col>
        </Row>
        <Modal
          show={showConfirmationDeleteAddresses}
          onHide={haldleCancelDeleteAddresses}
          centered
        >
          <Modal.Header>
            <h4 className="m-0 p-0">{t('delete_addresses')}</h4>
          </Modal.Header>
          <Modal.Body className="fs-5 m-0 p-0 p-4">
            {t('delete_addresses_customer')}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              className="btn-danger"
              onClick={haldleCancelDeleteAddresses}
            >
              {t('no')}
            </Button>
            <Button
              variant="success"
              onClick={() => {
                handleDeleteAdresses()
                haldleCancelDeleteAddresses()
              }}
            >
              {t('yes')}
            </Button>
          </Modal.Footer>
        </Modal>
        {(userContext?.controls?.type === 'adm' ||
          userContext?.controls?.type === 'manager') && (
          <Row className="fs-7 fw-bold mt-4">
            <Col>
              <FormGroup>
                <Form.Label>{t('user_cancellation')}</Form.Label>
                <Form.Switch
                  label={t('cancel_charges_user')}
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
                  {t('version_next')}{' '}
                  <span className="text-uppercase">({t('test')})</span>
                </Form.Label>
                <Form.Switch
                  id="nextVersion"
                  label={t('activate')}
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
                  {t('automatic_printing_browser')}{' '}
                  <span className="text-uppercase">({t('test')})</span>
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
          <Form.Label>{t('notes')}</Form.Label>
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
          <Col className="d-flex justify-content-end gap-2">
            <Button
              className="flex-grow-1 flex-md-grow-0 mt-3"
              variant="success"
              onClick={handleSaveUser}
              disabled={
                (secretNumberInvalid && !secretNumberInvalid?.valid) ||
                emailInvalid
              }
            >
              {t('save')}
            </Button>
          </Col>
        </Row>
        <Row className="mt-md-0 mt-3">
          <Col className="position-relative text-start">
            <span
              className="position-absolute fw-bold"
              style={{ bottom: '-18px' }}
            >
              {t('profile')} - {user.profile?.id ?? `${t('not_registered')}!`}
            </span>
          </Col>
        </Row>
        <hr />
        {user.profile && (
          <>
            <Row>
              <Col sm="6" className="my-lg-0 my-2">
                <Form.Label>
                  <b>{t('title')}</b>
                </Form.Label>
                <Form.Control defaultValue={user.profile.name} />
              </Col>
              <Col sm className="my-lg-0 my-2">
                <Form.Label>
                  <b>{t('whatsapp')}</b>
                </Form.Label>
                <Form.Control
                  value={user.profile.whatsapp}
                  onChange={(e) =>
                    setUser((prevUser) => ({
                      ...prevUser,
                      profile: {
                        ...(prevUser.profile as Profile),
                        whatsapp: e.target.value,
                      },
                    }))
                  }
                />
              </Col>
              <Col sm>
                <Form.Label>
                  <b>SLUG</b>
                </Form.Label>
                <Form.Control
                  value={user.profile.slug}
                  onChange={(e) =>
                    setUser((prevUser) => ({
                      ...prevUser,
                      profile: {
                        ...(prevUser.profile as Profile),
                        slug: e.target.value,
                      },
                    }))
                  }
                />
              </Col>
            </Row>
            <Row className="mx-2 my-4">
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Perfil"
                  label={t('block_profile')}
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Valor no Whatsapp?"
                  label={`${t('value_whatsapp')}?`}
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Habilitar frete por KM"
                  label={t('enable_shipping_mi')}
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Duplo envio Whatsapp"
                  label={t('double_sending_whatsapp')}
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Habilitar Pix Online"
                  label={t('enable_pix_online')}
                  disabled={user.profile.options.legacyPix}
                  checked={
                    user.profile.options.legacyPix
                      ? false
                      : (user.profile.options.onlinePix ?? false)
                  }
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Habilitar Cartão Online"
                  label={t('enable_online_card')}
                  disabled={user.profile.options.legacyPix}
                  checked={
                    user.profile.options.legacyPix
                      ? false
                      : (user.profile.options.onlineCard ?? false)
                  }
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
              <Col sm className="my-lg-0 my-2">
                <Form.Switch
                  id="Pix antigo"
                  label={t('old_pix')}
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
            <Row className="mt-md-0 mt-3">
              <Col className="position-relative text-start">
                <span
                  className="position-absolute fw-bold"
                  style={{ bottom: '-18px' }}
                >
                  {t('internationalization')}
                </span>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col sm="6" className="my-lg-0 my-2">
                <Form.Label>
                  <b>{t('language')}</b>
                </Form.Label>
                <Form.Select
                  aria-label={t('select_language')}
                  value={user.profile?.options?.locale?.language}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value)
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            locale: {
                              ...user.profile.options.locale,
                              language: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  }}
                >
                  <option value="pt-BR">{t('portuguese_brazil')}</option>
                  <option value="en-US">{t('english_us')}</option>
                  <option value="fr-CH">{t('swiss_french_chf')}</option>
                  <option value="pt-PT">{t('portuguese_portugal')}</option>
                </Form.Select>
              </Col>
              <Col sm="6" className="my-lg-0 my-2">
                <Form.Label>
                  <b>{t('currency')}</b>
                </Form.Label>
                <Form.Select
                  aria-label={t('select_currency')}
                  value={user.profile.options?.locale?.currency}
                  onChange={(e) => {
                    if (user.profile) {
                      setUser({
                        ...user,
                        profile: {
                          ...user.profile,
                          options: {
                            ...user.profile.options,
                            locale: {
                              ...user.profile.options.locale,
                              currency: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  }}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="EUR">EUR (€)</option>
                </Form.Select>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col
                sm={12}
                className="d-flex justify-content-end gap-2 text-end"
              >
                <Button
                  onClick={() =>
                    window.open(
                      `${process.env.WHATSMENU_BASE_URL}/${user.profile?.slug}`,
                      '_blank'
                    )
                  }
                  disabled={
                    (secretNumberInvalid && !secretNumberInvalid?.valid) ||
                    emailInvalid
                  }
                >
                  {t('menu')}
                </Button>
                <Button variant="success" onClick={handleSaveUserProfile}>
                  {t('save')}
                </Button>
              </Col>
            </Row>
            {user?.profile?.options?.asaas && (
              <div className="mt-3">
                <Row xs="12" className="d-flex  gap-3">
                  <p className="fw-bold border-bottom flex-grow-1 m-0 ">
                    Asaas
                  </p>
                  <Col sm="6" className=" border-separator pb-3 pe-4">
                    <form
                      onSubmit={pixNegotiationForm.handleSubmit(
                        handleSetNewAsaasPixFee
                      )}
                      className="d-flex align-items-center gap-3"
                    >
                      <Form.Label className="position-relative flex-grow-1 m-0">
                        <p>{t('negotiation_fee')}</p>
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
                            <div className="my-auto mb-2">
                              {t('expires_in')}{' '}
                              {Math.round(pixFeeExpirationDayCount)} {t('days')}
                            </div>
                          ) : (
                            <div className="my-auto mb-2">
                              {t('expired_since')}{' '}
                              {Math.abs(Math.round(pixFeeExpirationDayCount))}{' '}
                              {t('days')}
                            </div>
                          )}
                        </>
                      )}
                      <Button
                        type="submit"
                        variant="success"
                        className="mt-auto"
                        disabled={pixFeeExpirationDayCount > 0}
                      >
                        {t('save')}
                      </Button>
                    </form>
                  </Col>

                  <Col xs="1" className="m-0 ms-3 p-0">
                    <p>{t('disconnect_account_asaas')}</p>
                    <Button onClick={handleShowModalConfirmationUnlinkAsaas}>
                      {t('unlink')}
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}

        {/* MODAL DE CONFIRMAÇÃO PARA DESVINCULAR CONTA ASAAS */}
        <Modal
          show={showConfirmationUnlinkAsaas}
          onHide={handleCancelUnlinkAsaas}
          centered
        >
          <Modal.Header>
            <h4 className="m-0 p-0">{t('account_asaas')}</h4>
          </Modal.Header>
          <Modal.Body className="fs-5 m-0 p-0 p-4">
            {t('unlink_asaas_account')}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelUnlinkAsaas}>
              {t('no')}
            </Button>
            <Button
              variant="success"
              onClick={() => {
                unlinkAsaas()
                handleCancelUnlinkAsaas()
              }}
            >
              {t('yes')}
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
        {i18n.language === 'pt-BR' && (
          <>
            <span className="fw-bold">{t('add_ons')}</span>
            <hr />
            {props.systemProducts.map((prod) => {
              const price = prod.operations.prices.find(
                (price) => price.id === prod.default_price
              )
              const value =
                (price?.currencies[
                  user?.controls?.currency ?? price?.default_currency
                ].unit_amount ?? 0) / 100
              const productItem = invoiceItems.find(
                (item) => item.id === prod.id
              )
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
                                if (
                                  !oldItems.some((item) => item.id === prod.id)
                                ) {
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
                              return oldItems.filter(
                                (item) => item.id !== prod.id
                              )
                            })
                          }
                        }}
                        className="my-auto"
                      />
                    </Col>
                    {prod.service === 'printer' && (
                      <Col>
                        <InputGroup>
                          <InputGroup.Text>{t('quantity')}</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min={1}
                            value={productItem?.quantity ?? 1}
                            onChange={(e) => {
                              setInvoiceItems((oldItems) => {
                                const item = oldItems.find(
                                  (item) => item.id === prod.id
                                )
                                if (item) {
                                  item.quantity = Number(e.target.value)
                                }

                                return [...oldItems]
                              })
                            }}
                          />
                          <InputGroup.Text>
                            {currency({
                              value: value * (productItem?.quantity ?? 1),
                            })}
                          </InputGroup.Text>
                        </InputGroup>
                      </Col>
                    )}
                    <Col sm={4}>
                      <Form.Select
                        disabled={
                          !invoiceItems.some((item) => item.id === prod.id)
                        }
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
                          const currencyMoney =
                            price.currencies[user?.controls?.currency ?? 'brl']

                          return (
                            <option
                              key={price.id}
                              selected={price.id === prod.default_price}
                              value={currencyMoney.unit_amount / 100}
                              data-price-id={price.id}
                            >
                              {currency({
                                value: currencyMoney.unit_amount / 100,
                              })}
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
                  {currency({
                    value: invoiceItems.reduce(
                      (acc, item) => acc + item.value * item.quantity,
                      0
                    ),
                  })}
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
                <Button
                  className="px-5"
                  variant="success"
                  onClick={handleEmitAddons}
                  disabled={!invoiceItems?.length}
                >
                  {t('issue')}
                </Button>
                <div>
                  <Form.Label>{t('number_installments')}</Form.Label>
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
          </>
        )}

        <span className="fw-bold">{t('invoices')}</span>
        <hr />
        <Table responsive striped hover className="text-center align-middle">
          <thead>
            <tr>
              <th>{t('transaction_id')}</th>
              <th>{t('value')}</th>
              <th>{t('due_date')}</th>
              <th>Status</th>
              <th className="col-1">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {user.invoices?.map((invoice: any) => (
              <tr key={invoice.id}>
                <td>
                  {invoice.requests &&
                  invoice.requests[0] &&
                  invoice.requests[0].transactionId
                    ? invoice.requests[0].transactionId
                    : '-'}
                </td>
                <td>{currency({ value: invoice.value })}</td>
                <td>
                  {DateTime.fromISO(invoice.expiration).toFormat(
                    t('date_format')
                  )}
                </td>
                <td>
                  {invoice.status === 'pending' || invoice.status === 'canceled'
                    ? t('pending_pay')
                    : t('paid_a')}
                </td>
                <td>
                  <Button
                    variant={`${invoice.status === 'paid' || userContext.controls.type !== 'adm' ? 'outline-' : ''}success`}
                    disabled={
                      invoice.status === 'paid' ||
                      userContext.controls.type !== 'adm'
                    }
                    onClick={async () => {
                      try {
                        if (!user.controls.paymentInfo) {
                          await handleDropInvoice(invoice)
                        } else {
                          handleConfirmModal({
                            title: i18n.t('notice'),
                            message: `${t('action_remove_user_the')} ${user.controls.paymentInfo.gateway}`,
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
                    {t('settlement')}
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
