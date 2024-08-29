import { Accordion, Alert, Button, Card, Col, Container, Dropdown, DropdownButton, FloatingLabel, Form, InputGroup, Row } from 'react-bootstrap'
import { BsFillCalendar2DateFill } from 'react-icons/bs'
import { FaSave } from 'react-icons/fa'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { apiRoute, compareItems, copy, currency, hash, mask, textPackage } from '../../../../utils/wm-functions'
import { useCallback, useContext, useEffect, useState } from 'react'
import { AppContext } from '../../../../context/app.ctx'
import { DateTime } from 'luxon'
import { AiOutlineClear } from 'react-icons/ai'
import { MdDoneOutline } from 'react-icons/md'
import { Title } from '../../../../components/Partials/title'
import { Router, useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import Profile, { OptionsPackage, ProfileOptions } from '../../../../types/profile'
import { Dates } from '../../../../components/Dates'
import Week, { DateType } from '../../../../types/dates'

export default function SettingsPackage() {
  const { data: session } = useSession()
  const { profile, plansCategory, setProfile: setProfileContext, changeConfig, setChangeConfig, handleShowToast, user } = useContext(AppContext)

  const [profilePackage, setProfilePackage] = useState(
    copy({ ...profile.options.package, cashierDate: profile.options.package.cashierDate ?? 'nowDate' }, 'copy') as OptionsPackage
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
    const haveInvalid = Object.values(week).some((date) => date.some((day: DateType) => day.open >= day.close))

    if (haveInvalid) {
      handleShowToast({
        title: 'Horários',
        content: 'Por favor, revise o horário de entregas.',
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
        const { data: profData } = await apiRoute('/dashboard/settings/general', session, 'PATCH', data)
        setProfileContext(new Profile({ ...profile, ...profData }))
        showToast('success', 'Salvo', 'Alterações salvas com sucesso.')
        changeConfig.toRouter && changeConfig.toRouter()
      } catch (e) {
        console.error(e)
        showToast('erro', 'Não Salvo', 'Não foi possível salvar as alterações, vefique a sua conexão.')
      }

      setSaveClicked(false)
    } else {
      showToast('alert', 'Sem Alterações', 'Não há alterações para serem salvas')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePackage, setProfileContext, session, showToast, changeConfig, profile])

  useEffect(() => {
    setProfilePackage(copy(profile.options.package))
    // setWeek(profile.options.package.week)
  }, [profile])

  useEffect(() => {
    if (!invalidWeek) {
      profilePackage.week = week
      setChangeConfig({ changeState: !compareItems(profilePackage.week, profile.options.package.week) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])
  //Verifica se houve mudança nas propriedades
  useEffect(() => {
    setChangeConfig({ changeState: !compareItems(profile.options.package, profilePackage) })
  }, [profilePackage, profile, setChangeConfig])

  //Caso confirmModal for SALVAR useEffect aciona
  useEffect(() => {
    if (changeConfig.confirmSave) {
      if (!(!profilePackage.shippingDelivery.active && !profilePackage.shippingLocal.active)) {
        savePackage()
        setChangeConfig({})
      } else {
        handleShowToast({
          type: 'erro',
          title: `${textPackage(profilePackage.label2)}`,
          content: 'É necessário ter no mínimo um tipo de entrega ativado',
        })
        setChangeConfig({ ...changeConfig, confirmSave: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savePackage, setChangeConfig, changeConfig])

  const weeksDayNames = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.']

  const controle = false

  const basedLabelShippment = (capitalize?: boolean) => {
    let text: string
    if (profilePackage.shippingDelivery.active && profilePackage.shippingLocal.active) {
      text = 'Entregas/Retiradas'
    } else if (profilePackage.shippingDelivery.active) {
      text = 'Entregas'
    } else {
      text = 'Retiradas'
    }

    return capitalize ? text : text.toLowerCase()
  }

  return (
    plansCategory.includes('package') && (
      <>
        <Title title="Configurações" className="mb-4" componentTitle={`Configurações`} child={[textPackage(profilePackage.label2)]} />
        <Container className="p-0 m-0" fluid>
          {!profilePackage.shippingDelivery.active && !profilePackage.shippingLocal.active && (
            <Row>
              <Alert variant="orange" className="bd-callout bd-callout-orange text-center" style={{ borderLeft: '3px solid' }}>
                <h3>Atenção!</h3>
                <span>Tipos de entregas precisam ter no mínimo um ativado</span>
              </Alert>
            </Row>
          )}
          <Row>
            <Card>
              <Card.Header>
                <h4>Ativar Encomendas (Agendamentos de entregas)</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm="12" md>
                    <Form.Check
                      type="switch"
                      id={`Ativar ${textPackage(profilePackage.label2)}`}
                      label={`Ativar`}
                      checked={profilePackage.active}
                      onChange={(e) => {
                        setProfilePackage({
                          ...profilePackage,
                          active: e.target.checked,
                        })
                      }}
                    />
                  </Col>
                  <Col sm="12" md className="mt-2 mt-md-0">
                    <Form.Check
                      type="switch"
                      id="Retirar no Local"
                      label="Permitir Retiradas no Local"
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
                  <Col sm="12" md className="mt-2 mt-md-0">
                    <Form.Check
                      type="switch"
                      id="Entrega Delivery"
                      label="Permitir Entregas Delivery"
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
                <Row className="pt-0 pt-md-2 mt-3">
                  <Col sm="4" className="mt-2 mt-md-0">
                    <Form.Group>
                      <Form.Label className="fs-7">Disponibilizar {basedLabelShippment()} a partir de:</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          id={`Permitir ${textPackage(profilePackage.label2, true)} para o dia`}
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
                        <InputGroup.Text className="fs-7">Dias</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col sm="4" className="mt-2 mt-md-0">
                    <Form.Group>
                      <Form.Label className="fs-7">Disponibilizar {basedLabelShippment()} em até:</Form.Label>
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
                        <InputGroup.Text className="fs-7">Dias</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col sm="4">
                    <Form.Group>
                      <Form.Label className="fs-7">Agrupar {basedLabelShippment()} a cada:</Form.Label>
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
                        <InputGroup.Text className="fs-7">Minutos</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
                <hr />
                <Row className="pt-0 pt-md-2 align-items-end">
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
                  <Col sm="4" className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label className="fs-7">Máx. de {textPackage(profilePackage.label2, true)} por dia de 1 a 1000</Form.Label>
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
                  <Col sm="4" className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label className="fs-7">Máx. de {textPackage(profilePackage.label2, true)} por horário</Form.Label>
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
                      <Form.Label className="fw-bold">Exibir no cardápio como:</Form.Label>
                      <div className="d-flex gap-2 flex-wrap">
                        <Form.Check
                          type="radio"
                          id={'Agendamentos'}
                          label={'Agendamentos'}
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
                          label={'Encomendas'}
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
                <Row className="pt-0 pt-md-2">
                  <Col sm="4" md className="d-flex align-items-end mt-3  mt-md-0">
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">Mínimo para entrega.</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
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
                  <Col sm="4" md className="d-flex align-items-end mt-3 mt-md-0">
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">Mínimo para retirada.</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
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
                  <Col sm="4" md className="d-flex align-items-end mt-3 mt-md-0">
                    <Form.Group className="flex-grow-1">
                      <Form.Label className="fs-7 fw-bold">Registrar Pedidos no caixa</Form.Label>
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
                        <option value="nowDate">No dia em que foi pedido</option>
                        <option value="deliveryDate">No dia de entrega</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Row>
          <Row>
            <Dates
              title={`Disponibilidade de ${basedLabelShippment(true)}`}
              type="package"
              week={week}
              setWeek={setWeek}
              setInvalidWeek={setInvalidWeek}
            />
          </Row>

          <Row>
            <Card>
              <Card.Header>
                <h4>Datas que você não fará {basedLabelShippment()}</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm="12" className="mb-3">
                    <Form.Group>
                      <Form.Label className="fs-7">Selecione as datas especiais que você não não fará {basedLabelShippment()}</Form.Label>
                    </Form.Group>
                    <Row>
                      <Col md="3" className="d-flex">
                        <Dropdown className="flex-grow-1 d-flex" autoClose="outside" key="down">
                          <Dropdown.Toggle className="flex-grow-1" variant="primary" id="dropdown-basic">
                            Selecione uma data
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="package-calendar">
                            <Dropdown.Item>
                              <div className="mb-2 d-flex justify-content-between">
                                <Button
                                  variant="primary"
                                  disabled={!datesChoices.length}
                                  onClick={(e) => {
                                    setDatesChoices([])
                                  }}
                                >
                                  <AiOutlineClear />
                                  <span>Limpar</span>
                                </Button>
                                <Button
                                  variant="success"
                                  disabled={!datesChoices.length}
                                  onClick={(e) => {
                                    if (datesChoices.length) {
                                      setProfilePackage({
                                        ...profilePackage,
                                        specialsDates: [...profilePackage.specialsDates, ...datesChoices],
                                      })
                                      setDatesChoices([])
                                    }
                                  }}
                                >
                                  <MdDoneOutline />
                                  <span>Finalizar</span>
                                </Button>
                              </div>
                              <div>
                                <Calendar
                                  minDate={new Date()}
                                  tileDisabled={({ date }) => {
                                    const dateFormated = DateTime.fromJSDate(date).toISO()

                                    if (profilePackage.specialsDates.includes(dateFormated) || datesChoices.includes(dateFormated)) {
                                      return true
                                    }

                                    return false
                                  }}
                                  onClickDay={(e) => {
                                    const dateFormated = DateTime.fromJSDate(e).toISO()
                                    setTimeout(() => {
                                      if (!datesChoices.includes(dateFormated) && !profilePackage.specialsDates.includes(dateFormated)) {
                                        setDatesChoices([...datesChoices, dateFormated])
                                      }
                                    }, 5)
                                  }}
                                />
                              </div>

                              <div className="text-start pt-2 overflow-auto mx-auto" style={{ width: '300px' }}>
                                {datesChoices.map((date) => {
                                  const dateFormated = DateTime.fromJSDate(new Date(date)).toFormat('dd/MM/yyyy')
                                  return (
                                    <span
                                      key={date}
                                      id={date}
                                      className="d-inline-block ms-2 border p-1 rounded text-dark"
                                      onClick={() => {
                                        const newDates = datesChoices.filter((dt) => dt !== date)
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
                        <Accordion defaultActiveKey="0" className="flex-grow-1 w-100">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header className="d-inline fs-6 text-wrap text-warning">
                              <span>Datas Definidas ({profilePackage.specialsDates.length})</span>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div className="d-flex flex-wrap justify-content-center gap-2">
                                {profilePackage.specialsDates
                                  .sort((a, b) => {
                                    const dateA = new Date(a)
                                    const dateB = new Date(b)

                                    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0
                                  })
                                  .map((date) => {
                                    return (
                                      <Card key={date} className="border rounded p-1">
                                        <Card.Header className="text-center">
                                          <BsFillCalendar2DateFill />

                                          <span className="ms-2 d-inline-block align-middle">
                                            {DateTime.fromJSDate(new Date(date)).toFormat('dd/MM/yyyy')}
                                          </span>
                                        </Card.Header>
                                        <Button
                                          className="text-decoration-none"
                                          variant="link"
                                          onClick={(e) => {
                                            const newSpecialsDates = profilePackage.specialsDates.filter((dateItem) => dateItem !== date)
                                            setProfilePackage({
                                              ...profilePackage,
                                              specialsDates: newSpecialsDates,
                                            })
                                          }}
                                        >
                                          Remover
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
                  <h4>Valores</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col sm className="mb-3">
                      <Form.Group>
                        <Form.Group>
                          <Form.Label className="fs-7 fw-bold">Pedido Mínimo Entrega</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
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
                          <Form.Label className="fs-7 fw-bold">Pedido Mínimo Retirar no Local</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
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
          textSpinner="Salvando..."
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
            disabled={!profilePackage.shippingDelivery.active && !profilePackage.shippingLocal.active}
          >
            Salvar
          </Button>
        </div>
      </>
    )
  )
}
