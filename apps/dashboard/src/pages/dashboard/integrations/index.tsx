import { IntegrationCard, IntegrationCardContainer } from '@components/IntegrationCard'
import { Title } from '@components/Partials/title'
import Image from 'next/image'
import Link from 'next/link'
import {
  Card,
  CardBody,
  Col,
  Container,
  Row
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function Integrations() {
  const { t } = useTranslation()
  return (
    <Container fluid>
      <Title
        title={'Integrações'}
        componentTitle={'Integrações'}
        className="mb-4"
      />
      <Card>
        <CardBody className="color-white w-100 h-75 flex-shrink-0 p-4">
          <Row>
            <Col md className="d-flex gap-3">
              <h4 className="lh-base fs-2 fw-bold text-primary mt-2">
                Marketing e Vendas
              </h4>
            </Col>
          </Row>
          <Row>
            <Col>
              <p className="fs-6 lh-base mt-2 text-black">
                Integramos sua loja as maiores ferramentas de marketing e vendas
                do mercado, atraia mais clientes e venda muito mais com menos trabalho.
              </p>
              <IntegrationCardContainer>
                <Link href="/dashboard/integrations/google-tag-manager">
                  <IntegrationCard
                    legend={"Google Tag Manager"}
                  >
                    <Image
                      src="/images/google-tag-manager-logo.svg"
                      alt="Google Tag Manager"
                      width={150}
                      height={150}
                    />
                  </IntegrationCard>
                </Link>
                <Link href="/dashboard/integrations/google-ads">
                  <IntegrationCard
                    legend={"Google Ads"}
                  >
                    <Image
                      src="/images/google-ads-logo.svg"
                      alt="google-ads-logo"
                      width={90}
                      height={90}
                    />
                  </IntegrationCard>
                </Link>
                <Link href="/dashboard/integrations/facebook-pixel">
                  <IntegrationCard
                    legend={"Facebook Pixel"}
                  >
                    <Image
                      src="/images/facebook-pixel-logo.svg"
                      alt="facebook-pixel-logo"
                      width={90}
                      height={90}
                    />
                  </IntegrationCard>
                </Link>
              </IntegrationCardContainer>
            </Col>
          </Row>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="color-white w-100 h-75 flex-shrink-0 p-4">
          <Row>
            <Col md className="d-flex gap-3">
              <h4 className="lh-base fs-2 fw-bold text-primary mt-2">
                {t('online_payment_s')}
              </h4>
            </Col >
          </Row >
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
        </CardBody >
      </Card >

      <Card className="color-white w-100 h-100 flex-shrink-0 p-4">
        <Row>
          <Col className="d-flex gap-3">
            <h4 className="lh-base fs-2 fw-bold text-primary mt-2">
              {t('fiscal_note_issuer').replace('NFe e', '')}
            </h4>
          </Col >
        </Row >
        <Row>
          <Col className="mt-3">
            <p className="fs-6 lh-base text-black">
              {t('fiscal_note_issuer_description')}
            </p>
            {/* <Link href="/dashboard/integrations/grovenfe"> */}
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
            {/* </Link> */}
          </Col>
        </Row>
      </Card >
    </Container >
  )
}
