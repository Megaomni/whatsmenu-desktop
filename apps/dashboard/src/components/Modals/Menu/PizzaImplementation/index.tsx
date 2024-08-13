import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  InputGroup,
} from 'react-bootstrap'
import { BsFillPauseCircleFill } from 'react-icons/bs'
import PizzaProduct, {
  PizzaImplementationType,
} from '../../../../types/pizza-product'
import { encryptEmoji, mask } from '../../../../utils/wm-functions'
import Category from '../../../../types/category'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { useTranslation } from 'react-i18next'

interface PizzaImplementationProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
  implementation: PizzaImplementationType
  setImplementation: Dispatch<SetStateAction<PizzaImplementationType>>
  category: Category
  setCategory: Dispatch<SetStateAction<Category>>
}

export function PizzaImplementation(props: PizzaImplementationProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()

  const {
    handleShowToast,
    handleConfirmModal,
    modalFooterOpened,
    user,
    currency,
  } = useContext(AppContext)
  const { categories, setCategories } = useContext(MenuContext)

  const {
    show,
    handleClose,
    type,
    implementation,
    category,
    setCategory,
    setImplementation,
  } = props
  const [name, setName] = useState<string>(implementation.name || '')
  const [price, setPrice] = useState<string | number>(implementation.value || 0)

  const [nameInvalid, setNameInvalid] = useState(false)
  const [valueInvalid, setValueInvalid] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    setName(implementation.name)
    setPrice(Number(implementation.value))
  }, [implementation])

  const createOrUpdateImplementation = async () => {
    const body = {
      name: encryptEmoji(name),
      value: price.toString() || '0',
    }

    if (!name.length) {
      setNameInvalid(true)
      return
    }

    try {
      setShowSpinner(true)
      const { product } = category

      if (product) {
        await PizzaProduct.API({
          type: type.toUpperCase() as 'CREATE' | 'UPDATE',
          session,
          property: 'implementation',
          product,
          body,
          categories,
          setCategories,
          itemCode: implementation.code,
        })
      }

      handleShowToast({
        show: true,
        type: 'success',
        title: t('edges_doughs'),
        content: `${name}, ${type === 'create' ? t('created_successfully') : t('updated_successfully')}`,
      })

      handleClose()
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('edges_doughs'),
        content: `${name}, ${type === 'create' ? t('was_not_created') : t('was_not_updated')}`,
      })
    } finally {
      setShowSpinner(false)
    }
  }

  const deleteImplementation = async () => {
    const { product } = category
    try {
      handleConfirmModal({
        actionConfirm: async () => {
          if (product) {
            await PizzaProduct.API({
              type: 'DELETE',
              property: 'implementation',
              session,
              product,
              categories,
              setCategories,
              itemCode: implementation.code,
            })

            handleShowToast({
              show: true,
              type: 'success',
              title: t('edges_doughs'),
              content: `${implementation.name}, ${t('deleted_successfully')}`,
            })

            handleClose()
          }
        },
        title: t('edges_doughs'),
        message: `${t('you_really_want_delete')}, ${name}?`,
      })
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('edges_doughs'),
        content: `${t('could_not_delete')}, ${implementation.name}.`,
      })
    }
  }

  const pauseImplementation = async () => {
    const { product } = category
    try {
      if (product) {
        const newImplementation: any = await PizzaProduct.API({
          type: 'STATUS',
          property: 'implementation',
          session,
          product,
          categories,
          setCategories,
          itemCode: implementation.code,
        })

        if (newImplementation) {
          setImplementation(newImplementation)
        }

        handleShowToast({
          show: true,
          type: 'success',
          title: t('edges_doughs'),
          content: `${name}, ${implementation?.status ? t('resumed_successfully') : t('paused_successfully')}.`,
        })
      }
    } catch (e) {
      console.error(e)
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('edges_doughs'),
        content: `${t('could_not_pause')}, ${name}.`,
      })
    }
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.altKey) {
          if (e.code === 'Enter') {
            createOrUpdateImplementation()
          }
        }
      }}
    >
      <Modal
        show={show}
        onHide={handleClose}
        keyboard
        scrollable
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        onExited={() => {
          setNameInvalid(false)
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'create' ? t('add') : t('edit')} {t('edges_doughs')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          <Card className="mt-4">
            <Card.Body>
              <Container fluid className="mx-0 px-0">
                <Row className="text-dark">
                  <Col sm className="my-auto">
                    <Row>
                      <Col sm>
                        <Form.Label>
                          <b>{t('name')}</b>
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            value={name}
                            required
                            autoFocus
                            autoComplete="off"
                            isInvalid={nameInvalid}
                            maxLength={55}
                            onChange={(e) => {
                              if (nameInvalid) {
                                setNameInvalid(false)
                              }
                              setName(e.target.value)
                            }}
                          />
                          <Form.Control.Feedback tooltip type="invalid">
                            {t('please_valid_name')}!
                          </Form.Control.Feedback>
                        </div>
                        <div className="d-flex justify-content-end">
                          <p
                            className={name.length >= 55 ? 'text-red-500' : ''}
                          >
                            {name.length}
                            /55 {t('characters')}
                          </p>
                        </div>
                      </Col>
                      <Col sm className="mb-md-0 mb-2">
                        <Form.Label>
                          <b>{t('price')}</b>
                        </Form.Label>
                        <InputGroup className="position-relative">
                          <InputGroup.Text>
                            {currency({ value: 0, symbol: true })}
                          </InputGroup.Text>
                          <Form.Control
                            value={price}
                            required
                            maxLength={12}
                            isInvalid={valueInvalid}
                            onBlur={(e) => {
                              setValueInvalid(!e.target.value.length)
                            }}
                            onFocus={() => {
                              setValueInvalid(false)
                            }}
                            onChange={(e) => {
                              mask(e, 'currency', 10)
                              setPrice(e.target.value)
                            }}
                          />
                          <Form.Control.Feedback tooltip type="invalid">
                            {t('enter_valid_value')}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col sm className="d-flex flex-column">
                        {type !== 'create' && (
                          <div className="wm-default-border-none text-dark px-3 py-5">
                            <Row className="align-items-center">
                              <Col sm className="d-flex">
                                <Button
                                  variant="outline-orange"
                                  className="flex-grow-1 mb-3"
                                  onClick={pauseImplementation}
                                >
                                  <BsFillPauseCircleFill size={20} />
                                  <span>
                                    {!implementation?.status
                                      ? t('resume_sales')
                                      : t('pause_sales')}
                                  </span>
                                </Button>
                              </Col>
                              <Col sm className="text-600 fs-8 mb-3">
                                {t('to_pause_sale_message')}
                              </Col>
                            </Row>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Container>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer
          className={`${type === 'update' ? 'justify-content-between' : undefined} position-relative ${
            modalFooterOpened ? 'show' : 'hidden'
          }-buttons-modal-footer`}
        >
          <ArrowModalFooter />
          <ActionsFooterButton
            type={type}
            disabledButtonSave={nameInvalid}
            createOrUpdate={createOrUpdateImplementation}
            deleteFunction={deleteImplementation}
            handleClose={handleClose}
          />
        </Modal.Footer>
        <OverlaySpinner show={showSpinner} />
      </Modal>
    </div>
  )
}
