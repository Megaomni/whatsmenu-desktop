import { Button, Card, Col, Row } from 'react-bootstrap'
import {
  FaChartLine,
  FaCoins,
  FaHourglass,
  FaMagic,
  FaQrcode,
  FaTachometerAlt,
  FaThumbsUp,
  FaUser,
} from 'react-icons/fa'
import { GoPackage } from 'react-icons/go'
import { useTranslation } from 'react-i18next'

interface AddPlanProps {
  title: string
  plan: 'delivery' | 'table' | 'package'
  notDefaultTitle?: boolean
}

export function AddPlan({ title, plan, notDefaultTitle }: AddPlanProps) {
  const { t } = useTranslation()
  return (
    <>
      <Card className="mt-4">
        <Card.Header className="text-700 text-center">
          <h2>
            <b>
              {notDefaultTitle ? '' : t('control_of')}
              {title}
            </b>
          </h2>
        </Card.Header>
        <Card.Body className="d-flex flex-column">
          {plan === 'table' && (
            <>
              <Row>
                <Col sm="6">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/-iwJoaRRFRE?controls=0"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-100"
                    allowFullScreen
                  ></iframe>
                </Col>
                <Col sm="6">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/M5Q667_9UCg?controls=0"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-100"
                    allowFullScreen
                  ></iframe>
                </Col>
              </Row>
              <Row className="mt-2 text-center">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaTachometerAlt fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('efficiency')}</b>
                      </p>
                      <span className="my-auto">
                        {t('incredible_agility')}.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaMagic fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('automation')}</b>
                      </p>
                      <span className="my-auto">{t('now_you_control')}</span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaQrcode fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>QRCode</b>
                      </p>
                      <span className="my-auto">
                        {t('qrcode_self_service')}
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="mt-4 text-center">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaUser fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('self_service')}</b>
                      </p>
                      <span className="my-auto">
                        {t('customers_place_orders_themselves')}
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaChartLine fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('zero_waste')}</b>
                      </p>
                      <span className="my-auto">
                        {t('indecipherable_handwriting')}
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaCoins fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('closure')}</b>
                      </p>
                      <span className="my-auto">
                        {t('automatically_separates_calculates')}
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
          {plan === 'package' && (
            <>
              <Row className="mt-2 text-center">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <GoPackage fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('ordering_system')}</b>
                      </p>
                      <span className="my-auto">
                        <p>{t('allows_your_customer')}</p>
                        <p>{t('allows_customer_they_wish')}</p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaHourglass fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>24H</b>
                      </p>
                      <span className="my-auto">
                        <p>{t('you_can_sell_24h')}</p>
                        <p>{t('prevents_setbacks')}</p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaThumbsUp fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>{t('advantages')}</b>
                      </p>
                      <span className="my-auto">
                        <p>{t('configure_days_establishment')}</p>
                        <p>{t('customer_best_time_for_them')}</p>
                        <p>{t('helps_improve')}</p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
          <Button
            variant="success"
            size="lg"
            className="text-uppercase fs-1 flex-grow-1 mx-auto mt-5 text-wrap"
            onClick={() => {
              if (plan === 'package') {
                window.open(
                  'https://api.whatsapp.com/send/?phone=5511937036875&text=Já%20sou%20cliente%20delivery%20e%20quero%20agendar%20o%20treinamento%20do%20sistema%20de%encomendas.'
                )
              } else if (plan === 'table') {
                window.open(
                  'https://api.whatsapp.com/send/?phone=5511937036875&text=á%20sou%20cliente%20delivery%20e%20quero%20agendar%20o%20treinamento%20do%20sistema%20de%20mesa.'
                )
              }
            }}
          >
            {t('speak_with_consultant')}
          </Button>
        </Card.Body>
      </Card>
    </>
  )
}
