import { AsaasTerms } from '@components/Modals/Asaas/Terms'
import FinPasswordModal from '@components/Modals/FinPassword'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import Image from 'next/legacy/image'
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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
        {profileState.options?.asaas ? (
          <Card className="m-0">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row-reverse justify-content-md-between align-items-center align-items-md-baseline gap-3">
                <h2 className="m-0 order-1">{t('online_payment_automatic')}</h2>
                <Image src="/images/logo-asaas-2.svg" alt="Logo Asaas" width={127} height={38} className="mx-auto ms-md-auto order-0 order-md-2" />
                <p className="m-0 mt-2 d-md-none order-2 text-center">{t('message_avoid_fraud_errors')}</p>
              </div>
              <p className="m-0 mt-2 d-none d-md-flex">{t('message_avoid_fraud_errors')}</p>
              <Button className="p-0 fw-bold" variant="link" onClick={() => setAsaasTermsModal(true)}>
                {t('asaas_terms_use')}
              </Button>
              <div
                className="me-3 mt-3 rounded p-2 "
                style={{ color: '#BC1C21', background: '#FEF3F3', border: 'none', boxShadow: '0 2px 5px 0 rgba(0, 0, 0, 0.1)' }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <MdOutlineCancel />
                  <strong>{t('attention')}:</strong>
                </div>
                <ol className="d-flex flex-column gap-2">
                  <li>
                    {t('acess_email')} {profileState.options.asaas.loginEmail}
                  </li>
                  <li>{t('message_open_asaas_email')}</li>
                  <li>
                    {t('message_sent_sms_token')} {profileState.options.asaas.mobilePhone}
                  </li>
                </ol>
              </div>
              <p className="fw-bold mt-4">{t('account_creation_details')}:</p>
              <ul>
                <li>
                  {t('branch')}: {profileState.options.asaas.accountNumber.agency}
                </li>
                <li>
                  Conta: {profileState.options.asaas.accountNumber.account}-{profileState.options.asaas.accountNumber.accountDigit}
                </li>
                <li>E-mail: {profileState.options.asaas.loginEmail}</li>
                <li>{t('password')}: ******</li>
              </ul>
              <Button as="a" href={process.env.ASAAS_DASHBOARD_URL} target="_blank" className="me-auto  my-auto order-4 order-md-2">
                {t('acess_asaas_account')}
              </Button>
              <Card.Footer className="mt-4">
                <AdvanceCard />
              </Card.Footer>
            </Card.Body>
            <Modal backdrop="static" show={asaasTermsModal} size="lg" scrollable centered onHide={() => setAsaasTermsModal(false)}>
              <Modal.Header closeButton>
                <h4 className="fw-bold m-0">{t('termis_of_use')}</h4>
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
                  {t('go_back')}
                </Button>
              </Modal.Footer>
            </Modal>
          </Card>
        ) : (
          <Accordion.Item eventKey="0">
            <Accordion.Header className="d-flex gap-3">
              <p className="m-0 overflow-hidden">{t('online_payment_automatic')}</p>
              <div className="vr"></div>
              <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/uo7zxBqTBXE', title: t('online_payment') }]} />
            </Accordion.Header>
            <Accordion.Body>
              <BankAccountSettings paymentMethod="bank" />
            </Accordion.Body>
          </Accordion.Item>
        )}
        <Accordion.Item eventKey="1">
          <Accordion.Header className="d-flex gap-3">
            <p className="m-0 overflow-hidden">{t('payment_on_delivery_card')}</p>
            <div className="vr"></div>
            <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/cVnU3b67NY0', title: t('payment_on_delivery') }]} />
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
