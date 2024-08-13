import { AppContext } from '@context/app.ctx'
import { apiRoute } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'
import { useContext } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { GoAlert } from 'react-icons/go'
interface UpdateAccountModalProps {
  show: boolean
  onSuccess: (show: boolean) => void
}

type UpdateAccountModalData = {
  incomeValue:
    | 'UP_TO_5K'
    | 'FROM_5K_TO_10K'
    | 'FROM_10K_TO_20K'
    | 'ABOVE_20K'
    | 'UP_TO_50K'
    | 'FROM_50K_TO_100K'
    | 'FROM_100K_TO_250K'
    | 'FROM_250K_TO_1MM'
    | 'FROM_1MM_TO_5MM'
    | 'ABOVE_5MM'
}

export const UpdateAccountModal = ({
  show,
  onSuccess,
}: UpdateAccountModalProps) => {
  const { data: session } = useSession()
  const { setProfile, profile } = useContext(AppContext)
  const { register, handleSubmit } = useForm<UpdateAccountModalData>()

  const updateAsaasAccount = async (body: UpdateAccountModalData) => {
    const { data } = await apiRoute(
      '/dashboard/asaas/asaasUpdateSubAccount',
      session,
      'PUT',
      body
    )
    setProfile({ ...profile, ...data })
    onSuccess(false)
  }

  return (
    <form
      id="updateAsaasAccountForm"
      onSubmit={handleSubmit(updateAsaasAccount)}
    >
      <Modal show={show} centered>
        <Modal.Body className="d-flex justify-content-center align-items-center flex-column gap-3 px-5 py-4">
          <div className="bg-warning rounded-3 p-3 text-white">
            <GoAlert size={30} />
          </div>
          <h2 style={{ color: '#A35F32' }}>Atualizar Conta Asaas</h2>
          <Form.Label className="w-100">
            <p>Rendimento Mensal</p>
            <Form.Select {...register('incomeValue', { required: true })}>
              <option value="UP_TO_5K">Até R$ 5.000</option>
              <option value="FROM_5K_TO_10K">Entre R$ 5.000 e R$ 10.000</option>
              <option value="FROM_10K_TO_20K">
                Entre R$ 10.000 e R$ 20.000
              </option>
              <option value="ABOVE_20K">Acima de R$ 20.000</option>
            </Form.Select>
          </Form.Label>
          <div className="text-center" style={{ color: '#888E9C' }}>
            <p>Olá! Tudo bem?</p>
            <br />
            <p>
              Por exigência do Bacen, agora é obrigatório que todos os clientes
              do Banco ASAAS informem seu rendimento médio mensal para que as
              automações de pagamentos on-line funcionem corretamente, a data
              limite é 30/05.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" type="submit" form="updateAsaasAccountForm">
            Atualizar
          </Button>
        </Modal.Footer>
      </Modal>
    </form>
  )
}
