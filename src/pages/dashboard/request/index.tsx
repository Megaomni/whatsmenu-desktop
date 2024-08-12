import { useRouter } from 'next/router'
import { useContext, useState } from 'react'
import { Alert, Button, Col, Nav, Row, Tab } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { AddPlan } from '../../../components/AddPlan'
import { BadgeQuantity } from '../../../components/Generic/BadgeQuantity'
import { Title } from '../../../components/Partials/title'
import { Carts } from '../../../components/Request/Carts'
import { Packages } from '../../../components/Request/Packages'
import { AppContext } from '../../../context/app.ctx'
import useLocalStorage from '../../../hooks/useLocalStorage'
import { textPackage } from '../../../utils/wm-functions'

export default function Requests() {
  // const { packageCarts } = useContext(CartsContext)
  const { profile, plansCategory, bartenders } = useContext(AppContext)
  const router = useRouter()

  const [batenderMessage, setBartenderMessage] = useLocalStorage('batenderMessage', true)

  const [lengthRequestsNullPackage, setLengthRequestsNullPackage] = useState<number>(0)
  const [lengthRequestsNull, setLengthRequestsNull] = useState<number>(0)

  const { t } = useTranslation()
  return (
    <>
      {profile?.id && (
        <>
          <Title title={t('orders')} componentTitle={t('order_management')} className="mb-4" />
          {plansCategory.includes('table') &&
          bartenders.length &&
          !bartenders.filter((bartender) => !bartender.deleted_at).length &&
          batenderMessage ? (
            <Alert variant="warning">
              <Alert.Heading>{t('new_feature')}</Alert.Heading>
              <p>{t('work_waiters_taking')}</p>
              <p>{t('register_you_waiters_quickly')}</p>
              <hr />
              <div className="d-flex justify-content-end gap-2">
                <Button variant="danger" onClick={() => setBartenderMessage(false)}>
                  {t('dont_work_waiters')}
                </Button>
                <Button
                  variant="warning text-white"
                  onClick={() => {
                    router.push('/dashboard/settings/table?bartender=true')
                  }}
                >
                  {t('register_waiters')}
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
                          <span>{t('orders')}</span>
                          {lengthRequestsNull > 0 && (
                            <BadgeQuantity
                              title={t('orders_were_not_received')}
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
                              title={t('orders_were_not_received')}
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
                      {!plansCategory.includes('package') ? <AddPlan title={t('orders_appointments')} plan="package" /> : <Packages />}
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
