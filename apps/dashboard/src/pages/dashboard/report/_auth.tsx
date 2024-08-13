import { AuthForm } from '@components/AuthForm'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import { Dispatch, FormEvent, SetStateAction, useContext } from 'react'
import { AppContext } from '../../../context/app.ctx'
import Cart from '../../../types/cart'
import Table from '../../../types/table'
import { ReportType } from './[report]'
import { useTranslation } from 'react-i18next'
import { HelpVideos } from '@components/Modals/HelpVideos'

interface AuthReportProps {
  setValidation: Dispatch<SetStateAction<boolean>>
  setData: Dispatch<SetStateAction<any>>
  setResume: Dispatch<SetStateAction<any>>
  report: ReportType
}

export default function AuthReport({
  setData,
  setValidation,
  setResume,
  report,
}: AuthReportProps) {
  const { t } = useTranslation()
  const { handleShowToast, profile } = useContext(AppContext)
  const { data: session } = useSession()
  const handleSubmit = async (e: FormEvent<HTMLElement>) => {
    e.preventDefault()

    const security_key = (
      document.querySelector('#security_key') as HTMLInputElement
    ).value
    const motoboyId = (document.querySelector('#motoboyId') as HTMLInputElement)
      .value
    const response = await fetch('/api/middleware/reports', {
      body: JSON.stringify({ security_key, report, session, motoboyId }),
      method: 'POST',
    })
      .then((response) => response.json())
      .catch(console.error)

    const { validate, data, resume } = response
    if (!response.validate) {
      return handleShowToast({ type: 'erro', content: response.message })
    }

    if (data.carts) {
      data.carts.data = data.carts.data.map((c: Cart) => new Cart(c))
    }

    if (data.tables) {
      data.tables.data = data.tables.data.map((t: Table) => new Table(t))
    }

    setValidation(validate)
    setData(data)
    setResume(resume)
  }

  let video = { src: '', title: 'Relatório' }
  //
  switch (report) {
    case 'finance':
      video = {
        src: 'https://www.youtube.com/embed/oYUhPHihzq0',
        title: 'Relatorio Financeiro',
      }
      break
    case 'daily':
      video = {
        src: 'https://www.youtube.com/embed/Ye8ZSTtXnXU',
        title: 'Relatório Diário',
      }
      break
    case 'monthly':
      video = {
        src: 'https://www.youtube.com/embed/KEmlQ8wWhJU',
        title: 'Relatório Mensal',
      }
      break
    case 'cashier':
      video = {
        src: 'https://www.youtube.com/embed/-rtskl9XiVI',
        title: 'Relatório de Caixa',
      }
      break
    case 'motoboys':
      video = {
        src: 'https://www.youtube.com/embed/DF8j9EV58rI',
        title: 'Relatório de Entregadores',
      }
      break
    case 'client':
      video = {
        src: 'https://www.youtube.com/embed/hMTYKIVi9nU',
        title: 'Relatório de Clientes',
      }
      break
  }

  return (
    <div
      style={{ minHeight: 'inherit' }}
      className="d-flex justify-content-center position-relative"
    >
      {report !== 'bestSellers' && (
        <div className="position-absolute start-0 top-0">
          <HelpVideos.Trigger urls={[video]} />
        </div>
      )}
      <Head>
        <title>WhatsMenu - {t('reports')}</title>
      </Head>
      <div className="my-auto">
        <AuthForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
