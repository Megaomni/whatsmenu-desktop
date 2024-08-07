import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import { Alert, Button, Col, Nav, Row, Tab } from 'react-bootstrap'
import { AddPlan } from '../../../components/AddPlan'
import { BadgeQuantity } from '../../../components/Generic/BadgeQuantity'
import { Title } from '../../../components/Partials/title'
import { Carts } from '../../../components/Request/Carts'
import { Packages } from '../../../components/Request/Packages'
import { AppContext } from '../../../context/app.ctx'
import useLocalStorage from '../../../hooks/useLocalStorage'
import { apiRoute, textPackage } from '../../../utils/wm-functions'
import { CartsContext } from '@context/cart.ctx'
import { useSession } from 'next-auth/react'

export default function Requests() {
  // const { packageCarts } = useContext(CartsContext)
  const { profile, plansCategory, bartenders, verifyInventory } = useContext(AppContext)
  const { data: session } = useSession()
  const router = useRouter()

  const [batenderMessage, setBartenderMessage] = useLocalStorage('batenderMessage', true)

  const [lengthRequestsNullPackage, setLengthRequestsNullPackage] = useState<number>(0)
  const [lengthRequestsNull, setLengthRequestsNull] = useState<number>(0)

  // useEffect(() => {
  //   setLengthRequestsNullPackage(
  //     packageCarts.data.filter((cart) => cart.status === null).length
  //   );
  // }, [packageCarts]);

  return (
    <>
      {profile?.id && (
        <>
          <Title title="Pedidos" componentTitle="Gestão de Pedidos" className="mb-4" />
          {plansCategory.includes('table') &&
          bartenders.length &&
          !bartenders.filter((bartender) => !bartender.deleted_at).length &&
          batenderMessage ? (
            <Alert variant="warning">
              <Alert.Heading>Recurso novo</Alert.Heading>
              <p>Você trabalha com garçons tirando pedidos?</p>
              <p>Então Cadastre seus garçons e lance pedidos rapidamente.</p>
              <hr />
              <div className="d-flex justify-content-end gap-2">
                <Button variant="danger" onClick={() => setBartenderMessage(false)}>
                  Não trabalho com garçons
                </Button>
                <Button
                  variant="warning text-white"
                  onClick={() => {
                    router.push('/dashboard/settings/table?bartender=true')
                  }}
                >
                  Cadastrar meus garçons
                </Button>
              </div>
            </Alert>
          ) : null}
          <section>
            <Tab.Container id="" defaultActiveKey="requests">
              <Row>
                <Col sm={12}>
                  <Nav variant="tabs" className="flex-row tab-nav-flex">
                    <Nav.Item>
                      <Nav.Link eventKey="requests" className="nav-link">
                        <div className="d-flex align-items-baseline gap-1">
                          <span>Pedidos</span>
                          {lengthRequestsNull > 0 && (
                            <BadgeQuantity
                              title="Pedidos que não foram recebidos."
                              number={lengthRequestsNull}
                              className="pulseElement my-auto badge-item"
                            />
                          )}
                        </div>
                      </Nav.Link>
                    </Nav.Item>
                    {/* <Nav.Item>
                      <Nav.Link eventKey="tables" className="nav-link">
                        Comandas
                      </Nav.Link>
                    </Nav.Item> */}
                    <Nav.Item id="packageTabHead">
                      <Nav.Link eventKey="packages" className="nav-link">
                        <div className="d-flex align-items-baseline gap-1">
                          <span>{textPackage(profile.options.package.label2)}</span>
                          {lengthRequestsNullPackage > 0 && (
                            <BadgeQuantity
                              title="Pedidos que não foram recebidos."
                              number={lengthRequestsNullPackage}
                              className="pulseElement my-auto badge-item"
                            />
                          )}
                        </div>
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="requests">
                      <Carts />
                    </Tab.Pane>
                    {/* <Tab.Pane eventKey="tables">  
                      {!plans.includes("table") ? (
                        <AddPlan
                          title="Mesas e Comandas com auto-atendimento"
                          plan="table"
                        />
                      ) : (
                        <Tables />
                      )}
                    </Tab.Pane> */}
                    <Tab.Pane eventKey="packages">
                      {!plansCategory.includes('package') ? <AddPlan title="Encomendas/Agendamentos" plan="package" /> : <Packages />}
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </section>
        </>
      )}
    </>
  )
}
