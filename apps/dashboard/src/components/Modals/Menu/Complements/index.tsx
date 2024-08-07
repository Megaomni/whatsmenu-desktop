import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { Button, ButtonGroup, Card, Col, Form, InputGroup, OverlayTrigger, Popover, Row } from 'react-bootstrap'
import { FaSyncAlt } from 'react-icons/fa'
import { RiErrorWarningFill } from 'react-icons/ri'
import { MenuContext } from '../../../../context/menu.ctx'
import { compareItems, currency, encryptEmoji, hash, inputFocus, mask, modifyFontValues, verifyEmptyNameLength } from '../../../../utils/wm-functions'
import Complement, { ComplementType, ItemComplementType } from '../../../../types/complements'
import { AppContext } from '../../../../context/app.ctx'
import { HelpVideos } from '../../HelpVideos'
import { useSession } from 'next-auth/react'

type ComplementProps = {
  complements: Complement[]
  recicled?: { id?: number; link?: boolean }[]
  saveComplements: (...props: any[]) => void
  saveRecicledComplements?: (...props: any[]) => void
  saveRemovedComplements?: (...props: any[]) => void
  showVinculateComplement?: boolean
  typeModal: 'massive' | 'product'
  autoFocusElement?: number
  invalidComplement?: boolean
  complementType: 'default' | 'pizza'
}
export function ComponentComplement({
  complements: complementsProps,
  recicled,
  saveComplements,
  saveRecicledComplements,
  saveRemovedComplements,
  typeModal,
  showVinculateComplement,
  invalidComplement,
  complementType,
  autoFocusElement,
}: ComplementProps) {
  const { data: session } = useSession()
  const { handleConfirmModal, profile } = useContext(AppContext)
  const { productComplements, pizzaComplements, products, category, categories, setFocusId } = useContext(MenuContext)

  const [complements, setComplements] = useState<Complement[]>(complementsProps)
  const [recicledComplements, setRecicledComplements] = useState<{ id?: number; link?: boolean }[]>(recicled || [])
  const [removeComplements, setRemoveComplements] = useState<number[]>([])

  const [invalidComplementName, setInvalidComplementName] = useState<boolean>(false)
  const [updateHTML, setUpdateHTML] = useState(0)

  // COMPLEMENTS SET ID
  const [filteredComplementsSet, setFilteredComplementsSet] = useState<number[]>([])

  let allComplements = complementType === 'default' ? productComplements : pizzaComplements

  useEffect(() => {
    setComplements(complementsProps)
  }, [complementsProps])

  useEffect(() => {
    setInvalidComplementName(!!invalidComplement)
  }, [invalidComplement])

  useEffect(() => {
    if (!compareItems(complementsProps, complements)) {
      complements.forEach((complement) => {
        if (complement.min > complement.max) {
          complement.min = complement.max
        } else if (complement.min < 1) {
          complement.min = 1
        }

        if (complement.max < complement.min) {
          complement.max = complement.min
        } else if (complement.max < 1) {
          complement.max = 1
        }
      })

      saveComplements && saveComplements([...complements])
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complements, saveComplements])

  useEffect(() => {
    saveRecicledComplements && saveRecicledComplements([...recicledComplements])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recicledComplements])

  useEffect(() => {
    saveRemovedComplements && saveRemovedComplements([...removeComplements])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeComplements])

  useEffect(() => {
    const setComplements = new Set()
    allComplements?.forEach((complement) => {
      if (complement.id && !removeComplements.includes(complement.id)) {
        setComplements.add(complement.id)
      }
    })

    setFilteredComplementsSet(Array.from(setComplements) as number[])
  }, [allComplements, removeComplements])

  useEffect(() => {
    if (!showVinculateComplement) {
      complements.forEach((comp) => {
        if (comp.vinculate) {
          comp.vinculate.link = false
        }
      })
    }
  }, [showVinculateComplement, complements])

  useEffect(() => {
    if (autoFocusElement) {
      const complementRef = document.getElementById(`complement-${autoFocusElement}`)
      const arrayIndex = complements.findIndex((c) => c.id === autoFocusElement)
      const input = document.getElementById(`complement-name-${autoFocusElement}`)

      if (complementRef && arrayIndex) {
        complementRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      input?.focus()
      setFocusId(undefined)
    }
  }, [autoFocusElement, complements, setFocusId])
  const handleAddComplementCategory = (type: 'default' | 'recicle' = 'default', id?: number) => {
    if (type === 'default') {
      if (
        verifyEmptyNameLength(complements, 'id', {
          partialQuery: `#complement-name-`,
          queryParentElement: `#create-product-modal`,
          differTop: 200,
        }) ||
        verifyEmptyNameLength(
          complements.flatMap((comp) => comp.itens.flat()),
          'code',
          {
            partialQuery: `#complement-item-`,
            queryParentElement: `#create-product-modal`,
            differTop: -250,
          }
        )
      ) {
        setInvalidComplementName(true)
        return
      }

      const prodComplements: Complement[] = []
      let complementId: number
      let complementToAdd: Complement | null = null

      if (!id) {
        complementToAdd = new Complement({
          id: parseInt(String(Math.random() * (100 - 1) + 1)),
          name: '',
          type: complementType,
          order: complements.length || 0,
          min: 0,
          max: 1,
          required: false,
          itens: [],
        })

        if (typeModal === 'massive') {
          complementToAdd.vinculate = {
            link: false,
            code: hash(10),
          }
        }
        complementId = complementToAdd.id as number
      } else {
        const complement = allComplements.find((compl) => compl.id === id)

        if (complement) {
          complementToAdd = new Complement({
            id: parseInt(String(Math.random() * (100 - 1) + 1)),
            name: complement.name,
            type: complementType,
            order: complements.length + 1 || 0,
            min: complement.min,
            max: complement.max,
            required: complement.required,
            itens: complement.itens,
          })

          complementId = complementToAdd.id as number
        }
      }

      if (complementToAdd) {
        prodComplements.push(complementToAdd)
        setComplements([...complements, ...prodComplements])

        setTimeout(() => {
          const input = document.getElementById(`complement-name-${complementId}`)

          if (input) {
            input.focus()
          }
        }, 20)
      }
    } else {
      if (allComplements.length) {
        const firstDifferentComplement = allComplements.find((compl) => recicledComplements.every((c) => c.id !== compl.id))

        if (firstDifferentComplement) {
          setRecicledComplements([
            ...recicledComplements,
            {
              id: firstDifferentComplement.id,
              link: false,
            },
          ])
        }
      }
    }
  }

  const handleRemoveComplementCategory = (id: number, type: 'default' | 'recicle' = 'default') => {
    if (type === 'default') {
      const newComplements = complements.filter((complement) => complement.id !== id)

      setComplements([...newComplements])
      const complementExist = complements.find((complement) => complement.id === id)
      if (complementExist && complementExist.pivot) {
        setRemoveComplements([...removeComplements, id])
      }

      setRecicledComplements(recicledComplements.filter((recicledComplement) => recicledComplement.id !== id))
    } else {
      setRecicledComplements(recicledComplements.filter((recicledComplement) => recicledComplement.id !== id))
    }
  }

  const handleAddItemComplement = (complement: ComplementType, index: number) => {
    if (
      verifyEmptyNameLength(complements, 'id', {
        partialQuery: `#complement-name-`,
        queryParentElement: `#create-product-modal`,
        differTop: -250,
      }) ||
      verifyEmptyNameLength(
        complements.flatMap((comp) => comp.itens.flat()),
        'code',
        {
          partialQuery: `#complement-item-`,
          queryParentElement: `#create-product-modal`,
          differTop: -250,
        }
      )
    ) {
      setInvalidComplementName(true)
      return
    }

    const newItem: ItemComplementType = {
      code: hash(),
      name: '',
      description: '',
      status: true,
      value: 0,
      amount: 0,
      bypass_amount: true,
    }

    complement.itens.push(newItem)
    setUpdateHTML(updateHTML + 1)

    setTimeout(() => {
      // const input = document.getElementById();
      const btnAdd = document.getElementById(`btn-addItemComplement-${index}`)
      inputFocus(`#complement-item-${newItem.code}`, {
        queryParentElement: '#not-scroll',
      })

      if (btnAdd) {
        btnAdd.scrollIntoView({
          block: 'end',
        })
      }
    }, 20)
  }

  const handleRemoveItemComplement = (id: number, code: string) => {
    if (complements.length) {
      const newComplements = complements.map((comp) => {
        if (id === comp.id) {
          comp.itens = comp.itens.filter((item) => item.code !== code)
        }

        return comp
      })
      setComplements(newComplements)
    }
  }

  const handleChange = (e: any, id: number, type: 'name' | 'min' | 'max' | 'required') => {
    if (complements.length) {
      if (type === 'name') {
        complements[id][type] = e.target.value
      }
      if (type === 'min' || type === 'max') {
        complements[id][type] = Number(e.target.value)
      }
      if (type === 'required') {
        complements[id][type] = e.target.checked
      }
    }

    setUpdateHTML(updateHTML + 1)
  }

  return (
    <Card>
      <Card.Header style={{ position: window.innerWidth > 768 ? 'sticky' : 'relative', top: '-16px', zIndex: 99999 }}>
        <div className="d-flex justify-content-between">
          <div className="position-relative gap-2 d-flex flex-column flex-md-row">
            <Button variant="dark" className="p-2 text-wrap" onClick={() => handleAddComplementCategory()}>
              + Categoria
            </Button>
            <Button
              variant="dark"
              className="p-2 text-wrap"
              disabled={!allComplements.length}
              onClick={() => {
                handleAddComplementCategory('recicle')
              }}
            >
              <FaSyncAlt />
              Usar complementos de outro item
            </Button>
          </div>
          <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/AZowVbOpIvw', title: 'Criando complementos' }, { src: 'https://www.youtube.com/embed/cPXbA7NRmqs', title: 'Complementos compartilhados' }]} />
        </div>
      </Card.Header>
      <Card.Body>
        {recicledComplements.map((recicledComplement, index, arrRecicled) => {
          return (
            <Card className="wm-default text-dark" key={`${recicledComplement.id}-${index}`}>
              <Card.Body>
                <Row className="align-items-end">
                  <Col sm="6">
                    <Form.Label>
                      <b>Complemento:</b>
                    </Form.Label>
                    <Form.Select
                      value={recicledComplement.id}
                      onChange={(e) => {
                        recicledComplement.id = parseInt(e.target.value)
                        setRecicledComplements([...recicledComplements])
                      }}
                    >
                      {filteredComplementsSet.map((complementId) => {
                        const complement = allComplements.find((c) => c.id === complementId)
                        const productPrincipal = Math.min(
                          ...products?.filter((prod) => prod.complements?.some((c) => c.id === complementId)).map((prod) => prod.id as number)
                        )

                        if (complement) {
                          const foundedIndex = arrRecicled.findIndex((compl) => compl.id === complementId)
                          if (foundedIndex !== -1 && foundedIndex !== index) {
                            return null
                          }

                          return (
                            <option key={`${complement.id}-${complement}`} value={`${complement.id}`}>
                              {`${complement.name} - [${complementType === 'default'
                                ? products.find((prod) => prod.id === productPrincipal)?.name
                                : categories.find((cat) => cat.product?.complements.some((comp) => comp.id === complement.id))?.name
                                }]`}
                            </option>
                          )
                        }
                      })}
                    </Form.Select>
                  </Col>
                  <Col sm="2" className="d-flex">
                    <OverlayTrigger
                      overlay={
                        <Popover id="popover-basic">
                          <Popover.Header as="h3">
                            <RiErrorWarningFill className="text-warning" />
                            <b> Atenção</b>
                          </Popover.Header>
                          <Popover.Body>Todas alterações feitas nesse complemento terão efeito em outros produtos que o utilizarem</Popover.Body>
                        </Popover>
                      }
                    >
                      <div className="d-flex gap-2 flex-row-reverse mt-auto justify-content-end">
                        <Form.Label htmlFor={`linked-${index}`}>Vincular?</Form.Label>
                        <Form.Switch
                          id={`linked-${index}`}
                          className="flex-grow-1"
                          onChange={(e) => {
                            recicledComplement.link = e.target.checked
                            setUpdateHTML(updateHTML + 1)
                          }}
                        />
                      </div>
                    </OverlayTrigger>
                  </Col>
                  <Col sm="4" className="d-flex gap-2">
                    <ButtonGroup className="flex-grow-1 d-flex gap-2">
                      <Button
                        className="my-auto"
                        disabled={recicledComplement.link}
                        onClick={() => {
                          if (recicledComplement.id && !recicledComplement.link) {
                            handleAddComplementCategory('default', recicledComplement.id)
                            const newRecicleds = recicledComplements.filter((req, indexRec) => indexRec !== index)
                            setRecicledComplements(newRecicleds)
                          }
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        className="mt-auto flex-grow-1"
                        onClick={() => {
                          const newRecicleds = recicledComplements.filter((req, indexRec) => indexRec !== index)
                          setRecicledComplements(newRecicleds)
                        }}
                      >
                        Excluir
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )
        })}
        {complements?.map((complement, index) => (
          <Card
            id={`complement-${complement.id}`}
            key={`complement-${complement.id}`}
            className={`wm-default text-dark ${complement.isLinked(allComplements) ? 'linked-component' : ''}`}
          >
            {complement.isLinked(allComplements) && (
              <div className="link-alert-component">
                Atenção este complemento está vinculado a outro(s) produto(s), qualquer alteração feita aqui afetará os produtos vinculados, exceto
                excluir.
              </div>
            )}
            <Card.Body>
              <Row>
                <Col sm>
                  <div className="d-flex justify-content-end align-items-center">
                    {typeModal === 'massive' && showVinculateComplement && (
                      <OverlayTrigger
                        overlay={
                          <Popover id="popover-basic">
                            <Popover.Header as="h3">
                              <RiErrorWarningFill className="text-warning" />
                              <b> Atenção</b>
                            </Popover.Header>
                            <Popover.Body>Todas alterações feitas nesse complemento terão efeito em outros produtos que o utilizarem</Popover.Body>
                          </Popover>
                        }
                      >
                        <div className="d-flex gap-2 flex-row-reverse">
                          <Form.Switch
                            id="Vincular"
                            label="Vincular Todos Produtos"
                            defaultChecked={complement.vinculate?.link}
                            className="flex-grow-1"
                            onChange={(e) => {
                              if (complement.vinculate) {
                                complement.vinculate.link = e.target.checked
                              }
                            }}
                          />
                        </div>
                      </OverlayTrigger>
                    )}
                    {typeModal !== 'massive' && complement.isLinked(allComplements) && (
                      <Button
                        variant="link text-decoration-none"
                        className="mb-3"
                        onClick={() => {
                          handleConfirmModal({
                            show: true,
                            title: 'Produtos Vinculados',
                            message: `${products
                              .filter((prod) => prod.complements?.find((compl) => compl.id === complement.id))
                              .map((prod, index, arr) => {
                                if (index === 0 && arr.length === 1) {
                                  return `<span>${prod.name}</span>`
                                }

                                return `<span>${prod.name}</span><br />`
                              })
                              .join('')}`,
                            alignText: 'start',
                            cancelButton: 'none',
                            confirmButton: 'Fechar',
                          })
                        }}
                      >
                        Ver Produtos Vinculados
                      </Button>
                    )}
                  </div>
                  <div className="d-flex gap-4">
                    <div className="flex-grow-1 mb-3">
                      <Form.Label>
                        <b>Nome</b>
                      </Form.Label>
                      <div className="position-relative ">
                        <Form.Control
                          placeholder="Nome"
                          defaultValue={complement.name}
                          id={`complement-name-${complement.id}`}
                          className={`mb-2 ${index === 0 ? 'first-complement-focus' : ''}`}
                          isInvalid={!complement.name.length && invalidComplementName}
                          maxLength={50}
                          onChange={(e) => {
                            handleChange(e, index, 'name')
                            setComplements([...complements])
                            invalidComplementName && setInvalidComplementName(false)
                          }}
                          onKeyDown={(e) => modifyFontValues(e, { prop: complement.name })}
                        />
                        <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                          Nome inválido
                        </Form.Control.Feedback>
                      </div>
                      <div className="d-flex justify-content-end">
                        <p className={complement.name.length >= 50 ? 'text-red-500' : ''} data-name-length={complement.id}>
                          {complement.name.length}/50 caracteres
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                      <Button
                        variant="danger"
                        className="mb-auto px-5"
                        onClick={() => {
                          if (complement.id) {
                            handleRemoveComplementCategory(complement.id)
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row className="mt-2 mb-5">
                <Col sm>
                  <Form.Label>
                    <b>Quantidade</b>
                  </Form.Label>
                  <Row>
                    <Col sm="6" md="6">
                      <InputGroup className="mt-1">
                        <InputGroup.Text>Min.</InputGroup.Text>
                        <Form.Control
                          defaultValue={complement.min || 0}
                          type="number"
                          min={0}
                          max={10000}
                          required
                          isInvalid={complement.min > complement.max}
                          onChange={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')

                            const targetValue = Number(e.currentTarget.value)
                            e.currentTarget.value = String(Math.min(Math.abs(targetValue), 10000))

                            handleChange(e, index, 'min')
                          }}
                        />
                        <Form.Control.Feedback type="invalid">Mín maior que o máximo.</Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                    <Col sm="6" md="6">
                      <InputGroup className="mt-1">
                        <InputGroup.Text>Máx.</InputGroup.Text>
                        <Form.Control
                          defaultValue={complement.max || 0}
                          required
                          min={1}
                          max={10000}
                          type="number"
                          isInvalid={complement.max < complement.min}
                          onChange={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')

                            const targetValue = Number(e.currentTarget.value)
                            e.currentTarget.value = String(Math.min(Math.abs(targetValue), 10000))

                            handleChange(e, index, 'max')
                          }}
                        />
                        <Form.Control.Feedback type="invalid">Máx menor que mínimo</Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                  </Row>
                </Col>
                <Col sm="4" md className="mt-auto mb-2 d-flex gap-2 justify-content-end">
                  <Form.Check
                    defaultChecked={complement.required}
                    id={`complemento-obrigatorio-${complement.id}`}
                    label="Complemento Obrigatório"
                    onChange={(e) => {
                      handleChange(e, index, 'required')
                    }}
                  />
                </Col>
              </Row>
              <hr />
              <Row className="d-none d-md-flex">
                <Col sm="3" lg="3">
                  Nome
                </Col>
                <Col sm="3" lg="3">
                  Descrição
                </Col>
                <Col sm="3" lg="2">
                  Valor
                </Col>
                <Col sm="3" lg="2">
                  Estoque
                </Col>
                <Col sm="3" lg="2">
                  Opções
                </Col>
              </Row>
              {complement.itens.map((item) => (
                <div key={item.code}>
                  <br />
                  <Row>
                    <Col sm="3" lg="3">
                      <div className="position-relative">
                        <Form.Control
                          className={item.code}
                          id={`complement-item-${item.code}`}
                          placeholder="Complemento"
                          defaultValue={item.name}
                          isInvalid={!item.name.trim().length && invalidComplementName}
                          maxLength={70}
                          onChange={(e) => {
                            item.name = encryptEmoji(e.target.value.trim())
                            setComplements([...complements])
                            invalidComplementName && setInvalidComplementName(false)
                          }}
                          onKeyDown={(e) => modifyFontValues(e, { prop: item.name })}
                        />
                        <Form.Control.Feedback tooltip type="invalid" style={{ zIndex: 0 }}>
                          Nome inválido
                        </Form.Control.Feedback>
                      </div>
                      <div className="d-flex justify-content-end">
                        <p id={`itemComplement-${item.code}`} className={item.name.length >= 70 ? 'text-red-500' : ''}>
                          {item.name.length}/70 caracteres
                        </p>
                      </div>
                    </Col>
                    <Col sm="3" lg="3">
                      <Form.Control
                        placeholder="Descrição"
                        defaultValue={item.description}
                        maxLength={100}
                        onChange={(e) => {
                          item.description = encryptEmoji(e.target.value)
                          setComplements([...complements])
                        }}
                        onKeyDown={(e) => modifyFontValues(e, { prop: item.description })}
                      />
                      <div className="d-flex justify-content-end">
                        <p id={`itemDescription-${item.code}`} className={item.description.length >= 100 ? 'text-red-500' : ''}>
                          {item.description.length}/100 caracteres
                        </p>
                      </div>
                    </Col>
                    <Col sm="3" lg="2">
                      <InputGroup className="mb-2">
                        <InputGroup.Text>{currency({ value: 0, symbol: true, currency: session?.user?.controls?.currency })}</InputGroup.Text>
                        <Form.Control
                          required
                          min="0"
                          defaultValue={(item.value ?? Number(0)).toFixed(2)}
                          onChange={(e) => {
                            mask(e, 'currency')
                            item.value = Number(e.target.value)
                          }}
                        />
                      </InputGroup>
                    </Col>
                    {profile.options.inventoryControl ? (
                      item.amount && item.amount > 0 ? (
                        <Col sm="3" lg="2">
                          <InputGroup className="position-relative mb-2">
                            <Button
                              style={{ minWidth: '48.79px' }}
                              onClick={() => {
                                if (typeof item.amount === 'number' && item.amount > 0) {
                                  item.amount--
                                }
                                setComplements([...complements])
                              }}
                            >
                              -
                            </Button>

                            <Form.Control
                              value={item.amount || 0}
                              onChange={(e) => {
                                const newAmount = Number(e.target.value)
                                item.amount = newAmount || undefined
                                setComplements([...complements])
                              }}
                            />

                            <Button
                              className="rounded-end"
                              style={{ minWidth: '48.79px' }}
                              onClick={() => {
                                if (typeof item.amount !== 'number') item.amount = 0
                                item.amount++
                                setComplements([...complements])
                              }}
                            >
                              +
                            </Button>
                            <Form.Control.Feedback tooltip type="invalid">
                              Por favor, insira um valor válido!
                            </Form.Control.Feedback>
                            <div className="d-flex w-100 justify-content-end">
                              <Form.Check
                                id={`bypass-${item.code}`}
                                label="Sempre disponível"
                                onClick={() => {
                                  item.amount = 0
                                  item.bypass_amount = true
                                  setComplements([...complements])
                                }}
                              />
                            </div>
                          </InputGroup>
                        </Col>
                      ) : (
                        <Col sm="3" lg="2">
                          <Button
                            className="rounded-end w-100 my-2 my-sm-0"
                            style={{ minWidth: '48.79px' }}
                            onClick={() => {
                              if (typeof item.amount !== 'number') item.amount = 0
                              item.amount++
                              item.bypass_amount = false
                              setComplements([...complements])
                            }}
                          >
                            Habilitar Estoque
                          </Button>
                        </Col>
                      )
                    ) : null}
                    <Col sm="12" lg className="mb-auto">
                      <Row className="gap-2 justify-content-end">
                        <Col sm md lg className="d-flex">
                          <Button
                            className={`${!item.status ? 'complement-item-button' : ''} `}
                            variant={`${!item.status ? 'outline-orange text-orange' : 'orange text-white'} `}
                            style={{ flex: '1 1 150px' }}
                            tabIndex={-1}
                            onClick={() => {
                              item.status = !item.status
                              setUpdateHTML(updateHTML + 1)
                            }}
                          >
                            {item.status ? 'Pausar' : 'Pausado'}
                          </Button>
                        </Col>
                        <Col sm md lg className="d-flex">
                          <Button
                            variant="danger"
                            style={{ flex: '1 1 150px' }}
                            tabIndex={-1}
                            onClick={() => {
                              if (complement.id) {
                                handleRemoveItemComplement(complement.id, item.code)
                              }
                            }}
                          >
                            Excluir
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              ))}
              <Row className="mt-2">
                <Col sm="12" md="2" lg="2" className="d-flex">
                  <Button
                    variant="success"
                    className="flex-grow-1"
                    id={`btn-addItemComplement-${index}`}
                    onClick={() => {
                      if (complement.id) {
                        handleAddItemComplement(complement, index)
                      }
                    }}
                  >
                    + Adicionar Item
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </Card.Body>
    </Card>
  );
}
