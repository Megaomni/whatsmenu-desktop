import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useContext, useEffect, useState } from 'react'
import { Accordion, Button, Card, Col, Form, FormControl, InputGroup, Modal, Row } from 'react-bootstrap'
import { Title } from '../../../components/Partials/title'
import { AppContext } from '../../../context/app.ctx'
import { Plan, SystemProduct } from '../../../types/plan'
import { apiRoute, copy, hash, inputFocus, mask } from '../../../utils/wm-functions'
import i18n from 'i18n'

export default function Products({ plans, products }: { plans: Plan[]; products: SystemProduct[] }) {
  const { data: session } = useSession()

  const { handleShowToast, handleConfirmModal, currency } = useContext(AppContext)

  const [modalConfig, setModalConfig] = useState<{
    show: boolean
    gateway?: 'stripe'
    type: 'create' | 'update' | 'none'
    category: 'plans' | 'products' | 'none'
    period?: string
    plan?: {
      id: number
      category: string
      type: 'register' | 'upgrade'
      name: string
    }
    recurring?: {
      interval: 'month' | 'year'
    }
    product?: {
      id?: number
      status: boolean
      name: string
      description: string
      service?: string
      default_price?: string
      operations: {
        originalValue?: string | number
        gateways?: {
          [key: string]: {
            id: string
            status: 0 | 1
          }
        }
        prices: {
          id?: string
          new?: boolean
          default_currency: string
          gateways?: {
            [key: string]: {
              id: string
              status: 0 | 1
            }
          }
          currencies: {
            [key: string]: {
              unit_amount: number
            }
          }
        }[]
      }
    }
  }>({
    show: false,
    type: 'none',
    category: 'none',
  })

  const getRecurringType = (interval: string) => {
    switch (interval) {
      case 'year':
        return 'Anual'
      case 'month':
      default:
        return 'Mensal'
    }
  }
  const createOrUpdate = async () => {
    try {
      if (modalConfig.product && modalConfig.product.name.length) {
        if (!modalConfig.product.service && modalConfig.category === 'products') {
          handleShowToast({
            title: 'Criação de Produto',
            content: 'É necessário escolher um tipo de serviço para o produto.',
          })
          return
        }

        if (modalConfig.product && modalConfig.type !== 'none') {
          modalConfig.product?.operations.prices.forEach((price) => {
            delete price.new
          })
          const gateway = modalConfig.gateway ?? 'stripe'

          const {
            data: { systemProduct: data },
          } = await apiRoute(`/adm/system/products`, session, modalConfig.type === 'create' ? 'POST' : 'PATCH', {
            gateway,
            period: modalConfig.period,
            plan: modalConfig.plan,
            product: {
              ...modalConfig.product,
            },
            recurring: modalConfig.recurring,
          })

          if (modalConfig.type === 'create') {
            products.push(data)
          } else {
            products.forEach((pr) => {
              if (pr.id === data.id) {
                pr.name = data.name
                pr.description = data.description
                pr.default_price = data.default_price
                pr.operations = data.operations
              }
            })
          }

          handleShowToast({
            show: true,
            title: modalConfig.category === 'plans' ? 'Planos' : 'Produtos',
            content: `${modalConfig.category === 'plans' ? 'Planos' : 'Produtos'} ${
              modalConfig.type === 'create' ? 'criados' : 'atualizados'
            } com sucesso.`,
            type: 'success',
          })

          setModalConfig({
            show: false,
            category: 'none',
            type: 'none',
          })
        }
      } else {
        handleShowToast({
          title: 'Atenção!!',
          content: 'Necessário colocar um nome no produto.',
        })
      }
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        title: modalConfig.category === 'plans' ? 'Planos' : 'Produtos',
        content: `${modalConfig.category === 'plans' ? 'Planos' : 'Produtos'} não foram ${
          modalConfig.type === 'create' ? 'criados' : 'atualizados'
        }.`,
        type: 'erro',
      })
    }
  }
  const deleteProductOrPlanStripe = (productId: number, period?: string) => {
    handleConfirmModal({
      title: 'Excluir Produtos',
      actionConfirm: async () => {
        const itemName = period ? 'Planos' : 'Produtos'

        try {
          const { data } = await apiRoute(`/adm/system/products/${productId}`, session, 'DELETE', {
            period,
          })
          products.forEach((pr, index, arr) => {
            if (pr.id === productId) {
              delete arr[index]
            }
          })

          handleShowToast({
            type: 'success',
            title: itemName,
            content: 'Produto deletado com sucesso',
          })
        } catch (error) {
          console.error(error)
          handleShowToast({
            type: 'erro',
            title: itemName,
            content: 'Não foi possível deletar o produto',
          })
        }
      },
    })
  }

  return (
    <>
      <Row>
        <Col sm>
          <Title title="ADM" componentTitle="Gestão de Produtos" className="mb-4" child={['products']} />
        </Col>
      </Row>

      <Row className="mt-3">
        <Col className="p-0">
          <Card>
            <Card.Header>
              <h3>Planos</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>Nome</Col>
                <Col md={2}>Tipo</Col>
                <Col md={2}>Categoria</Col>
                <Col md={2}>Status</Col>
              </Row>
              {plans?.map((plan: Plan) => {
                return (
                  <Accordion key={plan.name + plan.id} className="border mb-1">
                    <Accordion.Header className="fs-5">
                      <Row className="w-100">
                        <Col md={2}>
                          <span>
                            {plan.id} - {plan.name}
                          </span>
                        </Col>
                        <Col md={2}>
                          <span>{plan.type === 'register' ? 'Normal' : 'Desconto'}</span>
                        </Col>
                        <Col md={2}>
                          <span>{plan.category === 'basic' ? 'Básico' : plan.category === 'table' ? 'Mesas' : 'Encomendas'}</span>
                        </Col>
                        <Col md={2}>
                          <span style={{ color: plan.status ? '' : 'red' }}>{plan.status ? 'Ativo' : 'Inativo'}</span>
                        </Col>
                      </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        {[
                          {
                            name: 'Mensal',
                            period: 'monthly',
                            abbr: 'month',
                          },
                          {
                            name: 'Anual',
                            period: 'yearly',
                            abbr: 'year',
                          },
                        ].map((item, index, arr) => {
                          const planProduct = products.find((prod) => {
                            return prod && prod.status && prod.plan_id === plan.id && prod.operations.type === item.period
                          })
                          if (planProduct) {
                            return (
                              <Col key={item.period} sm={12 / arr.length} className={`d-flex flex-column ${index > 0 ? 'border-start' : ''}`}>
                                <h5>{item.name}</h5>
                                <div className="">
                                  <div className="ps-2">
                                    {planProduct && (
                                      <Row>
                                        {planProduct.operations.prices.map((price, index, prices) => {
                                          return (
                                            <Col sm={12} key={price.id}>
                                              <Row className="d-flex gap-2 justify-content-between">
                                                <Col>
                                                  <span className="fs-7 my-1 d-block">{price.id}</span>
                                                </Col>
                                              </Row>
                                              {Object.entries(price.currencies).map((currencyMoney, index) => {
                                                return (
                                                  <Row key={currencyMoney[0] + index}>
                                                    <Col>
                                                      <p className="m-0 fs-7">
                                                        Moeda <span className="fw-bold">{currencyMoney[0].toUpperCase()}</span> -{' '}
                                                        {currency({ value: currencyMoney[1].unit_amount / 100 })}
                                                      </p>
                                                    </Col>
                                                  </Row>
                                                )
                                              })}
                                              {index + 1 < prices.length && <hr />}
                                            </Col>
                                          )
                                        })}
                                        <Col sm="12" className="pt-4">
                                          <div className="mt-auto  justify-content-between  d-flex gap-2">
                                            <Button size="sm" variant="danger" onClick={() => deleteProductOrPlanStripe(planProduct.id, item.period)}>
                                              Excluir
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                setModalConfig({
                                                  show: true,
                                                  type: 'update',
                                                  category: 'plans',
                                                  plan: {
                                                    id: plan.id,
                                                    category: plan.category,
                                                    type: plan.type,
                                                    name: plan.name,
                                                  },
                                                  period: item.period,
                                                  recurring: {
                                                    interval: item.abbr as 'month' | 'year',
                                                  },
                                                  product: copy(planProduct, 'copy'),
                                                })
                                              }}
                                            >
                                              {i18n.t('edit')}
                                            </Button>
                                          </div>
                                        </Col>
                                      </Row>
                                    )}
                                  </div>
                                  {}
                                </div>
                              </Col>
                            )
                          } else {
                            return (
                              <Col key={item.period} className={`ms-2 ${index > 0 ? 'border-start' : ''}`}>
                                <h5>{item.name}</h5>
                                <Button
                                  size="sm"
                                  className="mt-auto"
                                  onClick={() => {
                                    const price_id = hash(15)
                                    setModalConfig({
                                      show: true,
                                      type: 'create',
                                      category: 'plans',
                                      plan: {
                                        id: plan.id,
                                        category: plan.category,
                                        type: plan.type,
                                        name: plan.name,
                                      },
                                      recurring: {
                                        interval: item.abbr as 'month' | 'year',
                                      },
                                      period: item.period,
                                      product: {
                                        name: '',
                                        description: '',
                                        status: true,
                                        default_price: price_id,
                                        operations: {
                                          originalValue: plan[item.period],
                                          prices: [
                                            {
                                              id: price_id,
                                              new: true,
                                              default_currency: 'brl',
                                              currencies: {
                                                ['brl']: {
                                                  unit_amount: 0,
                                                },
                                                ['eur']: {
                                                  unit_amount: 0,
                                                },
                                                ['usd']: {
                                                  unit_amount: 0,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    })
                                  }}
                                >
                                  Adicionar Produto{' '}
                                </Button>
                              </Col>
                            )
                          }
                        })}
                      </Row>
                    </Accordion.Body>
                  </Accordion>
                )
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col className="p-0">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between flex-grow-1">
                <h3>Produtos e Serviços</h3>
                <Button
                  onClick={() => {
                    const price_id = hash(15)
                    setModalConfig({
                      show: true,
                      type: 'create',
                      category: 'products',
                      product: {
                        name: '',
                        description: '',
                        status: true,
                        default_price: price_id,
                        operations: {
                          prices: [
                            {
                              id: price_id,
                              new: true,
                              default_currency: 'brl',
                              currencies: {
                                ['brl']: {
                                  unit_amount: 0,
                                },
                                ['eur']: {
                                  unit_amount: 0,
                                },
                                ['usd']: {
                                  unit_amount: 0,
                                },
                              },
                            },
                          ],
                        },
                      },
                    })
                  }}
                >
                  Adicionar Produto
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {products
                .filter((prod) => prod.service !== 'plan')
                .map((systemProduct) => {
                  return (
                    <Accordion key={systemProduct.default_price} className="border mb-1">
                      <Accordion.Header>
                        <Row className="flex-grow-1 fs-4">
                          <Col sm={3}>{systemProduct.name}</Col>
                        </Row>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {systemProduct.description && <Col sm={12}>{systemProduct.description}</Col>}

                          {systemProduct.operations.prices.map((price, index, arrPrice) => {
                            return (
                              <Col sm={3} className="fs-6" key={`${price.id}`}>
                                <Row>
                                  <Col sm={12} key={price.id} className={`ps - 4 mb - 2 ${index > 0 ? 'border-start' : ''} `}>
                                    {/* <div>
                                                                          <p className="fw-bold m-0 fs-6">{price.id}</p>
                                                                      </div> */}
                                    {Object.entries(price.currencies).map((currencyType) => {
                                      const currencyName = currencyType[0]
                                      const currency_amout = currencyType[1].unit_amount
                                      return (
                                        <div key={`${price.id}-${currencyName}`}>
                                          <p className="m-0 fs-7">
                                            Moeda <span className="fw-bold">{currencyName.toUpperCase()}</span>:{' '}
                                            {currency({ value: currency_amout / 100 })}
                                          </p>
                                        </div>
                                      )
                                    })}
                                  </Col>
                                </Row>
                              </Col>
                            )
                          })}
                        </Row>
                        <Row className="mt-1">
                          <Col className="d-flex gap-2 align-items-center justify-content-end mb-2">
                            <div className="d-flex gap-3">
                              <Button size="sm" variant="danger" onClick={() => deleteProductOrPlanStripe(systemProduct.id)}>
                                Excluir
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setModalConfig({
                                    show: true,
                                    category: 'products',
                                    type: 'update',
                                    product: {
                                      id: systemProduct.id,
                                      name: systemProduct.name,
                                      description: systemProduct.description,
                                      default_price: systemProduct.default_price,
                                      status: systemProduct.status,
                                      // images: product.images,
                                      service: systemProduct.service,
                                      operations: {
                                        prices: systemProduct.operations.prices,
                                        gateways: systemProduct.operations.gateways,
                                      },
                                    },
                                  })
                                }}
                              >
                                {i18n.t('edit')}
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Accordion.Body>
                    </Accordion>
                  )
                })}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Modal
        show={modalConfig.show}
        onHide={() => setModalConfig({ show: false, type: 'none', category: 'none' })}
        dialogClassName="modal-100h modal-0-my modal-dialog-100-h"
      >
        <Modal.Header closeButton>
          {modalConfig.type === 'create' ? 'Criando' : modalConfig.type === 'update' ? 'Atualizando' : ''} Produto{' '}
          {modalConfig.plan?.name ? modalConfig.plan.name : ''}{' '}
          <span className="fw-bold ms-1">
            {' '}
            {modalConfig.category === 'plans' ? `- Plano ${getRecurringType(modalConfig.recurring?.interval ?? '')} ` : ''}
          </span>
        </Modal.Header>
        <Modal.Body className="overflow-auto modal-system-products">
          <Row>
            {/* {
                          modalConfig.type === 'update' &&
                          <Col sm="12">
                              <h6>ID: {modalConfig.product?.id}</h6>
                          </Col>
                      } */}
            <Col sm="12">
              {modalConfig.product?.operations.gateways &&
                Object.entries(modalConfig.product.operations.gateways).map((gat, index, arr) => {
                  const name = gat[0]
                    .split('')
                    .map((lr, index) => (index === 0 ? lr.toUpperCase() : lr))
                    .join('')

                  return (
                    <div key={name + index}>
                      <div className="d-flex gap-2 align-items-center" key={name}>
                        <h6 className="m-0">Gateway {name} ID: </h6>
                        <p className="fw-bold m-0 fs-6">{gat[1].id}</p>
                      </div>
                      {arr.length - index === 1 && <hr />}
                    </div>
                  )
                })}
            </Col>
            <Col sm="12">
              <Form.Label>
                Nome<sup style={{ color: 'red' }}>*</sup>
              </Form.Label>
              <FormControl
                defaultValue={modalConfig.product?.name}
                placeholder={`Ex: Plano Delivery Anual, Impressora`}
                onChange={(e) => {
                  if (modalConfig.product) {
                    setModalConfig({
                      ...modalConfig,
                      product: {
                        ...modalConfig.product,
                        name: e.target.value,
                      },
                    })
                  }
                }}
              />
            </Col>
            <Col sm="12" className="mt-2">
              <Form.Label>Descrição</Form.Label>
              <FormControl
                defaultValue={modalConfig.product?.description}
                placeholder="Ex: Plano com desconto"
                onChange={(e) => {
                  if (modalConfig.product) {
                    setModalConfig({
                      ...modalConfig,
                      product: {
                        ...modalConfig.product,
                        description: e.target.value,
                      },
                    })
                  }
                }}
              />
            </Col>
          </Row>
          {modalConfig.category === 'products' && (
            <Row className="mt-2">
              <Col>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  defaultValue={modalConfig.product?.service}
                  disabled={modalConfig.type === 'update'}
                  onChange={(e) => {
                    if (modalConfig.product) {
                      setModalConfig({
                        ...modalConfig,
                        product: {
                          ...modalConfig.product,
                          service: e.target.value,
                        },
                      })
                    }
                  }}
                >
                  <option disabled {...(modalConfig.product?.service ? {} : { selected: true })}>
                    Selecione uma opção
                  </option>
                  {[
                    {
                      value: 'printer',
                      name: 'Impressora',
                    },
                    {
                      value: 'menu',
                      name: 'Cardápio',
                    },
                  ].map((item) => {
                    return (
                      <option key={item.value} value={item.value}>
                        {item.name}
                      </option>
                    )
                  })}
                </Form.Select>
              </Col>
            </Row>
          )}
          <Row className="mt-5">
            <Col sm={12} className="d-flex align-items-center justify-content-between">
              <h5 className="m-0">Preços</h5>
              <Button
                size="sm"
                onClick={() => {
                  if (modalConfig.product) {
                    let id: any
                    while (!id) {
                      const newId = hash(15)
                      if (!modalConfig.product.operations.prices.some((pr) => pr.id === newId)) {
                        id = newId
                      }
                    }

                    setModalConfig({
                      ...modalConfig,
                      product: {
                        ...modalConfig.product,
                        operations: {
                          prices: [
                            {
                              id,
                              new: true,
                              default_currency: 'brl',
                              currencies: {
                                ['brl']: {
                                  unit_amount: 0,
                                },
                                ['eur']: {
                                  unit_amount: 0,
                                },
                                ['usd']: {
                                  unit_amount: 0,
                                },
                              },
                            },
                            ...modalConfig.product.operations.prices,
                          ],
                        },
                      },
                    })

                    setTimeout(() => {
                      inputFocus(`#brl-${id}`, { selectText: true, queryParentElement: '.modal-system-products' })
                    }, 100)
                  }
                }}
              >
                Novo Preço
              </Button>
            </Col>
            <Col>
              {modalConfig.product?.operations.prices.map((price, index, prices) => {
                return (
                  <div key={price.id}>
                    <hr />
                    <div>
                      <Row className="my-1 align-items-center mb-2">
                        <Col sm={7}>
                          <span className="fs-7 d-block">ID: {price.id}</span>
                        </Col>
                        <Col sm={5} className="d-flex justify-content-end gap-2 align-items-center">
                          <label className="text-nowrap" title="Moeda padrão do preço, é a moeda que será cobrada se nenhuma for encontrada.">
                            Padrão :
                          </label>
                          <Form.Select
                            disabled={modalConfig.type === 'update' && !price.new}
                            defaultValue={price.default_currency}
                            onChange={(e) => {
                              if (modalConfig.product) {
                                const newPrices = prices.map((pr) => {
                                  if (pr.id === price.id) {
                                    pr.default_currency = e.target.value
                                  }

                                  return pr
                                })

                                setModalConfig({
                                  ...modalConfig,
                                  product: {
                                    ...modalConfig.product,
                                    operations: {
                                      ...modalConfig.product.operations,
                                      prices: newPrices,
                                    },
                                  },
                                })
                              }
                            }}
                          >
                            {Object.entries(price.currencies).map((currency, index) => {
                              return (
                                <option key={currency[0] + index} value={currency[0]}>
                                  {currency[0].toUpperCase()}
                                </option>
                              )
                            })}
                          </Form.Select>
                        </Col>
                      </Row>

                      {['brl', 'eur', 'usd'].map((currencyType, index, arrCurrency) => {
                        return (
                          <Row className="mb-2 align-items-center" key={currencyType[0] + index}>
                            <Col sm={3}>
                              <p className="m-0" style={{ whiteSpace: 'nowrap' }}>
                                Moeda <span className="fw-bold">{currencyType.toUpperCase()}</span>:{' '}
                              </p>
                            </Col>
                            <Col>
                              <div>
                                <InputGroup>
                                  <InputGroup.Text style={{ width: 60 }}>{currency({ value: 0, symbol: true })}</InputGroup.Text>
                                  <FormControl
                                    id={`${currencyType}-${price.id}`}
                                    className={modalConfig.type === 'update' && !price.new ? 'not-allowed' : ''}
                                    disabled={modalConfig.type === 'update' && !price.new}
                                    defaultValue={currency({ value: price.currencies[currencyType]?.unit_amount / 100, withoutSymbol: true })}
                                    onChange={(e) => {
                                      mask(e, 'currency')
                                      if (price.currencies[currencyType]) {
                                        price.currencies[currencyType].unit_amount = Number(e.target.value.replace(/\D+/, ''))
                                      } else {
                                        price.currencies[currencyType] = {
                                          unit_amount: Number(e.target.value.replace(/\D+/, '')),
                                        }
                                      }
                                    }}
                                  />
                                  {/* <InputGroup.Text
                                                                          className="text-center bg-white cursor-pointer"
                                                                          onClick={() => {
                                                                              if (price.default_currency !== currencyType && modalConfig.product && price.new) {
                                                                                  const newPrices = prices.map(pr => {
                                                                                      if (pr.id === price.id) {
                                                                                          const disabled = !pr.currencies[currencyType].disable;
                                                                                          pr.currencies[currencyType].disable = undo ? false : !pr.currencies[currencyType].disable;
                                                                                      }

                                                                                      return pr;
                                                                                  })
                                                                                  setModalConfig({
                                                                                      ...modalConfig,
                                                                                      product: {
                                                                                          ...modalConfig.product,
                                                                                          prices: newPrices
                                                                                      }
                                                                                  })
                                                                              }
                                                                          }}
                                                                      >
                                                                          {
                                                                              price.currencies[currencyType].disable && price.new ?
                                                                                  <FaUndo color="green" /> :
                                                                                  <BsFillTrashFill color={`${ lengthDisabled === 2 || price.default_currency === currencyType || (modalConfig.type === 'update' && !price.new) ? 'gray' : 'red' } `} />

                                                                          }
                                                                      </InputGroup.Text> */}
                                </InputGroup>
                                {/* </Col> */}
                              </div>
                            </Col>
                          </Row>
                        )
                      })}
                      <Row>
                        {
                          <Col className="d-flex justify-content-between align-items-center gap-2">
                            <Button
                              variant={`${modalConfig.product?.default_price === price.id ? 'outline-orange' : 'orange'} `}
                              size="sm"
                              className="p-1"
                              style={{ height: 25 }}
                              onClick={() => {
                                if (modalConfig.product) {
                                  setModalConfig({
                                    ...modalConfig,
                                    product: {
                                      ...modalConfig.product,
                                      default_price: price.id,
                                    },
                                  })
                                }
                              }}
                            >
                              Definir como preço padrão
                            </Button>
                            {!price.new && prices.length > 1 && modalConfig.product?.default_price !== price.id && (
                              <Button
                                className="p-1 ms-auto"
                                style={{ height: 25 }}
                                onClick={() => {
                                  const newPrices = prices.filter((pr) => pr.id !== price.id)
                                  if (modalConfig.product) {
                                    setModalConfig({
                                      ...modalConfig,
                                      product: {
                                        ...modalConfig.product,
                                        operations: {
                                          ...modalConfig.product.operations,
                                          prices: newPrices,
                                        },
                                      },
                                    })
                                  }
                                }}
                              >
                                Remover
                              </Button>
                            )}
                          </Col>
                        }
                      </Row>
                    </div>
                  </div>
                )
              })}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button
            variant="danger"
            disabled={!modalConfig.product?.operations.prices.length}
            onClick={() => setModalConfig({ category: 'none', type: 'none', show: false })}
          >
            Cancelar
          </Button>
          <Button disabled={!modalConfig.product?.operations.prices.length} onClick={createOrUpdate}>
            Finalizar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const { data: plans } = await apiRoute('/dashboard/flexPlans', session)
  const { data: products } = await apiRoute('/api/v2/systemProducts', session)
  return {
    props: {
      plans,
      products,
    },
  }
}
