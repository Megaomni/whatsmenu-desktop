import { Modal, ProgressBar } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

interface SheetExportModalProps {
  show: boolean
  page: number
  lastPage: number
  onExited: () => void
}

export function SheetExportModal(props: SheetExportModalProps) {
  const { t } = useTranslation()
  let { show, onExited, page, lastPage } = props

  return (
    <Modal show={show} onExited={onExited} keyboard={false} size="sm" centered backdrop="static">
      <Modal.Body className="d-flex flex-column flex-nowrap justify-content-center align-center gap-3 ">
        <p className="text-center">{t('loading_orders')}</p>
        <ProgressBar striped variant="success" now={(page * 100) / lastPage} className="w-100" />
      </Modal.Body>
    </Modal>
  )
}
