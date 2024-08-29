import { useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, FormGroup, InputGroup, Modal, Nav, Row, Tab } from 'react-bootstrap'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import { compareItems, encryptEmoji, modifyFontValues, scrollToElement } from '../../../../utils/wm-functions'
import { Dates } from '../../../Dates'
import Week, { WeekType } from '../../../../types/dates'
import { OverlaySpinner } from '../../../OverlaySpinner'
import Category, { CategoryType } from '../../../../types/category'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { HelpVideos } from '../../HelpVideos'
import PizzaProduct from '../../../../types/pizza-product'

interface CategoryProps {
  show: boolean
  handleClose: (category?: Category) => void
  type: 'create' | 'update'
  // categories: Category[];
  // category: Category;
  // setCategory: Dispatch<SetStateAction<Category | undefined>>;
}

export function CategoryModal({ show, handleClose, type }: CategoryProps) {
  const { data: session } = useSession()

  const { profile, plansCategory, handleShowToast, handleConfirmModal, modalFooterOpened } = useContext(AppContext)
  const { categories, setCategories: setMenuCategories, category: categoryMenu, setCategory: setCategoryMenu } = useContext(MenuContext)

  const [category, setCategory] = useState<Category>(new Category(categoryMenu))
  const [showSaveSpinner, setShowSaveSpinner] = useState<boolean>(false)
  const [week, setWeek] = useState<Week>(new Week(categoryMenu.options.week))

  const [invalidWeek, setInvalidWeek] = useState<boolean>(false)
  const [invalidName, setInvalidName] = useState<boolean>(false)
  const [pizzaProduct, setPizzaProduct] = useState<any | null>(null)
  const [] = useState()

  useEffect(() => {
    if (category.type === 'pizza' && category.product) {
      setPizzaProduct(category.product)
    }
  }, [category])

  const setCategoryInstance = (cat: CategoryType) => {
    setCategory(new Category(cat))
  }

  useEffect(() => {
    setCategoryInstance(categoryMenu)
    setWeek(new Week(categoryMenu.options.week))
  }, [categoryMenu])

  useEffect(() => {
    category.options.week = week
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week])

  const createOrUpdateCategory = async () => {
    setShowSaveSpinner(true)
    try {
      const categoryNameInput = document.querySelector(`#category${category.id}`) as HTMLInputElement

      if (!category.name?.length || category.name?.length < 3) {
        categoryNameInput.focus()
        setInvalidName(true)
        setShowSaveSpinner(false)
        return
      }

      const body = {
        ...category,
        name: encryptEmoji(category.name),
        amount: category.product?.amount,
        amount_alert: category.product?.amount_alert,
        bypass_amount: category.product?.bypass_amount,
        options: {
          week,
        },
        products: [],
      }

      if (type === 'create') {
        const categoryCreated = (await Category.API({
          type: 'CREATE',
          session,
          category,
          categories,
          setCategories: setMenuCategories,
        })) as Category
        scrollToElement(`#${categoryCreated.type}-${categoryCreated.id}`, {
          delay: 30,
        })
      } else {
        await Category.API({
          type: 'UPDATE',
          session,
          data: body,
          category: categoryMenu,
          categories,
          setCategories: setMenuCategories,
        })
      }

      setTimeout(() => {
        handleClose()
        handleShowToast({
          position: 'middle-center',
          type: 'success',
          title: 'Categoria',
          content: `${category.name} foi ${type === 'create' ? 'criada ' : 'atualizada'} com sucesso.`,
          show: true,
        })
      }, 5)
    } catch (e) {
      console.error(e)
      handleShowToast({
        position: 'middle-center',
        type: 'success',
        title: 'Categoria',
        content: `${category.name} foi ${type === 'create' ? 'criada ' : 'atualizada'} com sucesso.`,
        show: true,
      })
    } finally {
      setShowSaveSpinner(false)
    }
  }

  const deleteCategory = () => {
    setShowSaveSpinner(true)
    handleConfirmModal({
      actionConfirm: async () => {
        try {
          await Category.API({
            type: 'DELETE',
            session,
            category,
            categories,
            setCategories: setMenuCategories,
          })

          setCategoryMenu(Category.newCategory(profile))

          handleShowToast({
            show: true,
            type: 'success',
            title: 'Categoria',
            content: `${category.name}, foi excluída com sucesso.`,
          })
          handleClose()
        } catch (e) {
          console.error(e)
          handleShowToast({
            show: true,
            type: 'erro',
            title: 'Categoria',
            content: `Não foi possível excluír a categoria, ${category.name}.`,
          })
        }
      },
      actionCancel: () => {
        setShowSaveSpinner(false)
      },
      title: `Categoria (${category.type === 'default' ? 'Padrão' : 'Pizza'})`,
      message: `Excluir a categoria:
      ${category.name}
      ${
        category.type === 'default' ? `Quant. de produtos: ${category.products?.length} ` : `Quant. de Sabores: ${category.product?.flavors.length}`
      } ?`,
    })
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.altKey) {
          if (e.code === 'Enter') {
            if (!invalidWeek) {
              createOrUpdateCategory()
            } else {
              handleShowToast({
                title: 'Revise os Dados',
                type: 'alert',
              })
            }
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
        onEntering={(e) => setShowSaveSpinner(false)}
        onExit={() => {
          setInvalidName(false)
          setInvalidWeek(false)
          setCategoryMenu(Category.newCategory(profile))
          setShowSaveSpinner(false)
        }}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{type === 'create' ? 'Adicionar' : 'Editar'} Categoria</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tab.Container id="" defaultActiveKey="details">
            <Row>
              <Col sm={12}>
                <Nav variant="tabs" className="tab-nav-flex flex-row">
                  <Nav.Item>
                    <Nav.Link eventKey="details">Detalhes</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="disponibility">Disponibilidade</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  <Tab.Pane eventKey="details">
                    <Card className="mt-4">
                      {type === 'create' && (
                        <Card.Header className="d-flex justify-content-between">
                          <h4>Selecione o modelo da categoria</h4>
                          <HelpVideos.Trigger
                            urls={[
                              { src: 'https://www.youtube.com/embed/xuvRjBQYM4M', title: 'Açaí' },
                              { src: 'https://www.youtube.com/embed/WGaGvntV0i4', title: 'Hambúrgueres' },
                              { src: 'https://www.youtube.com/embed/vIXl7348zY8', title: 'Marmitex' },
                              { src: 'https://www.youtube.com/embed/ZFCIXM7V13M', title: 'Monte sua marmitex' },
                              { src: 'https://www.youtube.com/embed/4BiNHqHNCHU', title: 'Pizzas' },
                              { src: 'https://www.youtube.com/embed/mUrjKblUjYE', title: 'Combo pizzas' },
                            ]}
                          />
                        </Card.Header>
                      )}
                      <Card.Body>
                        <Container fluid className="px-0 mx-0">
                          {type === 'create' && (
                            <Row className="p-2 wm-default text-dark">
                              <Col sm="8" className="d-flex flex-column justify-content-between">
                                <h6 className="fs-7">
                                  <b></b>
                                </h6>
                                <div className="d-flex gap-4">
                                  <div className="d-flex gap-2 flex-row-reverse justify-content-end">
                                    <Form.Label className="d-flex gap-2">
                                      <Form.Check
                                        type="radio"
                                        id="default"
                                        name="categoryType"
                                        value="default"
                                        defaultChecked
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            type: e.target.value as 'default',
                                          })
                                        }}
                                      />
                                      Padrão
                                    </Form.Label>
                                  </div>
                                  <div className="d-flex gap-2 flex-row-reverse justify-content-end">
                                    <Form.Label className="d-flex gap-2">
                                      <Form.Check
                                        type="radio"
                                        id="pizza"
                                        name="categoryType"
                                        value="pizza"
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            type: e.target.value as 'pizza',
                                          })
                                        }}
                                      />
                                      Pizza
                                    </Form.Label>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          )}
                          <br />
                          <Form.Label>
                            <b className="text-uppercase">Nome da Categoria</b>
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              id={`category${category.id}`}
                              defaultValue={category.name}
                              isInvalid={!category.name.length ? invalidName : false}
                              onChange={(e) => {
                                setCategoryInstance({
                                  ...category,
                                  name: encryptEmoji(e.target.value),
                                })
                                if (invalidName) {
                                  setInvalidName(false)
                                }
                              }}
                              onKeyDown={(e) => modifyFontValues(e, { prop: category.name })}
                              maxLength={70}
                              autoFocus
                            />
                            <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                              Nome da categoria inválido
                            </Form.Control.Feedback>
                          </div>
                          <div className="d-flex justify-content-end">
                            <p className={category.name.length >= 70 ? 'text-red-500' : ''}>{category.name.length}/70 caracteres</p>
                          </div>
                          {profile.options.inventoryControl ? (
                            <Row>
                              {category.product && category.type === 'pizza' && (
                                <>
                                  <Col sm="4" className="my-2">
                                    <Form.Label>
                                      <b className="text-nowrap">Estoque</b>
                                    </Form.Label>
                                    <InputGroup className="position-relative">
                                      <Button
                                        variant="secondary"
                                        disabled={!!category.product.bypass_amount}
                                        onClick={() => {
                                          if (typeof category.product?.amount !== 'number') return
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({
                                              ...category.product!,
                                              amount: !category.product?.amount ? 0 : category.product?.amount - 1,
                                            }),
                                          })
                                        }}
                                      >
                                        -
                                      </Button>
                                      <Form.Control
                                        disabled={!!category.product.bypass_amount}
                                        value={category.product?.amount || 0}
                                        name="amount"
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({ ...category.product!, amount: Number(e.target.value) }),
                                          })
                                        }}
                                      />
                                      <Button
                                        variant="secondary"
                                        className="rounded-end"
                                        disabled={!!category.product.bypass_amount}
                                        style={{ minWidth: '34.75px' }}
                                        onClick={() => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({
                                              ...category.product!,
                                              amount: !category.product?.amount ? 1 : category.product.amount + 1,
                                            }),
                                          })
                                        }}
                                      >
                                        +
                                      </Button>
                                      <Form.Control.Feedback tooltip type="invalid">
                                        Por favor insira um valor válido!
                                      </Form.Control.Feedback>
                                    </InputGroup>
                                  </Col>
                                  <Col sm="4" className="my-2">
                                    <Form.Label>
                                      <b className="text-nowrap">Estoque Mínimo</b>
                                    </Form.Label>
                                    <InputGroup className="position-relative">
                                      <Button
                                        variant="secondary"
                                        disabled={!!category.product.bypass_amount}
                                        onClick={() => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({
                                              ...category.product!,
                                              amount_alert: !category.product?.amount_alert ? 0 : category.product?.amount_alert - 1,
                                            }),
                                          })
                                        }}
                                      >
                                        -
                                      </Button>
                                      <Form.Control
                                        value={category.product?.amount_alert || 0}
                                        disabled={!!category.product.bypass_amount}
                                        name="amount_alert"
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({ ...category.product!, amount_alert: Number(e.target.value) }),
                                          })
                                        }}
                                      />
                                      <Button
                                        variant="secondary"
                                        disabled={!!category.product.bypass_amount}
                                        className="rounded-end"
                                        style={{ minWidth: '34.75px' }}
                                        onClick={() => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({
                                              ...category.product!,
                                              amount_alert: !category.product?.amount_alert ? 1 : category.product.amount_alert + 1,
                                            }),
                                          })
                                        }}
                                      >
                                        +
                                      </Button>
                                      <Form.Control.Feedback tooltip type="invalid">
                                        Por favor insira um valor válido!
                                      </Form.Control.Feedback>
                                    </InputGroup>
                                  </Col>
                                  <Col sm="4" className="my-2 d-flex align-items-end">
                                    <FormGroup>
                                      <Form.Check
                                        type="switch"
                                        id="bypass_amount"
                                        name="bypass_amount"
                                        label="Sempre disponível"
                                        className="fs-6 text-nowrap"
                                        defaultChecked={!!category.product.bypass_amount}
                                        onClick={(e: any) => {
                                          setCategoryInstance({
                                            ...category,
                                            product: new PizzaProduct({ ...category.product!, bypass_amount: e.target.checked }),
                                          })
                                        }}
                                      />
                                    </FormGroup>
                                  </Col>
                                </>
                              )}
                            </Row>
                          ) : null}
                        </Container>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                  <Tab.Pane eventKey="disponibility">
                    <Card className="mt-4">
                      <Card.Body>
                        <Container fluid className="px-0 mx-0">
                          <Row className="text-dark">
                            <Col sm className="fs-7">
                              <h6 className="mb-4"></h6>
                              <div className="d-flex gap-3">
                                {plansCategory.includes('basic') && (
                                  <div className="d-flex flex-column align-items-center">
                                    <Form.Label className="text-center">
                                      Delivery
                                      <Form.Switch
                                        className="mt-2"
                                        defaultChecked={category.disponibility.store.delivery}
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            disponibility: {
                                              ...category.disponibility,
                                              store: {
                                                ...category.disponibility.store,
                                                delivery: e.target.checked,
                                              },
                                            },
                                          })
                                        }}
                                      />
                                    </Form.Label>
                                  </div>
                                )}
                                {plansCategory.includes('table') && (
                                  <div className="d-flex flex-column align-items-center">
                                    <Form.Label className="text-center">
                                      Mesa
                                      <Form.Switch
                                        className="mt-2"
                                        defaultChecked={category.disponibility.store.table}
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            disponibility: {
                                              ...category.disponibility,
                                              store: {
                                                ...category.disponibility.store,
                                                table: e.target.checked,
                                              },
                                            },
                                          })
                                        }}
                                      />
                                    </Form.Label>
                                  </div>
                                )}
                                {plansCategory.includes('package') && (
                                  <div className="d-flex flex-column align-items-center">
                                    <Form.Label className="text-center">
                                      Encomenda
                                      <Form.Switch
                                        className="mt-2"
                                        defaultChecked={category.disponibility.store.package}
                                        onChange={(e) => {
                                          setCategoryInstance({
                                            ...category,
                                            disponibility: {
                                              ...category.disponibility,
                                              store: {
                                                ...category.disponibility.store,
                                                package: e.target.checked,
                                              },
                                            },
                                          })
                                        }}
                                      />
                                    </Form.Label>
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Container>
                      </Card.Body>
                    </Card>
                    <Dates
                      type="menu"
                      title="Adicionar Horário de Disponibilidade"
                      week={week as Week}
                      setWeek={setWeek}
                      setInvalidWeek={setInvalidWeek}
                    />
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Modal.Body>
        <Modal.Footer
          className={`${type === 'update' ? 'justify-content-between' : undefined} position-relative ${
            modalFooterOpened ? 'show' : 'hidden'
          }-buttons-modal-footer`}
        >
          <ArrowModalFooter />
          <ActionsFooterButton
            type={type}
            disabledButtonSave={invalidName || invalidWeek}
            createOrUpdate={createOrUpdateCategory}
            deleteFunction={deleteCategory}
            handleClose={handleClose}
          />
        </Modal.Footer>
        <OverlaySpinner
          show={showSaveSpinner}
          width={100}
          weight={10}
          backgroundColor="transparent"
          backdropBlur={0.7}
          className="fs-2"
          textSpinner="Aguarde..."
        />
      </Modal>
    </div>
  )
}
