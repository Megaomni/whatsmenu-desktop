import { useContext, useEffect, useState } from 'react'
import { Card, Form, Col, Button, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { PaymentSettingsProps } from '..'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { ProfileFormPayment } from '../../../../types/profile'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { FormAddon } from '@components/FormAddon'
import { useTranslation } from 'react-i18next'

const CashPaymentSettings = ({ paymentMethod }: PaymentSettingsProps) => {
  const { t } = useTranslation()
  const { profileState, showSpinner, showFinPassModal, dataToBeUpdated, toggleSpinner, onSubmit } = useContext(PaymentMethodContext)
  const [cashSettings, setCashSettings] = useState(profileState?.formsPayment?.find((method) => method.payment === paymentMethod))
  const {
    register,
    reset,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormPayment>({ mode: 'onChange', defaultValues: cashSettings })

  useEffect(() => {
    setCashSettings(profileState?.formsPayment?.find((method) => method.payment === paymentMethod))
  }, [profileState])

  useEffect(() => {
    reset(cashSettings)
  }, [cashSettings])

  useEffect(() => {
    if (showFinPassModal === false && dataToBeUpdated?.payment === paymentMethod) {
      reset(cashSettings)
    }
  }, [showFinPassModal])

  return (
    <>
      <Card className="position-relative">
        <form onSubmit={handleSubmit((data) => onSubmit(data, toggleSpinner, reset))}>
          <Card.Header className="text-dark d-flex justify-content-between">
            <h4 className="text-capitalize">
              <b>{cashSettings?.payment}</b>
            </h4>

            <Form.Switch
              id={cashSettings?.payment}
              label={t('activated')}
              className="fs-4"
              checked={!!cashSettings?.status}
              onClick={() => {
                setValue('status', !getValues('status'))
                handleSubmit((data) => onSubmit(data, toggleSpinner, reset))()
              }}
              {...register('status')}
            />
          </Card.Header>
          <Card.Body className="mt-0">
            <Row>
              <Col>
                <FormAddon
                  addon={cashSettings?.addon!}
                  onAddonChange={(addonUpdated) => {
                    setValue('addon', addonUpdated)
                  }}
                />
              </Col>
              <Col md="3" lg="3" className="d-flex">
                <Button variant="success" className="flex-grow-1 mt-auto mb-2" type="submit" disabled={Object.keys(errors).length ? true : false}>
                  {t('save')}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </form>

        <OverlaySpinner show={showSpinner || false} />
      </Card>
    </>
  )
}

export default CashPaymentSettings
