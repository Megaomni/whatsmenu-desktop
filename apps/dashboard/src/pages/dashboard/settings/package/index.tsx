import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import {
  Accordion,
  Alert,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  Row,
} from 'react-bootstrap'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { AiOutlineClear } from 'react-icons/ai'
import { BsFillCalendar2DateFill } from 'react-icons/bs'
import { MdDoneOutline } from 'react-icons/md'
import { Dates } from '../../../../components/Dates'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import { Title } from '../../../../components/Partials/title'
import { AppContext } from '../../../../context/app.ctx'
import Week, { DateType } from '../../../../types/dates'
import Profile, { OptionsPackage } from '../../../../types/profile'
import {
  apiRoute,
  compareItems,
  copy,
  mask,
  textPackage,
} from '../../../../utils/wm-functions'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'

export default function SettingsPackage() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const {
    profile,
    plansCategory,
    setProfile: setProfileContext,
    changeConfig,
    setChangeConfig,
    handleShowToast,
    user,
    currency,
  } = useContext(AppContext)

  const [profilePackage, setProfilePackage] = useState(
    copy(
      {
        ...profile.options.package,
        cashierDate: profile.options.package.cashierDate ?? 'nowDate',
      },
      'copy'
    ) as OptionsPackage
  )
  const [datesChoices, setDatesChoices] = useState<string[]>([])
  const [saveClicked, setSaveClicked] = useState<boolean>(false)
  const [week, setWeek] = useState<Week>(new Week(profilePackage.week))
  const [invalidWeek, setInvalidWeek] = useState<boolean>(false)
  // const [updateHTML, setUpdateHTML] = useState<number>(0);

  const router = useRouter()
  useEffect(() => {
    if (!plansCategory.includes('package')) {
      router.push('/dashboard/request')
    }
  }, [plansCategory, router])

  const showToast = useCallback(
    (type: 'success' | 'erro' | 'alert', title?: string, content?: string) => {
      handleShowToast({
        position: 'middle-center',
        type,
        title,
        content,
        show: true,
      })
    },
    [handleShowToast]
  )

  const savePackage = useCallback(async () => {
    const haveInvalid = Object.values(week).some((date) =>
      date.some((day: DateType) => day.open >= day.close)
    )

    if (haveInvalid) {
      handleShowToast({
        title: t('hours'),
        content: t('review_delivery_hours'),
        type: 'alert',
      })

      return
    }

    if (changeConfig.changeState) {
      setSaveClicked(true)
      try {
        const data = {
          options: {
            ...profile.options,
            package: profilePackage,
          },
        }
        const { data: profData } = await apiRoute(
          '/dashboard/settings/general',
          session,
          'PATCH',
          data
        )
        setProfileContext(new Profile({ ...profile, ...profData }))
        showToast('success', t('saved'), t('changes_saved'))
        changeConfig.toRouter && changeConfig.toRouter()
      } catch (e) {
        console.error(e)
        showToast('erro', t('not_saved'), t('unable_save_check_connection'))
      }

      setSaveClicked(false)
    } else {
      showToast('alert', t('no_changes'), t('no_changes_to_save'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profilePackage,
    setProfileContext,
    session,
    showToast,
    changeConfig,
    profile,
  ])

  useEffect(() => {
    setProfilePackage(copy(profile.options.package))
    // setWeek(profile.options.package.week)
  }, [profile])

  useEffect(() => {
    if (!invalidWeek) {
      profilePackage.week = week
      setChangeConfig({
        changeState: !compareItems(
          profilePackage.week,
          profile.options.package.week
        ),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])
  //Verifica se houve mudança nas propriedades
  useEffect(() => {
    setChangeConfig({
      changeState: !compareItems(profile.options.package, profilePackage),
    })
  }, [profilePackage, profile, setChangeConfig])

  //Caso confirmModal for SALVAR useEffect aciona
  useEffect(() => {
    if (changeConfig.confirmSave) {
      if (
        !(
          !profilePackage.shippingDelivery.active &&
          !profilePackage.shippingLocal.active
        )
      ) {
        savePackage()
        setChangeConfig({})
      } else {
        handleShowToast({
          type: 'erro',
          title: `${textPackage(profilePackage.label2)}`,
          content: t('delivery_type_activated'),
        })
        setChangeConfig({ ...changeConfig, confirmSave: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savePackage, setChangeConfig, changeConfig])

  const controle = false

  const basedLabelShippment = (capitalize?: boolean) => {
    let text: string
    if (
      profilePackage.shippingDelivery.active &&
      profilePackage.shippingLocal.active
    ) {
      text = 'Entregas/Retiradas'
    } else if (profilePackage.shippingDelivery.active) {
      text = t('deliverys')
    } else {
      text = t('pickups')
    }

    return capitalize ? text : text.toLowerCase()
  }

  return (
    plansCategory.includes('package') && (
      <>
        <Title
          title={t('settings')}
          className="mb-4"
          componentTitle={`${t('settings')}`}
          child={[textPackage(profilePackage.label2)]}
        />
        <Container className="m-0 p-0" fluid>
          {!profilePackage.shippingDelivery.active &&
            !profilePackage.shippingLocal.active && (
              <Row>
                <Alert
                  variant="orange"
                  className="bd-callout bd-callout-orange text-center"
                  style={{ borderLeft: '3px solid' }}
                >
                  <h3>{t('attention')}!</h3>
                  <span>{t('delivery_types_must_one_activated')}</span>
                </Alert>
              </Row>
            )}
          <Row>
            <Card>
              <Card.Header className="d-flex gap-3">
                <h4>
                  {t('activate_orders')} ({t('delivery_scheduling')})
                </h4>
                <div className="vr"></div>
                <HelpVideos.Trigger
                  urls={[
                    {
                      src: 'https://www.youtube.com/embed/BGBA9120Y_A',
                      title: t('order_settings'),
                    },
                  ]}
                />
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm="12" md>
                    <Form.Check
                      type="switch"
                      id={`${t('activate')} ${textPackage(profilePackage.label2)}`}
                      label={`${t('activate')}`}
                      checked={profilePackage.active}
                      onChange={(e) => {
                        setProfilePackage({
                          ...profilePackage,
                          active: e.target.checked,
                        })
                      }}
                    />
                  </Col>
                  <Col sm="12" md className="mt-md-0 mt-2">
                    <Form.Check
                      type="switch"
                      id={t('pickup_onsite')}
                      label={t('allow_onesite_pickups')}
                      checked={profilePackage.shippingLocal.active}
                      onChange={(e) => {
                        setProfilePackage({
                          ...profilePackage,
                          shippingLocal: {
                            ...profilePackage.shippingLocal,
                            active: e.target.checked,
                          },
                        })
                      }}
                    />
                  </Col>
                  <Col sm="12" md className="mt-md-0 mt-2">
                    <Form.Check
                      type="switch"
                      id={t('delivery_e')}
                      label={t('allow_delivery_services')}
                      checked={profilePackage.shippingDelivery.active}
                      onChange={(e) => {
                        setProfilePackage({
                          ...profilePackage,
                          shippingDelivery: {
                            ...profilePackage.shippingDelivery,
                            active: e.target.checked,
                          },
                        })
                      }}
                    />
                  </Col>
                </Row>
                <hr />
                <Row className="pt-md-2 mt-3 pt-0">
                  <Col sm="4" className="mt-md-0 mt-2">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('make_available')} {basedLabelShippment()}{' '}
                        {t('starting_from')}:
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          id={`${t('allow')} ${textPackage(profilePackage.label2, true)} ${t('for_day')}`}
                          // labe l={`Permitir entregas no mesmo dia`}
                          // checked={profilePackage.allowPackageDay}
                          defaultValue={profilePackage.distanceDays.start}
                          min={0}
                          onChange={(e) => {
                            setProfilePackage({
                              ...profilePackage,
                              // allowPackageDay: e.target.checked,
                              distanceDays: {
                                ...profilePackage.distanceDays,
                                start: Math.max(Number(e.target.value), 0) || 0,
                              },
                            })
                          }}
                        />
                        <InputGroup.Text className="fs-7">
                          {t('days_n')}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col sm="4" className="mt-md-0 mt-2">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('make_available')} {basedLabelShippment()}{' '}
                        {t('within')}:
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          defaultValue={profilePackage.distanceDays.end}
                          min={0}
                          onChange={(e) => {
                            setProfilePackage({
                              ...profilePackage,
                              distanceDays: {
                                ...profilePackage.distanceDays,
                                end: Math.max(Number(e.target.value), 0),
                              },
                            })
                          }}
                        ></Form.Control>
                        <InputGroup.Text className="fs-7">
                          {t('days_n')}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col sm="4">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('group')} {basedLabelShippment()} {t('every')}:
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          defaultValue={profilePackage.intervalTime}
                          min="0"
                          onChange={(e) => {
                            setProfilePackage({
                              ...profilePackage,
                              intervalTime: Number(e.target.value),
                            })
                          }}
                        />
                        <InputGroup.Text className="fs-7">
                          {t('minutes')}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
                <hr />
                <Row className="pt-md-2 align-items-end pt-0">
                  {/* <Col sm="4" md className="mt-2 mt-md-0">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        Permitir encomendas em até:
                      </Form.Label>
                      <Form.Select
                        defaultValue={profilePackage.weekDistance}
                        onChange={(e) => {
                          setProfilePackage({
                            ...profilePackage,
                            distanceDays: {
                              ...profilePackage.distanceDays,
                              end: parseInt(e.target.value)
                            },
                          });
                        }}
                      >
                        <option value="1">1 Semana</option>
                        <option value="2">2 Semanas</option>
                        <option value="3">3 Semanas</option>
                        <option value="4">4 Semanas</option>
                        <option value="5">5 Semanas</option>
                        <option value="6">6 Semanas</option>
                        <option value="7">7 Semanas</option>
                        <option value="8">8 Semanas</option>
                      </Form.Select>
                    </Form.Group>
                  </Col> */}
                  <Col sm="4" className="mb-md-0 mb-3">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('max_of')} {textPackage(profilePackage.label2, true)}{' '}
                        {t('per_day_from')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        defaultValue={profilePackage.maxPackage}
                        min="1"
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          setProfilePackage({
                            ...profilePackage,
                            maxPackage: value > 1 ? value : 1,
                          })
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm="4" className="mb-md-0 mb-3">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('max_of')} {textPackage(profilePackage.label2, true)}{' '}
                        {t('per_hour')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        defaultValue={profilePackage.maxPackageHour}
                        min="1"
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          setProfilePackage({
                            ...profilePackage,
                            maxPackageHour: value > 1 ? value : 1,
                          })
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm="4">
                    <Form.Group className="">
                      <Form.Label className="fw-bold">
                        {t('display_menu_as')}:
                      </Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        <Form.Check
                          type="radio"
                          id={'Agendamentos'}
                          label={t('appointments')}
                          name="display-type"
                          checked={!!profilePackage.label2}
                          onChange={(e) => {
                            setProfilePackage({
                              ...profilePackage,
                              label2: true,
                            })
                          }}
                        />

                        <Form.Check
                          type="radio"
                          id={'Encomendas'}
                          label={t('package')}
                          name="display-type"
                          checked={!profilePackage.label2}
                          onChange={(e) => {
                            setProfilePackage({
                              ...profilePackage,
                              label2: false,
                            })
                          }}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <hr />
                <Row className="pt-md-2 pt-0">
                  <Col
                    sm="4"
                    md
                    className="d-flex align-items-end mt-md-0  mt-3"
                  >
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">
                        {t('minimum_for_delivery')}.
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          {currency({ value: 0, symbol: true })}
                        </InputGroup.Text>
                        <Form.Control
                          value={profilePackage.minValue}
                          onChange={(e) => {
                            mask(e, 'currency')
                            setProfilePackage({
                              ...profilePackage,
                              minValue: e.currentTarget.value,
                            })
                          }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col
                    sm="4"
                    md
                    className="d-flex align-items-end mt-md-0 mt-3"
                  >
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">
                        {t('minimum_for_pickup')}.
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          {currency({ value: 0, symbol: true })}
                        </InputGroup.Text>
                        <Form.Control
                          value={profilePackage.minValueLocal}
                          onChange={(e) => {
                            mask(e, 'currency')
                            setProfilePackage({
                              ...profilePackage,
                              minValueLocal: e.currentTarget.value,
                            })
                          }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col
                    sm="4"
                    md
                    className="d-flex align-items-end mt-md-0 mt-3"
                  >
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">
                        {t('register_order_cash_register')}
                      </Form.Label>
                      <Form.Select
                        value={profilePackage.cashierDate}
                        onChange={(e) => {
                          if (!e.currentTarget.value) {
                            e.currentTarget.value = 'nowDate'
                          }
                          setProfilePackage({
                            ...profilePackage,
                            cashierDate: e.currentTarget.value,
                          })
                        }}
                      >
                        <option value="nowDate">{t('on_day_ordered')}</option>
                        <option value="deliveryDate">
                          {t('on_delivery_day')}
                        </option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Row>
          <Row>
            <Dates
              title={`${t('availability_of')} ${basedLabelShippment(true)}`}
              type="package"
              week={week}
              setWeek={setWeek}
              setInvalidWeek={setInvalidWeek}
            />
          </Row>

          <Row>
            <Card>
              <Card.Header>
                <h4>
                  {t('dates_not_be_available')} {basedLabelShippment()}
                </h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm="12" className="mb-3">
                    <Form.Group>
                      <Form.Label className="fs-7">
                        {t('select_special_dates')} {basedLabelShippment()}
                      </Form.Label>
                    </Form.Group>
                    <Row>
                      <Col md="3" className="d-flex">
                        <Dropdown
                          className="flex-grow-1 d-flex"
                          autoClose="outside"
                          key="down"
                        >
                          <Dropdown.Toggle
                            className="flex-grow-1"
                            variant="primary"
                            id="dropdown-basic"
                          >
                            {t('select_a_date')}
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="package-calendar">
                            <Dropdown.Item>
                              <div className="d-flex justify-content-between mb-2">
                                <Button
                                  variant="primary"
                                  disabled={!datesChoices.length}
                                  onClick={(e) => {
                                    setDatesChoices([])
                                  }}
                                >
                                  <AiOutlineClear />
                                  <span>{t('clear')}</span>
                                </Button>
                                <Button
                                  variant="success"
                                  disabled={!datesChoices.length}
                                  onClick={(e) => {
                                    if (datesChoices.length) {
                                      setProfilePackage({
                                        ...profilePackage,
                                        specialsDates: [
                                          ...profilePackage.specialsDates,
                                          ...datesChoices,
                                        ],
                                      })
                                      setDatesChoices([])
                                    }
                                  }}
                                >
                                  <MdDoneOutline />
                                  <span>{t('complete')}</span>
                                </Button>
                              </div>
                              <div>
                                <Calendar
                                  minDate={new Date()}
                                  tileDisabled={({ date }) => {
                                    const dateFormated =
                                      DateTime.fromJSDate(date).toISO()

                                    if (
                                      profilePackage.specialsDates.includes(
                                        dateFormated
                                      ) ||
                                      datesChoices.includes(dateFormated)
                                    ) {
                                      return true
                                    }

                                    return false
                                  }}
                                  onClickDay={(e) => {
                                    const dateFormated =
                                      DateTime.fromJSDate(e).toISO()
                                    setTimeout(() => {
                                      if (
                                        !datesChoices.includes(dateFormated) &&
                                        !profilePackage.specialsDates.includes(
                                          dateFormated
                                        )
                                      ) {
                                        setDatesChoices([
                                          ...datesChoices,
                                          dateFormated,
                                        ])
                                      }
                                    }, 5)
                                  }}
                                />
                              </div>

                              <div
                                className="mx-auto overflow-auto pt-2 text-start"
                                style={{ width: '300px' }}
                              >
                                {datesChoices.map((date) => {
                                  const dateFormated = DateTime.fromJSDate(
                                    new Date(date)
                                  ).toFormat(`${t('date_format')}`)
                                  return (
                                    <span
                                      key={date}
                                      id={date}
                                      className="d-inline-block text-dark ms-2 rounded border p-1"
                                      onClick={() => {
                                        const newDates = datesChoices.filter(
                                          (dt) => dt !== date
                                        )
                                        setDatesChoices(newDates)
                                      }}
                                    >
                                      {dateFormated}
                                    </span>
                                  )
                                })}
                              </div>
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>
                    <Row className="mt-4">
                      <Col sm="12" className="d-flex">
                        <Accordion
                          defaultActiveKey="0"
                          className="flex-grow-1 w-100"
                        >
                          <Accordion.Item eventKey="0">
                            <Accordion.Header className="d-inline fs-6 text-warning text-wrap">
                              <span>
                                {t('defined_dates')} (
                                {profilePackage.specialsDates.length})
                              </span>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div className="d-flex justify-content-center flex-wrap gap-2">
                                {profilePackage.specialsDates
                                  .sort((a, b) => {
                                    const dateA = new Date(a)
                                    const dateB = new Date(b)

                                    return dateA < dateB
                                      ? -1
                                      : dateA > dateB
                                        ? 1
                                        : 0
                                  })
                                  .map((date) => {
                                    return (
                                      <Card
                                        key={date}
                                        className="rounded border p-1"
                                      >
                                        <Card.Header className="text-center">
                                          <BsFillCalendar2DateFill />

                                          <span className="d-inline-block ms-2 align-middle">
                                            {DateTime.fromJSDate(
                                              new Date(date)
                                            ).toFormat(`${t('date_format')}`)}
                                          </span>
                                        </Card.Header>
                                        <Button
                                          className="text-decoration-none"
                                          variant="link"
                                          onClick={(e) => {
                                            const newSpecialsDates =
                                              profilePackage.specialsDates.filter(
                                                (dateItem) => dateItem !== date
                                              )
                                            setProfilePackage({
                                              ...profilePackage,
                                              specialsDates: newSpecialsDates,
                                            })
                                          }}
                                        >
                                          {t('remove')}
                                        </Button>
                                      </Card>
                                    )
                                  })}
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Row>
          {/* <Row className="mt-2">
            <Col md className="px-0">
              <Card className="px-2">
                <Card.Header>
                  <h4>
                    Datas que você não receberá{" "}
                    {textPackage(profilePackage.label2, true)}
                  </h4>
                </Card.Header>
                <Card.Body className="d-flex">
                  <Accordion defaultActiveKey="0" className="flex-grow-1 w-100">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header className="d-inline fs-6 text-wrap text-warning">
                        <span>
                          Datas Definidas ({profilePackage.specialsDates.length}
                          )
                        </span>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                          {profilePackage.specialsDates
                            .sort((a, b) => {
                              const dateA = new Date(a);
                              const dateB = new Date(b);

                              return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                            })
                            .map((date) => {
                              return (
                                <Card key={date} className="border rounded p-1">
                                  <Card.Header className="text-center">
                                    <BsFillCalendar2DateFill />

                                    <span className="ms-2 d-inline-block align-middle">
                                      {DateTime.fromJSDate(
                                        new Date(date)
                                      ).toFormat("dd/MM/yyyy")}
                                    </span>
                                  </Card.Header>
                                  <Button
                                    className="text-decoration-none"
                                    variant="link"
                                    onClick={(e) => {
                                      const newSpecialsDates =
                                        profilePackage.specialsDates.filter(
                                          (dateItem) => dateItem !== date
                                        );
                                      setProfilePackage({
                                        ...profilePackage,
                                        specialsDates: newSpecialsDates,
                                      });
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </Card>
                              );
                            })}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}

          {controle ? (
            <Row>
              <Card>
                <Card.Header>
                  <h4>{t('values')}</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col sm className="mb-3">
                      <Form.Group>
                        <Form.Group>
                          <Form.Label className="fs-7 fw-bold">
                            {t('minimum_delivery_order')}
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              {currency({ value: 0, symbol: true })}
                            </InputGroup.Text>
                            <Form.Control
                              value={profilePackage.minValue}
                              onChange={(e) => {
                                mask(e, 'currency')
                                setProfilePackage({
                                  ...profilePackage,
                                  minValue: e.currentTarget.value,
                                })
                              }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Form.Group>
                    </Col>
                    <Col sm className="mb-3">
                      <Form.Group>
                        <Form.Group>
                          <Form.Label className="fs-7 fw-bold">
                            {t('minimum_order_for_pickup')}
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              {currency({ value: 0, symbol: true })}
                            </InputGroup.Text>
                            <Form.Control
                              value={profilePackage.minValueLocal}
                              onChange={(e) => {
                                mask(e, 'currency')
                                setProfilePackage({
                                  ...profilePackage,
                                  minValueLocal: e.currentTarget.value,
                                })
                              }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Form.Group>
                    </Col>
                    {/* <Col md="2" className="d-flex mb-3">
                  <Button
                    variant="success"
                    className="mt-auto flex-grow-1"
                    onClick={savePackage}
                  >
                    Salvar
                  </Button>
                </Col> */}
                  </Row>
                </Card.Body>
              </Card>
            </Row>
          ) : null}
        </Container>
        <OverlaySpinner
          show={saveClicked}
          queryElement="body"
          width={100}
          weight={10}
          textSpinner={t('saving')}
          backgroundColor="transparent"
          backdropBlur={4}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        />
        <div className="d-flex justify-content-end">
          <Button
            variant="success"
            className="mt-auto"
            onClick={savePackage}
            disabled={
              !profilePackage.shippingDelivery.active &&
              !profilePackage.shippingLocal.active
            }
          >
            {t('save')}
          </Button>
        </div>
      </>
    )
  )
}
