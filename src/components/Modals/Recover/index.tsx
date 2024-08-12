import { useSession } from 'next-auth/react'
import { useContext } from 'react'
import { useState } from 'react'
import { Button, Form, InputGroup, Modal } from 'react-bootstrap'
import { BiMailSend } from 'react-icons/bi'
import { AppContext } from 'src/context/app.ctx'
import { apiRoute } from '../../../utils/wm-functions'
import { WMToast, WMToastProps } from '../../WMToast'
import { useTranslation } from 'react-i18next'

interface RecoverProps {
  show: boolean
  email?: string
  handleClose: () => void
  handleConfirm?: () => void
}

export function Recover(props: RecoverProps) {
  const { t } = useTranslation()

  const { user } = useContext(AppContext)

  const [showToast, setShowToast] = useState(false)
  const [toast, setToast] = useState<WMToastProps>({})

  const { show, handleClose } = props
  return (
    <>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header>
          <h3>
            <b>{t('password_recovery')}</b>
          </h3>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>
            <p>{t('enter_registed_email_recover_password')}</p>
          </Form.Label>
          <InputGroup>
            <InputGroup.Text>Email</InputGroup.Text>
            <Form.Control required type="email" id="recovery_email" defaultValue={props.email ?? ''} />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={async () => {
              const recovery_email = (document.querySelector('#recovery_email') as HTMLInputElement)?.value
              if (!recovery_email) {
                setToast({
                  type: 'alert',
                  content: t('please_enter_valid_email'),
                  title: '',
                })
                setShowToast(true)
                return
              }
              try {
                const body = { recovery_email }
                await apiRoute('/recoveryPassword', undefined, 'POST', body)

                setToast({
                  type: 'success',
                  title: t('email_sent_successfully'),
                  content: `${t('acess')} ${props.email} e \\n ${t('check_inbox_spam')} \\n ${t('message_subject')}: \\n ${t(
                    'password_recovery'
                  )}"| WhatsMenu"`,
                })
                setShowToast(true)
              } catch (error) {
                setToast({
                  type: 'erro',
                  title: '',
                  content: '',
                })
                setShowToast(true)
                console.error(error)
              }
            }}
          >
            <BiMailSend />
            {t('send')}
          </Button>
        </Modal.Footer>
      </Modal>
      <WMToast
        position={toast.position}
        title={toast.title}
        content={toast.content}
        show={showToast}
        setShow={setShowToast}
        type={toast.type}
        size={30}
      />
    </>
  )
}
