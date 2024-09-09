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
import { IntegrationCard, IntegrationCardContainer } from '@components/IntegrationCard'

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
              <IntegrationCardContainer>
                <Link href="/dashboard/profile#forms-payment">
                  <IntegrationCard
                    legend={t('credit_online')}
                  >
                    <Image
                      src="/images/AsaasLogo.svg"
                      alt="Asaas"
                      width={162}
                      height={52}
                    />
                  </IntegrationCard>
                </Link>
                {/* <IntegrationCard
                  legend="PIX automatizado no seu banco favorito"
                >
                  <Image
                    src="/images/GrovePay.svg"
                    alt="GrovePay"
                    width={162}
                    height={52}
                  />
                </IntegrationCard> */}
              </IntegrationCardContainer>
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
            <IntegrationCardContainer>
              <IntegrationCard
                legend={t('grove_nfe_description')}
              >
                <Image
                  src="/images/GroveNFeLogo.svg"
                  alt="GroveNFe"
                  width={162}
                  height={52}
                />
              </IntegrationCard>
            </IntegrationCardContainer>
          </Col>
        </Row>
      </Card>
    </Container>
  )
}
