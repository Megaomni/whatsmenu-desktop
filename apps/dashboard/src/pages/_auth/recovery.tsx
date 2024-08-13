import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { useState } from 'react'
import { apiRoute } from '../../utils/wm-functions'
import { UserType } from 'next-auth'
import { WMToast, WMToastProps } from '../../components/WMToast'
import { useRouter } from 'next/router'

export interface RecoveryProps {
  user: UserType
  token: string
  expired: boolean
}

export interface Controls {
  period: string
  recovery: Recovery
  salePrint: boolean
  salePrintQTD: number
  serviceStart: boolean
  disableInvoice: boolean
}

export interface Recovery {
  date: string
  token: string
}

export default function Recovery({ expired, user }: RecoveryProps) {
  const [showToast, setShowToast] = useState(false)
  const [toast, setToast] = useState<WMToastProps>({})
  const [password, setPassword] = useState('')
  const [password_confirm, setPassword_confirm] = useState('')
  const router = useRouter()

  const handleUpdatePassword = async () => {
    if (preventInsecurePassword()) return
    try {
      await apiRoute('/user/passwordForgot', undefined, 'POST', {
        user_email: user.email,
        password,
        password_confirm,
      })
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

  function preventInsecurePassword() {
    if (password === '123456')
      return 'Essa senha não é segura o suficiente. Por favor, escolha outra.'
    if (password !== password_confirm) return 'As senhas não coincidem!'
  }

  return (
    <>
      <Head>
        <title>WhatsMenu - Recuperação de Senha</title>
      </Head>
      <main className="bg-white">
        <div className="d-lg-flex half">
          <div
            className="bg order-md-2 d-none d-sm-block order-1"
            style={{ backgroundImage: "url('/images/bkg_1.webp')" }}
          ></div>
          <div className="order-md-1 order-2 contents">
            <div className="container">
              <div className="row align-items-center justify-content-center">
                {!expired ? (
                  <div className="col-md-7">
                    <p className="fs-1 text-center">
                      <strong>
                        <span className="text-green">WhatsMenu</span>
                      </strong>
                    </p>
                    <p className="fw-bold mb-4 text-center">
                      Recuperação de Senha
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleUpdatePassword()
                      }}
                      method="POST"
                    >
                      <div className="form-group first">
                        <input type="hidden" value={user.email} />
                        <label htmlFor="username">Nova Senha</label>
                        <input
                          type="password"
                          name="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="form-control"
                          placeholder="Sua nova senha"
                          required={true}
                        />
                      </div>
                      <div className="form-group last mb-3">
                        <label htmlFor="password">Confirmar senha</label>
                        <input
                          type="password"
                          name="password_confirm"
                          value={password_confirm}
                          onChange={(e) => setPassword_confirm(e.target.value)}
                          className="form-control"
                          placeholder="Confirme sua senha"
                          id="confirmPassword"
                          required={true}
                        />
                      </div>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success"
                          type="submit"
                          disabled={!!preventInsecurePassword()}
                        >
                          Salvar
                        </button>
                      </div>
                      {preventInsecurePassword() ? (
                        <div className="alert alert-danger my-2" role="alert">
                          {preventInsecurePassword()}
                        </div>
                      ) : null}
                    </form>
                  </div>
                ) : (
                  <div className="col-md-7 text-center">
                    <h2>
                      Sua solicitação de recuperação de senha expirou!
                      <br /> Por favor solicite novamente uma recuperação de
                      senha de acesso.
                    </h2>
                    <Link href="/auth/login">Clique aqui para voltar</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const session = await getSession({ req })

  if (session?.user?.id) {
    return {
      redirect: {
        destination: '/dashboard/request',
        permanent: false,
      },
    }
  }

  let dataFetched
  try {
    const { data } = await apiRoute(`/login/forgot?token=${query.token}`)
    dataFetched = data
  } catch (error) {
    console.error(error)
    throw error
  }

  return {
    props: { ...dataFetched },
  }
}
