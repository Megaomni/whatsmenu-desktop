import { useState, useEffect, useContext, useId } from 'react'
import { Card, Col, Form, FormControl, Row } from 'react-bootstrap'
import { set, useForm } from 'react-hook-form'
import { ProfileFormPayment } from 'src/types/profile'
import { PaymentMethodContext } from '@context/paymentMethod.ctx'
import { AppContext } from '@context/app.ctx'
import CardHeader from 'react-bootstrap/esm/CardHeader'
import { log } from 'console'
import { useTranslation } from 'react-i18next'

export interface FormAddonProps {
  addon: ProfileFormPayment['addon']
  onAddonChange: (addon: ProfileFormPayment['addon']) => void
}

export const FormAddon = ({ addon, onAddonChange }: FormAddonProps) => {
  const { t } = useTranslation()
  const {
    profileState,
    showSpinner,
    showFinPassModal,
    dataToBeUpdated,
    toggleSpinner,
    onSubmit,
  } = useContext(PaymentMethodContext)

  const [addonSettings, setAddonSettings] = useState(addon)
  const id = useId()

  const addonType = [{ discount: t('discount') }, { fee: t('surchage') }]
  const addonTypeValue = [
    { fixed: t('fixed') },
    { percentage: t('percentage') },
  ]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormPayment>({
    mode: 'onChange',
    defaultValues: addonSettings,
  })

  useEffect(() => {
    reset(addonSettings)
  }, [addonSettings, reset])

  useEffect(() => {
    onAddonChange(addonSettings)
  }, [addonSettings, onAddonChange])

  return (
    <>
      <div>
        <Form.Switch
          id={id}
          label={t('enable_surcharge_discount')}
          className="fs-4 mt-4"
          checked={!!addonSettings?.status}
          onClick={() => {
            setValue('addon.status', !getValues('addon.status'))
            setAddonSettings((state) => ({ ...state, status: !state.status }))
          }}
          {...register('addon.status')}
        />
        <Row className="mt-3">
          <Col md="4" lg className="position-relative mb-2 mt-2">
            <Form.Label>{t('type_of_fee')}</Form.Label>
            <Form.Select
              {...register('addon.type')}
              value={addonSettings?.type}
              onChange={(e) => {
                setValue('addon.type', e.target.value)
                setAddonSettings((state) => ({
                  ...state,
                  type: e.target.value,
                }))
              }}
            >
              {addonType?.map((type, index) => (
                <option value={Object.keys(type)[0]} key={index}>
                  {type.discount || type.fee}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md="4" lg className="position-relative mb-2 mt-2">
            <Form.Label>{t('type_of_value')}</Form.Label>
            <Form.Select
              {...register('addon.valueType')}
              value={addonSettings?.valueType}
              onChange={(e) => {
                setValue('addon.valueType', e.target.value)
                setAddonSettings((state) => ({
                  ...state,
                  valueType: e.target.value,
                }))
              }}
            >
              {addonTypeValue?.map((type, index) => (
                <option value={Object.keys(type)[0]} key={index}>
                  {type.fixed || type.percentage}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md="4" lg className="position-relative mb-2 mt-2">
            <Form.Label className="">{t('fee_amount')}</Form.Label>
            <FormControl
              min={0}
              type="number"
              {...register('addon.value')}
              step="0.01"
              value={addonSettings?.value}
              onChange={(e) => {
                const value = Number(e.target.value)
                setValue('addon.value', value) // Converte para número aqui
                setAddonSettings((state) => ({ ...state, value: value }))
              }}
            />
          </Col>
        </Row>
      </div>
    </>
  )
}
