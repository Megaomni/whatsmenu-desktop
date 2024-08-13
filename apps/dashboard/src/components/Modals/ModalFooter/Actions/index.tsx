import { useContext } from 'react'
import { Button, Col, OverlayTrigger, Row, Tooltip } from 'react-bootstrap'
import { AppContext } from '../../../../context/app.ctx'
import { useTranslation } from 'react-i18next'

type ActionsProp = {
  deleteFunction?: () => void
  handleClose?: () => void
  createOrUpdate?: (e: any) => Promise<void>
  type: 'create' | 'update'
  disabledButtonSave: boolean
  invalid?: boolean
}
export function ActionsFooterButton({
  deleteFunction,
  handleClose,
  createOrUpdate,
  type,
  disabledButtonSave,
  invalid,
}: ActionsProp) {
  const { t } = useTranslation()
  const { handleShowToast } = useContext(AppContext)

  return (
    <Row className="flex-grow-1 flex-column-reverse flex-md-row">
      {type === 'update' && (
        <Col sm="12" md className="d-flex">
          {deleteFunction && (
            <Button
              variant="outline-danger"
              className="flex-grow-1 flex-md-grow-0"
              onClick={deleteFunction}
            >
              {t('delete')}
            </Button>
          )}
        </Col>
      )}
      <Col
        sm="12"
        md
        className="d-flex flex-column flex-md-row my-md-0 justify-content-end my-2 gap-2"
      >
        {handleClose && (
          <Button
            variant="danger"
            className="order-md-0 order-1"
            onClick={() => handleClose()}
          >
            {t('cancel')}
          </Button>
        )}

        {createOrUpdate && (
          <Button
            variant="success"
            className="order px-4"
            type="submit"
            form="form-size"
            disabled={disabledButtonSave}
            onClick={(e) => {
              if (disabledButtonSave) {
                handleShowToast({
                  title: t('review'),
                  type: 'alert',
                  content: t('please_review_data'),
                })
              } else {
                createOrUpdate(e)
              }
            }}
          >
            {type === 'create' ? t('create') : t('save')}
          </Button>
        )}
      </Col>
    </Row>
  )
}
