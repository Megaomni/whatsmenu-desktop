import {
  Modal,
  Accordion,
  Button,
  Card,
  useAccordionButton,
} from 'react-bootstrap'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react'
import Category from '../../../../types/category'
import { ProductType } from '../../../../types/product'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import Sortable, { MultiDrag } from 'sortablejs'
import { useSession } from 'next-auth/react'
import { RiDragMove2Line } from 'react-icons/ri'
import { OverlaySpinner } from '../../../OverlaySpinner'
import AccordionItem from 'react-bootstrap/AccordionItem'
import AccordionHeader from 'react-bootstrap/AccordionHeader'
import AccordionBody from 'react-bootstrap/AccordionBody'
import { ImSortAmountDesc } from 'react-icons/im'
import { useTranslation } from 'react-i18next'

export function MenuReorder(props: any) {
  const { t } = useTranslation()
  const { handleShowToast, invoicePending } = useContext(AppContext)
  const { categories: menuCategories, setCategories: setMenuCategories } =
    useContext(MenuContext)
  const [isTransition, startTransition] = useTransition()
  const { data: session } = useSession()
  const [categories, setCategories] = useState<any[]>([])
  const [runReorder, setRunReorder] = useState<boolean>(false)
  const [showSpinner, setShowSpinner] = useState<boolean>(false)
  const [finalOrder, setFinalOrder] = useState<any>({
    category: {},
    product: {},
    complement: {},
    'complement/itens': {},
    flavor: {},
    size: {},
    implementation: {},
  })

  const sortEnd = (arr: any[], oldIndex: number, newIndex: number) => {
    const element = arr.splice(oldIndex, 1)
    arr.splice(newIndex, 0, element[0])
  }
  const orderArray = (arr: any[], type: 'id' | 'code') => {
    return arr.map((el) => el[type])
  }

  const newArr = (arrPosition: any[], arr: any[], type: 'id' | 'code') => {
    const newArrR: any = []
    arrPosition.forEach((el, index) => {
      const elFounded = arr.find((elA) => elA[type] === el)
      if (elFounded) {
        if (type === 'id') {
          elFounded.order = index
        }
        newArrR.push(elFounded)
      }
    })

    return newArrR
  }
  /** Envia a ordenação para api e reordena os itens originais */
  const reorder = async () => {
    let newCategories = [...menuCategories]

    try {
      if (runReorder) {
        setShowSpinner(true)
        for (const key of Object.keys(finalOrder)) {
          for (const [keyIn, valueIn] of Object.entries(finalOrder[key])) {
            const value = valueIn as any
            const body: any = {}
            if (key === 'category') {
              body.order = valueIn
            } else {
              body.categoryId = value.categoryId
              body.productId = value.productId
              body.pizzaId = value.pizzaId
              body.complementId = value.complementId
              body.order = value.order
            }

            await Category.orderItem(body, session, key, value.pizza)
            const category = newCategories.find(
              (cat) => cat.id === Number(body.categoryId)
            )
            const product = category?.products?.find(
              (prod: any) => prod.id === Number(body.productId)
            )
            const productComplement = product?.complements.find(
              (compl: any) => compl.id === Number(body.complementId)
            )
            const complementsPizza = category?.product?.complements.find(
              (comp: any) => comp.id === Number(body.complementId)
            )

            switch (key) {
              case 'category':
                newCategories = newArr(body.order, menuCategories, 'id')
                break
              case 'product':
                if (category && category.products) {
                  category.products = newArr(
                    body.order,
                    category.products,
                    'id'
                  )
                }
                break
              case 'complement':
                if (product) {
                  product.complements = newArr(
                    body.order,
                    product.complements,
                    'id'
                  )
                }
                if (category?.product) {
                  category.product.complements = newArr(
                    body.order,
                    category.product.complements,
                    'id'
                  )
                }
                break
              case 'complement/itens':
                if (productComplement) {
                  productComplement.itens = newArr(
                    body.order,
                    productComplement.itens,
                    'code'
                  )
                }

                if (complementsPizza) {
                  complementsPizza.itens = newArr(
                    body.order,
                    complementsPizza.itens,
                    'code'
                  )
                }
                break
              case 'flavor':
              case 'size':
              case 'implementation':
                if (category && category.type === 'pizza' && category.product) {
                  category.product[`${key}s`] = newArr(
                    body.order,
                    category.product[`${key}s`],
                    'code'
                  )
                }
                break
            }
          }
        }

        setMenuCategories(newCategories)
        handleShowToast({
          show: true,
          type: 'success',
          title: t('reorder_menu'),
          content: `${t('reordered_successfully')}.`,
          position: 'top-end',
          flexPositionX: 'end',
        })
      }
      props.onHide()
    } catch (e) {
      handleShowToast({
        show: true,
        type: 'erro',
        title: t('reorder_menu'),
        content: t('could_not_reorder_items'),
        position: 'top-end',
        flexPositionX: 'end',
      })
      console.error(e)
    } finally {
      setTimeout(() => {
        setShowSpinner(false)
        setRunReorder(false)
      }, 500)
    }
  }

  const sortedCategories = () => {
    const sortedCategories = [...menuCategories]
    const newCategories = sortedCategories
      .sort((catA, catB) => catA.order - catB.order)
      .map((cat) => {
        if (cat.products && cat.type === 'default') {
          const products = (cat.returnProdNoInstaced() ?? []) as ProductType[]
          return {
            id: cat.id,
            name: cat.name,
            order: cat.order,
            products: products
              .sort((pA, pB) => pA.order - pB.order)
              .map((prod) => {
                return {
                  id: prod.id,
                  name: prod.name,
                  order: prod.order,
                  complements: prod.complements
                    .sort((cA, cB) => cA.order - cB.order)
                    .map((compl) => {
                      return {
                        id: compl.id,
                        name: compl.name,
                        order: compl.order,
                        itens: compl.itens.map((item, indexItem) => {
                          return {
                            name: item.name,
                            code: item.code,
                            order: indexItem,
                          }
                        }),
                      }
                    }),
                }
              }),
          }
        }

        if (cat.product && cat.type === 'pizza') {
          return {
            name: cat.name,
            id: cat.id,
            order: cat.order,
            product: {
              id: cat.product.id,
              sizes: cat.product.sizes.map((sz) => {
                return {
                  code: sz.code,
                  name: sz.name,
                }
              }),
              implementations: cat.product.implementations.map((impl) => {
                return {
                  code: impl.code,
                  name: impl.name,
                }
              }),
              complements: cat.product.complements
                .sort((cA, cB) => cA.order - cB.order)
                .map((compl) => {
                  return {
                    id: compl.id,
                    name: compl.name,
                    order: compl.order,
                    itens: compl.itens.map((item, indexItem) => {
                      return {
                        name: item.name,
                        code: item.code,
                        order: indexItem,
                      }
                    }),
                  }
                }),
              flavors: cat.product.flavors.map((flavor) => {
                return {
                  code: flavor.code,
                  name: flavor.name,
                }
              }),
            },
          }
        }
      })

    startTransition(() => {
      setCategories(newCategories)
    })
  }

  const createSortables = () => {
    const nestedElements = Array.from(
      document.getElementsByClassName('elements-reorder') ?? []
    ) as HTMLElement[]
    nestedElements.forEach((el) => {
      new Sortable(el, {
        group: {
          name: 'nested',
          pull: false,
        },
        disabled: false,
        animation: 100,
        swapThreshold: 1,
        forceFallback: true,
        multiDrag: true,
        selectedClass: 'sortable-selected',
        delay: 200,
        onEnd: ({ oldIndex, newIndex, item }) => {
          if (
            oldIndex !== undefined &&
            newIndex !== undefined &&
            newIndex !== oldIndex
          ) {
            setRunReorder(true)
            const category = categories.find(
              (cat) => cat.id === Number(item.dataset.categoryId)
            )
            const product = category?.products?.find(
              (prod: any) => prod.id === Number(item.dataset.productId)
            )
            const complement = product?.complements.find(
              (compl: any) => compl.id === Number(item.dataset.complementId)
            )
            const complementsPizza = category?.product?.complements.find(
              (comp: any) => comp.id === Number(item.dataset.complementId)
            )

            switch (item.dataset.type) {
              case 'category':
                sortEnd(categories, oldIndex, newIndex)
                finalOrder['category'] = {}
                finalOrder['category'].order = orderArray(categories, 'id')
                break
              case 'product':
                if (category) {
                  sortEnd(category.products, oldIndex, newIndex)
                  finalOrder['product'][`${category.id}`] = {}
                  finalOrder['product'][`${category.id}`].categoryId =
                    category.id
                  finalOrder['product'][`${category.id}`].order = orderArray(
                    category.products,
                    'id'
                  )
                }
                break
              case 'complement':
                if (category && product) {
                  sortEnd(product.complements, oldIndex, newIndex)
                  finalOrder['complement'][`${product.id}`] = {}
                  finalOrder['complement'][`${product.id}`].order = orderArray(
                    product.complements,
                    'id'
                  )
                  finalOrder['complement'][`${product.id}`].categoryId =
                    category.id
                  finalOrder['complement'][`${product.id}`].productId =
                    product.id
                }
                break
              case 'complement-item':
                if (category && product && complement) {
                  sortEnd(complement.itens, oldIndex, newIndex)
                  finalOrder['complement/itens'][`${complement.code}`] = {}
                  finalOrder['complement/itens'][`${complement.code}`].order =
                    orderArray(complement.itens, 'code')
                  finalOrder['complement/itens'][
                    `${complement.code}`
                  ].categoryId = category.id
                  finalOrder['complement/itens'][
                    `${complement.code}`
                  ].productId = product.id
                  finalOrder['complement/itens'][
                    `${complement.code}`
                  ].complementId = complement.id
                }

                if (category && category.product && complementsPizza) {
                  sortEnd(complementsPizza.itens, oldIndex, newIndex)
                  finalOrder['complement/itens'][`${complementsPizza.code}`] =
                    {}
                  finalOrder['complement/itens'][
                    `${complementsPizza.code}`
                  ].order = orderArray(complementsPizza.itens, 'code')
                  finalOrder['complement/itens'][
                    `${complementsPizza.code}`
                  ].categoryId = category.id
                  finalOrder['complement/itens'][
                    `${complementsPizza.code}`
                  ].pizzaId = category.product.id
                  finalOrder['complement/itens'][
                    `${complementsPizza.code}`
                  ].complementId = complementsPizza.id
                }
                break
              case 'size':
              case 'flavor':
              case 'implementation':
                if (category) {
                  sortEnd(
                    category.product[`${item.dataset.type}s`],
                    oldIndex,
                    newIndex
                  )
                  finalOrder[item.dataset.type][`${item.dataset.code}`] = {}
                  finalOrder[item.dataset.type][`${item.dataset.code}`].pizza =
                    true
                  finalOrder[item.dataset.type][
                    `${item.dataset.code}`
                  ].categoryId = category.id
                  finalOrder[item.dataset.type][`${item.dataset.code}`].order =
                    orderArray(
                      category.product[`${item.dataset.type}s`],
                      'code'
                    )
                }
            }
          }
        },
        onChoose: ({ item }) => {
          const accordionOpen = Array.from(
            document.querySelectorAll(
              `div[data-type=${item.dataset.type}] .accordion-button[aria-expanded=true]`
            )
          ) as HTMLButtonElement[]
          accordionOpen.forEach((el) => {
            el.click()
          })
        },
      })
    })
  }
  //** Cria um array, com as propriedades necessárias para facilitar o reorder */
  useEffect(() => {
    sortedCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuCategories])

  useEffect(() => {
    if (categories.length) {
      createSortables()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  return (
    <>
      <Modal
        show={props.show}
        fullscreen={true}
        keyboard
        onEnter={sortedCategories}
        onExited={() => {
          setFinalOrder({
            category: {},
            product: {},
            complement: {},
            'complement/itens': {},
            flavor: {},
            size: {},
            implementation: {},
          })
        }}
        style={{ zIndex: 9999 }}
      >
        <Modal.Header>
          <div>
            <h3 className="mb-1">{t('reorder_menu')}</h3>
            <span className="fs-7">{t('message_press_and_hold')}</span>
          </div>
        </Modal.Header>
        <Modal.Body id="body-draggable" className="pt-3">
          {categories.length ? (
            <>
              <Accordion className="elements-reorder">
                {categories.map((cat) => {
                  return (
                    <AccordionItem
                      key={cat.id}
                      eventKey={`category-${cat.id}`}
                      data-type="category"
                    >
                      <AccordionHeader
                        id={`button-${cat.id}`}
                        className="fs-4 title-element-reorder p-0"
                        style={{ position: 'sticky', top: '-20px', zIndex: 10 }}
                      >
                        <RiDragMove2Line size={25} className="icon" />{' '}
                        {cat.name}
                      </AccordionHeader>
                      <AccordionBody>
                        {cat.products && cat.products.length && (
                          <Accordion className="elements-reorder">
                            {cat.products.map((prod: any) => {
                              return (
                                <AccordionItem
                                  key={prod.id}
                                  eventKey={`prod-${prod.id}`}
                                  data-type="product"
                                  data-category-id={`${cat.id}`}
                                >
                                  <AccordionHeader className="fs-4 title-element-reorder p-0">
                                    <RiDragMove2Line
                                      size={25}
                                      className="icon"
                                    />{' '}
                                    {prod.name}
                                  </AccordionHeader>
                                  <AccordionBody>
                                    <Accordion className="elements-reorder">
                                      {prod.complements.map((compl: any) => {
                                        return (
                                          <AccordionItem
                                            key={compl.id}
                                            eventKey={`compl-${compl.id}`}
                                            data-type={'complement'}
                                            data-category-id={`${cat.id}`}
                                            data-product-id={`${prod.id}`}
                                          >
                                            <AccordionHeader className="fs-4 title-element-reorder p-0">
                                              <RiDragMove2Line
                                                size={25}
                                                className="icon"
                                              />{' '}
                                              {compl.name}
                                            </AccordionHeader>
                                            <Accordion.Body>
                                              <div className="elements-reorder">
                                                {compl.itens.map(
                                                  (item: any) => {
                                                    return (
                                                      <div
                                                        key={item.code}
                                                        className="fs-4 fw-500 py-2"
                                                        data-type="complement-item"
                                                        data-category-id={
                                                          cat.id
                                                        }
                                                        data-product-id={
                                                          prod.id
                                                        }
                                                        data-complement-id={
                                                          compl.id
                                                        }
                                                      >
                                                        <RiDragMove2Line
                                                          size={25}
                                                          className="icon"
                                                        />{' '}
                                                        {item.name}
                                                      </div>
                                                    )
                                                  }
                                                )}
                                              </div>
                                            </Accordion.Body>
                                          </AccordionItem>
                                        )
                                      })}
                                    </Accordion>
                                  </AccordionBody>
                                </AccordionItem>
                              )
                            })}
                          </Accordion>
                        )}
                        {cat.product && (
                          <div>
                            <div>
                              <div>{t('sizes')}</div>
                              <Accordion className="elements-reorder">
                                {cat.product.sizes.map((sz: any) => {
                                  return (
                                    <AccordionItem
                                      key={sz.code}
                                      eventKey={`size-${sz.code}`}
                                      data-type={`size`}
                                      data-category-id={cat.id}
                                    >
                                      <AccordionHeader className="fs-4 title-element-reorder p-0">
                                        <RiDragMove2Line
                                          size={25}
                                          className="icon"
                                        />{' '}
                                        {sz.name}
                                      </AccordionHeader>
                                    </AccordionItem>
                                  )
                                })}
                              </Accordion>
                            </div>
                            <div>
                              <div>{t('edges_doughs')}</div>
                              <Accordion className="elements-reorder">
                                {cat.product.implementations.map((imp: any) => {
                                  return (
                                    <AccordionItem
                                      key={imp.code}
                                      eventKey={`implementation-${imp.code}`}
                                      data-type={`implementation`}
                                      data-category-id={cat.id}
                                    >
                                      <AccordionHeader className="fs-4 title-element-reorder p-0">
                                        <RiDragMove2Line
                                          size={25}
                                          className="icon"
                                        />{' '}
                                        {imp.name}
                                      </AccordionHeader>
                                    </AccordionItem>
                                  )
                                })}
                              </Accordion>
                            </div>
                            <div>
                              <div>{t('complements')}</div>
                              <Accordion className="elements-reorder">
                                {cat.product.complements.map((compl: any) => {
                                  return (
                                    <AccordionItem
                                      key={compl.id}
                                      eventKey={`compl-${compl.id}`}
                                      data-type={'complement'}
                                      data-category-id={`${cat.id}`}
                                      data-product-id={`${cat.product.id}`}
                                    >
                                      <AccordionHeader className="fs-4 title-element-reorder p-0">
                                        <RiDragMove2Line
                                          size={25}
                                          className="icon"
                                        />{' '}
                                        {compl.name}
                                      </AccordionHeader>
                                      <Accordion.Body>
                                        <div className="elements-reorder">
                                          {compl.itens.map((item: any) => {
                                            return (
                                              <div
                                                key={item.code}
                                                className="fs-4 fw-500 py-2"
                                                data-type="complement-item"
                                                data-category-id={cat.id}
                                                data-product-id={cat.product.id}
                                                data-complement-id={compl.id}
                                              >
                                                <RiDragMove2Line
                                                  size={25}
                                                  className="icon"
                                                />{' '}
                                                {item.name}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </Accordion.Body>
                                    </AccordionItem>
                                  )
                                })}
                              </Accordion>
                            </div>
                            <div>
                              <div>{t('flavors')}</div>
                              <Accordion className="elements-reorder">
                                {cat.product.flavors.map((fl: any) => {
                                  return (
                                    <AccordionItem
                                      key={fl.code}
                                      eventKey={`flavor-${fl.code}`}
                                      data-type={`flavor`}
                                      data-category-id={cat.id}
                                    >
                                      <AccordionHeader className="fs-4 title-element-reorder p-0">
                                        <RiDragMove2Line
                                          size={25}
                                          className="icon"
                                        />{' '}
                                        {fl.name}
                                      </AccordionHeader>
                                    </AccordionItem>
                                  )
                                })}
                              </Accordion>
                            </div>
                          </div>
                        )}
                      </AccordionBody>
                    </AccordionItem>
                  )
                })}
              </Accordion>
              <OverlaySpinner
                show={showSpinner}
                textSpinner={t('reordegring_wait')}
                position="fixed"
                style={{ zIndex: 999 }}
              />
            </>
          ) : (
            <h2 className="p-5 text-center">
              {menuCategories.length
                ? t('please_wait')
                : t('you_any_categories_yet')}
            </h2>
          )}
        </Modal.Body>
        <Modal.Footer
          className="justify-content-between"
          style={{
            paddingBottom:
              invoicePending?.invoice?.overdue &&
              !invoicePending?.invoice?.overdue &&
              '60px',
          }}
        >
          <Button variant="danger" onClick={props.onHide}>
            {t('cancel')}
          </Button>
          <Button
            variant="success"
            onClick={async () => {
              await reorder()
            }}
          >
            {t('save')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
