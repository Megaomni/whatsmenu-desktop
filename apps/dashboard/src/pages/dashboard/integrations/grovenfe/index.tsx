import { ConfigEmission } from '@components/GroveNFe/ConfigEmission'
import { CreateCompany } from '@components/GroveNFe/CreateCompany'
import { Title } from '@components/Partials/title'
import { AppContext } from '@context/app.ctx'
import Image from 'next/image'
import { useContext, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Nav,
  Row,
  Tab
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export default function Grovenfe() {
  const { t } = useTranslation()
  const { profile } = useContext(AppContext)
  const grovenfe = profile.options.integrations?.grovenfe?.created_at

  const [tabKey, setTabKey] = useState('addCompany')
  const [groveNfeTerms, setGroveNfeTerms] = useState(false)
  const [showConfigEmission, setShowConfigEmission] = useState(Boolean(profile.options.integrations?.grovenfe))

  return (
    <>
      {!showConfigEmission ? (
        <>
          <Card>
            <Card.Header className="ms-2 fw-bold fs-5">GroveNFE</Card.Header>
            <Card.Body >
              <Row>
                <Col lg={6} className="mt-5">
                  <Image src="/images/grovenfe/grovenfe.png" alt="Logo da GroveNFE" width={320} height={100} />
                  <div>
                    <h3 className="bold fw-bold fs-1 text-start" style={{ color: '#000' }}>Emissão e Gestão Automática de Notas Fiscais Eletrônicas</h3>
                    <p style={{ color: '#86849C' }}>Chega de perder tempo lançando notas fiscais na mão. Defina automações e configure limites de acordo com o seu enquadramento CNPJ.</p>
                  </div>
                </Col>
                <Col lg={6} className="m-0 p-0">
                  <Image src="/images/grovenfe/grovenfe_lion.png" alt="Imagem de uma pessoa com um leão" fill className='position-relative' />
                </Col>
              </Row>
            </Card.Body>

            <Card.Footer>
              <div>
                <div className="m-3 my-5 d-flex flex-row gap-5 overflow-auto">
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/fast-delivery 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Suporte Total para Operação Delivery</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/receipt 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Enviamos a Nota Fiscal para os seus Clientes na Hora</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/xml 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Envio Automático XML ao seu Contador</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/cancel-event 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Fechamento Mensal Automático</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/system-configuration 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Liberdade para Configurar Automações</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/operation 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Defina Limites por Forma de Pagamento</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/monitor 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Relatórios e Filtros Especiais</p>
                  </div>
                  <div className="d-flex flex-column align-items-center ">
                    <Image src="/images/grovenfe/shopping 1.png" alt="" width={50} height={50} />
                    <p className="text-center">Cancelamento de Notas Emitidas</p>
                  </div>
                </div>
              </div>
              <div className='bg-primary text-white rounded p-4 text-center d-flex align-items-center justify-content-center flex-column'>
                <p>
                  <span className='fw-bold'>Você ganhou </span>
                  <span>um cupom para começar:</span>
                </p>
                <p className='text-uppercase' style={{
                  fontWeight: 'lighter'
                }}>50 NOTAS FISCAIS GRÁTIS</p>
              </div>
            </Card.Footer>
          </Card>
        
          <div className='d-flex flex-column justify-content-center align-items-center gap-4'>
            <Form.Label className='d-flex align-items-center gap-2'>
              <Form.Check checked={groveNfeTerms}  onChange={() => setGroveNfeTerms(!groveNfeTerms)} />
              <span>Li e aceito os Termos de uso Grove NFE.</span>
            </Form.Label>
            <Button variant='success' disabled={!groveNfeTerms} onClick={() => setShowConfigEmission(true)}>ATIVAR CUPOM</Button>
          </div>
        </>
      ): (
      <>
        <Title
          title="Configurações NFe"
          componentTitle="Configurações NFe"
          className="mb-3"
        />
        <Tab.Container
          activeKey={tabKey}
          onSelect={(key) => setTabKey(key as string)}
        >
          <Row>
            <Col>
              <Nav variant="tabs" className="tab-nav-flex flex-row">
                <Nav.Item>
                  <Nav.Link eventKey="addCompany" className="text-nowrap">
                    {grovenfe ? t('edit_company') : t('add_company')}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="configEmission" className="text-nowrap">
                    {t('configure_emission')}
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane eventKey="addCompany">
                  <CreateCompany />
                </Tab.Pane>
                <Tab.Pane eventKey="configEmission">
                  <ConfigEmission />
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </>
    )}
    </>
  )
}
