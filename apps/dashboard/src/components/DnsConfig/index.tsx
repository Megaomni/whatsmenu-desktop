import { useSession } from 'next-auth/react'
import { useContext, useState } from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { BsArrowLeftCircleFill } from 'react-icons/bs'
import { AppContext } from '../../context/app.ctx'
import Domain, { DNSRecord } from '../../types/domains'
import { apiRoute } from '../../utils/wm-functions'
import { useTranslation } from 'react-i18next'

interface DnsConfigProps {
  setDnsConfig: any
  domain: Domain
}

export function DnsConfig({ setDnsConfig, domain }: DnsConfigProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const [newDnsRecord, setNewDnsRecord] = useState({
    typeDns: 'A',
    nameDns: '@',
    contentDns: '',
    proprityDns: '',
  })

  const handleAddDnsRecord = async () => {
    try {
      const { data } = await apiRoute('/dashboard/domains/storeDnsConfig', session, 'POST', { ...newDnsRecord, domainId: domain.id })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro' })
    }
  }

  return (
    <>
      <h3 onClick={() => setDnsConfig(false)}>
        <span className="with-icon cursor-pointer">
          <BsArrowLeftCircleFill />
          <span>{t('back_to_list')}</span>
        </span>
      </h3>
      <Card>
        <Card.Body>
          <Form className="d-flex mb-2">
            <Container className="mx-0">
              <Row>
                <Col sm>
                  <Form.Label>{t('type')}</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      setNewDnsRecord({
                        ...newDnsRecord,
                        typeDns: e.target.value,
                        contentDns: '@',
                      })
                    }}
                  >
                    <option value="A">A</option>
                    <option value="AAAA">AAAA</option>
                    <option value="CNAME">CNAME</option>
                    <option value="TXT">TXT</option>
                    <option value="MX">MX</option>
                  </Form.Select>
                </Col>
                <Col sm>
                  <Form.Label>{t('name')}</Form.Label>
                  <Form.Control type="text" placeholder="Use @ para root" />
                </Col>
                {newDnsRecord.typeDns === 'A' && (
                  <Col sm>
                    <Form.Label>{t('address')} IPv4</Form.Label>
                    <Form.Control type="text" placeholder="Use @ para root" />
                  </Col>
                )}
                {newDnsRecord.typeDns === 'AAAA' && (
                  <Col sm>
                    <Form.Label>{t('address')} IPv6</Form.Label>
                    <Form.Control type="text" placeholder="Use @ para root" />
                  </Col>
                )}
                {newDnsRecord.typeDns === 'CNAME' && (
                  <Col sm>
                    <Form.Label>{t('destination')}</Form.Label>
                    <Form.Control type="text" placeholder="Use @ para root" />
                  </Col>
                )}
                {newDnsRecord.typeDns === 'TXT' && (
                  <Col className="mt-4" sm="12">
                    <Form.Label>{t('content')}</Form.Label>
                    <Form.Control as="textarea" onChange={(e) => (newDnsRecord.contentDns = e.target.value)} rows={5} className="mb-4" />
                  </Col>
                )}
                {newDnsRecord.typeDns === 'MX' && (
                  <>
                    <Col sm>
                      <Form.Label>{t('email_server')}</Form.Label>
                      <Form.Control value={newDnsRecord.contentDns} type="text" />
                    </Col>
                    <Col sm>
                      <Form.Label>{t('priority')}</Form.Label>
                      <Form.Control value={newDnsRecord.proprityDns} type="text" />
                    </Col>
                  </>
                )}
                <Col className="d-flex mt-2">
                  <Button variant="success" className="mt-auto flex-grow-1" onClick={() => handleAddDnsRecord()}>
                    {t('save')}
                  </Button>
                </Col>
              </Row>
            </Container>
          </Form>
        </Card.Body>
      </Card>
    </>
  )
}
