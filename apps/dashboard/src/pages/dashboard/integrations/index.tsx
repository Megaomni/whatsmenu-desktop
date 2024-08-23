import React from 'react'
import {
  Row,
  Col,
  Card,
  Container,
  CardHeader,
  CardBody,
} from 'react-bootstrap'
import { HelpVideos } from '../../../components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'
import { t } from 'i18next'
import Image from 'next/image'
import Link from 'next/link'

export default function Integrations() {
  return (
    <Container>
      <Card>
        <CardHeader>
          <h2 className="fs-5 fw-semibold text-start text-black">
            {t('integrations')}
          </h2>
        </CardHeader>
        <CardBody className="color-white w-100 h-75 flex-shrink-0 p-4">
          <Row>
            <Col md className="d-flex gap-3">
              <h4 className="lh-base fs-2 fw-bold text-primary mt-2">
                {t('online_payment_s')}
              </h4>
              <div
                className="vr mt-4"
                style={{ height: 'var(--dropdown-padding-x, 24px)' }}
              ></div>
              <HelpVideos.Trigger urls={[{ src: '', title: t('') }]} />
            </Col>
          </Row>
          <Row>
            <Col>
              <p className="fs-6 lh-base mt-2 text-black">
                {t('online_payment_description')}
              </p>
              <Row className="mt-4">
                <Col md={3} className="text-center">
                  <Link href="/dashboard/profile#forms-payment">
                    <div
                      className="d-flex justify-content-center align-items-center w-100 h-50 mt-2 border border-2 border-opacity-50"
                      style={{ borderRadius: '15px' }}
                    >
                      <Card.Body>
                        <Image
                          src="/images/AsaasLogo.svg"
                          alt="Asaas"
                          width={162}
                          height={52}
                        />
                      </Card.Body>
                    </div>
                    <Card.Text className="fs-7 fw-bolder lh-lg text-secondary mb-5 mt-3 text-center">
                      {t('credit_online')}
                    </Card.Text>
                  </Link>
                </Col>
                {/* <Col md={3} className="text-center">
                  <div
                    className="d-flex justify-content-center align-items-center w-100 h-50 mt-2 border border-2 border-opacity-50"
                    style={{ borderRadius: '15px' }}
                  >
                    <Card.Body>
                      <Image
                        src="/images/GrovePay.svg"
                        alt="GrovePay"
                        width={162}
                        height={52}
                      />
                    </Card.Body>
                  </div>
                  <Card.Text className="fs-7 fw-bolder lh-lg text-secondary mb-5 mt-3 text-center">
                    PIX automatizado no seu banco favorito
                  </Card.Text>
                </Col> */}
              </Row>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card className="color-white w-100 h-100 flex-shrink-0 p-4">
        <Row>
          <Col className="d-flex gap-3">
            <h4 className="lh-base fs-2 fw-bold text-primary mt-2">
              {t('fiscal_note_issuer')}
            </h4>
            <div
              className="vr mt-4 "
              style={{ height: 'var(--dropdown-padding-x, 24px)' }}
            ></div>
            <HelpVideos.Trigger urls={[{ src: '', title: t('') }]} />
          </Col>
        </Row>
        <Row>
          <Col className="mt-3">
            <p className="fs-6 lh-base text-black">
              {t('fiscal_note_issuer_description')}
            </p>
            <Row className="mt-4">
              <Col md={3} className="text-center">
                <div
                  className="d-flex justify-content-center align-items-center w-100 h-50 mt-2 border border-2 border-opacity-50"
                  style={{ borderRadius: '15px' }}
                >
                  <Card.Body>
                    <Image
                      src="/images/GroveNFeLogo.svg"
                      alt="GroveNFe"
                      width={162}
                      height={52}
                    />
                  </Card.Body>
                </div>
                <Card.Text className="fs-7 fw-bolder lh-lg text-secondary mb-5 mt-3 text-center">
                  {t('grove_nfe_description')}
                </Card.Text>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    </Container>
  )
}
