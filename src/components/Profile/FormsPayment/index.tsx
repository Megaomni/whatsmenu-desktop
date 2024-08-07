import { AsaasTerms } from '@components/Modals/Asaas/Terms'
import FinPasswordModal from '@components/Modals/FinPassword'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import Image from "next/legacy/image"
import { useContext, useEffect, useState } from 'react'
import { Accordion, Button, Card, Modal } from 'react-bootstrap'
import { MdOutlineCancel } from 'react-icons/md'
import Profile, { ProfileFormPayment } from '../../../types/profile'
import { HelpVideos } from '../../Modals/HelpVideos'
import { AdvanceCard } from './advanceCardPayment'
import BankAccountSettings from './bankInfo/bankaccount'
import CardPaymentSettings from './methods/card'
import CashPaymentSettings from './methods/cash'
import OnlinePaymentSettings from './methods/pix'

interface ProfileFormsPaymentProps {
  isActive: boolean
}

export interface BankAccountProps {
  paymentMethod?: string
  profileState?: Profile | null
  showPresentation?: boolean | null
}

export interface PaymentSettingsProps {
  paymentMethod?: string
  formPayment?: ProfileFormPayment
}

export function ProfileFormsPayment({ isActive = false }: ProfileFormsPaymentProps) {
  const { profileState, setDataResponse, handleProfileUpdate, toggleModal, dataToBeUpdated, handleDataToBeUpdated, updateDataCallback } =
    useContext(PaymentMethodContext)
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)
  const [asaasTermsModal, setAsaasTermsModal] = useState(false)

  useEffect(() => {
    if (dataToBeUpdated) {
      if (dataToBeUpdated.asaasTerms) {
        return
      }
      return toggleModal(true)
    }
    return toggleModal(false)
  }, [dataToBeUpdated, toggleModal])

  useEffect(() => {
    if (!updateSuccess || !profileState) return
    const index = profileState.formsPayment?.findIndex((method) => method.payment === dataToBeUpdated?.payment)
    const updatedFormsPayment = [...profileState.formsPayment]
    updatedFormsPayment[index] = dataToBeUpdated
    handleProfileUpdate({ ...profileState, formsPayment: updatedFormsPayment })
    handleDataToBeUpdated(null)
    setUpdateSuccess(null)
  }, [updateSuccess, dataToBeUpdated, handleDataToBeUpdated, profileState, handleProfileUpdate])

  if (!profileState) return <OverlaySpinner show />

  return (
    <>
      <FinPasswordModal dataToBeUpdated={dataToBeUpdated} setUpdateSuccess={setUpdateSuccess} updateDataCallback={updateDataCallback} />
      <Accordion defaultActiveKey="0" className="d-flex flex-column gap-4 payment-accordion">
        {profileState.options.asaas ? (
          <Card className="m-0">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row-reverse justify-content-md-between align-items-center align-items-md-baseline gap-3">
                <h2 className="m-0 order-1">Pagamento Online - Automático</h2>
                <Image src="/images/logo-asaas-2.svg" alt="Logo Asaas" width={127} height={38} className="mx-auto ms-md-auto order-0 order-md-2" />
                <p className="m-0 mt-2 d-md-none order-2 text-center">
                  Evite golpes, erros e atrasos no atendimento tendo que verificar comprovantes no app do banco.
                </p>
              </div>
              <p className="m-0 mt-2 d-none d-md-flex">
                Evite golpes, erros e atrasos no atendimento tendo que verificar comprovantes no app do banco.
              </p>
              <Button className="p-0 fw-bold" variant="link" onClick={() => setAsaasTermsModal(true)}>
                Termos de uso Banco Asaas
              </Button>
              <div
                className="me-3 mt-3 rounded p-2 "
                style={{ color: '#BC1C21', background: '#FEF3F3', border: 'none', boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.1)' }}
              >
                <div className='d-flex align-items-center gap-2 mb-2'>
                  <MdOutlineCancel />
                  <strong>Atenção:</strong>
                </div>
                <ol className="d-flex flex-column gap-2">
                  <li>Acesse o email {profileState.options.asaas.loginEmail}</li>
                  <li>Abra o email do Asaas e clique no link para criar sua senha bancaria.</li>
                  <li>Enviamos o SMS com o token para {profileState.options.asaas.mobilePhone}</li>
                </ol>
              </div>
              <p className="fw-bold mt-4">Dados da Conta Criada:</p>
              <ul>
                <li>Agência: {profileState.options.asaas.accountNumber.agency}</li>
                <li>
                  Conta: {profileState.options.asaas.accountNumber.account}-{profileState.options.asaas.accountNumber.accountDigit}
                </li>
                <li>E-mail: {profileState.options.asaas.loginEmail}</li>
                <li>Senha: ******</li>
              </ul>
              <Button as="a" href={process.env.ASAAS_DASHBOARD_URL} target="_blank" className="me-auto  my-auto order-4 order-md-2">
                Acesse sua conta Asaas
              </Button>
              <Card.Footer className="mt-4">
                <AdvanceCard />
              </Card.Footer>
            </Card.Body>
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
                  Voltar
                </Button>
              </Modal.Footer>
            </Modal>
          </Card>
        ) : (
          <Accordion.Item eventKey="0">
            <Accordion.Header className="d-flex gap-3">
              <p className="m-0 overflow-hidden">Pagamento Online - Automático</p>
              <div className="vr"></div>
              <HelpVideos.Trigger urls={[{ src: "https://www.youtube.com/embed/uo7zxBqTBXE", title: "Pagamento Online" }]} />
            </Accordion.Header>
            <Accordion.Body>
              <BankAccountSettings paymentMethod="bank" />
            </Accordion.Body>
          </Accordion.Item>
        )}
        <Accordion.Item eventKey="1">
          <Accordion.Header className="d-flex gap-3">
            <p className="m-0 overflow-hidden">Pagamento na Entrega - Maquininha</p>
            <div className="vr"></div>
            <HelpVideos.Trigger urls={[{ src: "https://www.youtube.com/embed/cVnU3b67NY0", title: "Pagamento na Entrega" }]} />
          </Accordion.Header>
          <Accordion.Body>
            <CashPaymentSettings paymentMethod="money" />
            {profileState.formsPayment
              ?.filter((f) => f.flags && f.payment !== 'money')
              .map((cardFormPayment) => (
                <CardPaymentSettings key={cardFormPayment.payment} paymentMethod={cardFormPayment.payment} formPayment={cardFormPayment} />
              ))}
            {profileState.formsPayment
              ?.filter((f) => f.key && f.payment !== 'money')
              .filter((f) => {
                if (f.payment === 'pix') {
                  return profileState.options.legacyPix
                }
                return true
              })
              .map((onlineFormPayment) => {
                if (onlineFormPayment.payment === 'pix' && !profileState.options.legacyPix) {
                  return null
                }
                return (
                  <OnlinePaymentSettings key={onlineFormPayment.payment} paymentMethod={onlineFormPayment.payment} formPayment={onlineFormPayment} />
                )
              })}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </>
  )
}
