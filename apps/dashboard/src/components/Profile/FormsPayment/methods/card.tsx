import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { ProfileFormPayment } from '../../../../types/profile'
import { IoCloseSharp } from 'react-icons/io5'
import { useCallback, useContext, useEffect, useState } from 'react'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { PaymentSettingsProps } from '..'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { FormAddon } from '@components/FormAddon'
import { useTranslation } from 'react-i18next'

import { apiRoute } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'
import { AppContext } from '@context/app.ctx'

type CreditForm = ProfileFormPayment & {
  onlineCard: boolean
}

export interface CardPaymentSettingsProps extends PaymentSettingsProps {}

const CardPaymentSettings = ({ formPayment }: CardPaymentSettingsProps) => {
  const { t } = useTranslation()
  const { data: session } = useSession()
  // const { profile, setProfile } = useContext(AppContext)
  const {
    profileState,
    showSpinner,
    showFinPassModal,
    dataToBeUpdated,
    toggleSpinner,
    onSubmit,
    setUpdateDataCallback,
    toggleModal,
    setDataToBeUpdated,
  } = useContext(PaymentMethodContext)
  const [cardSettings, setCardSettings] = useState<Partial<CreditForm>>({
    onlineCard: profileState?.options.onlineCard,
    ...formPayment,
  })
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    resetField,
    watch,
    formState: { errors },
  } = useForm<CreditForm>({ mode: 'onChange', defaultValues: cardSettings })

  const deleteFlag = (code: string) => {
    if (!cardSettings || !cardSettings.flags) return
    resetField('newFlag')
    setValue(
      'flags',
      cardSettings?.flags?.filter((flag) => flag.code !== code)
    )
    handleSubmit((data) => onSubmit(data, toggleSpinner, reset))()
  }

  useEffect(() => {
    setCardSettings((state) => ({
      ...state,
      ...formPayment,
    }))
    reset(
      profileState?.formsPayment?.find(
        (method) => method.payment === formPayment?.payment
      )
    )
  }, [profileState, formPayment?.payment, getValues])

  useEffect(() => {
    reset(
      profileState?.formsPayment?.find(
        (method) => method.payment === formPayment?.payment
      )
    )
  }, [cardSettings])

  useEffect(() => {
    if (
      showFinPassModal === false &&
      dataToBeUpdated?.payment === formPayment?.payment
    ) {
      reset()
    }
  }, [showFinPassModal])

  const newFlag = watch('newFlag')

  return (
    <Card className="position-relative">
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, toggleSpinner, reset))}
      >
        <Card.Header className="text-dark d-flex justify-content-between">
          <h4 className="text-capitalize mb-0 text-sm">
            <b>{t(cardSettings!.payment as string)}</b>
          </h4>
          <div className="d-flex gap-5">
            <Form.Switch
              id={cardSettings?.payment}
              label={cardSettings?.status ? t('activated') : t('disabled_o')}
              className="fs-4"
              checked={!!cardSettings?.status}
              onClick={() => {
                setValue('status', !getValues('status'))
                handleSubmit((data) => onSubmit(data, toggleSpinner, reset))()
              }}
              {...register('status')}
            />
          </div>
        </Card.Header>

        <Card.Body>
          <Row className="mt-3">
            <div className="d-flex gap-4">
              <Form.Control
                placeholder={t('card_network')}
                className="flex-grow-1 w-100"
                {...register('newFlag')}
              />
              <Button
                variant="success"
                className="flex-grow-1 my-auto"
                type="submit"
                disabled={
                  Object.keys(errors).length || !newFlag?.length ? true : false
                }
              >
                {t('add_card_network')}
              </Button>
            </div>
            <Col className=" mb-2">
              <FormAddon
                addon={cardSettings?.addon!}
                onAddonChange={(addonUpdated) => {
                  setValue('addon', addonUpdated)
                }}
              />
            </Col>

            <Col md lg="2" className="d-flex">
              <Button
                variant="success"
                className="flex-grow-1 mb-3 mt-auto"
                type="submit"
                disabled={Object.keys(errors).length ? true : false}
              >
                {t('save')}
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md className="d-flex mt-3 gap-3">
              {cardSettings?.flags?.map((flag) => (
                <Badge
                  key={flag.code}
                  bg="dark"
                  className="cursor-pointer"
                  onClick={() => deleteFlag(flag.code)}
                >
                  {flag.name} <IoCloseSharp />
                </Badge>
              ))}
            </Col>
          </Row>
        </Card.Body>
      </form>
      <OverlaySpinner show={showSpinner || false} />
    </Card>
  )
}

export default CardPaymentSettings
