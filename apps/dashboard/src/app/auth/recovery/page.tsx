import { UserType } from 'next-auth'
import Head from 'next/head'
import Link from 'next/link'
import { RecoveryForm } from './recovery-form'
import { api, apiV2 } from 'src/lib/axios'

export interface RecoveryProps {
  searchParams: {
    token: string
  }
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

export default async function Recovery({
  searchParams: { token },
}: RecoveryProps) {
  const { data } = await apiV2.get<{
    user: UserType
    token: string
    expired: boolean
  }>(`/login/forgot?token=${token}`)
  const { user, expired } = data

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
                    <RecoveryForm user={user} />
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
    </>
  )
}
