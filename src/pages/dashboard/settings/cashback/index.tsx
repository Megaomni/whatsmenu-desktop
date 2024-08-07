import { HelpVideos } from '@components/Modals/HelpVideos'
import { Title } from '@components/Partials/title'
import { AppContext } from '@context/app.ctx'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext } from 'react'
import { Button, Card, Form, InputGroup } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { api } from 'src/lib/axios'
import { z } from 'zod'

const CashbackFormSchema = z.object({
  percentage: z
    .string()
    .transform((value) => parseInt(value))
    .refine((value) => value > 0 && value <= 100, { message: 'Porcentagem inválida' }),
  expirationDays: z.string().transform((value) => parseInt(value)),
})

type CashbackFormInput = z.input<typeof CashbackFormSchema>

export default function SettingsCashback() {
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
          return { ...state, options: { ...state.options, voucher: [{ ...state.options.voucher[0], status: !state.options.voucher[0].status }] } }
        }
        return state
      })
      handleShowToast({ type: 'success', title: 'Status Cashback', content: data.message })
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro', title: 'Status Cashback' })
    }
  }

  const handleSubmitCashback = async (body: CashbackFormInput) => {
    try {
      const { data } = await api.patch('/dashboard/vouchers/config', body)
      setProfile((state) => {
        if (state) {
          return { ...state, options: { ...state.options, voucher: [{ ...data.voucher[0] }] } }
        }
        return state
      })
      handleShowToast({ type: 'success', title: 'Configuração Cashback', content: data.message })
    } catch (error) {
      console.error(error)
      handleShowToast({ type: 'erro', title: 'Configuração Cashback' })
    }
  }

  return (
    <>
      <Title title="Configurações" className="mb-4" componentTitle="Fidelidade / Cashback" child={['Cashback']} />
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <HelpVideos.Trigger
            className="btn btn-danger"
            title="Cashback"
            urls={[
              {
                src: 'https://www.youtube.com/embed/CBBI_YDzuoU?si=F2XsaNgyklthrkBy',
                title: 'Como configurar o Cashback no WhatsMenu',
              },
            ]}
          />
          <Form.Switch
            id="toggle-cashback"
            label="Ativar Cashback"
            checked={profile.options.voucher[0].status}
            onChange={handleToggleCashbackStatus}
          />
        </Card.Header>
        <Card.Body>
          <form id="form-cashback" onSubmit={handleSubmit(handleSubmitCashback)} className="d-flex flex-column flex-md-row gap-3">
            <div>
              <Form.Label>Porcentagem</Form.Label>
              <InputGroup className="position-relative">
                <Form.Control
                  isInvalid={!!errors.percentage}
                  type="number"
                  placeholder="Porcentagem. Ex: 10"
                  {...register('percentage', { max: 100, min: 1 })}
                />
                <Form.Control.Feedback tooltip type="invalid" className="mt-2">
                  {errors.percentage?.message}
                </Form.Control.Feedback>
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </div>
            <div>
              <Form.Label>Validade</Form.Label>
              <InputGroup>
                <Form.Control type="number" placeholder="Em dias. Ex: 30" {...register('expirationDays')} />
                <InputGroup.Text>Dias</InputGroup.Text>
              </InputGroup>
            </div>
          </form>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end">
          <Button variant="success" type="submit" form="form-cashback">
            Salvar
          </Button>
        </Card.Footer>
      </Card>
    </>
  )
}
