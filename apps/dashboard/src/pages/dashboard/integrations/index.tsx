import React from 'react'
import { useSession } from 'next-auth/react'
import { Row, Col, Card, Container, Button } from 'react-bootstrap'
import { HelpVideos } from '../../../components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'
import { t } from 'i18next'
import Image from 'next/image'
import Link from 'next/link'

export default function Integrations() {
  return (
    <Container className="mt-4">
      <h2 className="mb-4"> Integrações </h2>
      <Row>
        <Col md className="d-flex gap-3">
          <h4 className="text-primary">Pagamentos Online</h4>
          <div className="vr"></div>
          <HelpVideos.Trigger urls={[{ src: '', title: t('') }]} />
        </Col>
      </Row>
      <Row>
        <Col className="mt-3">
          <b>
            Evite golpes, erros e atrasos tendo que verificar comprovantes no app do banco, o pedido chega no painel e o pagamento com segurança
            direto na sua conta.
          </b>

          <Row className="mt-4">
            <Col md={3} className="text-center">
            <Link href="/dashboard/profile/payment-methods">
              <div style={{ border: '2px solid #CED9EA', borderRadius: '19px' }} className="mb-3">
                <Card.Body>
                  <Image src="/images/AsaasLogo.svg" alt="Asaas" width={200} height={200} />
                </Card.Body>
              </div>
              <Card.Text className="mt-3 mb-3">Crédito Online</Card.Text>
            </Link>
            </Col>
            <Col md={3} className="text-center">
              <div style={{ border: '2px solid #CED9EA', borderRadius: '19px' }} className="mb-3">
                <Card.Body>
                  <Image src="/images/GrovePay.svg" alt="GrovePay" width={200} height={200} />
                </Card.Body>
              </div>
              <Card.Text className="mt-3 mb-3">PIX automatizado no seu banco favorito</Card.Text>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row>
        <Col className="d-flex gap-3">
          <h4 className="text-primary">Emissor de NFe e NFCe</h4>
          <div className="vr"></div>
          <HelpVideos.Trigger urls={[{ src: '', title: t('') }]} />
        </Col>
      </Row>
      <Row>
        <Col className="mt-3">
          <b>Chega de perder tempo lançando notas fiscais na mão, Defina automações e configure limites de acordo com o seu enquadramento CNPJ.</b>
          <Row className="mt-4">
            <Col md={3} className="text-center">
              <div style={{ border: '2px solid #CED9EA', borderRadius: '19px' }} className="mb-3">
                <Card.Body>
                  <Image src="/images/GroveNFeLogo.svg" alt="GroveNFe" width={200} height={200} />
                </Card.Body>
              </div>
              <Card.Text className="mt-4">Emissão e Gestão Automática de Notas Fiscais</Card.Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}
