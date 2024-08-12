import { useSession } from 'next-auth/react'
import { Dispatch, ReactNode, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, OverlayTrigger, Popover, Row, Table } from 'react-bootstrap'
import { RiErrorWarningFill } from 'react-icons/ri'
import { AppContext } from '../../context/app.ctx'
import { apiRoute, compareItems, copy, hash } from '../../utils/wm-functions'
import Week, { DateType } from '../../types/dates'
import { HelpVideos } from '../Modals/HelpVideos'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

interface DatesProps {
  title?: string
  type: 'profile' | 'menu' | 'package'
  week: Week
  setWeek: Dispatch<SetStateAction<Week>>
  saveWeek?: (newWeek: Week) => void
  // invalidWeek: boolean;
  setInvalidWeek?: Dispatch<SetStateAction<boolean>>
}

export function Dates({ setInvalidWeek, ...props }: DatesProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast, setChangeConfig, changeConfig, setProfile } = useContext(AppContext)
  let { title, type, week: propsWeek, setWeek: setWeekProps } = props
  const [week, setWeek] = useState(propsWeek)
  const [checkAllDays, setCheckAllDays] = useState(false)
  const [invalid, setInvalid] = useState(false)

  const days = Object.entries(new Week()).map((dayMap) => {
    return {
      day: dayMap[0],
      label: Week.label(dayMap[1][0].weekDay),
      weekDay: dayMap[1][0].weekDay,
    }
  })

  useEffect(() => {
    if (setInvalidWeek) {
      const haveInvalid = Object.values(week).some((date) => date.some((day: DateType) => day.open >= day.close))

      setInvalidWeek((invalid) => haveInvalid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid, setInvalidWeek])

  // useEffect(() => {
  //   setWeek(copy(propsWeek));
  // }, [propsWeek]);

  useEffect(() => {
    const checkboxs = document.querySelectorAll('.dayCheckbox')
    checkboxs.forEach((checkbox: any) => {
      checkbox.children[0].checked = checkAllDays
    })
  }, [checkAllDays])

  //Compara mudanças no objeto e verifica se foi salva
  useEffect(() => {
    const haveInvalid = Object.values(week).some((date) => date.some((day: DateType) => day.open >= day.close))

    setInvalid(haveInvalid)

    if (type !== 'profile') {
      if (!invalid) {
        setWeekProps && setWeekProps((oldWeek) => week)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

    setInvalidWeek && setInvalidWeek(haveInvalid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsWeek, week, setChangeConfig, setWeekProps])

  useEffect(() => {
    if (type !== 'profile') {
      if (!invalid && changeConfig.changeState) {
        setWeekProps && setWeekProps(week)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeConfig, week])

  const convertHour = (text: string) => parseFloat(text.replace(':', '.'))

  const handleAddDate = () => {
    const openDate = (document.querySelector('#openDate') as HTMLInputElement)?.value
    const closeDate = (document.querySelector('#closeDate') as HTMLInputElement)?.value
    const selectedDays = Array.from(document.querySelectorAll('.dayCheckbox'))
      .filter((input) => (input.childNodes[0] as HTMLInputElement).checked)
      .map((div) => div.childNodes[0]) as HTMLInputElement[]

    if (openDate && closeDate) {
      if (openDate >= closeDate) {
        handleShowToast({
          type: 'alert',
          content: i18n.t('opening_time_must_closing'),
        })
        return
      }

      if (selectedDays.length) {
        const invalidDays: string[] = []
        const s = selectedDays.length > 1 ? 's' : ''
        selectedDays.forEach((day) => {
          if (week) {
            if (
              !week[day.name].some(
                (d: DateType) =>
                  convertHour(openDate) >= convertHour(d.open) &&
                  convertHour(openDate) <= convertHour(d.close) &&
                  convertHour(closeDate) <= convertHour(d.close) &&
                  convertHour(closeDate) >= convertHour(d.open)
              )
            ) {
              week[day.name].push({
                code: hash(),
                open: openDate,
                close: closeDate,
                active: true,
                weekDay: Number(day.id),
              })
            } else {
              invalidDays.push(day.dataset.name as string)
            }
          }
        })
        if (invalidDays.length) {
          handleShowToast({
            type: 'alert',
            content: `${t('time_will_not_take')}${s} ${t('day')}${s} ${t('following')}${s}: (${invalidDays.join(', ')}) ${t(
              'changing_existing_time'
            )}${s} ${t('day')}${s} ${t('mentioned')}${s}`,
          })
          return
        }
        setWeek({ ...week })
        // handleShowToast({
        //   type: "success",
        //   content: `Horário${s} adicionado${s} com sucesso`,
        //   title: "",
        // });
      } else {
        handleShowToast({
          type: 'alert',
          content: i18n.t('please_select_day'),
          title: '',
        })
      }
    } else {
      handleShowToast({
        type: 'alert',
        content: i18n.t('please_set_valid_time'),
        title: '',
      })
      return
    }

    setTimeout(() => {
      setWeekProps(week)
    }, 10)
  }

  const handleSaveProfileWeek = useCallback(async () => {
    if (!invalid && type === 'profile') {
      try {
        const { data } = await apiRoute('/dashboard/profile/week', session, 'POST', { week })
        setProfile((prevState) => {
          if (prevState) {
            return { ...prevState, week: data }
          }
        })
        handleShowToast({
          type: `success`,
          title: '',
        })
      } catch (error) {
        console.error(error)
        return handleShowToast({
          type: 'erro',
          title: i18n.t('operating_hours'),
          size: 35,
        })
      }
    } else {
      return handleShowToast({
        type: `alert`,
        content: i18n.t('the_change_were'),
        title: i18n.t('operating_hours'),
        size: 35,
      })
    }
    setChangeConfig({})
  }, [handleShowToast, invalid, session, week, setChangeConfig, type, setProfile])

  useEffect(() => {
    const { changeState, confirmSave } = changeConfig
    if (changeState && confirmSave) {
      handleSaveProfileWeek()
    }
  }, [handleSaveProfileWeek, changeConfig])

  let video = { src: '', title: '' }

  switch (type) {
    case 'menu':
      video = { src: 'https://www.youtube.com/embed/3CKI4sh9wKA', title: t('product_availability') }
      break
    default:
      video = { src: 'https://www.youtube.com/embed/POrBnzbrSm4', title: t('setting_operating_hours') }
      break
  }

  return (
    <>
      <Card className={type === 'menu' ? 'mt-4' : ''}>
        {title && (
          <Card.Header className="d-flex gap-3">
            <h4>{title}</h4>
            <div className="vr"></div>
            <HelpVideos.Trigger urls={[video]} />
          </Card.Header>
        )}
        <Card.Body>
          <Card bsPrefix="wm-default">
            <Card.Header className="bg-light bg-gradient text-dark">
              <h5>{t('choose_days_times')}</h5>
            </Card.Header>
            <Card.Body className="text-dark">
              <Container fluid className="mx-0 px-0">
                <Row className="fs-6 gap-2 align-items-baseline">
                  {days.map((element) => (
                    <Col key={element.day} sm="1" style={{ maxWidth: '25%' }}>
                      <Form.Check
                        label={element.label?.replace(/^(\S{3})(\S+)/, '$1.')}
                        className="mt-auto dayCheckbox"
                        name={element.day}
                        id={element.weekDay}
                        data-name={element.label}
                        onChange={(e) => e.target.checked}
                      />
                    </Col>
                  ))}
                  <Col md>
                    <Row className="justify-content-end">
                      <Col lg="8" className="d-flex">
                        <Button className="flex-grow-1" onClick={() => setCheckAllDays(!checkAllDays)}>
                          {t('select_all')}
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md="3" className="d-flex gap-2 align-items-baseline mb-2">
                    <Form.Label className="w-25">{t('from')}</Form.Label>
                    <Form.Control
                      type="time"
                      defaultValue="00:00"
                      id="openDate"
                      onChange={(e) => {
                        e.target.value = !!e.target.value ? e.target.value : '00:00'
                      }}
                    />
                  </Col>
                  <Col md="3" className="d-flex gap-2 align-items-baseline mb-2">
                    <Form.Label className="w-25">{t('until')}</Form.Label>
                    <Form.Control
                      type="time"
                      defaultValue="23:59"
                      id="closeDate"
                      onChange={(e) => {
                        e.target.value = !!e.target.value ? e.target.value : '23:59'
                      }}
                    />
                  </Col>
                  <Col md>
                    <Row className="justify-content-end mb-2">
                      <Col lg="4" md="5" className="d-flex align-items-baseline">
                        <Button className="flex-grow-1" onClick={handleAddDate}>
                          + {t('add')}
                        </Button>
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <br />
                <Table responsive hover bordered>
                  <thead>
                    <tr>
                      <th>{t('day')}</th>
                      <th>{t('open')}</th>
                      <th>{t('close')}</th>
                      <th className="col-2">{t('actions')}</th>
                    </tr>
                  </thead>
                  {type === 'profile' && (
                    <tfoot>
                      <tr>
                        <td colSpan={3}></td>
                        <td>
                          <div className="d-flex justify-content-end">
                            <Button variant="success" className="mt-auto flex-fill flex-lg-grow-0" onClick={() => handleSaveProfileWeek()}>
                              {t('save')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                  <tbody>
                    {Object.values(week).map((day: DateType[], index, weekArr) => {
                      return day.map((date) => (
                        <tr key={date.code} className={`${date.open >= date.close && 'wm-warning'} text-dark`}>
                          <td className="position-relative">
                            {date.open >= date.close && (
                              <OverlayTrigger
                                placement="auto"
                                overlay={
                                  <Popover id="popover-basic">
                                    <Popover.Header as="h3" className="with-icon">
                                      <RiErrorWarningFill className="text-warning" />
                                      <b>{t('invalid_time')}</b>
                                    </Popover.Header>
                                    <Popover.Body>
                                      <p>{t('if_work_overnight')}:</p>
                                      <p>
                                        {days[date.weekDay < 6 ? date.weekDay + 1 : 0].label} - {t('from')}: {date.open} {t('until')}: 23:59
                                      </p>
                                      <p className="m-0">
                                        <span>
                                          {days[date.weekDay < 6 ? date.weekDay + 1 : 0].label} - {t('from')}: {date.open} {t('until')}:{' '}
                                          {(document.querySelector(`#close-${date.code}`) as HTMLInputElement)?.value}
                                        </span>
                                      </p>
                                      <p>
                                        <span>
                                          {days[date.weekDay < 6 ? date.weekDay + 1 : 0].label} - {t('from')}: 00:00 {t('until')}:{' '}
                                          {(document.querySelector(`#close-${date.code}`) as HTMLInputElement)?.value !== '00:00'
                                            ? (document.querySelector(`#close-${date.code}`) as HTMLInputElement)?.value
                                            : '23:59'}
                                        </span>
                                      </p>
                                    </Popover.Body>
                                  </Popover>
                                }
                              >
                                <span>
                                  <RiErrorWarningFill className="text-warning" />
                                </span>
                              </OverlayTrigger>
                            )}
                            <span className="ms-2">{Week.label(date.weekDay)}</span>
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              defaultValue={date.open}
                              id={`${date.code}-open`}
                              onChange={(e) => {
                                e.target.value = !!e.target.value ? e.target.value : '00:00'

                                if (week) {
                                  setTimeout(() => {
                                    date.open = e.target.value
                                    setWeek({ ...week })
                                  }, 1)
                                }
                              }}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="time"
                              defaultValue={date.close}
                              id={`close-${date.code}`}
                              onChange={(e) => {
                                e.target.value = !!e.target.value ? e.target.value : '23:59'
                                if (week) {
                                  setTimeout(() => {
                                    date.close = e.target.value
                                    setWeek({ ...week })
                                  }, 1)
                                }
                              }}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {type === 'menu' && (
                                <Button
                                  variant="orange text-white"
                                  className="flex-grow-2"
                                  onClick={() => {
                                    if (week) {
                                      setTimeout(() => {
                                        date.active = !date.active
                                        setWeek({ ...week })
                                      }, 1)
                                    }
                                  }}
                                >
                                  {date.active ? t('pause') : t('unpause')}
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                className="flex-grow-2"
                                onClick={() => {
                                  const filteredDay = days.find((d) => d.weekDay === date.weekDay)
                                  if (filteredDay) {
                                    week[filteredDay.day] = week[filteredDay.day].filter((d: DateType) => d.code !== date.code)
                                  }
                                  setTimeout(() => {
                                    setWeek({ ...week })
                                  }, 1)
                                  // handleShowToast({
                                  //   type: "success",
                                  //   title: "Excluir horário",
                                  //   content: `Horário de ${
                                  //     type === "profile"
                                  //       ? "funcionamento"
                                  //       : "disponibilidade"
                                  //   } excluído com sucesso`,
                                  // });
                                }}
                              >
                                {t('delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </Table>
              </Container>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </>
  )
}
