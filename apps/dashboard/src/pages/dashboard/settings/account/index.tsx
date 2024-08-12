import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Title } from '../../../../components/Partials/title'
import { AppContext } from '../../../../context/app.ctx'
import { apiRoute } from '../../../../utils/wm-functions'
import { useRouter } from 'next/router'
import { api } from 'src/lib/axios'
import { useTranslation } from 'react-i18next'

export interface AccountProps {
  expired: boolean
  token: string
}

export default function Account({ token, ...props }: AccountProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { handleShowToast, profile, setProfile, user } = useContext(AppContext)

  const [security_key, setSecurity_key] = useState('')
  const [old_security_key, setOld_security_key] = useState('')
  const [password, setPassword] = useState('')
  const [old_password, setOld_Password] = useState('')
  const [expired, setExpired] = useState(props.expired === undefined ? true : props.expired)
  const { t } = useTranslation()

  useEffect(() => {
    if (expired && token) {
      handleShowToast({
        type: 'erro',
        title: t('authentication_failure'),
        content: t('password_recovery_token'),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStore = async () => {
    try {
      const body = { security_key, security_key_confirm: old_security_key }
      await apiRoute(`/dashboard/account`, session, 'PATCH', body)
      handleShowToast({
        type: 'success',
        content: `${t('security_password_registered')}`,
      })
      profile.not_security_key = false
      setExpired(true)
      setSecurity_key('')
      setOld_security_key('')
      setProfile(profile)
      await router.push('/dashboard/profile')
    } catch (error) {
      handleShowToast({
        type: 'erro',
        content: ``,
      })
      console.error(error)
    }
  }

  const handleUpdate = async (type: 'security' | 'access') => {
    if (
      type === 'access' &&
      ((password.length && !old_password.length) || (!password.length && old_password.length) || (!password.length && !old_password.length))
    ) {
      return handleShowToast({ type: 'alert' })
    }
    if (
      type === 'security' &&
      ((security_key.length && !old_security_key.length) ||
        (!security_key.length && old_security_key.length) ||
        (!security_key.length && !old_security_key.length))
    ) {
      return handleShowToast({ type: 'alert' })
    }

    try {
      const body = type === 'access' ? { password, old_password } : { security_key, old_security_key }

      if (type === 'access') {
        await api.patch(`/dashboard/user/${type === 'access' ? 'alterPassword' : 'alterSecurityKey'}`, body)
      }
      if (type === 'security') {
        await apiRoute(`/dashboard/account/updateSecurityKey`, session, 'PATCH', body)
      }
      setSecurity_key('')
      setOld_security_key('')
      setOld_Password('')
      setPassword('')
      handleShowToast({
        type: 'success',
        content: `Senha de ${type === 'access' ? t('access') : t('security')} ${t('changed_successfully')}`,
      })
    } catch (error) {
      handleShowToast({
        type: 'erro',
        content: `${t('incorrect_current_password')}`,
      })
      console.error(error)
    }
  }

  const handleRecoverSecurity = async () => {
    try {
      await apiRoute('/dashboard/account/recoverySecurityPassword', session, 'POST')
      handleShowToast({
        type: 'success',
        content: `${t('acess')} ${user?.email} e \\n ${t('check_inbox_spam')} \\n ${t('message_subject')}: \\n "${t(
          'password_recovery'
        )} | WhatsMenu"`,
        size: 30,
      })
    } catch (error) {
      handleShowToast({
        type: 'erro',
        content: ``,
      })
      console.error(error)
    }
  }

  return (
    <>
      <Title title="Meu Perfil" componentTitle={t('password_settings')} className="mb-4" child={['Senhas']} />
      {expired ? (
        <>
          {profile.not_security_key ? (
            <Alert variant="warning" show={true}>
              <Alert.Heading className="d-flex align-items-start gap-2">{t('attention')}</Alert.Heading>
              <p className="ms-4">{t('register_financial_password')}</p>
            </Alert>
          ) : null}
          <Card>
            <Card.Header className="text-dark">
              <h4>{!profile.not_security_key ? t('change_financial_password') : t('register_password_financial')}</h4>
            </Card.Header>
            <Card.Body>
              <Container fluid className="mx-0 px-0">
                <Row className="align-items-baseline">
                  <Col md="2">
                    <Form.Label className="fw-bold text-nowrap">{!profile.not_security_key ? t('current_password') : t('password')}</Form.Label>
                  </Col>
                  <Col md="4">
                    <div>
                      <Form.Control
                        id="old_security_key"
                        type="password"
                        value={old_security_key}
                        onChange={(e) => setOld_security_key(e.target.value)}
                      />
                    </div>
                  </Col>
                </Row>
                <Row className="align-items-baseline mt-3">
                  <Col md="2">
                    <Form.Label className="fw-bold text-nowrap">{!profile.not_security_key ? t('new_password') : t('confirm_password')}</Form.Label>
                  </Col>
                  <Col md="4">
                    <div>
                      <Form.Control id="security_key" type="password" value={security_key} onChange={(e) => setSecurity_key(e.target.value)} />
                    </div>
                    {!profile.not_security_key ? (
                      <span className="mt-3 fs-7 text-nowrap d-flex gap-1 justify-content-between">
                        {t('forgot_financial_password')}?
                        <a
                          href=""
                          onClick={(e) => {
                            e.preventDefault()
                            handleRecoverSecurity()
                          }}
                        >
                          {t('recover_password')}
                        </a>
                      </span>
                    ) : null}
                  </Col>
                </Row>
              </Container>
            </Card.Body>
            <Card.Footer>
              <Row>
                <Col md="1" className="d-flex">
                  <Button
                    variant="success"
                    className="flex-grow-1"
                    onClick={() => {
                      !profile.not_security_key ? handleUpdate('security') : handleStore()
                    }}
                  >
                    {t('save')}
                  </Button>
                </Col>
              </Row>
            </Card.Footer>
          </Card>
          {!profile.not_security_key ? (
            <>
              <Card className="mt-5">
                <Card.Header className="text-dark">
                  <h4>{t('change_access_password')}</h4>
                </Card.Header>
                <Card.Body>
                  <Container fluid className="mx-0 px-0">
                    <Row className="align-items-baseline">
                      <Col md="2">
                        <Form.Label className="fw-bold text-nowrap">{t('current_password')}</Form.Label>
                      </Col>
                      <Col md="4">
                        <div className="position-relative">
                          <Form.Control
                            id="accessPassword"
                            type="password"
                            value={old_password}
                            onChange={(e) => {
                              setOld_Password(e.target.value)
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row className="align-items-baseline mt-3">
                      <Col md="2">
                        <Form.Label className="fw-bold text-nowrap">{t('new_password')}</Form.Label>
                      </Col>
                      <Col md="4">
                        <div className="position-relative">
                          <Form.Control
                            id="accessPasswordConfirm"
                            type="password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </Card.Body>
                <Card.Footer>
                  <Row>
                    <Col md="1" className="d-flex">
                      <Button
                        variant="success"
                        className="flex-grow-1"
                        onClick={() => {
                          handleUpdate('access')
                        }}
                      >
                        {t('save')}
                      </Button>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            </>
          ) : null}
        </>
      ) : (
        <Card>
          <Card.Header className="text-dark">
            <h4>{t('recover_financial_password')}</h4>
          </Card.Header>
          <Card.Body>
            <Container fluid className="mx-0 px-0">
              <Row className="align-items-baseline">
                <Col md="3">
                  <Form.Label className="fw-bold text-nowrap">{t('new_password')}</Form.Label>
                </Col>
                <Col md="4">
                  <div>
                    <Form.Control type="password" value={security_key} onChange={(e) => setSecurity_key(e.target.value)} />
                  </div>
                </Col>
              </Row>
              <Row className="align-items-baseline mt-3">
                <Col md="3">
                  <Form.Label className="fw-bold text-nowrap">{t('confirm_new_password')}</Form.Label>
                </Col>
                <Col md="4">
                  <div>
                    <Form.Control type="password" value={old_security_key} onChange={(e) => setOld_security_key(e.target.value)} />
                  </div>
                </Col>
              </Row>
            </Container>
          </Card.Body>
          <Card.Footer>
            <Row>
              <Col md="1" className="d-flex">
                <Button variant="success" className="flex-grow-1" onClick={handleStore}>
                  {t('save')}
                </Button>
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  if (query.token) {
    const session = await getSession({ req })

    try {
      const { data } = await apiRoute(`/dashboard/account/recovery?token=${query.token}`, session)
      return {
        props: { ...data },
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return {
    props: {},
  }
}
