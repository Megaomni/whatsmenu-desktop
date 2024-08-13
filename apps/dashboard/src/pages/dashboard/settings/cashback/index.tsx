import { HelpVideos } from '@components/Modals/HelpVideos'
import { Title } from '@components/Partials/title'
import { AppContext } from '@context/app.ctx'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext } from 'react'
import { Button, Card, Form, InputGroup } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { api } from 'src/lib/axios'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

const CashbackFormSchema = z.object({
  percentage: z
    .string()
    .transform((value) => parseInt(value))
    .refine((value) => value > 0 && value <= 100, {
      message: 'Porcentagem inválida',
    }),
  expirationDays: z.string().transform((value) => parseInt(value)),
})

type CashbackFormInput = z.input<typeof CashbackFormSchema>

export default function SettingsCashback() {
  const { t } = useTranslation()
  const { profile, setProfile, handleShowToast } = useContext(AppContext)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashbackFormInput>({
    resolver: zodResolver(CashbackFormSchema),
    defaultValues: {
      percentage: profile.options.voucher[0].percentage.toString(),
      expirationDays: profile.options.voucher[0].expirationDays.toString(),
    },
  })

  const handleToggleCashbackStatus = async () => {
    try {
      const { data } = await api.patch('/dashboard/vouchers/toggle-cashback')
      setProfile((state) => {
        if (state) {
          return {
            ...state,
            options: {
              ...state.options,
              voucher: [
                {
                  ...state.options.voucher[0],
                  status: !state.options.voucher[0].status,
                },
              ],
            },
          }
        }
        return state
      })
      handleShowToast({
        type: 'success',
        title: t('cashback_status'),
        content: data.message,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro', title: t('cashback_status') })
    }
  }

  const handleSubmitCashback = async (body: CashbackFormInput) => {
    try {
      const { data } = await api.patch('/dashboard/vouchers/config', body)
      setProfile((state) => {
        if (state) {
          return {
            ...state,
            options: { ...state.options, voucher: [{ ...data.voucher[0] }] },
          }
        }
        return state
      })
      handleShowToast({
        type: 'success',
        title: t('cashback_configuration'),
        content: data.message,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro', title: t('cashback_configuration') })
    }
  }

  return (
    <>
      <Title
        title={t('settings')}
        className="mb-4"
        componentTitle={`${t('loyalty')} / Cashback`}
        child={['Cashback']}
      />
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <HelpVideos.Trigger
            className="btn btn-danger"
            title="Cashback"
            urls={[
              {
                src: 'https://www.youtube.com/embed/CBBI_YDzuoU?si=F2XsaNgyklthrkBy',
                title: t('how_to_configure_cashback'),
              },
            ]}
          />
          <Form.Switch
            id="toggle-cashback"
            label={t('activate_cashback')}
            checked={profile.options.voucher[0].status}
            onChange={handleToggleCashbackStatus}
          />
        </Card.Header>
        <Card.Body>
          <form
            id="form-cashback"
            onSubmit={handleSubmit(handleSubmitCashback)}
            className="d-flex flex-column flex-md-row gap-3"
          >
            <div>
              <Form.Label>{t('percentage_of')}</Form.Label>
              <InputGroup className="position-relative">
                <Form.Control
                  isInvalid={!!errors.percentage}
                  type="number"
                  placeholder={`${t('percentage_of')}. Ex: 10`}
                  {...register('percentage', { max: 100, min: 1 })}
                />
                <Form.Control.Feedback tooltip type="invalid" className="mt-2">
                  {errors.percentage?.message}
                </Form.Control.Feedback>
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </div>
            <div>
              <Form.Label>{t('validity')}</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder={`${t('in_days')}. Ex: 30`}
                  {...register('expirationDays')}
                />
                <InputGroup.Text>{t('days_n')}</InputGroup.Text>
              </InputGroup>
            </div>
          </form>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end">
          <Button variant="success" type="submit" form="form-cashback">
            {t('save')}
          </Button>
        </Card.Footer>
      </Card>
    </>
  )
}
