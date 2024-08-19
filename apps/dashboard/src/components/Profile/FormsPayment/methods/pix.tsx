import { FormAddon } from '@components/FormAddon'
import { OverlaySpinner } from '@components/OverlaySpinner'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { cnpj, cpf } from 'cpf-cnpj-validator'
import { useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import InputMask from 'react-input-mask'
import { PaymentSettingsProps } from '..'
import { ProfileFormPayment } from '../../../../types/profile'

type PixForm = ProfileFormPayment & {
  onlinePix: boolean
}

export interface OnlinePaymentSettingsProps extends PaymentSettingsProps { }

const OnlinePaymentSettings = ({ formPayment }: PaymentSettingsProps) => {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profileState,
    showSpinner,
    showFinPassModal,
    dataToBeUpdated,
    toggleSpinner,
    onSubmit,
  } = useContext(PaymentMethodContext)
  const [pixSettings, setPixSettings] = useState<Partial<PixForm>>({
    onlinePix: profileState?.options.onlinePix,
    ...formPayment,
  })
  const keyArray =
    formPayment?.payment === 'pix'
      ? ['Telefone', 'E-mail', 'CPF', 'CNPJ', 'Aleatória']
      : [t('user'), 'Email']

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<PixForm>({ mode: 'onChange', defaultValues: pixSettings })

  const validatePix = (value: string) => {
    const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/
    const phoneRegex = /^\d{2} \d{5}-\d{4}$/
    const key = watch('key')
    if (!watch('status')) return true
    switch (key?.type) {
      case 'CPF':
        return cpf.isValid(value)
      case 'CNPJ':
        return cnpj.isValid(value)
      case 'E-mail':
        return emailRegex.test(value)
      case 'Telefone':
        return phoneRegex.test(value)
      case 'Usuário':
        return !!value.length
      case 'Aleatório':
        return !!value.length
      default:
        break
    }
  }

  const pixKeyMask = () => {
    const keyType = watch('key.type')

    switch (keyType) {
      case 'CPF':
        return '999.999.999-99'
      case 'CNPJ':
        return '99.999.999/9999-99'
      case 'Telefone':
        return '99 99999-9999'
      default:
        return ''
    }
  }

  useEffect(() => {
    setPixSettings((state) => ({
      ...state,
      ...formPayment,
    }))
    reset(
      profileState?.formsPayment?.find(
        (method) => method.payment === formPayment?.payment
      )
    )
  }, [profileState])

  useEffect(() => {
    // reset({
    //   ...formPayment,
    //   onlinePix: profileState?.options.onlinePix
    // })
  }, [pixSettings])

  useEffect(() => {
    if (
      showFinPassModal === false &&
      dataToBeUpdated?.payment === formPayment?.payment
    ) {
      // reset()
    }
  }, [showFinPassModal])

  return (
    <>
      <Card className="position-relative">
        <form
          onSubmit={handleSubmit((data) => {
            onSubmit(data, toggleSpinner, reset)
          })}
        >
          <Card.Header className="text-dark d-flex justify-content-between">
            <h4 className="mb-0 text-sm">
              <b>{t(pixSettings!.payment as string)}</b>
            </h4>
            <div className="d-flex gap-5">
              <Form.Switch
                id={pixSettings?.payment}
                label={pixSettings.status ? t('activated') : t('disabled_o')}
                className="fs-4"
                checked={!!pixSettings?.status}
                disabled={!watch('key.value')}
                onClick={() => {
                  setValue('status', !getValues('status'))
                  handleSubmit((data) => onSubmit(data, toggleSpinner, reset))()
                }}
                {...register('status')}
              />
            </div>
          </Card.Header>
          <Card.Body>
            {/* {!!profileState?.options.recipient && formPayment?.payment === 'pix' ? (
              <p>Sua conta bancária está habilitada. Pedidos realizados via Pix serão creditados automaticamente.</p>
            ) : null} */}
            <Row className="mt-3">
              <>
                <Col md="5" lg className="position-relative mb-2 mt-2">
                  <Form.Label>{t('key_type')}</Form.Label>
                  <Form.Select
                    // disabled={formPayment?.payment === 'pix'}
                    {...register('key.type', {
                      onChange: () => setValue('key.value', ''),
                    })}
                    defaultValue={pixSettings?.key?.type}
                  >
                    {keyArray?.map((type) => (
                      <option value={type} key={type}>
                        {type} asdasdas
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md="5" lg className="position-relative mb-2 mt-2">
                  <Form.Label>{t('key')}</Form.Label>
                  <Controller
                    name="key.value"
                    control={control}
                    defaultValue={pixSettings?.key?.value}
                    rules={{
                      required: true,
                      validate: (value) => validatePix(value),
                    }}
                    render={({ field }) => (
                      <>
                        <InputMask
                          // disabled={formPayment?.payment === 'pix'}
                          mask={pixKeyMask()}
                          maskChar={null}
                          value={field.value}
                          alwaysShowMask={false}
                          onChange={field.onChange}
                          className={`form-control ${errors.key && 'is-invalid'} `}
                        />
                        <Form.Control.Feedback
                          tooltip
                          type="invalid"
                          style={{ zIndex: 0 }}
                        >
                          {t('invalid_pix')}
                        </Form.Control.Feedback>
                      </>
                    )}
                  />
                </Col>
              </>

              <Card.Body className="flex flex-row ">
                <Row className="">
                  <Col md lg="10" className=" mb-2">
                    <FormAddon
                      addon={pixSettings?.addon!}
                      onAddonChange={(addonUpdated) => {
                        setValue('addon', addonUpdated)
                      }}
                    />
                  </Col>

                  <Col md lg="2" className="d-flex">
                    <Button
                      // disabled={
                      //   formPayment?.payment === 'pix' ? (!!profileState?.options.recipient ? true : !!Object.keys(errors).length) : !!Object.keys(errors).length
                      // }
                      variant="success"
                      className="flex-grow-1 mb-3 mt-auto"
                      type="submit"
                    >
                      {t('save')}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Row>
          </Card.Body>
        </form>
        <OverlaySpinner show={showSpinner || false} />
      </Card>
    </>
  )
}

export default OnlinePaymentSettings
