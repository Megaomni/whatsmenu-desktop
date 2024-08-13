import { useSession } from 'next-auth/react'
import { ElementType, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'

export interface ConfirmModalProps {
  show?: boolean
  onHide?: () => void
  title?: string
  confirmButton?: string
  cancelButton?: string
  message?: string
  actionConfirm?: (...props: any) => any
  actionCancel?: (...props: any) => any
  actionExiting?: (...props: any) => any
  alignText?: 'start' | 'center' | 'end'
  size?: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
}

export function ConfirmModal(props: ConfirmModalProps) {
  let {
    show,
    onHide,
    title,
    confirmButton,
    cancelButton,
    message,
    alignText,
    actionConfirm,
    actionCancel,
    actionExiting,
    size,
  } = props

  const { data: session } = useSession()

  useEffect(() => {
    if (show) {
      const messageContainer = document.getElementById('confirmModal-message')
      if (messageContainer && message) {
        messageContainer.innerHTML = message
      }
    }
  }, [show, message])

  title = title ? title : 'Deseja Continuar'
  confirmButton = confirmButton ? confirmButton : 'Confirmar'
  cancelButton = cancelButton ? cancelButton : 'Cancelar'

  const handleShortcutActions = (e: KeyboardEvent) => {
    const modalConfirmButton = document.getElementById(
      'modalConfirmButton'
    ) as HTMLButtonElement
    const modalCancelButton = document.getElementById(
      'modalCancelButton'
    ) as HTMLButtonElement

    if (e.code === 'Escape' && modalCancelButton) {
      modalCancelButton.click()
      modalCancelButton.disabled = true
      actionCancel = () => {}
      window.removeEventListener('keydown', handleShortcutActions)
    }
    if (
      (e.code === 'Enter' || e.code === 'NumpadEnter') &&
      modalConfirmButton
    ) {
      modalConfirmButton.click()
      modalConfirmButton.disabled = true
      actionConfirm = () => {}
      window.removeEventListener('keydown', handleShortcutActions)
    }
  }

  if (show) {
    window.addEventListener('keydown', handleShortcutActions)
  } else {
    window.removeEventListener('keydown', handleShortcutActions)
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      keyboard={false}
      size="sm"
      dialogClassName={size ? `modal-${size}` : ''}
      centered
      backdrop="static"
      onExiting={(e) => {
        actionExiting && actionExiting()
      }}
    >
      <Modal.Header className="justify-content-center ">
        <Modal.Title>
          <h5>{title}</h5>
        </Modal.Title>
      </Modal.Header>
      {message && (
        <Modal.Body className="d-flex justify-content-center align-center flex-nowrap gap-3 ">
          <span
            className={`text-${alignText || 'center'}`}
            id="confirmModal-message"
            style={{ whiteSpace: 'pre-line', width: `100%` }}
          >
            {/* Valor inserido no useEffect */}
          </span>
        </Modal.Body>
      )}
      <Modal.Footer className="d-flex justify-content-center align-center flex-nowrap gap-3">
        <Button
          id="modalCancelButton"
          variant="danger"
          size="sm"
          className={`${
            cancelButton === 'none' && 'invisible'
          } flex-grow-1 m-0`}
          onClick={() => {
            actionCancel && actionCancel()
            onHide && onHide()
          }}
        >
          {cancelButton}
        </Button>
        <Button
          id="modalConfirmButton"
          variant="success"
          size="sm"
          className={`${confirmButton === 'none' && 'invisible'} flex-grow-1 m-0`}
          onClick={() => {
            actionConfirm && actionConfirm()
            onHide && onHide()
          }}
        >
          {confirmButton}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
