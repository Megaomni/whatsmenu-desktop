import { PaymentMethodProvider } from '@context/paymentMethod.ctx'
import { useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Badge, Col, Nav, Row, Tab } from 'react-bootstrap'
import { BsCheckLg, BsExclamationLg } from 'react-icons/bs'
import { HelpVideos } from '../../../components/Modals/HelpVideos'
import { Title } from '../../../components/Partials/title'
import { ProfileAddress } from '../../../components/Profile/Address'
import { ProfileBusiness } from '../../../components/Profile/Business'
import { ProfileFormsPayment } from '../../../components/Profile/FormsPayment'
import { ProfileFreight } from '../../../components/Profile/Freight'
import { ProfileOpeningHours } from '../../../components/Profile/OpeningHours'
import { AppContext } from '../../../context/app.ctx'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

interface ProfileProps {}

export default function Profile({}: ProfileProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, plansCategory } = useContext(AppContext)
  const [key, setKey] = useState('business')
  const [block] = useState(plansCategory?.some((plan) => plan !== 'table'))
  const [steps, setSteps] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (
      profile &&
      profile.id &&
      !profile.address?.street &&
      !plansCategory.every((plan) => plan === 'table')
    ) {
      setKey('address')
    }
    if (
      profile &&
      profile.id &&
      profile.address?.street &&
      profile.taxDelivery?.length < 1 &&
      !plansCategory.every((plan) => plan === 'table')
    ) {
      setKey('freight')
    }
  }, [profile, block, plansCategory])

  useEffect(() => {
    if (
      plansCategory?.some((p) => p !== 'table') &&
      (!profile.id || !profile.address.street || profile.taxDelivery.length < 1)
    ) {
      setSteps(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    switch (location.hash) {
      case '#forms-payment':
        setKey('forms-payment')
        break

      case '#address':
        setKey('address')
        break

      case '#layout':
        setKey('layout')
        break

      case '#freight':
        setKey('freight')
        break

      case '#hours':
        setKey('hours')
        break

      default:
        setKey('business')
        break
    }
  }, [])

  return (
    profile && (
      <>
        <Title
          title={t('my_profile')}
          componentTitle={t('profile')}
          className="mb-4"
        />
        {steps && (
          <div className="bd-callout bd-callout-success">
            <p className="m-0">
              <span className="fw-bold">{t('congratulations')}</span>,{' '}
              {
                (session?.user?.name ?? session?.user?.$attributes.name).split(
                  ' '
                )[0]
              }
              ! <br />
              {t('message_few_steps_organized')}
              <span className="fw-bold"> {t('digital_menu')}</span>
            </p>
            <div className="d-flex align-itens-center justify-content-between">
              <p className="m-0 my-3 text-red-400">
                {t('basic_details_establishment')}
              </p>
              <HelpVideos.Trigger
                urls={[
                  {
                    src: 'https://www.youtube.com/embed/a7kfhg0lKFM',
                    title: t('filling_profile'),
                  },
                ]}
              />
            </div>
          </div>
        )}
        <section>
          {profile && (
            <Tab.Container
              id=""
              activeKey={key}
              onSelect={(k) => setKey(k as string)}
            >
              <Row>
                <Col sm={12}>
                  <Nav
                    activeKey={'address'}
                    variant="tabs"
                    className="tab-nav-flex flex-row"
                  >
                    <Nav.Item>
                      <Nav.Link
                        eventKey="business"
                        className="position-relative"
                      >
                        {steps && (
                          <Badge
                            bg={profile.id ? 'success' : 'danger'}
                            pill
                            className={`position-absolute`}
                            style={{ top: -10, right: -5 }}
                          >
                            {profile.id ? <BsCheckLg /> : <BsExclamationLg />}
                          </Badge>
                        )}
                        {t('establishment')}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="layout">{t('store_layout')}</Nav.Link>
                    </Nav.Item>
                    <>
                      <Nav.Item>
                        <Nav.Link
                          disabled={!profile.id ? true : false}
                          eventKey="address"
                          className="position-relative"
                        >
                          {steps &&
                            profile.id &&
                            plansCategory.some((plan) => plan !== 'table') && (
                              <Badge
                                bg={
                                  profile.id && profile.address.street
                                    ? 'success'
                                    : 'danger'
                                }
                                pill
                                className={`position-absolute`}
                                style={{ top: -10, right: -5 }}
                              >
                                {profile.id && profile.address.street ? (
                                  <BsCheckLg />
                                ) : (
                                  <BsExclamationLg />
                                )}
                              </Badge>
                            )}
                          {t('address')}
                        </Nav.Link>
                      </Nav.Item>
                      <>
                        <>
                          <Nav.Item>
                            <Nav.Link
                              disabled={
                                profile.id &&
                                ((profile.address.street &&
                                  profile.taxDelivery.length > 0) ||
                                  plansCategory.every(
                                    (plan) => plan === 'table'
                                  ))
                                  ? false
                                  : true
                              }
                              eventKey="hours"
                            >
                              {t('operating_hours')}
                            </Nav.Link>
                          </Nav.Item>
                          <Nav.Item>
                            <Nav.Link
                              // disabled={
                              //   !profile.id ||
                              //   (profile.id && !profile.address.street)
                              //     ? true
                              //     : false
                              // }
                              disabled={
                                profile.id &&
                                (profile.address.street ||
                                  plansCategory.every(
                                    (plan) => plan === 'table'
                                  ))
                                  ? false
                                  : true
                              }
                              eventKey="freight"
                              className="position-relative"
                            >
                              {t('shipping')}
                              {!steps ||
                              !profile.id ||
                              (profile.id && !profile.address.street) ? null : (
                                <Badge
                                  bg={
                                    profile.id &&
                                    profile.address.street &&
                                    profile.taxDelivery.length
                                      ? 'success'
                                      : 'danger'
                                  }
                                  pill
                                  className={`position-absolute`}
                                  style={{ top: -10, right: -5 }}
                                >
                                  {profile.id &&
                                  profile.address.street &&
                                  profile.taxDelivery.length ? (
                                    <BsCheckLg />
                                  ) : (
                                    <BsExclamationLg />
                                  )}
                                </Badge>
                              )}
                            </Nav.Link>
                          </Nav.Item>
                          <Nav.Item>
                            <Nav.Link
                              disabled={
                                profile.id &&
                                ((profile.address.street &&
                                  profile.taxDelivery.length > 0) ||
                                  plansCategory.every(
                                    (plan) => plan === 'table'
                                  ))
                                  ? false
                                  : true
                              }
                              eventKey="forms-payment"
                            >
                              {t('payment')}
                            </Nav.Link>
                          </Nav.Item>
                        </>
                      </>
                    </>
                  </Nav>
                  <Tab.Content>
                    <Tab.Pane eventKey="business">
                      <PaymentMethodProvider>
                        <ProfileBusiness layout={false} steps={steps} />
                      </PaymentMethodProvider>
                    </Tab.Pane>
                    <Tab.Pane eventKey="layout">
                      <PaymentMethodProvider>
                        <ProfileBusiness layout={true} steps={steps} />
                      </PaymentMethodProvider>
                    </Tab.Pane>
                    <Tab.Pane eventKey="address">
                      <ProfileAddress
                        automaticModal={
                          !!(profile.id && !profile.address.street)
                        }
                      />
                    </Tab.Pane>
                    {
                      <>
                        <Tab.Pane eventKey="hours">
                          {profile.id && <ProfileOpeningHours />}
                        </Tab.Pane>
                        <Tab.Pane eventKey="freight">
                          {profile.id && <ProfileFreight />}
                        </Tab.Pane>
                        <Tab.Pane eventKey="forms-payment">
                          <PaymentMethodProvider>
                            {profile.id && (
                              <ProfileFormsPayment
                                isActive={key === 'forms-payment'}
                              />
                            )}
                          </PaymentMethodProvider>
                        </Tab.Pane>
                      </>
                    }
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          )}
        </section>
      </>
    )
  )
}
