import { Dispatch, SetStateAction } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { BsCheckCircle } from 'react-icons/bs'
import { FiAlertCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

export interface WMToastProps {
  position?:
    | 'top-start'
    | 'top-center'
    | 'top-end'
    | 'middle-start'
    | 'middle-center'
    | 'middle-end'
    | 'bottom-start'
    | 'bottom-center'
    | 'bottom-end'
  flexPositionX?: 'start' | 'center' | 'end'
  flexPositionY?: 'start' | 'center' | 'end'
  title?: string
  content?: string
  type?: 'success' | 'erro' | 'alert'
  show?: boolean
  setShow?: Dispatch<SetStateAction<boolean>>
  delay?: number
  size?: number
  classAdd?: string
}

export function WMToast({
  position,
  title,
  content,
  type,
  show,
  setShow,
  delay = 3000,
  size,
  flexPositionX,
  flexPositionY,
  classAdd,
}: WMToastProps) {
  type = type ? type : 'alert'
  flexPositionX = flexPositionX ? flexPositionX : 'center'
  flexPositionY = flexPositionY ? flexPositionY : 'center'

  const { t } = useTranslation()
  if (!title) {
    switch (type) {
      case 'success':
        title = `${t('success')}!`
        break
      case 'erro':
        title = 'Ops..!'
        break
      case 'alert':
        title = `${t('attention')}!`
        break
    }
  }
  if (!content) {
    switch (type) {
      case 'success':
        content = `${t('changes_made_successfully')}!`
        break
      case 'erro':
        content = t('unexpected_try_again')
        break
      case 'alert':
        content = t('review_entered_data')
        break
    }
  }
  return (
    <ToastContainer
      className={`d-flex align-items-${flexPositionY} justify-content-${flexPositionX} w-100 position-fixed`}
      position={position ? position : 'middle-center'}
      style={{ zIndex: 999999 }}
    >
      <Toast
        className={`wm-toast-${type} ${classAdd}`}
        onClose={() => {
          if (setShow) {
            setShow(false)
          }
        }}
        show={show}
        delay={delay}
        autohide
        style={{ width: `${size}rem` }}
      >
        <Toast.Header className="fs-5 gap-2">
          {type === 'success' && <BsCheckCircle />}
          {type === 'erro' && <AiOutlineCloseCircle />}
          {type === 'alert' && <FiAlertCircle />}
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body className="fs-5 text-center">
          {content.split('\\n').map((text) => (
            <p key={text} className="m-0">
              {text}
            </p>
          ))}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  )
}
