import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap'
import { FaCopy } from 'react-icons/fa'
import { DnsConfig } from '../../../../components/DnsConfig'
import { OverlaySpinner } from '../../../../components/OverlaySpinner'
import { Title } from '../../../../components/Partials/title'
import { AppContext } from '../../../../context/app.ctx'
import useLocalStorage from '../../../../hooks/useLocalStorage'
import Domain, { DNSRecord, DomainType } from '../../../../types/domains'
import { apiRoute, handleCopy, hash } from '../../../../utils/wm-functions'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { useTranslation } from 'react-i18next'

interface SettingsDomainsProps {
  domains: Domain[]
}

export default function SettingsDomains(props: SettingsDomainsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleShowToast } = useContext(AppContext)
  const [domains, setDomains] = useState(props.domains)
  const [domain, setDomain] = useState<Domain>()
  const [dnsConfig, setDnsConfig] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    'defaultDomain',
    null,
    'sessionStorage'
  )
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    const haveDefault = domains.find((d: DomainType) => d.default)
    if (haveDefault) {
      setDefaultDomain(haveDefault.name)
    }
  }, [domains, setDefaultDomain])

  const handleAddDomain = async () => {
    try {
      if (newDomain !== '') {
        const haveDomain = domains.find((d) => d.name === newDomain)
        if (!haveDomain) {
          const body = {
            name: newDomain, //.replace(/(http?\D:\/\/)/, "").replace(/(\w+\.)/, "")
          }
          const { data } = await apiRoute(
            '/dashboard/domains',
            session,
            'POST',
            body
          )
          const regex = /.+(\..+)$/gm
          let domainArr
          while (
            (domainArr = regex.exec(data[data.length - 1].name)) !== null
          ) {
            if (domainArr.index === regex.lastIndex) {
              regex.lastIndex++
            }
            //.cf, .ga, .gq, .ml, or .tk
            if (
              domainArr[1] == '.cf' ||
              domainArr[1] == '.ga' ||
              domainArr[1] == '.gq' ||
              domainArr[1] == '.ml' ||
              domainArr[1] == '.tk'
            ) {
              handleShowToast({
                type: 'alert',
                content: t('domain_registered_dns_registration'),
              })
            } else {
              handleShowToast({
                type: 'success',
                content: t('domain_registered'),
              })
            }
          }
          setDomains(data)
        } else {
          return handleShowToast({
            type: 'alert',
            content: t('domain_already_registered'),
          })
        }
      } else {
        return handleShowToast({
          type: 'alert',
          content: t('enter_valid_domain'),
        })
      }
    } catch (error) {
      console.error(error)
      switch ((error as any).errors.code) {
        case 1049:
          return handleShowToast({
            type: 'erro',
            title: t('invalid_domain'),
            content: t('domain_not_valid'),
          })
        case 1061:
          return handleShowToast({
            type: 'erro',
            title: t('invalid_domain'),
            content: t('domain_already_registered'),
          })
        default:
          return handleShowToast({ type: 'erro' })
      }
    }
  }

  const handleDeleteDomain = async (domainId: number) => {
    try {
      await apiRoute('/dashboard/domains/deleteDomain', session, 'DELETE', {
        domainId,
      })
      const updatedDomains = domains.filter((d) => d.id !== domainId)
      setDomains(updatedDomains)
      setDomain(undefined)
      handleShowToast({
        type: 'success',
        content: t('domain_successfully_deleted'),
        title: t('delete_domain'),
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: t('delete_domain') })
    }
  }

  const handleGetDnsRecords = async () => {
    if (domain) {
      setFetched(true)
      try {
        const { data } = await apiRoute(
          '/dashboard/domains/dnsRecords',
          session,
          'POST',
          { domainId: domain.id }
        )
        const updatedDomain = domains.find((d) => d.id === domain.id)
        if (updatedDomain) {
          updatedDomain.dns = data
          domain.dns = data
          setFetched(false)
          setDomains(domains)
        }
      } catch (error) {
        console.error(error)
        return handleShowToast({ type: 'erro' })
      }
    }
  }

  const handleUpdateDefaultDomain = async (domainId: number) => {
    try {
      const { data: updatedDomains } = await apiRoute(
        '/dashboard/domains/updateDomain',
        session,
        'PATCH',
        {
          id: domainId,
        }
      )
      setDomains(updatedDomains)
      handleShowToast({
        type: 'success',
        content: t('default_domain_successfully_changed'),
        title: t('default_domain'),
      })
    } catch (error) {
      console.error(error)
      return handleShowToast({ type: 'erro', title: t('delete_domain') })
    }
  }

  useEffect(() => {
    if (domain && !domain.dns) {
      handleGetDnsRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain])

  const handleDeleteDnsRecord = async (dns: DNSRecord) => {
    if (domain) {
      try {
        await apiRoute('/dashboard/domains/deleteDns', session, 'DELETE', {
          id: dns.id,
          zone_id: domain.key,
        })
        domain.dns = domain.dns?.filter((item) => item.id !== dns.id)

        setDomains([...domains])
        handleShowToast({
          type: 'success',
          title: t('dns_entry'),
          content: t('dns_entry_successfully'),
        })
      } catch (error) {
        console.error(error)
        return handleShowToast({ type: 'erro' })
      }
    }
  }

  return (
    <>
      <Title
        title={t('settings')}
        className="mb-4"
        componentTitle={t('domain_settings')}
        child={[t('domains')]}
      />
      <div>
        <div className="bd-callout bd-callout-warning">
          <h5>{t('attention_up')}!</h5>
          <p>{t('after_registering_domain')}</p>
          <input type="hidden" id="textCopy" />
          <ul className="mt-2">
            <li>
              <span
                className="with-icon cursor-pointer"
                onClick={(e) => handleCopy(e, handleShowToast)}
              >
                maxine.ns.cloudflare.com
                <FaCopy />
              </span>
            </li>
            <li>
              <span
                className="with-icon cursor-pointer"
                onClick={(e) => handleCopy(e, handleShowToast)}
              >
                milan.ns.cloudflare.com
                <FaCopy />
              </span>
            </li>
          </ul>
        </div>
        <section id="domainForms">
          {dnsConfig && domain ? (
            <DnsConfig domain={domain} setDnsConfig={setDnsConfig} />
          ) : (
            <Card>
              <Card.Header className="d-flex gap-3">
                <h4>{t('domain')}</h4>
                <div className="vr"></div>
                <HelpVideos.Trigger
                  urls={[
                    {
                      src: 'https://www.youtube.com/embed/IZxOQS5rCTk',
                      title: t('domain'),
                    },
                  ]}
                />
              </Card.Header>
              <Card.Body>
                <Form className="d-flex">
                  <Container fluid className="mx-0">
                    <Row>
                      <Col sm="10">
                        <Form.Control
                          type="text"
                          id="newDomain"
                          placeholder={t('domain_com')}
                          className="w-100"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                        />
                      </Col>
                      <Col sm className="mt-md-0 mt-2">
                        <Button
                          variant="success"
                          className="w-100 px-4"
                          onClick={handleAddDomain}
                        >
                          {t('save')}
                        </Button>
                      </Col>
                    </Row>
                  </Container>
                </Form>
              </Card.Body>
            </Card>
          )}
        </section>
        <section
          id="domainInfo"
          className="position-relative"
          style={{ minHeight: '13.75rem' }}
        >
          {!fetched ? (
            <Card className="mt-5">
              <Card.Header>
                <h4>
                  {dnsConfig
                    ? t('domain_information')
                    : t('registered_domains')}
                </h4>
              </Card.Header>
              <Card.Body>
                {dnsConfig ? (
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr>
                        <th>{t('type')}</th>
                        <th>{t('name')}</th>
                        <th>{t('content')}</th>
                        <th className="col-1">{t('delete')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domain?.dns?.map((dns) => (
                        <tr key={hash()}>
                          <td>{dns.type}</td>
                          <td>{dns.name}</td>
                          <td>{dns.content}</td>
                          <td>
                            <Button
                              variant="danger"
                              onClick={() => {
                                handleDeleteDnsRecord(dns)
                              }}
                            >
                              {t('delete')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr className="fs-7">
                        <th>{t('domain')}</th>
                        <th>{t('standard')}</th>
                        <th className="col-1">{t('delete')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains?.map((domainMap, index) => (
                        <tr key={hash()}>
                          <td
                            onClick={() => {
                              setDnsConfig(true)
                              setDomain(domainMap)
                            }}
                          >
                            {domainMap.name}
                          </td>
                          <td>
                            <Form.Check
                              type="radio"
                              name="domain"
                              defaultChecked={domainMap.default}
                              onChange={() => handleUpdateDefaultDomain(index)}
                            />
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              onClick={() => {
                                if (domainMap.default) {
                                  return handleShowToast({
                                    type: 'alert',
                                    content: `${t('default_domain_cannot_deleted')}  `,
                                    title: t('delete_domain'),
                                  })
                                }
                                handleDeleteDomain(domainMap.id as number)
                              }}
                            >
                              {t('delete')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          ) : (
            <OverlaySpinner show={fetched} textSpinner={t('please_wait')} />
          )}
        </section>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const { data: domains } = await apiRoute('/dashboard/domains', session)
  return {
    props: { domains },
  }
}
