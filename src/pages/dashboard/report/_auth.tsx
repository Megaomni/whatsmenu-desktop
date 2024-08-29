import { AuthForm } from '@components/AuthForm'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import { Dispatch, FormEvent, SetStateAction, useContext } from 'react'
import { AppContext } from '../../../context/app.ctx'
import Cart from '../../../types/cart'
import Table from '../../../types/table'
import { ReportType } from './[report]'

interface AuthReportProps {
  setValidation: Dispatch<SetStateAction<boolean>>
  setData: Dispatch<SetStateAction<any>>
  setResume: Dispatch<SetStateAction<any>>
  report: ReportType
}

export default function AuthReport({ setData, setValidation, setResume, report }: AuthReportProps) {
  const { handleShowToast, profile } = useContext(AppContext)
  const { data: session } = useSession()
  const handleSubmit = async (e: FormEvent<HTMLElement>) => {
    e.preventDefault()

    const security_key = (document.querySelector('#security_key') as HTMLInputElement).value
    const motoboyId = (document.querySelector('#motoboyId') as HTMLInputElement).value
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

  return (
    <div style={{ minHeight: 'inherit' }} className="d-flex justify-content-center">
      <Head>
        <title>WhatsMenu - Relatórios</title>
      </Head>
      <div className="my-auto">
        <AuthForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
