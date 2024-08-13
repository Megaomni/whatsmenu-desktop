'use client'

import { Recover } from '@components/Modals/Recover'
import { zodResolver } from '@hookform/resolvers/zod'
import useLocalStorage from '@hooks/useLocalStorage'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const LoginFormSchema = z.object({
  username: z.string().email(),
  password: z.string(),
  ip: z.string(),
  userAgent: z.string(),
  csrfToken: z.string(),
})

type LoginFormSchemaInput = z.infer<typeof LoginFormSchema>

type LoginProps = Omit<LoginFormSchemaInput, 'username' | 'password'>

export const Login = ({ csrfToken, ip, userAgent }: LoginProps) => {
  const searchParams = useSearchParams()
  const [lastEmail, setLastEmail] = useLocalStorage('last-email', '')
  const { register, handleSubmit, watch, getValues } =
    useForm<LoginFormSchemaInput>({
      resolver: zodResolver(LoginFormSchema),
      defaultValues: {
        csrfToken,
        userAgent,
        ip,
        username: lastEmail,
      },
    })

  const [showRecover, setShowRecover] = useState(false)

  const handleLogin = async (credentials: LoginFormSchemaInput) => {
    await signIn('credentials', {
      ...credentials,
      redirect: true,
      callbackUrl: '/dashboard/request',
    })
  }

  const username = watch('username')

  useEffect(() => {
    setLastEmail(username)
  }, [username, setLastEmail])

  const error = searchParams?.get('error')

  return (
    <>
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit(handleLogin)}>
        <input type="hidden" {...register('csrfToken')} />
        <input type="hidden" {...register('ip')} />
        <input type="hidden" {...register('userAgent')} />
        <div className="form-group first">
          <label htmlFor="username">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Email de cadastro"
            {...register('username')}
          />
        </div>
        <div className="form-group last mb-3">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            className="form-control"
            placeholder="Sua senha"
            {...register('password')}
          />
        </div>

        <div className=" align-items-center mb-5">
          <p
            className="text-dark float-start cursor-pointer"
            onClick={() => setShowRecover(true)}
          >
            Esqueci a senha
          </p>
          <br />
        </div>

        <div className="d-grid gap-2">
          <button className="btn btn-success" type="submit">
            Acessar
          </button>
        </div>
      </form>
      <Recover
        show={showRecover}
        handleClose={() => setShowRecover(false)}
        email={getValues('username')}
      />
    </>
  )
}
