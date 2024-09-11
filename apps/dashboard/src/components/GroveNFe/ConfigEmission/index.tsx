import { AppContext } from '@context/app.ctx'
import { zodResolver } from '@hookform/resolvers/zod'
import { mask } from '@utils/wm-functions'
import axios from 'axios'
import { useContext, useEffect } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  FormGroup,
  Nav,
  Row,
  Tab,
  Tabs,
} from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { groveNfeApi } from 'src/lib/axios'
import { z } from 'zod'

const EditEmissonSchema = z.object({
  day_limiter: z.coerce.number().nullable(),
  forms_payment: z.array(
    z.object({
      type: z.string(),
    })
  ),
})

type EditEmissonFormData = z.infer<typeof EditEmissonSchema>

export function ConfigEmission() {
  const { t } = useTranslation()
  const { setProfile, profile } = useContext(AppContext)
  const { register, setValue, getValues, handleSubmit, watch } = useForm({
    resolver: zodResolver(EditEmissonSchema),
    defaultValues: {
      day_limiter:
        profile.options.integrations?.grovenfe?.config?.fiscal_notes
          .day_limiter,
      forms_payment:
        profile.options.integrations?.grovenfe?.config?.fiscal_notes
          .forms_payment ?? [],
    },
  })

  //   forms_payment
  const handleFormsPayment = ({
    checked,
    typePayment,
  }: {
    checked: boolean
    typePayment: string
  }) => {
    let updatedPayments = getValues('forms_payment').filter(
      (payment) => payment.type !== typePayment
    )
    if (checked) {
      setValue('forms_payment', [...updatedPayments, { type: typePayment }])
    }

    if (!checked) {
      setValue(
        'forms_payment',
        updatedPayments.filter((payment) => payment.type !== typePayment)
      )
    }
  }

  const editEmission = async (fiscal_notes: EditEmissonFormData) => {
    const company = {
      id: profile.options.integrations.grovenfe.company_id,
      controls: {
        fiscal_notes,
      },
    }
    try {
      const { data } = await groveNfeApi.put('/v1/companies', { company })
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
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return (
    <>
      <form id="editEmission" onSubmit={handleSubmit(editEmission)}>
        <Card>
          <Card.Header className="fw-bold fs-5 m-2 p-2">
            {t('emission_ecfn')}
          </Card.Header>
          <Card.Body>
            <h5 className="fw-bold" style={{ color: '#000' }}>
              {t('set_defaults_for_automatic_issuance_of_your_fiscal_notes')}.
            </h5>
            <p style={{ color: '#9894A4' }}>
              *
              {t(
                'whenever_necessary_you_can_manually_issue_in_addition_to_the_defined_standard'
              )}
              .
            </p>
            <Row className="">
              <h4>Formas de Pagamento</h4>
              <Col md={5}>
                {profile.formsPayment?.map(
                  (formPayment, index) =>
                    formPayment.payment !== 'card' && (
                      <Form.Switch
                        key={index}
                        name={formPayment.payment}
                        className="my-3"
                        label={t(formPayment.payment)}
                        checked={watch('forms_payment').some(
                          (payment) => payment.type === formPayment.payment
                        )}
                        onChange={(e) => {
                          handleFormsPayment({
                            checked: e.target.checked,
                            typePayment: e.target.name,
                          })
                          console.log(e.target.checked, e.target.name)
                        }}
                      />
                    )
                )}
              </Col>
              <Col md={3}>
                <Form.Label className="m-0 my-2 p-0">
                  {t('daily_average')}
                </Form.Label>
                <Form.Control
                  {...register('day_limiter')}
                  placeholder="R$ 250,00"
                  style={{ backgroundColor: '#F3F4F6' }}
                  step="0.01"
                  onChange={(e) => mask(e, 'currency')}
                ></Form.Control>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* <Card.Body className="mt-2" style={{ backgroundColor: '#EDEDF7', color: '#000' }}>
                    <h3 className="fw-bold">{t('dont_miss_deadlines')}!</h3>
                    <p>{t('we_will_send_the_fiscal_closing')}.</p>
                    <Form.Label>{t('accountant_email')}</Form.Label>
                    <Col md={6}>
                        <Form.Control></Form.Control>
                    </Col>
                    <p className="mt-3" style={{textDecoration:'line-through'}}>R$ 39,90/mês</p>
                    <h4 style={{color:'#0075FF'}}>*{t('additional_service')}<span className="fw-bold"> {t('gratis')} </span>{t('for_shopkeeper')} {t('WM')}!</h4>
                </Card.Body>

                <Card.Footer className="mt-3 p-0">
                    <Card.Header className="fw-bold">{t('plan_change')}</Card.Header>
                    <Card.Body>
                        <Row className="gap-3">
                            <Col md={2}>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>{t('current_plan')}</p>
                                    <h4 className="fw-bold m-0 p-0">{t('plan')} 100</h4>
                                    <p className="m-0 p-0">R$ 67,00</p>
                                </div>
                            </Col>
                            <Col md={3}>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>{t('plan_expiration')}</p>
                                    <p className="m-0 p-0">03/08/2024</p>
                                </div>
                            </Col>
                            <Col md={3} className='mt-3'>
                                <Button className="w-100">{t('change_plan')}</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card.Footer> */}
      </form>

      <div
        className={`btn-footer-show d-flex justify-content-end position-fixed w-100 bottom-0 m-0 p-3`}
        style={{
          left: '0 ',
          right: '0 ',
        }}
      >
        <Button
          className="flex-grow-1 flex-md-grow-0"
          type="submit"
          form="editEmission"
          style={{
            backgroundColor: '#13C296',
            border: 'none',
          }}
        >
          {t('save')}
        </Button>
      </div>
    </>
  )
}
