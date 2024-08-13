import Head from 'next/head'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { BsSearch } from 'react-icons/bs'
import { Title } from '../../../../../components/Partials/title'

export default function AdmReportUsersCard() {
  return (
    <>
      <Title
        title="ADM"
        componentTitle="Ativos Cartão"
        className="mb-4"
        child={['Ativos Cartão']}
      />
      <section>
        <Row>
          <Card>
            <Card.Body>
              <Row>
                <Col sm="6">
                  <Form.Group>
                    <Form.Label className="fs-7">Usuário</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Digite o email do usuário"
                    />
                  </Form.Group>
                </Col>
                <Col sm="4">
                  <Form.Group>
                    <Form.Label className="fs-7 ">Buscar por</Form.Label>
                    <Form.Select>
                      <option>Email</option>
                      <option>Slug</option>
                      <option>WhatsApp</option>
                      <option>Nome</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm="2" className="d-flex align-items-end">
                  <Button variant="success" className="w-100">
                    <span className="ms-2">Buscar</span>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Row>
        <Row className="mt-3">
          <Card>
            <Card.Header>
              <h4 className="fs-5">Ativos Cartão</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm>
                  <Table className=" fs-6" responsive striped hover>
                    <thead>
                      <tr className="fs-7">
                        <th>ID</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>WhatsApp</th>
                        <th>Slug</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="fs-7">
                        <td>9435</td>
                        <td>Havy Lanches Delivery</td>
                        <td>academiagerufitness@gmail.com</td>
                        <td>79 9801-1344</td>
                        <td>HeavyLanches</td>
                      </tr>
                      <tr className="fs-7">
                        <td>9435</td>
                        <td>Havy Lanches Delivery</td>
                        <td>academiagerufitness@gmail.com</td>
                        <td>79 9801-1344</td>
                        <td>HeavyLanches</td>
                      </tr>
                      <tr className="fs-7">
                        <td>9435</td>
                        <td>Havy Lanches Delivery</td>
                        <td>academiagerufitness@gmail.com</td>
                        <td>79 9801-1344</td>
                        <td>HeavyLanches</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Row>
      </section>
    </>
  )
}
