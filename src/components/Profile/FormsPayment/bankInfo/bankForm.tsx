import { AsaasTerms } from '@components/Modals/Asaas/Terms'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { AppContext } from '@context/app.ctx'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { apiRoute } from '@utils/wm-functions'
import { AxiosError } from 'axios'
import { DateTime } from 'luxon'
import { UserType } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useContext, useEffect, useRef, useState } from 'react'
import { Button, Card, Col, Form, InputGroup, Modal, Row, Image } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import InputMask from 'react-input-mask'
import { BankAccountProps } from '..'
import { useTranslation } from 'react-i18next'

export type AsaasSubAccountForm = Pick<UserType, 'name' | 'email'> & {
  cpfCnpj: string
  mobilePhone: string
  address: string
  addressNumber: number
  province: string
  postalCode: string
  birthDate: string
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
  incomeValue: '5000' | '10000' | '20000' | '21000' | '50000' | '100000'
}

export default function BankForm({ paymentMethod }: BankAccountProps) {
  const { t } = useTranslation()
  const { profile, setProfile, handleShowToast } = useContext(AppContext)
  const {
    showSpinner,
    showFinPassModal,
    dataToBeUpdated,
    toggleSpinner,
    setDataToBeUpdated,
    setUpdateDataCallback,
    toggleModal,
    setShowResponseAlert,
  } = useContext(PaymentMethodContext)
  const { data: session } = useSession()
  const [bankAccount, setBankAccount] = useState<AsaasSubAccountForm>({
    name: session!.user!.name,
    email: session!.user!.email,
    cpfCnpj: session!.user!.secretNumber,
    mobilePhone: session!.user!.whatsapp,
    birthDate: '',
    address: profile.address.street,
    addressNumber: Number(profile.address.number),
    postalCode: profile.address.zipcode,
    province: profile.address.neigborhood,
    incomeValue: '5000',
  })

  const [widthWindow, setWidthWindow] = useState(window.innerWidth)
  const [showTag, setShowTag] = useState(false)
  const [asaasTermsModal, setAsaasTermsModal] = useState(false)
  const [ip, setIp] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isValid, errors },
  } = useForm<AsaasSubAccountForm>({
    defaultValues: {
      ...bankAccount,
    },
  })

  const documentMask = () => {
    const cpfCnpj = watch('cpfCnpj')
    if (cpfCnpj?.length > 14) {
      return '99.999.999/9999-99'
    } else {
      return '999.999.999-99*'
    }
  }

  const createAsaasSubAccount = async (data: AsaasSubAccountForm) => {
    setDataToBeUpdated({ ...data, asaasTerms: true })
    toggleModal(true)
    setUpdateDataCallback((state: any) => {
      state = async () => {
        try {
          const { data: response } = await apiRoute('/dashboard/asaas/asaasCreateSubAccount', session, 'POST', {
            ...data,
            terms: {
              ip,
              userAgent: navigator.userAgent,
              created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
            },
          })
          setProfile(response.profile)
          setShowResponseAlert(true)
          handleShowToast({
            type: 'success',
            content: `Conta na plataforma Asaas criada com sucesso, acesse o email ${data.email} para definir uma senha com o token enviado para o número de celular ${data.mobilePhone}`,
            delay: 10 * 1000,
          })
        } catch (error) {
          console.error(error)
          handleShowToast({
            type: 'erro',
            content: (error as AxiosError<{ error: { message: string } }, any>).response?.data?.error?.message,
          })
          throw error
        } finally {
          toggleModal(false)
          toggleSpinner(false)
        }
      }
      return state
    })
    toggleSpinner(true)
  }

  useEffect(() => {
    function handleResize() {
      setWidthWindow(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const minimumWidth = 768
    setShowTag(widthWindow >= minimumWidth)
  }, [widthWindow])

  useEffect(() => {
    if (showFinPassModal === false && dataToBeUpdated?.payment === paymentMethod) {
      reset()
    }
  }, [showFinPassModal])

  return (
    <>
      <Form id="formAsaas" onSubmit={handleSubmit(createAsaasSubAccount)}>
        <Card.Header className="text-dark d-flex justify-content-between ">
          <h4 className="text-sm mb-0 d-flex align-items-center justify-content-between w-100">
            <div>
              <p>
                <b>PIX Automatizado + Crédito Online:</b>
              </p>
              <span className="fw-normal" style={{ fontSize: '1.125rem' }}>
                Evite golpes, erros e atrasos no atendimento verificando comprovantes no app do banco e enviando maquininhas para pagamentos no
                cartão.
              </span>
            </div>
            <img src="/images/logo-asaas-2.svg" alt="Logo Asaas" />
          </h4>
        </Card.Header>
        <Card.Body>
          <Row className="mt-3">
            <Col md lg="6" className="mb-2">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                placeholder="Nome completo"
                className={`${errors.name && 'is-invalid'} `}
                {...register('name', { required: true, minLength: 3 })}
              />
            </Col>
            <Col md="6" lg className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                placeholder="Seu melhor email"
                className={`${errors.email && 'is-invalid'} `}
                {...register('email', { required: true, minLength: 3 })}
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md="6" lg className="mb-2">
              <Form.Label>CPF/CNPJ</Form.Label>
              <InputMask
                mask={documentMask()}
                maskChar={null}
                alwaysShowMask={false}
                className={`form-control flex-grow-1 ${errors.cpfCnpj && 'is-invalid'} `}
                placeholder="CPF/CNPJ"
                {...register('cpfCnpj', {
                  required: true,
                  minLength: 3,
                  onChange: (e) => {
                    if (e.target.value.length > 14) {
                      setValue('companyType', 'MEI')
                      return
                    }
                    setValue('companyType', undefined)
                  },
                })}
              />
            </Col>
            {watch('cpfCnpj')?.length > 14 && (
              <Col md="4" lg className="mb-2">
                <Form.Label>Tipo de Empresa</Form.Label>
                <Form.Select {...register('companyType')}>
                  <option value="MEI">Microempreendedor Individual</option>
                  <option value="LIMITED">Limitada</option>
                  <option value="INDIVIDUAL">Empresário Individual</option>
                  <option value="ASSOCIATION">Associação</option>
                </Form.Select>
              </Col>
            )}
            <Col md="6" lg className="mb-2">
              <Form.Label>Data de Nascimento</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  type="date"
                  className={`form-control flex-grow-1 ${errors.birthDate && 'is-invalid'} `}
                  {...register('birthDate', { required: true })}
                />
              </InputGroup>
            </Col>

            <Col md="6" lg className="mb-2">
              <Form.Label>Celular</Form.Label>
              <InputGroup className="mb-3">
                <InputMask
                  mask="(99) 9 9999-9999"
                  maskChar={null}
                  alwaysShowMask={false}
                  className={`form-control flex-grow-1 ${errors.mobilePhone && 'is-invalid'} `}
                  placeholder="Seu número de celular"
                  {...register('mobilePhone', { required: true })}
                />
              </InputGroup>
            </Col>
          </Row>
          <Row>
            <Col className="mb-2">
              <Form.Label>Rendimento Mensal</Form.Label>
              <Form.Select {...register('incomeValue', { required: true })}>
                <option value="5000">Até R$ 5.000</option>
                <option value="10000">Entre R$ 5.000 e R$ 10.000</option>
                <option value="20000">Entre R$ 10.000 e R$ 20.000</option>
                <option value="21000">Acima de R$ 20.000</option>
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col sm="8" className="mb-2">
              <Form.Label>Rua</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  className={`form-control flex-grow-1 ${errors.address && 'is-invalid'} `}
                  list="datalistOptions"
                  id="exampleDataList"
                  placeholder="Endereço do estabelecimento"
                  {...register('address', { required: true })}
                />
              </InputGroup>
            </Col>
            <Col sm className="mb-2">
              <Form.Label>Número</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  type="number"
                  className={`form-control flex-grow-1 ${errors.addressNumber && 'is-invalid'} `}
                  placeholder="Número do estabelecimento"
                  {...register('addressNumber', { required: true })}
                />
              </InputGroup>
            </Col>
            <Col sm="6" className="mb-2">
              <Form.Label>Bairro</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  className={`form-control flex-grow-1 ${errors.province && 'is-invalid'} `}
                  placeholder="Bairro do estabelecimento"
                  {...register('province', { required: true })}
                />
              </InputGroup>
            </Col>
            <Col sm className="mb-2">
              <Form.Label>CEP</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  className={`form-control flex-grow-1 ${errors.postalCode && 'is-invalid'} `}
                  placeholder="CEP do estabelecimento"
                  {...register('postalCode', { required: true })}
                />
              </InputGroup>
            </Col>
          </Row>
          <div className="d-lg-flex gap-4 justify-content-center">
            <div className="d-flex flex-column align-items-center">
              <p>
                <strong> PIX Automatizado</strong>
              </p>
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ border: '2px dashed #D6D6D6', borderRadius: '1rem', width: '15.5rem', height: '8.5rem' }}
              >
                <p className="m-0 p-0">
                  de: <strong style={{ textDecoration: 'line-through' }}> {t('coin')}0,99</strong>
                </p>
                <p className="text-primary d-flex gap-2 m-0 p-0">
                  <span className="mt-1">por:</span>
                  <h3 className="p-0 m-0">
                    <strong>{t('coin')} 0,49</strong>
                  </h3>
                </p>
                <p className="p-0 m-0">nos primeiros 3 meses</p>
              </div>

              <Image src="/images/pix-logo.svg" alt="Logo Asaas" className="m-0 p-0" height={70} width={70} style={{ padding: '0', margin: '0' }} />
            </div>

            <div className="d-flex flex-column align-items-center">
              <p>
                <strong> Cartão de Crédito</strong>
              </p>
              <div
                className="d-md-flex justify-content-evenly  align-items-center "
                style={{ border: '2px dashed #D6D6D6', borderRadius: '1rem', width: '98%', height: '8.5rem' }}
              >
                <div className="d-flex flex-column align-items-center justify-content-center mt-1 mb-3 mb-md-0">
                  <h3 className="text-primary m-0 p-0">
                    <strong> 2,99%</strong>
                  </h3>
                  <p className="p-0 m-0">32 dias</p>
                </div>

                {showTag && <div style={{ border: '1px solid #E4E2E2', height: '80%', width: '0' }}></div>}

                <div className="d-flex flex-column align-items-center justify-content-center">
                  <h3 className="text-primary m-0 p-0">
                    <strong>4,99%</strong>
                  </h3>
                  <span>2 dias úteis</span>
                </div>
              </div>
              <div className="d-md-flex d-sm-block  gap-3 mt-1">
                <Image
                  src="/images/visa-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
                <Image
                  src="/images/mastercard-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
                <Image src="/images/elo-logo.svg" alt="Logo Asaas" className="m-0 p-0" height={50} width={50} style={{ padding: '0', margin: '0' }} />
                <Image
                  src="/images/americanexpress-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
                <Image
                  src="/images/dinersclub-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
                <Image
                  src="/images/discover-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
                <Image
                  src="/images/hipercard-logo.svg"
                  alt="Logo Asaas"
                  className="m-0 p-0"
                  height={50}
                  width={50}
                  style={{ padding: '0', margin: '0' }}
                />
              </div>
            </div>
          </div>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end align-items-center gap-3">
          <Button type="button" disabled={!isValid} onClick={() => setAsaasTermsModal(true)}>
            Criar conta
          </Button>
        </Card.Footer>
      </Form>
      {/* <BankConfirmationModal show={showConfirmationModal} setShow={toggleConfirmationModal} formValues={getValues()} /> */}
      <OverlaySpinner show={showSpinner || false} />
      <Modal backdrop="static" show={asaasTermsModal} size="lg" scrollable centered onHide={() => setAsaasTermsModal(false)}>
        <Modal.Header closeButton>
          <h4 className="fw-bold m-0">Termo de uso</h4>
        </Modal.Header>
        <Modal.Body>
          <AsaasTerms />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            style={{ backgroundColor: 'var(--bs-secondary)', borderColor: 'var(--bs-secondary)' }}
            type="button"
            onClick={() => setAsaasTermsModal(false)}
          >
            Cancelar
          </Button>
          <Button form="formAsaas" style={{ backgroundColor: 'var(--bs-primary)' }} type="submit">
            Aceito os termos de uso
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
