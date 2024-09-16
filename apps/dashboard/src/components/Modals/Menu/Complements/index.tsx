import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  InputGroup,
  OverlayTrigger,
  Popover,
  Row,
} from 'react-bootstrap'
import { FaSyncAlt } from 'react-icons/fa'
import { RiErrorWarningFill } from 'react-icons/ri'
import { MenuContext } from '../../../../context/menu.ctx'
import {
  compareItems,
  encryptEmoji,
  hash,
  inputFocus,
  mask,
  modifyFontValues,
  verifyEmptyNameLength,
} from '../../../../utils/wm-functions'
import Complement, {
  ComplementType,
  ItemComplementType,
} from '../../../../types/complements'
import { AppContext } from '../../../../context/app.ctx'
import { HelpVideos } from '../../HelpVideos'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { ComplementItems } from './ComplementItems'

export const ComplementFormSchema = z.object({
  id: z.string().transform((value) => {
    const parsedId = Number(value)
    if (isNaN(parsedId)) {
      return undefined
    }
    return parsedId
  }).optional(),
  name: z
    .string()
    .min(3, 'O nome deve ter pelo menos 3 caracteres')
    .max(50, 'O nome deve ter no maúximo 50 caracteres'),
  required: z.boolean(),
  type: z.enum(['default', 'pizza']),
  min: z.string().min(1).max(10000).transform((value) => parseInt(value)),
  max: z.string().min(1).max(10000).transform((value) => parseInt(value)),
  order: z.number(),
  itens: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z
          .string()
          .min(3, 'O nome deve ter pelo menos 3 caracteres')
          .max(70, 'O nome deve ter no maúximo 70 caracteres'),
        description: z.string().max(100, 'A descrição deve ter no maúximo 100 caracteres').nullable(),
        value: z.string().transform((value) => parseFloat(Number(value).toFixed(2))),
      })
    ),
})

type ComplementFormData = z.infer<typeof ComplementFormSchema>

