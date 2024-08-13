import { Button, Col, Modal, Row } from 'react-bootstrap'
import Request from '../../../../../types/request'

import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { DateTime } from 'luxon'
import { useContext, useState } from 'react'
import { AppContext } from '../../../../../context/app.ctx'
import { useSession } from 'next-auth/react'
import Cart from '../../../../../types/cart'
import { CartsContext } from '../../../../../context/cart.ctx'
import { useTranslation } from 'react-i18next'

type PropsTypes = {
  show: boolean
  onHide: () => void
  cart: Cart
}

type StateAlterDate = {
  daySelected?: Date
}

export function PackageAlterDate({ cart, ...props }: PropsTypes) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const [stateAlterDate, setStateAlterDate] = useState<StateAlterDate>({})
  const { handleShowToast } = useContext(AppContext)
  const { carts, setCarts } = useContext(CartsContext)

  const { daySelected } = stateAlterDate

  const setDate = async () => {
    if (daySelected) {
      try {
        await cart.alterDate(session, daySelected.toDateString())
        setCarts([...carts])
        handleShowToast({ type: 'success', title: t('change_date') })
      } catch (error) {
        console.error(error)
        handleShowToast({ type: 'erro', title: t('change_date') })
      }
    }
  }
  return (
    <>
      <Modal
        {...props}
        centered
        style={{ zIndex: 999999 }}
        onExited={() => {
          setStateAlterDate({})
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>
              {t('change_order_date')}: wm{cart.code}-{cart.type}
            </h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col className="d-flex justify-content-center">
              <Calendar
                // activeStartDate={new Date()}
                minDate={new Date()}
                tileDisabled={({ activeStartDate, date, view }) => {
                  const reqDate = DateTime.fromJSDate(
                    new Date(cart.packageDate)
                  )
                  const actualyDate = DateTime.fromJSDate(date)
                  return (
                    reqDate.toFormat('yyyy-MM-dd') ===
                    actualyDate.toFormat('yyyy-MM-dd')
                  )
                }}
                onClickDay={(e) => {
                  setStateAlterDate({
                    daySelected: e,
                  })
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col className="text-center">
              <p className={`mb-0 ${!daySelected && 'invisible'}`}>
                <span className="fw-bold">{t('selected_date')} : </span>
                {daySelected &&
                  DateTime.fromJSDate(new Date(daySelected)).toFormat(
                    t('date_format')
                  )}
              </p>

              <p className="mt-0">
                <span className="fw-bold">{t('current_order_date')} : </span>
                {DateTime.fromJSDate(new Date(cart.packageDate)).toFormat(
                  t('date_format')
                )}
              </p>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex w-100 justify-content-end">
            <div className="d-flex gap-2">
              <Button
                variant="success"
                disabled={!daySelected}
                onClick={() => {
                  setDate()
                  props.onHide()
                }}
              >
                <span className="align-middle">{t('confirm')}</span>
              </Button>
              <Button variant="danger" onClick={props.onHide}>
                <span>{t('close')}</span>
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}
