import { AppContext } from '@context/app.ctx'
import { DateTime } from 'luxon'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { FormEvent, useContext, useState } from 'react'
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { BsCheck, BsSearch } from 'react-icons/bs'
import { Title } from '../../../../components/Partials/title'
import { apiRoute, handleCopy } from '../../../../utils/wm-functions'
import { FaCopy } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

interface AdmReportLeadsProps {
  initialLeads: any
  initialYear: string
  initialMonth: string
}

export default function AdmReportLeads({ initialLeads }: AdmReportLeadsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const [month, setMonth] = useState(
    DateTime.local().month.toString().padStart(2, '0')
  )
  const [year, setYear] = useState(DateTime.local().year.toString())
  const [leads, setLeads] = useState<Array<any>>(initialLeads)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await apiRoute(
        `/adm/registers/${year}/${month}`,
        session,
        'GET'
      )
      setLeads(data as any[])
    } catch (error) {
      handleShowToast({
        type: 'erro',
        content: (error as any)?.response?.data?.message,
      })
      console.error(error)
    }
  }

  const handleUpdateLead = async (index: number) => {
    try {
      setLeads((state) => {
        state[index].loading = true
        return [...state]
      })
      const { data } = await apiRoute(
        `/adm/registers/${year}/${month}/update/${index}`,
        session,
        'PATCH',
        { sellerId: session?.user?.id }
      )
      setLeads((state) => {
        state[index] = { ...state[index], ...data.lead, loading: false }
        return [...state]
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Title
        title="ADM"
        componentTitle="Leads"
        className="mb-4"
        child={['Leads']}
      />
      <Row>
        <section>
          <article>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col sm className="flex-grow">
                  <Form.Label className="fs-7">Ano:</Form.Label>
                  <Form.Select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option key={year} value={year}>
                      {year}
                    </option>
                  </Form.Select>
                </Col>
                <Col sm>
                  <Form.Label className="fs-7">Mês:</Form.Label>
                  <Form.Select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {Array.from(Array(12).keys())
                      .filter((m) => {
                        m = Number(m + 1)
                        return (
                          m >= DateTime.local().month,
                          m,
                          DateTime.local().month >= m
                        )
                      })
                      .map((month) => {
                        month += 1
                        const monthValue = String(month).padStart(2, '0')
                        return (
                          <option key={month} value={monthValue}>
                            {monthValue}
                          </option>
                        )
                      })}
                  </Form.Select>
                </Col>
                <Col sm="2" className="mt-auto">
                  <Button className="w-100" type="submit">
                    <BsSearch />
                    Buscar
                  </Button>
                </Col>
              </Row>
            </Form>
            <Card className="mt-3">
              <Card.Header>
                <h4>Lista de Clientes</h4>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr className="fs-7 text-center">
                      <th>ID</th>
                      <th>Nome</th>
                      <th>WhatsApp</th>
                      <th>Tipo</th>
                      <th>Data de Cadastro</th>
                      <th>Vendedor</th>
                      <th>Contatado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads
                      ?.map((lead, index) => ({ ...lead, id: index }))
                      .reverse()
                      .map((lead) => (
                        <tr key={`${lead.id}`} className="fs-7 text-center">
                          <td>{lead.id}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden' }}>
                            {lead.name}
                          </td>
                          <td onClick={(e) => handleCopy(e, handleShowToast)}>
                            <div className="d-flex align-items-center justify-content-center cursor-pointer gap-2">
                              <FaCopy color="#a1a1a1" />
                              {lead.whatsapp}
                            </div>
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden' }}>
                            {lead.work}
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden' }}>
                            {DateTime.fromISO(lead.date).toFormat(
                              `${t('date_format')} HH:mm:ss`
                            )}
                          </td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden' }}>
                            {lead?.seller?.name ?? '-'}
                          </td>
                          <td>
                            <Button
                              id={`lead-${lead.id}`}
                              className="w-100"
                              variant={
                                lead.contacted_at
                                  ? 'outline-success'
                                  : 'primary'
                              }
                              onClick={() => handleUpdateLead(lead.id)}
                              disabled={!!lead.contacted_at === true}
                            >
                              {lead.loading ? (
                                <>
                                  <Spinner
                                    size="sm"
                                    animation="border"
                                    variant="light"
                                    className="d-inline-block ms-1"
                                  />
                                  <span className="d-inline-block ms-1">
                                    Aguarde
                                  </span>
                                </>
                              ) : (
                                <>
                                  {lead.contacted_at ? (
                                    <>
                                      <BsCheck />
                                      <span>
                                        Contatado em{' '}
                                        {DateTime.fromISO(
                                          lead.contacted_at
                                        ).toFormat(
                                          `${t('date_format')} HH:mm:ss`
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    `Contatado`
                                  )}
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </article>
        </section>
      </Row>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const initialYear = DateTime.local().year.toString().padStart(2, '0')
  const initialMonth = DateTime.local().month.toString().padStart(2, '0')
  let initialLeads: any[] = []
  try {
    const { data } = await apiRoute(
      `/adm/registers/${initialYear}/${initialMonth}`,
      session,
      'GET'
    )
    initialLeads = data as any[]
  } catch (error) {
    console.error(error)
  }

  return {
    props: { initialLeads, initialYear, initialMonth },
  }
}