type ComplementProps = {
  showVinculateComplement?: boolean
  typeModal: 'massive' | 'product'
  autoFocusElement?: number
  invalidComplement?: boolean
  complementType: 'default' | 'pizza'
}
export function ComponentComplement({
  typeModal,
  showVinculateComplement,
  invalidComplement,
  complementType,
  autoFocusElement,
}: ComplementProps) {
  const { watch, control, register, formState } = useFormContext<{ complements: Complement[] }>()
  const { append: appendComplement, remove: removeComplement, fields: complements, update: updateComplement } = useFieldArray({
    control,
    name: 'complements',
  })

  const { t } = useTranslation()
  const { data: session } = useSession()
  const { handleConfirmModal, profile, currency } = useContext(AppContext)
  const {
    productComplements,
    pizzaComplements,
    products,
    category,
    categories,
    setFocusId,
  } = useContext(MenuContext)

  const [removeComplements, setRemoveComplements] = useState<number[]>([])

  const [invalidComplementName, setInvalidComplementName] =
    useState<boolean>(false)
  const [updateHTML, setUpdateHTML] = useState(0)

  // COMPLEMENTS SET ID
  const [filteredComplementsSet, setFilteredComplementsSet] = useState<
    number[]
  >([])

  let allComplements =
    complementType === 'default' ? productComplements : pizzaComplements


  useEffect(() => {
    setInvalidComplementName(!!invalidComplement)
  }, [invalidComplement])

  // useEffect(() => {
  //   if (!compareItems(complementsProps, complements)) {
  //     complements.forEach((complement) => {
  //       if (complement.min > complement.max) {
  //         complement.min = complement.max
  //       } else if (complement.min < 1) {
  //         complement.min = 1
  //       }

  //       if (complement.max < complement.min) {
  //         complement.max = complement.min
  //       } else if (complement.max < 1) {
  //         complement.max = 1
  //       }
  //     })
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [complements])

  // useEffect(() => {
  //   saveRecicledComplements && saveRecicledComplements([...recicledComplements])
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [recicledComplements])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeComplements])

  useEffect(() => {
    const setComplements = new Set()
    allComplements?.forEach((complement) => {
      if (complement.id && !removeComplements.includes(complement.id)) {
        setComplements.add(complement.id)
      }
    })

  }, [allComplements, removeComplements])

  // useEffect(() => {
  //   if (!showVinculateComplement) {
  //     complements.forEach((comp) => {
  //       if (comp.vinculate) {
  //         comp.vinculate.link = false
  //       }
  //     })
  //   }
  // }, [showVinculateComplement, complements])

  // useEffect(() => {
  //   if (autoFocusElement) {
  //     const complementRef = document.getElementById(
  //       `complement-${autoFocusElement}`
  //     )
  //     const arrayIndex = complements.findIndex((c) => c.id === autoFocusElement)
  //     const input = document.getElementById(
  //       `complement-name-${autoFocusElement}`
  //     )

  //     if (complementRef && arrayIndex) {
  //       complementRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  //     }

  //     input?.focus()
  //     setFocusId(undefined)
  //   }
  // }, [autoFocusElement, complements, setFocusId])

  const handleAddItemComplement = (
    complement: ComplementType,
    index: number
  ) => {
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

  const handleAddComplement = () => {
    appendComplement(new Complement({
      name: '',
      itens: [],
      max: 0,
      min: 0,
      required: false,
      order: 0,
      type: complementType,
    }))
  }

  const handleRemoveComplement = (index: number) => {
    removeComplement(index)
  }

  // const handleRemoveItemComplement = (id: number, code: string) => {
  //   if (complements.length) {
  //     const newComplements = complements.map((comp) => {
  //       if (id === comp.id) {
  //         comp.itens = comp.itens.filter((item) => item.code !== code)
  //       }

  //       return comp
  //     })
  //     setComplements(newComplements)
  //   }
  // }

  const handleChange = (
    e: any,
    id: number,
    type: 'name' | 'min' | 'max' | 'required'
  ) => {
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
      <Card.Header
        style={{
          position: window.innerWidth > 768 ? 'sticky' : 'relative',
          top: '-16px',
          zIndex: 99999,
        }}
      >
        <div className="d-flex justify-content-between">
          <div className="position-relative d-flex flex-column flex-md-row gap-2">
            <Button
              variant="dark"
              className="text-wrap p-2"
              onClick={handleAddComplement}
            >
              + {t('category')}
            </Button>
            <Button
              variant="dark"
              className="text-wrap p-2"
              disabled={!allComplements.length}
            >
              <FaSyncAlt />
              {t('use_addons_another_item')}
            </Button>
          </div>
          <HelpVideos.Trigger
            urls={[
              {
                src: 'https://www.youtube.com/embed/AZowVbOpIvw',
                title: t('creating_addons'),
              },
              {
                src: 'https://www.youtube.com/embed/cPXbA7NRmqs',
                title: t('shared_addons'),
              },
            ]}
          />
        </div>
      </Card.Header>
      <Card.Body>
        {/* {recicledComplements.map((recicledComplement, index, arrRecicled) => {
          return (
            <Card
              className="wm-default text-dark"
              key={`${recicledComplement.id}-${index}`}
            >
              <Card.Body>
                <Row className="align-items-end">
                  <Col sm="6">
                    <Form.Label>
                      <b>{t('complement')}:</b>
                    </Form.Label>
                    <Form.Select
                      value={recicledComplement.id}
                      onChange={(e) => {
                        recicledComplement.id = parseInt(e.target.value)
                        setRecicledComplements([...recicledComplements])
                      }}
                    >
                      {filteredComplementsSet.map((complementId) => {
                        const complement = allComplements.find(
                          (c) => c.id === complementId
                        )
                        const productPrincipal = Math.min(
                          ...products
                            ?.filter((prod) =>
                              prod.complements?.some(
                                (c) => c.id === complementId
                              )
                            )
                            .map((prod) => prod.id as number)
                        )

                        if (complement) {
                          const foundedIndex = arrRecicled.findIndex(
                            (compl) => compl.id === complementId
                          )
                          if (foundedIndex !== -1 && foundedIndex !== index) {
                            return null
                          }

                          return (
                            <option
                              key={`${complement.id}-${complement}`}
                              value={`${complement.id}`}
                            >
                              {`${complement.name} - [${complementType === 'default'
                                  ? products.find(
                                    (prod) => prod.id === productPrincipal
                                  )?.name
                                  : categories.find((cat) =>
                                    cat.product?.complements.some(
                                      (comp) => comp.id === complement.id
                                    )
                                  )?.name
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
                            <b> {t('attention')}</b>
                          </Popover.Header>
                          <Popover.Body>
                            {t('all_changes_addon_affect_other_product')}
                          </Popover.Body>
                        </Popover>
                      }
                    >
                      <div className="d-flex justify-content-end mt-auto flex-row-reverse gap-2">
                        <Form.Label htmlFor={`linked-${index}`}>
                          {t('link')}?
                        </Form.Label>
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
                          if (
                            recicledComplement.id &&
                            !recicledComplement.link
                          ) {
                            handleAddComplementCategory(
                              'default',
                              recicledComplement.id
                            )
                            const newRecicleds = recicledComplements.filter(
                              (req, indexRec) => indexRec !== index
                            )
                            setRecicledComplements(newRecicleds)
                          }
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-grow-1 mt-auto"
                        onClick={() => {
                          const newRecicleds = recicledComplements.filter(
                            (req, indexRec) => indexRec !== index
                          )
                          setRecicledComplements(newRecicleds)
                        }}
                      >
                        {t('delete')}
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )
        })} */}
        {complements.map((complement, index) => (
          <Card
            id={`complement-${complement.id}`}
            key={`complement-${complement.id}`}
            className={`wm-default text-dark ${complement.isLinked(allComplements) ? 'linked-component' : ''}`}
          >
            {complement.isLinked(allComplements) && (
              <div className="link-alert-component">
                {t('attention_addon_linked')} {t('other')}(s) {t('product_m')}
                (s), {t('attention_addon_linked_v2')}
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
                              <b> {t('attention')}</b>
                            </Popover.Header>
                            <Popover.Body>
                              {t('all_changes_addon_affect_other_product')}
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <div className="d-flex flex-row-reverse gap-2">
                          <Form.Switch
                            id="Vincular"
                            label="Vincular Todos Produtos"
                            {...register(`complements.${index}.vinculate.link`)}
                            className="flex-grow-1"
                          // onChange={(e) => {
                          //   if (complement.vinculate) {
                          //     complement.vinculate.link = e.target.checked
                          //   }
                          // }}
                          />
                        </div>
                      </OverlayTrigger>
                    )}
                    {typeModal !== 'massive' &&
                      complement.isLinked(allComplements) && (
                        <Button
                          variant="link text-decoration-none"
                          className="mb-3"
                          onClick={() => {
                            handleConfirmModal({
                              show: true,
                              title: 'Produtos Vinculados',
                              message: `${products
                                .filter((prod) =>
                                  prod.complements?.find(
                                    (compl) => compl.id === complement.id
                                  )
                                )
                                .map((prod, index, arr) => {
                                  if (index === 0 && arr.length === 1) {
                                    return `<span>${prod.name}</span>`
                                  }

                                  return `<span>${prod.name}</span><br />`
                                })
                                .join('')}`,
                              alignText: 'start',
                              cancelButton: 'none',
                              confirmButton: t('close'),
                            })
                          }}
                        >
                          {t('view_linked_products')}
                        </Button>
                      )}
                  </div>
                  <div className="d-flex gap-4">
                    <div className="flex-grow-1 mb-3">
                      <Form.Label>
                        <b>{t('name')}</b>
                      </Form.Label>
                      <div className="position-relative ">
                        <Form.Control
                          placeholder={t('name')}
                          // defaultValue={complement.name}
                          id={`complement-name-${complement.id}`}
                          className={`mb-2 ${index === 0 ? 'first-complement-focus' : ''}`}
                          {...register(`complements.${index}.name`)}
                          // isInvalid={
                          //   !complement.name.length && invalidComplementName
                          // }
                          maxLength={50}
                        // onChange={(e) => {
                        //   handleChange(e, index, 'name')
                        //   invalidComplementName &&
                        //     setInvalidComplementName(false)
                        // }}
                        // onKeyDown={(e) =>
                        //   modifyFontValues(e, { prop: complement.name })
                        // }
                        />
                        <Form.Control.Feedback
                          tooltip
                          type="invalid"
                          style={{ zIndex: 0 }}
                        >
                          {t('invalid_name')}
                        </Form.Control.Feedback>
                      </div>
                      <div className="d-flex justify-content-end">
                        <p
                          className={
                            watch(`complements.${index}.name`).length >= 50 ? 'text-red-500' : ''
                          }
                          data-name-length={complement.id}
                        >
                          {watch(`complements.${index}.name`).length}/50 {t('characters')}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                      <Button
                        variant="danger"
                        className="mb-auto px-5"
                        onClick={() => handleRemoveComplement(index)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-5 mt-2">
                <Col sm>
                  <Form.Label>
                    <b>{t('quantity')}</b>
                  </Form.Label>
                  <Row>
                    <Col sm="6" md="6">
                      <InputGroup className="mt-1">
                        <InputGroup.Text>Min.</InputGroup.Text>
                        <Form.Control
                          type="number"
                          {...register(`complements.${index}.min`)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {t('min_greater_max')}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                    <Col sm="6" md="6">
                      <InputGroup className="mt-1">
                        <InputGroup.Text>Máx.</InputGroup.Text>
                        <Form.Control
                          {...register(`complements.${index}.max`)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {t('max_less_min')}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Col>
                  </Row>
                </Col>
                <Col
                  sm="4"
                  md
                  className="d-flex justify-content-end mb-2 mt-auto gap-2"
                >
                  <Form.Label className='d-flex gap-3'>
                    <Form.Check
                      defaultChecked={complement.required}
                      id={`complemento-obrigatorio-${complement.id}`}
                      {...register(`complements.${index}.required`)}
                    />
                    <span>{t('mandatory_addon')}</span>
                  </Form.Label>
                </Col>
              </Row>
              <hr />
              <Row className="d-none d-md-flex">
                <Col sm="3" lg="3">
                  {t('name')}
                </Col>
                <Col sm="3" lg="3">
                  {t('description')}
                </Col>
                <Col sm="3" lg="2">
                  {t('value')}
                </Col>
                <Col sm="3" lg="2">
                  {t('stock')}
                </Col>
                <Col sm="3" lg="2">
                  {t('options')}
                </Col>
              </Row>
              <ComplementItems complementIndex={index} />
              <Row className="mt-2">
                <Col sm="12" md="2" lg="2" className="d-flex">
                  <Button
                    variant="success"
                    className="flex-grow-1"
                    id={`btn-addItemComplement-${index}`}
                    onClick={() => {
                      complement.itens.push({
                        name: '',
                        description: '',
                        amount: 0,
                        bypass_amount: false,
                        code: hash(6),
                        status: true,
                        value: 0,
                        amount_alert: 0,
                        quantity: 1
                      })
                      updateComplement(index, complement)
                    }}
                  >
                    + {t('add_item')}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </Card.Body>
    </Card>
  )
}
