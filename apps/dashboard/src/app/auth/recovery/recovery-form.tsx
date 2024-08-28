'use client'
import { WMToast, WMToastProps } from '@components/WMToast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserType } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { api } from 'src/lib/axios'
import { z } from 'zod'

const RecoveryFormSchema = z.object({
  user_email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .refine((value) => value !== '123456', {
      message:
        'Essa senha não é segura o suficiente. Por favor, escolha outra.',
    }),
  password_confirm: z.string(),
})
interface RecoveryFormProps {
  user: UserType
}

type FormData = z.infer<typeof RecoveryFormSchema>

export const RecoveryForm = ({ user }: RecoveryFormProps) => {
  const [showToast, setShowToast] = useState(false)
  const [toast, setToast] = useState<WMToastProps>({})
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(RecoveryFormSchema),
    defaultValues: {
      user_email: user.email,
    },
  })

  const handleUpdatePassword = async (data: FormData) => {
    try {
      await api.post('/recovery/user/password', data)
      setToast({
        type: 'success',
        content:
          'Senha alterada com sucesso acesse seu painel com a nova senha',
        title: 'Recuperação de Senha',
      })
      setShowToast(true)
      router.push('/auth/login')
    } catch (error) {
      setToast({
        type: 'erro',
        content: '',
        title: '',
      })
      setShowToast(true)
      console.error(error)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleUpdatePassword)} method="POST">
        <div className="form-group first position-relative">
          <label htmlFor="username">Nova Senha</label>
          <Form.Control
            type="password"
            placeholder="Sua nova senha"
            isInvalid={!!errors.password}
            {...register('password')}
          />
          <Form.Control.Feedback
            tooltip
            type="invalid"
            style={{ zIndex: 0, left: 0 }}
            className="mt-2"
          >
            {errors.password?.message}
          </Form.Control.Feedback>
        </div>
        <div className="form-group last mb-3">
          <label htmlFor="password">Confirmar senha</label>
          <input
            type="password"
            className="form-control"
            placeholder="Confirme sua senha"
            id="confirmPassword"
            {...register('password_confirm')}
          />
        </div>
        <div className="d-grid gap-2">
          <button
            className="btn btn-success"
            type="submit"
            disabled={!!errors.password}
          >
            Salvar
          </button>
        </div>
        {/* {preventInsecurePassword() ? <div className="alert alert-danger my-2" role="alert">
          {preventInsecurePassword()}
        </div> : null} */}
      </form>
      <WMToast
        position={toast.position}
        title={toast.title}
        content={toast.content}
        show={showToast}
        setShow={setShowToast}
        type={toast.type}
        size={30}
      />
    </>
  )
}

//