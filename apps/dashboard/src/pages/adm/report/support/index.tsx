import { DateTime } from 'luxon'
import { GetServerSideProps } from 'next'
import { UserType } from 'next-auth'
import { getSession, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, Form, Row, Col, Table } from 'react-bootstrap'
import { Title } from '../../../../components/Partials/title'
import { ReportAdmGraphic } from '../../../../components/Report/AdmGraphic'
import { apiRoute } from '../../../../utils/wm-functions'

interface AdmReportBonusSupportProps {
  supports: any
}

export default function AdmReportBonusSupport({
  supports,
}: AdmReportBonusSupportProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [type, setType] = useState('paids')
  const [monthInput, setMonthInput] = useState(
    DateTime.local().toFormat('yyyy-MM')
  )
  const [months, setMonths] = useState<string[]>([])
  const { data: session } = useSession()

  useEffect(() => {
    setMonths(
      Array.from(
        new Set(
          supports?.flatMap((support: any) => Object.keys(support.report))
        )
      )
    )
  }, [supports])

  useEffect(() => {
    setUsers(
      supports?.flatMap(
        (support: any) =>
          support.report[monthInput] &&
          Object.values(support.report[monthInput][type]).reverse()
      )
    )
  }, [supports, type, monthInput])

  return (
    <>
      <Title
        title="ADM"
        componentTitle="Clientes"
        className="mb-4"
        child={['Clientes']}
      />
      <Row>
        <section>
          <article>
            {supports?.map((support: any) => (
              <Card key={support.id}>
                <Card.Header>
                  <h4>{support.name}</h4>
                </Card.Header>
                <Card.Body>
                  <ReportAdmGraphic
                    months={Object.keys(support.report)}
                    reports={support.report}
                    type="support"
                    period="yearly"
                  />
                </Card.Body>
              </Card>
            ))}
          </article>
          <article>
            <hr />
            <Form>
              <Row>
                <Col sm className="flex-grow">
                  <Form.Label className="fs-7">Data:</Form.Label>
                  <Form.Select
                    value={monthInput}
                    onChange={(e) => setMonthInput(e.target.value)}
                  >
                    {months?.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col sm>
                  <Form.Label className="fs-7">Tipo:</Form.Label>
                  <Form.Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="paids">Ativos</option>
                    <option value="paidLates">Ativos com Atraso</option>
                    <option value="canceleds">Cancelamentos</option>
                  </Form.Select>
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
                    <tr className="fs-7">
                      <th>#</th>
                      <th>id</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Cadastro</th>
                      <th>WhatsApp</th>
                      <th>Suporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user, index) => (
                      <tr key={user.id} className="fs-7">
                        <td>{index + 1}</td>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user?.controls?.serviceStart ? 'SIM' : 'NÃO'}</td>
                        <td>{user.whatsapp}</td>
                        <td>
                          {
                            supports.find(
                              (support: any) => support.id === user.supportId
                            ).name
                          }
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
  const { data: supports } = await apiRoute(
    `${process.env.NEXT_PUBLIC_WHATSMENU_API}/administrator-api/report/support`,
    session
  )
  return {
    props: { supports },
  }
}
