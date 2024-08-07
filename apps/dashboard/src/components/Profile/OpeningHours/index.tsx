import { DateTime, Zone } from 'luxon'
import { useSession } from 'next-auth/react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Col, Row, Card, Form, Container, Button } from 'react-bootstrap'
import { AppContext } from '../../../context/app.ctx'
import { apiRoute, compareItems } from '../../../utils/wm-functions'
import { Dates } from '../../Dates'
import Week from '../../../types/dates'

export function ProfileOpeningHours() {
  const { data: session } = useSession()
  const { profile, plansCategory, handleShowToast, setChangeConfig, changeConfig } = useContext(AppContext)

  // const [profile, setProfile] = useState<Profile>(profile);
  const [week, setWeek] = useState<Week>(new Week(profile.week))
  const [now, setNow] = useState(DateTime.now().toFormat('HH:mm:ss'))
  const [fuso, setFuso] = useState(profile.timeZone)
  const [count, setCount] = useState(0)

  const [nextDate, setNextDate] = useState('')
  const [forceClose, setForceClose] = useState(profile.options.forceClose)
  const [forceCloseOn, setForceCloseOn] = useState(!!profile.options.forceClose && DateTime.fromISO(profile.options.forceClose) > DateTime.local())
  const [propertyChange, setPropertyChange] = useState<{
    fuso?: boolean
    forceClose?: boolean
  }>()

  // useEffect(() => {
  //   if (profile) {
  //     setForceClose(profile.options.forceClose);
  //     setForceCloseOn(
  //       !!profile.options.forceClose &&
  //       DateTime.fromISO(profile.options.forceClose) > DateTime.local()
  //     );
  //   }
  // }, [profile]);

  const handleForceClose = useCallback(async () => {
    const body = { options: { forceClose, forceCloseOn } }
    try {
      await apiRoute('/dashboard/profile/forceClose', session, 'POST', body)
      handleShowToast({
        type: 'success',
        content: `Loja ${forceCloseOn ? 'fechada' : 'aberta'}`,
        title: '',
      })
      setChangeConfig({})
    } catch (error) {
      handleShowToast({ type: 'erro' })
      console.error(error)
    }
  }, [forceClose, forceCloseOn, handleShowToast, session, setChangeConfig])

  const handleFuso = useCallback(async () => {
    profile.timeZone = fuso
    const body = { fuso }
    try {
      await apiRoute('/dashboard/profile/fuso', session, 'PATCH', body)
      handleShowToast({
        type: 'success',
        content: `Fuso horário alterado com sucesso`,
        title: 'Fuso horário',
      })
    } catch (error) {
      handleShowToast({ type: 'erro' })
      console.error(error)
    }

    setChangeConfig({})
  }, [fuso, handleShowToast, session, setChangeConfig])

  useEffect(() => {
    const differFuso = !compareItems(profile.timeZone, fuso)
    const differForceClose = !compareItems(profile.options.forceClose, forceClose)
    setChangeConfig({
      changeState: differFuso || differForceClose,
    })

    setPropertyChange({
      fuso: differFuso,
      forceClose: differForceClose,
    })
  }, [profile, fuso, forceClose, setChangeConfig])

  useEffect(() => {
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    const tomorrow = DateTime.local().plus({ days: 1 }).toFormat('cccc').toLowerCase()

    const indexOfDay = weekDays.findIndex((item) => item === tomorrow)

    let nextOpen = null

    for (let item of weekDays.filter((item, index) => index >= indexOfDay)) {
      if (week[item].length > 0) {
        let x = 1
        while (DateTime.local().plus({ days: x }).toFormat('cccc').toLowerCase() !== item) {
          x++
        }
        nextOpen = DateTime.local().plus({ days: x }).toFormat('yyyy-MM-dd') + `T${week[item][0].open}`
        break
      }
    }

    if (!nextOpen) {
      for (let item of weekDays) {
        if (week[item].length > 0) {
          let x = 1
          while (DateTime.local().plus({ days: x }).toFormat('cccc').toLowerCase() !== item) {
            x++
          }
          nextOpen = DateTime.local().plus({ days: x }).toFormat('yyyy-MM-dd') + `T${week[item][0].open}`
          break
        }
      }
    }

    if (!nextOpen) {
      nextOpen = DateTime.local().plus({ days: 1 }).toFormat('yyyy-MM-dd') + `T00:00`
    }
    setNextDate(nextOpen)
  }, [week])

  useEffect(() => {
    const time = setInterval(() => {
      setCount((prevCount) => prevCount + 1)
    }, 1000)

    return () => clearInterval(time)
  }, [])

  useEffect(() => {
    setNow(DateTime.now().setZone(fuso).toFormat('HH:mm:ss'))
  }, [count, fuso])

  useEffect(() => {
    const { changeState, confirmSave } = changeConfig
    if (changeState && confirmSave) {
      if (propertyChange?.forceClose) {
        handleForceClose()
      }

      if (propertyChange?.fuso) {
        handleFuso()
      }

      setPropertyChange({})
    }
  }, [propertyChange, handleForceClose, handleFuso, changeConfig])

  return (
    <section>
      {plansCategory.includes('basic') && (
        <Card>
          <Card.Header className="text-dark">
            <h4 className="mb-0">
              <b>Fechamento fora do horário programado</b>
            </h4>
          </Card.Header>
          <Card.Body>
            <Container className="mx-0 px-0">
              <Row>
                <Col md>
                  <div className="d-flex gap-2 flex-row-reverse justify-content-end">
                    <Form.Label htmlFor="forceClose">Fechar?</Form.Label>
                    <Form.Switch
                      id="forceClose"
                      defaultChecked={forceCloseOn}
                      onChange={(e) => {
                        setForceClose(e.target.checked ? nextDate : null)
                        setForceCloseOn(!forceCloseOn)
                      }}
                    />
                  </div>
                  <Form.Label className="mt-3">Data de Reabertura</Form.Label>
                  <Row>
                    <Col md="10" className="mb-2">
                      <Form.Control
                        type="datetime-local"
                        disabled={!forceCloseOn}
                        value={forceClose ? forceClose : nextDate}
                        min={nextDate}
                        onChange={(e) => {
                          setForceClose(e.target.value)
                        }}
                      />
                    </Col>
                    <Col md="2" className="d-flex my-auto mt-0">
                      <Button
                        variant="success"
                        className="flex-grow-1"
                        onClick={() => {
                          handleForceClose()
                        }}
                      >
                        Salvar
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
      )}
      <br />
      <Card>
        <Card.Header className="text-dark">
          <h4 className="mb-0">
            <b>Fuso Horário</b>
          </h4>
        </Card.Header>
        <Card.Body>
          <Container className="mx-0 px-0">
            <Row>
              <Col md className="mb-2">
                <Form.Label>Selecione seu fuso horário</Form.Label>
                <Form.Select
                  value={fuso}
                  onChange={(e) => {
                    setFuso(e.target.value)
                  }}
                >
                  {[
                    { label: 'Acre', value: 'America/Rio_Branco' },
                    { label: 'Brasília', value: 'America/Sao_Paulo' },
                    { label: 'Manaus', value: 'America/Manaus' },
                    { label: 'Fernando de Noronha', value: 'America/Noronha' },
                  ].map((fuso) => (
                    <option key={fuso.label} value={fuso.value}>
                      {fuso.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md className="d-flex mb-2">
                <div className="mt-auto flex-grow-1">
                  <Form.Label>Agora</Form.Label>
                  <Form.Control readOnly value={now} />
                </div>
              </Col>
              <Col md="2" className="d-flex mb-2">
                <Button
                  variant="success"
                  className="mt-auto flex-grow-1"
                  onClick={() => {
                    handleFuso()
                  }}
                >
                  Salvar
                </Button>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
      <br />
      {profile && <Dates type="profile" title="Adicionar Horário de Funcionamento" week={week} setWeek={setWeek} />}
    </section>
  )
}
