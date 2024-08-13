import { AppContext } from '@context/app.ctx'
import { CartsContext } from '@context/cart.ctx'
import { apiRoute } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FormEvent, useContext } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { RiErrorWarningFill } from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

interface AuthFormProps {
  onSubmit: (e: FormEvent<HTMLElement>) => void
}

export const AuthForm = ({ onSubmit }: AuthFormProps) => {
  const { t } = useTranslation()
  const { profile, handleShowToast, user } = useContext(AppContext)
  const { motoboys } = useContext(CartsContext)
  const { data: session } = useSession()

  const handleRecoverSecurity = async () => {
    try {
      await apiRoute(
        '/dashboard/account/recoverySecurityPassword',
        session,
        'POST'
      )
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

  if (profile.not_security_key) {
    return (
      <Alert variant="warning" className="d-flex gap-4">
        <RiErrorWarningFill className="text-warning" size={30} />
        <div>
          <p>{t('warning_financial_password')}</p>
          <p className="">
            {t('warning_v2')} &gt; {t('passwords_or')} &nbsp;
            <Link href="/dashboard/settings/account">{t('click_here')}</Link>
          </p>
        </div>
      </Alert>
    )
  }

  return (
    <Card className="text-center">
      <Card.Header>
        <h4>{t('enter_financial_password')}</h4>
      </Card.Header>
      <Card.Body className="pb-0">
        <Row
          as={Form}
          method="POST"
          onSubmit={onSubmit}
          className="align-items-baseline mt-3"
        >
          <Col md="12" className="d-flex">
            <Form.Control
              type="password"
              id="security_key"
              className=" mb-3"
              required
            />
            <input type="hidden" value={motoboys[0]?.id} id="motoboyId" />
          </Col>
          <Col className="d-flex">
            <Button
              type="submit"
              className="text-uppercase flex-grow-1 mb-3 text-nowrap"
            >
              {t('confirm')}
            </Button>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col sm>
            <p>{t('forgot_financial_password')}?</p>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col sm>
            <Button
              variant="link"
              className="text-decoration-none mx-auto"
              style={{ boxShadow: 'none' }}
              onClick={handleRecoverSecurity}
            >
              {t('recover_password')}
            </Button>
          </Col>
        </Row>
      </Card.Body>
      <div className="d-flex justify-content-center align-items-center m-2"></div>
    </Card>
  )
}
