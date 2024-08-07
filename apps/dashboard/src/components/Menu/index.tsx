import { useSession } from 'next-auth/react'
import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Figure,
  Form,
  FormControl,
  FormGroup,
  InputGroup,
  OverlayTrigger,
  Popover,
  Row,
  Table,
} from 'react-bootstrap'
import { BsArrowLeftShort, BsArrowRightShort, BsFacebook, BsInfoCircle, BsSearch, BsYoutube } from 'react-icons/bs'
import { AppContext } from '../../context/app.ctx'
import { MenuContext } from '../../context/menu.ctx'
import {
  apiRoute,
  compareItems,
  copy,
  currency,
  encryptEmoji,
  getAndSetterElementValue,
  hash,
  inputFocus,
  mask,
  modifyFontValues,
  normalizeCaracter,
  scrollToElement,
  textDeliveryOrPackage,
} from '../../utils/wm-functions'
import Category, { CategoryType } from '../../types/category'
import PizzaProduct, { PizzaFlavorType, PizzaImplementationType, PizzaProductType, PizzaSizeType } from '../../types/pizza-product'
import Product, { ProductType } from '../../types/product'
import { OverlaySpinner } from '../OverlaySpinner'
import { Title } from '../Partials/title'
import { CreateMassiveProducts } from '../Modals/Menu/Product/Massive'
import { MdOutlineWarning, MdPhotoLibrary } from 'react-icons/md'
import { CropModal } from '../Modals/CropModal'
import { FaEllipsisV, FaUndo } from 'react-icons/fa'
import Complement, { ComplementType, ItemComplementType } from '../../types/complements'
import { DateTime } from 'luxon'
import { FacebookShareButton } from 'react-share'
import { RiWhatsappFill } from 'react-icons/ri'
import { AiOutlineCopy } from 'react-icons/ai'
import { HelpVideos } from '@components/Modals/HelpVideos'

export function MenuComponent() {
  const { profile, plansCategory, handleShowToast, handleConfirmModal, setHelpVideoModal, user } = useContext(AppContext)
  const {
    category: categoryMenu,
    setCategory: setCategoryMenu,
    categories: categoriesMenu,
    setCategories: setCategoriesMenu,
    handleMenuModal,
    setFlavor,
    setImplementation,
    setSize,
    setProduct,
    focusId,
    setFocusId,
  } = useContext(MenuContext)

  const { data: session } = useSession()

  const [category, setCategory] = useState<Category>(categoryMenu)
  const [categories, setCategories] = useState<Category[]>(categoriesMenu)
  const [usedFilter, setUsedFilter] = useState({ name: 'Produtos', value: 'products' })
  const [searchValue, setSearchValue] = useState<string>('')
  const [massiveShow, setMassiveShow] = useState<boolean>(false)
  const [editingFlavorsMassive, setEditingFlavorsMassive] = useState<boolean>(false)
  const [updateFlavorsMassive, setUpdateFlavorsMassive] = useState<Partial<PizzaFlavorType>[]>([])
  const [editingProductsMassive, setEditingProductsMassive] = useState<boolean>(false)
  const [updateProductsMassive, setUpdateProductsMassive] = useState<Partial<ProductType>[]>([])

  const [inputFileImage, setInputFileImage] = useState<HTMLInputElement>()
  const [imagesMassive, setImagesMassive] = useState<{ id: number | string; image: Blob; oldImage: string }[]>([])

  //Spinners
  const [categoryOverlay, setCategoryOverlay] = useState<number | undefined>(-1)
  const [showSpinner, setShowSpinner] = useState<boolean>(false)
  const [overlaySize, setOverlaySize] = useState({ code: '' })
  const [overlayCategory, setOverlayCategory] = useState<number | undefined>(-1)
  const [overlayProduct, setOverlayProduct] = useState<number | null>(0.1)
  const [loading, setLoading] = useState(false)

  const setNewCategory = () => {
    setCategory(Category.newCategory(profile))
    setTimeout(() => {
      handleMenuModal(true, 'category', 'create')
    }, 10)
  }

  const duplicateCategory = async (cat: Category) => {
    setCategoryOverlay(cat.id)

    const categorysNameLength = categoriesMenu.filter((catF) => catF.name.includes(cat.name.split('- CÓPIA')[0].trim())).length ?? 0

    try {
      setShowSpinner(true)

      const catDuplicated = (await Category.API({
        type: 'DUPLICATE',
        session,
        data: Category.removeCategoryInstance(cat, (newCategory: CategoryType) => {
          newCategory.name = `${cat.name.split('- CÓPIA')[0]?.trim()} - CÓPIA ${categorysNameLength > 1 ? categorysNameLength : ''}`
          newCategory.order = categoriesMenu.length
        }),
        category: cat,
        categories: categoriesMenu,
        setCategories: setCategoriesMenu,
      })) as Category

      scrollToElement(`#${catDuplicated.type}-${catDuplicated.id}`)
      setShowSpinner(false)

      handleShowToast({
        show: true,
        type: 'success',
        title: 'Categoria',
        content: `${cat.name}, foi duplicada com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Categoria',
        content: `Não foi possível duplicar a categoria, ${cat.name}.`,
      })
    }
    setCategoryOverlay(-1)
  }

  const duplicateProduct = async (productMap: Product, categoryMap: Category) => {
    Product.remapValues(productMap)

    const productsCopyLength = categoryMap.products?.filter((prod) => prod.name.includes(productMap.name.split('- CÓPIA')[0].trim())).length ?? 0

    try {
      const newProduct = await Product.API({
        type: 'DUPLICATE',
        session,
        product: productMap,
        data: Product.removeInstance(productMap, (newProduct: ProductType) => {
          newProduct.name = `${productMap.name.split('- CÓPIA')[0]?.trim()} - CÓPIA ${productsCopyLength > 1 ? productsCopyLength : ''}`
          newProduct.order = categoryMap.products?.length ?? 0
          //@ts-ignore
          newProduct.complements = Complement.toDuplicate(newProduct.complements)
        }),
        categories,
        setCategories: setCategoriesMenu,
      })

      setCategoryMenu(new Category(categoryMenu))

      scrollToElement(`#product-${'id' in newProduct ? newProduct.id : ''}`, { position: 'center', scrollIntoView: true })

      handleShowToast({
        show: true,
        type: 'success',
        title: 'Produto',
        content: `${productMap.name}, foi duplicado com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Produto',
        content: `Não foi possível duplicar o produto, ${productMap.name}.`,
      })
    }
  }

  const pauseCategory = async (cat: Category) => {
    setCategoryOverlay(cat.id)
    try {
      await Category.API({
        type: 'STATUS',
        session,
        category: cat,
        categories: categoriesMenu,
        setCategories: setCategoriesMenu,
      })

      handleShowToast({
        show: true,
        type: 'success',
        title: 'Categoria',
        content: `${cat.name}, foi ${!cat.status ? 'pausada' : 'despausada'} com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Categoria',
        content: `Não foi possível ${cat.status ? 'pausar' : 'despausar'} a categoria, ${cat.name}.`,
      })
    }
    setCategoryOverlay(undefined)
  }

  const pauseProduct = async (productMap: Product) => {
    Product.remapValues(productMap)
    try {
      await Product.API({
        type: 'STATUS',
        session,
        product: productMap,
        data: Product.removeInstance(productMap),
      })

      handleShowToast({
        show: true,
        type: 'success',
        title: 'Produto',
        content: `${productMap.name}, foi ${!productMap.status ? 'pausado' : 'despausado'} com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Produto',
        content: `Não foi possível ${productMap.status ? 'pausar' : 'despausar'} o produto, ${productMap.name}.`,
      })
    }
  }

  const pausePizzaProductItem = async (
    itemToPause: PizzaFlavorType | PizzaSizeType | PizzaImplementationType,
    categoryMap: Category,
    property: 'size' | 'flavor' | 'implementation'
  ) => {
    const titleMessage = property === 'size' ? 'Tamanhos' : property === 'implementation' ? 'Bordas e Massas' : 'Sabores'

    try {
      if (categoryMap.product) {
        const { product } = categoryMap

        setOverlaySize({
          code: itemToPause.code,
        })

        await PizzaProduct.API({
          type: 'STATUS',
          property,
          session,
          product,
          itemCode: itemToPause.code,
          categories: categoriesMenu,
          setCategories: setCategoriesMenu,
        })

        handleShowToast({
          show: true,
          type: 'success',
          title: titleMessage,
          content: `${itemToPause.name}, foi ${itemToPause.status ? 'pausado' : 'despausado'} com sucesso.`,
        })
      }
    } catch (error) {
      console.error(error)

      handleShowToast({
        show: true,
        type: 'erro',
        title: titleMessage,
        content: `Não foi possível ${!itemToPause.status ? 'pausar' : 'despausar'}, ${itemToPause.name}.`,
      })
    } finally {
      setOverlaySize({
        code: '',
      })
    }
  }

  const popover = (
    <Popover id="popover-basic">
      <Popover.Header as="h3">Informações do Cardápio</Popover.Header>
      <Popover.Body>
        <Row className="border-bottom">
          <Col className="border-end pb-1" sm="9">
            <p className="m-0" title="Categorias Padrões">
              Cat. Padrão:{' '}
            </p>
            <p className="m-0">Qt. Produtos: </p>
            <p className="m-0">Qt. Complementos: </p>
          </Col>
          <Col className="pb -1" sm="3">
            <p className="m-0">{categories.filter((cat) => cat.type === 'default').length}</p>
            <p className="m-0">{categories.flatMap((cat) => cat.products).length}</p>
            <p className="m-0">
              {categories.flatMap((cat) => cat.products?.flatMap((prod) => prod.getAllComplements())).filter((comp) => comp).length}
            </p>
          </Col>
        </Row>
        <Row>
          <Col className="border-end pt-1" sm="9">
            <p className="m-0" title="Categorias Pizzas">
              Cat. Pizza:{' '}
            </p>
            <p className="m-0">Qt. Tamanhos: </p>
            <p className="m-0">Qt. Bordas/Massas: </p>
            <p className="m-0">Qt. Sabores: </p>
          </Col>
          <Col className="pt-1" sm="3">
            <p className="m-0">{categories.filter((cat) => cat.type === 'pizza').length}</p>
            <p className="m-0">{categories.flatMap((cat) => cat.product?.sizes.flat()).filter((el) => el).length}</p>
            <p className="m-0">{categories.flatMap((cat) => cat.product?.implementations.flat()).filter((el) => el).length}</p>
            <p className="m-0">{categories.flatMap((cat) => cat.product?.flavors.flat()).filter((el) => el).length}</p>
          </Col>
        </Row>
      </Popover.Body>
    </Popover>
  )

  const pizzaSizesMap = (categoryMap: Category, flavorMap: PizzaFlavorType, indexFlavor: number) => {
    const sizes = copy(categoryMap.product?.sizes) as PizzaSizeType[]
    return sizes.map((flavorSize, index) => {
      return (
        <Row key={`${flavorSize.code}`} className="my-2 mx-1 justify-content-between text-center text-nowrap p-0 align-items-center w-100 p">
          {
            <Col className="col-12 col-md-6 text-start text-wrap flex-grow-1">
              <span style={{ whiteSpace: 'break-spaces' }}>{flavorSize.name}</span>
            </Col>
          }
          <Col className="col-12 col-md-6">
            <Row className="justify-content-between">
              {(plansCategory?.includes('basic') || plansCategory?.includes('package')) && (
                <Col className="d-flex align-items-center gap-1 col-6">
                  {editingFlavorsMassive && categoryMenu.id === categoryMap.id ? (
                    <Form.Control
                      defaultValue={flavorMap.values[flavorSize.name] || 0}
                      className={`${index > 0 ? 'mt-1' : ''}`}
                      id={`flavor-${indexFlavor}-values-${index}`}
                      onChange={(e) => {
                        mask(e, 'currency')
                        setValuesFlavorsMassive(flavorMap, 'values', { value: Number(e.target.value), sizeName: flavorSize.name })
                      }}
                      onKeyDown={(e) => alignPositionEditingMassive(e, categoryMap, { type: 'values', index: indexFlavor, indexSize: index })}
                      style={{ width: 75, border: '1px solid #2285d0' }}
                    />
                  ) : (
                    <span style={{ padding: '.5px 1.5px', color: '#2285d0' }}>
                      {currency({ value: Number(flavorMap.values[flavorSize.name] || 0), currency: user?.controls?.currency })}
                    </span>
                  )}
                </Col>
              )}
              {plansCategory?.includes('table') && (
                <Col className="d-flex align-items-center justify-content-end gap-1 col-6 p-0">
                  {editingFlavorsMassive && categoryMenu.id === categoryMap.id ? (
                    <Form.Control
                      defaultValue={flavorMap.valuesTable[flavorSize.name] || 0}
                      id={`flavor-${indexFlavor}-valuesTable-${index}`}
                      className={`${index > 0 ? 'mt-1' : ''}`}
                      onChange={(e) => {
                        mask(e, 'currency')
                        setValuesFlavorsMassive(flavorMap, 'valuesTable', { value: Number(e.target.value), sizeName: flavorSize.name })
                      }}
                      onKeyDown={(e) => alignPositionEditingMassive(e, categoryMap, { type: 'valuesTable', index: indexFlavor, indexSize: index })}
                      style={{ width: 75, border: '1px solid #a4673f' }}
                    />
                  ) : (
                    <span style={{ padding: '.5px 1.5px', color: '#a4673f' }}>
                      {currency({
                        value: Number(flavorMap.valuesTable[flavorSize.name] || 0),
                        currency: user?.controls?.currency,
                      })}
                    </span>
                  )}
                  {/* {
                  plansCategory.length === 1 && <span className="badge badge-pill badge-light text-dark border border-dark p-1">{flavorSize.name}</span>
                } */}
                </Col>
              )}
            </Row>
          </Col>
          <Col className="d-flex align-items-center justify-content-end gap-1 col-3 p-0"></Col>
        </Row>
      )
    })
  }

  const setValuesProductMassive = (
    productMap: Partial<Product>,
    prop: 'name' | 'value' | 'valueTable' | 'promoteValue' | 'promoteValueTable' | 'id' | 'amount',
    value?: any,
    operation?: 'add' | 'subtract'
  ) => {
    const product = updateProductsMassive.find((prod) => prod.id === productMap.id)

    if (product) {
      if ((prop && value) || (prop === 'amount' && value === 0)) {
        const array = Object.entries(updateProductsMassive)
        const foundValue = array.findIndex((item) => item[1].id === product.id)
        array[foundValue][1][prop] = value
        setUpdateFlavorsMassive(Object.values(Object.fromEntries(array)))
      }
    } else {
      const newProduct = {
        id: productMap.id,
        [prop]: productMap[prop],
      }

      if (prop && value) {
        newProduct[prop] = value
      }

      if (prop === 'amount' && value === 0) {
        newProduct[prop] = value
      }

      setUpdateProductsMassive([...updateProductsMassive, newProduct])
    }
  }

  const setValuesFlavorsMassive = (
    flavor: Partial<PizzaFlavorType>,
    prop: 'name' | 'values' | 'valuesTable' | 'image' | 'amount',
    data?: { value?: any; sizeName?: string; amount?: number }
  ) => {
    const foundFlavor = updateFlavorsMassive.find((flv) => flv.code === flavor.code)

    //
    const setValues = (item: any) => {
      if (prop === 'amount') {
        item.amount = data?.amount
      }
      if (prop !== 'image') {
        if (prop === 'name') {
          item[prop] = data?.value
        } else {
          if (data && data.sizeName) {
            //@ts-ignore
            if (item[prop]) {
              item[prop][data.sizeName] = Number(data?.value) || 0
            } else {
              item[prop] = {
                [data.sizeName]: Number(data?.value) || 0,
              }
            }
          }
        }
      }
    }

    if (foundFlavor) {
      if (prop === 'amount' && data && (data[prop] || data[prop] === 0)) {
        const array = Object.entries(updateFlavorsMassive)
        const foundValue = array.findIndex((item) => item[1].code === flavor.code)
        array[foundValue][1][prop] = data[prop]
        setUpdateFlavorsMassive(Object.values(Object.fromEntries(array)))
      }
      setValues(foundFlavor)
    } else {
      const newFlavor: {
        code: string
        name?: string
        values?: {
          [key: string]: number
        }
        valuesTable?: {
          [key: string]: number
        }
        amount?: number
        amount_alert?: number
        bypass_amount?: boolean
      } = {
        code: flavor.code as string,
      }

      setValues(newFlavor)

      //@ts-ignore
      setUpdateFlavorsMassive([...updateFlavorsMassive, newFlavor])
    }
  }

  const editingMassiveCancel = (length: number, title: string) => {
    if (length > 0) {
      handleConfirmModal({
        title,
        message: `Você editou ${length} ${length > 1 ? 'itens' : 'item'}<br/> Deseja cancelar a edição?`,
        actionConfirm: () => {
          setEditingProductsMassive(false)
          setCategoriesMenu((oldCategories) => [...oldCategories])
          setEditingFlavorsMassive(false)
          setUpdateProductsMassive([])
          setUpdateFlavorsMassive([])

          imagesMassive.forEach((itemImage) => {
            const imageInput = document.getElementById(`productImage-${itemImage.id}`) as HTMLImageElement

            if (imageInput) {
              imageInput.src = itemImage.oldImage
            }
          })

          setImagesMassive([])
        },
      })
    } else {
      setEditingProductsMassive(false)
      setUpdateProductsMassive([])
      setCategoriesMenu((oldCategories) => [...oldCategories])
      setImagesMassive([])
      setEditingFlavorsMassive(false)
      setUpdateFlavorsMassive([])
    }
  }

  const updateItemsMassive = async (type: 'flavors' | 'products', arrUpdate: any[], categoryMap: Category) => {
    try {
      if (!arrUpdate.length) {
        return handleShowToast({
          title: type === 'flavors' ? 'Sabores' : 'Produtos',
          content: `Não há ${type === 'flavors' ? 'sabores' : 'produtos'} para atualizar.`,
          type: 'alert',
          show: true,
        })
      }

      setOverlayCategory(categoryMap.id)

      arrUpdate = arrUpdate.map((item) => {
        if (item.name?.trim() === '' || item.name?.trim() === null) {
          item.name = ''
        }

        if (item.name) {
          item.name = encryptEmoji(item.name)
        }

        return item
      })

      await Category.updateMassiveAPI(type, session, {
        categoryMap,
        arrUpdate,
        imagesMassive,
        categories: categoriesMenu,
        setCategories: setCategoriesMenu,
      })

      setEditingProductsMassive(false)
      setEditingFlavorsMassive(false)
      setUpdateFlavorsMassive([])
      setUpdateProductsMassive([])
      setImagesMassive([])

      handleShowToast({
        show: true,
        type: 'success',
        title: type === 'flavors' ? 'Sabores' : 'Produtos',
        content: `Todos os ${type === 'flavors' ? 'sabores' : 'produtos'} foram atualizados com sucesso.`,
      })

      setCategoryMenu(Category.newCategory(profile, 'default'))
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        type: 'erro',
        title: type === 'flavors' ? 'Sabores' : 'Produtos',
        content: `Não foi possível atualizar os ${type === 'flavors' ? 'sabores' : 'produtos'}.`,
      })
    } finally {
      setOverlayCategory(undefined)
    }
  }

  const resetValuesMassive = (categoryMap: Category, item: any) => {
    const propType = categoryMap.type === 'pizza' ? 'code' : 'id'

    if (categoryMap.product && categoryMap.type === 'pizza') {
      categoryMap.product?.sizes.forEach((sz) => {
        getAndSetterElementValue(`input#flavor-name-${item.code}`, { text: item.name }, 'value')
        getAndSetterElementValue(`input#flavor-${item.code}-values-${sz.name}`, { text: item.values[sz.name] }, 'value')
        getAndSetterElementValue(`input#flavor-${item.code}-valuesTable-${sz.name}`, { text: item.valuesTable[sz.name] }, 'value')
      })

      const newFlavors = updateFlavorsMassive.filter((flv) => flv.code !== item.code)
      setUpdateFlavorsMassive(newFlavors)
    } else if (categoryMap.products && categoryMap.type === 'default') {
      getAndSetterElementValue(`input[data-editing-name="${item.id}"]`, { text: item.name }, 'value')
      getAndSetterElementValue(`input[data-editing-value="${item.id}"]`, { text: item.promoteStatus ? item.promoteValue : item.value }, 'value')
      getAndSetterElementValue(
        `input[data-editing-value-table="${item.id}"]`,
        { text: item.promoteStatusTable ? item.promoteValueTable : item.valueTable },
        'value'
      )

      const newUpdateProducts = updateProductsMassive.filter((prod) => prod.id !== item.id)
      setUpdateProductsMassive(newUpdateProducts)
    }

    if (imagesMassive.find((prod) => prod.id == item[propType])) {
      const prodImageHtml = document.getElementById(`productImage-${item[propType]}`) as HTMLImageElement
      if (prodImageHtml) {
        prodImageHtml.src = item.image || '/images/no-img.jpeg'
      }

      const newImages = imagesMassive.filter((prod) => prod.id !== item[propType])
      setImagesMassive(newImages)
    }
  }

  const alignPositionEditingMassive = (
    e: React.KeyboardEvent,
    categoryMap: Category,
    { type, index, indexSize = 0 }: { type: string; index: number; indexSize?: number }
  ) => {
    if (e.altKey) {
      e.preventDefault()
      const value1 = type === 'value' ? 'value' : 'valueTable'
      const value2 = type === 'value' ? 'valueTable' : 'value'

      if (categoryMap.type === 'default') {
        switch (e.code) {
          case 'ArrowUp':
            inputFocus(`#product-${value1}-${index - 1}`, { queryParentElement: `#default-${categoryMap.id}`, differTop: -70, selectText: true })
            break
          case 'ArrowDown':
            inputFocus(`#product-${value1}-${index + 1}`, { queryParentElement: `#default-${categoryMap.id}`, differTop: -70, selectText: true })
            break
          case 'ArrowRight':
          case 'ArrowLeft':
            inputFocus(`#product-${value2}-${index}`, { queryParentElement: `#default-${categoryMap.id}`, differTop: -70, selectText: true })
        }
      } else {
        const sizes = categoryMap.product?.sizes || []
        const values1 = type === 'values' ? 'values' : 'valuesTable'
        const values2 = type === 'values' ? 'valuesTable' : 'values'
        switch (e.code) {
          case 'ArrowUp':
            const element = inputFocus(`#flavor-${index}-${values1}-${indexSize - 1}`, {
              queryParentElement: `#category-pizza-${categoryMap.product?.id}`,
              differTop: -70,
              selectText: true,
            })
            if (!element) {
              inputFocus(`#flavor-${index - 1}-${values1}-${sizes.length - 1}`, {
                queryParentElement: `#category-pizza-${categoryMap.product?.id}`,
                differTop: -70,
                selectText: true,
              })
            }
            break
          case 'ArrowDown':
            const element2 = inputFocus(`#flavor-${index}-${values1}-${indexSize + 1}`, {
              queryParentElement: `#category-pizza-${categoryMap.product?.id}`,
              differTop: -70,
              selectText: true,
            })
            if (!element2) {
              inputFocus(`#flavor-${index + 1}-${values1}-${0}`, {
                queryParentElement: `#category-pizza-${categoryMap.product?.id}`,
                differTop: -70,
                selectText: true,
              })
            }
            break
          case 'ArrowRight':
          case 'ArrowLeft':
            inputFocus(`#flavor-${index}-${values2}-${indexSize}`, {
              queryParentElement: `#category-pizza-${categoryMap.product?.id}`,
              differTop: -70,
              selectText: true,
            })
        }
      }
    }
  }

  const linkShare = (title: string, categoryMap: Category, productMap?: Product) => {
    const urlType = plansCategory.filter((plan) => plan !== 'table')[0] === 'basic' ? 'delivery' : 'package'
    const urlLink = (type: 'delivery' | 'package' = urlType) => {
      const urlBase = process.env.WHATSMENU_BASE_URL
      const urlCategory = `${urlBase}/${profile.slug}/${type}/${categoryMap.id}?time=${DateTime.local().toMillis()}`
      const urlProduct = `${urlBase}/${profile.slug}/${type}/${categoryMap.id}/${productMap?.id}?time=${DateTime.local().toMillis()}`

      return productMap ? urlProduct : urlCategory
    }

    let urlToShared = urlLink()

    return (
      <Popover id="popover-basic" style={{ zIndex: 10 }}>
        <Popover.Header as="h3" className="text-center">
          {window.innerWidth < 768 ? 'Produto' : 'Compartilhar'}
        </Popover.Header>
        <Popover.Body>
          <>
            {((plansCategory.length === 2 && !plansCategory.includes('table')) || plansCategory.length === 3) && (
              <FormGroup
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {plansCategory.map((plan, index, arr) => {
                  if (plan === 'basic' || plan === 'package') {
                    const label = plan === 'basic' ? 'Delivery' : profile.options.package.label2 ? 'Agendamentos' : 'Encomendas'
                    return (
                      <Form.Check
                        key={plan}
                        type="radio"
                        id={label}
                        label={label}
                        name="share"
                        defaultChecked={plan === 'basic' ? 'delivery' === urlType : 'package' === urlType}
                        onChange={(e) => {
                          if (e.target.checked) {
                            urlToShared = urlLink(plan === 'package' ? plan : 'delivery')
                          }
                        }}
                      />
                    )
                  }
                })}
              </FormGroup>
            )}
            <div className="d-flex gap-3 justify-content-center ">
              <a
                href={`${profile.options.linkWhatsapp ? 'whatsapp://' : 'https://api.whatsapp.com/'}send?text=${urlToShared}`}
                data-action={profile.options.linkWhatsapp ? 'share/whatsapp/share' : ''}
                rel="noreferrer"
                target="_blank"
              >
                <RiWhatsappFill color="green" size={30} title="Compartilhar no Whatsapp" style={{ pointerEvents: 'none' }} />
              </a>
              <FacebookShareButton url={urlToShared} className="cursor-pointer">
                <BsFacebook color="blue" size={27} title="Compartilhar no Facebook"></BsFacebook>
              </FacebookShareButton>
              <AiOutlineCopy
                size={30}
                className="cursor-pointer"
                title={'Copiar para o clipboard'}
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard?.writeText(urlToShared)
                    handleShowToast({
                      type: 'success',
                      title: 'Copiado',
                      content: `Link copiado com sucesso.`,
                      position: 'bottom-end',
                      flexPositionX: 'end',
                      classAdd: ' m-2 ',
                    })
                  } else {
                    handleShowToast({
                      type: 'erro',
                      title: 'Copiar',
                      content: `Não foi possível copiar o link, seu navegador não tem suporte.`,
                      position: 'bottom-end',
                      flexPositionX: 'end',
                      classAdd: ' m-2 ',
                    })
                  }
                }}
              />
            </div>
          </>
        </Popover.Body>
      </Popover>
    )
  }

  const handleChangeProductStatus = async (product: Product) => {
    if (product.id) {
      setOverlayProduct(product.id)
      await pauseProduct(product)
      setOverlayProduct(null)
    }
  }

  const handleChangeProductInventory = async ({
    productMap,
    operation,
    value,
  }: {
    productMap: any
    operation?: 'add' | 'subtract' | 'edit'
    value?: string
  }) => {
    switch (operation) {
      case 'add':
        productMap.amount = !productMap.amount ? 1 : productMap.amount + 1
        break
      case 'subtract':
        productMap.amount === undefined ? 0 : productMap.amount ? productMap.amount-- : 1
        break

      default:
        productMap.amount = Number(value)
        break
    }
    /* try {
      await Product.API({
        type: 'UPDATE',
        session,
        product: productMap,
        data: {
          amount: productMap.amount,
        },
      })
      handleShowToast({
        show: true,
        position: 'bottom-center',
        type: 'success',
        title: 'Estoque',
        content: `Estoque de ${productMap.name}, foi atualizado com sucesso.`,
      })
    } catch (error) {
      console.error(error)
      handleShowToast({
        show: true,
        position: 'bottom-center',
        type: 'erro',
        title: 'Estoque',
        content: `Não foi possível atualizar o estoque de ${productMap.name}.`,
      })
    } finally {
      setLoading(false)
    } */
  }

  const handleDuplicateProduct = async (product: Product, category: Category) => {
    if (product.id) {
      setOverlayProduct(product.id)
      await duplicateProduct(product, category)
      setOverlayProduct(null)
    }
  }

  const handleEditProduct = (product: Product, category: Category) => {
    setCategoryMenu(category)
    setProduct(product)
    setTimeout(() => {
      handleMenuModal(true, 'product', 'update')
    }, 1)
  }

  useEffect(() => {
    setCategories([...categoriesMenu])
  }, [categoriesMenu])

  useEffect(() => {
    setCategory(categoryMenu)
  }, [categoryMenu])

  useEffect(() => {
    if (searchValue.trim() !== '') {
      switch (usedFilter.value) {
        case 'products':
          setCategories(
            categoriesMenu.filter((categoryFilter) => {
              return (
                categoryFilter.type === 'default' &&
                categoryFilter.products?.some((prodFt) => normalizeCaracter(prodFt.name).includes(normalizeCaracter(searchValue)))
              )
            })
          )
          break
        case 'categories':
          setCategories(categoriesMenu.filter((categoryFilter) => normalizeCaracter(categoryFilter.name).includes(normalizeCaracter(searchValue))))
          break
        case 'flavors':
          setCategories(
            categoriesMenu.filter(
              (categoryFilter) =>
                categoryFilter.type === 'pizza' &&
                categoryFilter.product?.flavors.some((flavor) => normalizeCaracter(flavor.name).includes(normalizeCaracter(searchValue)))
            )
          )
          break
        case 'complements':
          setCategories(
            categoriesMenu.filter((categoryFilter) => {
              if (categoryFilter.products) {
                return categoryFilter.products?.some((prod) => {
                  return (
                    prod.complements?.some((compl) => normalizeCaracter(compl.name).includes(normalizeCaracter(searchValue))) ||
                    prod.complements?.some((compl) =>
                      compl.itens.some(
                        (item) =>
                          normalizeCaracter(item.name).includes(normalizeCaracter(searchValue)) ||
                          normalizeCaracter(item.description || '').includes(normalizeCaracter(searchValue))
                      )
                    )
                  )
                })
              }
            })
          )
          break
        case 'description':
          setCategories(
            categoriesMenu.filter((categoryFilter) => {
              if (categoryFilter.type === 'pizza') {
                return categoryFilter.product?.flavors.some((flavor) =>
                  normalizeCaracter(flavor.description || '').includes(normalizeCaracter(searchValue))
                )
              } else {
                return categoryFilter.products?.some((prod) => normalizeCaracter(prod.description || '').includes(normalizeCaracter(searchValue)))
              }
            })
          )
          break
        default:
          setCategories(categoriesMenu)
          break
      }
    } else {
      setCategories(categoriesMenu)
    }
  }, [searchValue, usedFilter, categoriesMenu])

  useEffect(() => {
    const categoryScroll = document.getElementById(
      `${categoryMenu.type === 'default' ? `default-${categoryMenu.id}` : `category-pizza-${categoryMenu.product?.id}`}`
    ) as HTMLElement

    if (editingProductsMassive || editingFlavorsMassive) {
      // categoryScroll.style.maxHeight = "calc(100vh - 60px)";
      // categoryScroll.classList.add("overflow-auto");

      scrollToElement(`#default-${categoryMenu.id}`)
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
      // if (categoryScroll) {
      //   categoryScroll.style.maxHeight = "unset";
      //   categoryScroll.classList.remove("overflow-auto");
      // }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProductsMassive, editingFlavorsMassive])

  function verifyAvailability(product: ProductType | PizzaProductType | PizzaFlavorType, type: 'alert' | 'absolute' = 'absolute') {
    if (!profile.options.inventoryControl) return true
    const amount = product?.amount
    const bypass = product.bypass_amount
    if (bypass) return true
    if (amount && amount > (type === 'absolute' ? 0 : product.amount_alert || 0)) return true
    return false
  }

  function verifyPizzaComplementAvailability(complement: ComplementType, type: 'alert' | 'absolute') {
    if (!profile.options.inventoryControl) return true
    for (const item of complement.itens) {
      const amount = item?.amount
      const bypass = item.bypass_amount
      if (bypass) return true
      if ((amount || 0) <= (type === 'absolute' ? 0 : item.amount_alert || 0)) return false
    }
    return true
  }

  return (
    <>
      {(editingProductsMassive || editingFlavorsMassive) && (
        <div className="position-fixed" style={{ zIndex: 999, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, .3)' }}></div>
      )}

      <div>
        <Title title="Cardápio">
          <HelpVideos.Trigger
            className='my-3'
            urls={[
              { src: 'https://www.youtube.com/embed/-q9IyNjfdQ0', title: 'Açaís e Sorvetes' },
              { src: 'https://www.youtube.com/embed/n2TWneze46w', title: 'Hambúrgueres' },
              { src: 'https://www.youtube.com/embed/GgQy6o3k3MU', title: 'Marmitas' },
              { src: 'https://www.youtube.com/embed/MSR366YYiXQ', title: 'Marmitas com escolha de tamanhos' },
              { src: 'https://www.youtube.com/embed/ZFCIXM7V13M', title: 'Monte sua marmita' },
              { src: 'https://www.youtube.com/embed/zVAarMwsCHI', title: 'Pizzas' },
              { src: 'https://www.youtube.com/embed/PfOQuhCfR5A', title: 'Combo pizzas' },
              { src: 'https://www.youtube.com/embed/9drpc_IgYrM', title: 'Hortifruit' },
              { src: 'https://www.youtube.com/embed/LQg6D_OnvN4', title: 'Açougue' },
              { src: 'https://www.youtube.com/embed/aFJxzkenaYU', title: 'Bebidas' },
            ]}
          />
        </Title>
        <p className="small">
          O cardápio é sua vitrine de produtos no <b>WhatsMenu</b>. Aqui você pode criar categorias, inserir itens, complementos e opcionais, definir
          disponibilidade e alterar preços.
          <br />
          <b>Link de divulgação:</b>{' '}
          <a
            rel="noreferrer"
            style={{ wordBreak: 'break-all' }}
            href={`${process.env.WHATSMENU_BASE_URL}/${profile.slug}`}
            target="_blank"
          >{`${process.env.WHATSMENU_BASE_URL}/${profile.slug}`}</a>
        </p>
        <Row>
          <Col md className="mt-4">
            <Card className="border-green">

              <Card.Body>
                <Row className="mt-2 justify-content-between text-nowrap px-2">
                  <Col sm="12" lg="7" className="d-flex flex-wrap flex-column flex-md-row mb-2 mb-md-0 gap-2  p-0">
                    <Button
                      variant="primary"
                      className={'menu-profile-add-category flex-grow-1 flex-lg-grow-0 px-5 '}
                      onClick={setNewCategory}
                      style={{ flex: '0 0 50px' }}
                      onMouseEnter={(e) => setCategoryMenu(Category.newCategory(profile, 'default', categories))}
                    >
                      + Adicionar Categoria
                    </Button>
                    <Button
                      variant="primary"
                      className="menu-profile-add-category flex-grow-1 flex-lg-grow-0 px-5 mt-0"
                      // disabled={!categories.length}
                      style={{ flex: '0 0 50px' }}
                      onClick={() => handleMenuModal(true, 'reorder')}
                    >
                      Reordernar Cardápio
                    </Button>
                  </Col>
                  <Col sm="12" lg="5" className="d-flex  gap-2 p-0 mt-2 mt-lg-0">
                    <InputGroup className="mt-1 mt-md-0 flex-column flex-md-row gap-2 gap-md-0 flex-md-nowrap justify-content-md-end ">
                      <div className="d-flex flex-grow-1 flex-lg-grow-0">
                        <InputGroup.Text style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                          <BsSearch />
                        </InputGroup.Text>
                        <div className="flex-grow-1 flex-lg-grow-0 p-0 m-0">
                          <FormControl
                            aria-label="Pesquisar"
                            placeholder="Pesquisar..."
                            className="menu-profile-search-input w-100 h-100"
                            style={{ borderRadius: 0 }}
                            onChange={(e) => {
                              setTimeout(() => {
                                setSearchValue(e.target.value)
                              }, 10)
                            }}
                          />
                        </div>
                      </div>
                      <DropdownButton
                        variant="primary"
                        title={usedFilter.name}
                        id="input-group-dropdown-4"
                        align="end"
                        className="d-md-block"
                      // style={{display: window.innerWidth < 380 ? "block" : "inline-block"}}
                      >
                        {[
                          { name: 'Produtos', value: 'products' },
                          { name: 'Complementos', value: 'complements' },
                          { name: 'Descrição', value: 'description' },
                          { name: 'Categorias', value: 'categories' },
                          { name: 'Sabores de Pizza', value: 'flavors' },
                        ].map((mapFilter) => (
                          <Dropdown.Item
                            key={mapFilter.value}
                            href="#"
                            onClick={(e: any) => {
                              setUsedFilter(mapFilter)
                            }}
                          >
                            {mapFilter.name}
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                    </InputGroup>
                    {window.innerWidth > 600 && (
                      <OverlayTrigger placement="left" overlay={popover}>
                        <Button variant="none" className="p-0 m-0 ms-2 ms-2">
                          <BsInfoCircle size={30} />
                        </Button>
                      </OverlayTrigger>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <section className="position-relative">
          <article className="mt-3">
            {categories.length ? (
              categories
                .sort((a, b) => {
                  if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order
                  }
                  return 0
                })
                .map((categoryMap) => {
                  if (categoryMap.type === 'pizza') {
                    const catEdition = editingFlavorsMassive && categoryMenu.id === categoryMap.id
                    return (
                      <Row key={categoryMap.id} id={`pizza-${categoryMap.id}`}>
                        <Col sm>
                          <Card className="border-green">
                            <Card.Header
                              className={`position-relative d-flex justify-content-start align-items-center overflow-auto ${categoryMap.status && verifyAvailability(categoryMap?.product as PizzaProductType)
                                ? verifyAvailability(categoryMap?.product as PizzaProductType, 'alert')
                                  ? ''
                                  : 'wm-warning'
                                : 'wm-request-canceled'
                                }`}
                            >
                              {(plansCategory.includes('package') || plansCategory.includes('basic')) && (
                                <OverlayTrigger rootClose trigger={'click'} placement="right" overlay={linkShare(categoryMap.name, categoryMap)}>
                                  <Button
                                    id={`product-share-${categoryMap.id}`}
                                    variant="gray"
                                    className="buttons-link-share"
                                    style={{ marginRight: 5 }}
                                  >
                                    <FaEllipsisV size={15} className="cursor-pointer" />
                                  </Button>
                                </OverlayTrigger>
                              )}
                              <span className="d-sm-inline d-block fs-5 fw-600 text-nowrap">
                                <b>{categoryMap.name} | </b>
                                {/* <b>{categoryMap.name} | </b> */}
                              </span>
                              <span className="d-flex align-items-center flex-grow-1">
                                <ButtonGroup className="mt-sm-auto">
                                  <Button
                                    variant="link"
                                    disabled={editingFlavorsMassive}
                                    className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                    onClick={(e) => pauseCategory(categoryMap)}
                                  >
                                    {categoryMap.status ? 'Pausar' : 'Despausar'}
                                  </Button>
                                  <Button
                                    variant="link"
                                    className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                    disabled={editingFlavorsMassive}
                                    onClick={(e) => duplicateCategory(categoryMap)}
                                  >
                                    Duplicar
                                  </Button>
                                  {/* <Button variant="link" className={`text-decoration-none fs-7 mt-1 ${categoryMap.product?.amount ? "" : "link-danger"}`} disabled={editingFlavorsMassive}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap);
                                      handleMenuModal(
                                        true,
                                        "category",
                                        "update"
                                      );
                                    }}>Estoque: {categoryMap.product?.amount}</Button> */}

                                  <Button
                                    variant="link"
                                    className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                    disabled={editingFlavorsMassive}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)
                                      handleMenuModal(true, 'category', 'update')
                                    }}
                                  >
                                    Editar
                                  </Button>
                                </ButtonGroup>

                                {profile.options.inventoryControl ? (
                                  <>
                                    <div className="vr mx-2"></div>
                                    <div className="text-nowrap fw-normal text-dark d-flex justify-content-end flex-grow-1 align-items-center gap-2 small mt-1  fs-8">
                                      Estoque:
                                      <>
                                        <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-warning"></span>
                                        <span style={{ color: '#2285d0' }}>Baixo</span>
                                      </>
                                      <>
                                        <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-canceled"></span>
                                        <span style={{ color: '#2285d0' }}>Esgotado</span>
                                      </>
                                    </div>
                                  </>
                                ) : null}
                              </span>
                              {categoryOverlay === categoryMap.id ? (
                                <OverlaySpinner show={true} backdropBlur={0.8} className="fs-3 text-white" />
                              ) : null}
                            </Card.Header>
                            <Card.Body>
                              <Card className="my-3 border-green-dashed overflow-auto">
                                <Card.Body className="p-0">
                                  <Table hover responsive className="align-middle mb-0 text-nowrap last">
                                    <thead className="text-white">
                                      <tr>
                                        <th className="text-uppercase" colSpan={4} style={{ color: '#f35' }}>
                                          Tamanho
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {categoryMap.product?.sizes?.map((sizeMap) => {
                                        return (
                                          <tr
                                            key={sizeMap.code}
                                            className={`position-relative ${sizeMap.status ? '' : 'wm-request-canceled border-0'}`}
                                          >
                                            <td>
                                              <Container fluid>
                                                <Row key={sizeMap.code} className="align-items-center">
                                                  <Col
                                                    className="overflow-hidden col-12 col-md-5"
                                                    onClick={() => {
                                                      if (window.innerWidth < 768) {
                                                        setCategoryMenu(categoryMap)
                                                        setSize(sizeMap)
                                                        setTimeout(() => {
                                                          handleMenuModal(true, 'pizzaSize', 'update', 'covers')
                                                        }, 200)
                                                      }
                                                    }}
                                                  >
                                                    <span className="my-auto">{sizeMap.name}</span>
                                                  </Col>
                                                  <Col className="col-12 col-md-7">
                                                    <ButtonGroup className="d-flex justify-content-between">
                                                      <div>
                                                        <Button
                                                          variant="link"
                                                          className="link-danger fs-7 text-decoration-none"
                                                          onClick={() => {
                                                            setCategoryMenu(categoryMap)
                                                            setSize(sizeMap)
                                                            setTimeout(() => {
                                                              handleMenuModal(true, 'pizzaSize', 'update', 'covers')
                                                            }, 200)
                                                          }}
                                                        >
                                                          Editar Capa
                                                        </Button>
                                                      </div>
                                                      <ButtonGroup className="d-flex">
                                                        <Button
                                                          variant="link text-decoration-none"
                                                          className={`fs-7  ${sizeMap.status ? '' : 'link-danger'}`}
                                                          onClick={async () => await pausePizzaProductItem(sizeMap, categoryMap, 'size')}
                                                        >
                                                          <span>{!sizeMap.status ? 'Despausar' : 'Pausar'}</span>
                                                        </Button>
                                                        <Button
                                                          variant="link text-decoration-none"
                                                          className={`fs-7  ${sizeMap.status ? '' : 'link-danger'}`}
                                                          onClick={() => {
                                                            setCategoryMenu(categoryMap)
                                                            setSize(sizeMap)

                                                            setTimeout(() => {
                                                              handleMenuModal(true, 'pizzaSize', 'update', 'details')
                                                            }, 50)
                                                          }}
                                                        >
                                                          Editar
                                                        </Button>
                                                      </ButtonGroup>
                                                    </ButtonGroup>
                                                  </Col>
                                                </Row>
                                              </Container>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </Table>
                                </Card.Body>
                                <Card.Footer className="m-0 p-0 py-1" style={{ backgroundColor: '#F3FCDD' }}>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="fw-bold text-decoration-none m-0 "
                                    style={{ color: '#35C400' }}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)
                                      setSize(PizzaProduct.newSize())
                                      handleMenuModal(true, 'pizzaSize', 'create')
                                    }}
                                  >
                                    + Adicionar Tamanho
                                  </Button>
                                </Card.Footer>
                              </Card>
                              <Card className="my-3 border-green-dashed">
                                <Card.Body className="p-0">
                                  <Table hover responsive className="align-middle mb-0 text-nowrap last">
                                    <thead className="text-white">
                                      <tr>
                                        <th className="text-uppercase" style={{ color: '#f35' }}>
                                          Bordas e Massas
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {categoryMap.product?.implementations.map((implementationMap) => {
                                        return (
                                          <tr
                                            key={implementationMap.code}
                                            className={`position-relative ${implementationMap.status ? '' : 'wm-request-canceled border-0'}`}
                                          >
                                            <td
                                              onClick={() => {
                                                setCategoryMenu(categoryMap)
                                                setImplementation(implementationMap)
                                                handleMenuModal(true, 'pizzaImplementation', 'update')
                                              }}
                                            >
                                              <Container fluid>
                                                <Row className="align-items-center">
                                                  <Col sm="12" md="5" className="py-1">
                                                    {implementationMap.name}
                                                  </Col>
                                                  <Col sm="12" md="7">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                      <span className="ps-2">
                                                        {currency({ value: implementationMap.value, currency: user?.controls?.currency })}
                                                      </span>
                                                      <ButtonGroup
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                        }}
                                                      >
                                                        <Button
                                                          variant="link"
                                                          className={`text-decoration-none fs-7 ${implementationMap.status ? '' : 'link-danger'}`}
                                                          onClick={async () => {
                                                            await pausePizzaProductItem(implementationMap, categoryMap, 'implementation')
                                                          }}
                                                        >
                                                          <span>{!implementationMap.status ? 'Despausar' : 'Pausar'}</span>
                                                        </Button>
                                                        <Button
                                                          variant="link"
                                                          className={`text-decoration-none fs-7 ${implementationMap.status ? '' : 'link-danger'}`}
                                                          onClick={() => {
                                                            setCategoryMenu(categoryMap)
                                                            setImplementation(implementationMap)
                                                            handleMenuModal(true, 'pizzaImplementation', 'update')
                                                          }}
                                                        >
                                                          <span>Editar</span>
                                                        </Button>
                                                      </ButtonGroup>
                                                    </div>
                                                  </Col>
                                                </Row>
                                              </Container>

                                              {implementationMap.code === overlaySize.code ? (
                                                <OverlaySpinner show={true} backgroundColor="rgba(0, 0, 0, .05)" />
                                              ) : null}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </Table>
                                </Card.Body>
                                <Card.Footer className="p-0 py-1" style={{ backgroundColor: '#F3FCDD' }}>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="fw-bold text-decoration-none"
                                    style={{ color: '#35C400' }}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)

                                      setTimeout(() => {
                                        handleMenuModal(true, 'pizzaImplementation', 'create')
                                      }, 10)
                                    }}
                                  >
                                    + Adicionar Item
                                  </Button>
                                </Card.Footer>
                              </Card>

                              <Card className="my-3 border-green-dashed">
                                <Card.Body className="p-0">
                                  <Table hover responsive className="align-middle mb-0 text-nowrap last">
                                    <thead className="text-white">
                                      <tr className="d-flex w-100">
                                        <th className="text-uppercase" style={{ color: '#f35' }}>
                                          Complementos
                                        </th>
                                        <th>
                                          {' '}
                                          <div className="text-nowrap fw-normal text-dark d-flex justify-content-end flex-grow-1 align-items-center gap-2 small mt-1  fs-8">
                                            Estoque:
                                            {/* <>
                                            <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-warning"></span>
                                            <span style={{ color: '#2285d0' }}>Baixo</span>
                                          </> */}
                                            <>
                                              <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-canceled"></span>
                                              <span style={{ color: '#2285d0' }}>Esgotado</span>
                                            </>
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {categoryMap.product?.complements.map((complement) => (
                                        <tr
                                          key={complement.id}
                                          className={`${verifyPizzaComplementAvailability(complement, 'absolute')
                                            ? verifyPizzaComplementAvailability(complement, 'alert')
                                              ? ''
                                              : 'wm-warning border-0'
                                            : 'wm-request-canceled border-0'
                                            }`}
                                        >
                                          <td>
                                            <Container fluid>
                                              <Row className="align-items-center">
                                                <Col sm className="py-1">
                                                  {complement.name}
                                                </Col>
                                                <Col sm className="py-1 d-flex justify-content-end">
                                                  <ButtonGroup
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                    }}
                                                  >
                                                    <Button
                                                      variant="link"
                                                      className={`text-decoration-none fs-7`}
                                                      onClick={() => {
                                                        setFocusId(complement.id)
                                                        setCategoryMenu(categoryMap)
                                                        handleMenuModal(true, 'pizzaComplement', 'update')
                                                      }}
                                                    >
                                                      <span>Editar</span>
                                                    </Button>
                                                  </ButtonGroup>
                                                </Col>
                                              </Row>
                                            </Container>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </Card.Body>
                                <Card.Footer className="p-0 py-1" style={{ backgroundColor: '#F3FCDD' }}>
                                  <Button
                                    size="sm"
                                    variant="link"
                                    className="fw-bold text-decoration-none"
                                    style={{ color: '#35C400' }}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)

                                      setTimeout(() => {
                                        handleMenuModal(true, 'pizzaComplement', 'create')
                                      }, 10)
                                    }}
                                  >
                                    + Adicionar Complemento(s)
                                  </Button>
                                </Card.Footer>
                              </Card>
                              <Card
                                id={`category-pizza-${categoryMap?.product?.id}`}
                                className={`border-green-dashed ${catEdition ? 'overflow-auto' : 'my-3'}`}
                                style={{
                                  zIndex: catEdition ? 999 : 0,
                                  marginTop: catEdition ? '60px' : 'unset',
                                  maxHeight: catEdition ? 'calc(100vh - 60px)' : 'unset',
                                }}
                              >
                                <Card.Header
                                  id={`flavors-${categoryMap.id}`}
                                  className="overflow-auto pb-3"
                                  style={{ minHeight: catEdition ? '70px' : 'unset' }}
                                >
                                  <div className="d-flex align-items-center justify-content-between flex-column flex-md-row">
                                    <div className="d-flex align-items-center text-uppercase justify-content-between w-100">
                                      {editingFlavorsMassive && (
                                        <Form.Control
                                          type="text"
                                          className="position-absolute"
                                          style={{ opacity: 0, top: -100000 }}
                                          onFocus={() =>
                                            inputFocus(`#flavor-name-${categoryMap.product?.flavors ? categoryMap.product.flavors[0].code : ''}`)
                                          }
                                        />
                                      )}
                                      <span className="pe-3 border-dark border-4 border-end fw-bold" style={{ color: 'rgb(255, 51, 85)' }}>
                                        Sabores
                                      </span>
                                      {editingFlavorsMassive && categoryMap.id === categoryMenu.id ? (
                                        <Button
                                          variant="link"
                                          className="text-red-500 me-auto text-decoration-none fs-7"
                                          onClick={() => editingMassiveCancel(updateFlavorsMassive.length, 'Editar Sabores')}
                                        >
                                          Cancelar Edição
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="link"
                                          className="me-md-auto text-decoration-none fs-7"
                                          disabled={!categoryMap.product?.flavors.length}
                                          onClick={() => {
                                            setCategoryMenu(categoryMap)
                                            setEditingFlavorsMassive(true)
                                            scrollToElement(`#flavors-${categoryMap.id}`)
                                          }}
                                        >
                                          Editar Sabores
                                        </Button>
                                      )}
                                    </div>
                                    <span className="text-nowrap fw-normal text-dark d-flex align-items-center gap-2 small fs-8">
                                      Preços:
                                      {(plansCategory?.includes('basic') || (plansCategory?.includes('package') && plansCategory.length > 1)) && (
                                        <>
                                          <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-request-delivery"></span>
                                          <span style={{ color: '#2285d0' }}>
                                            {textDeliveryOrPackage(plansCategory, profile.options.package.label2)}
                                          </span>
                                        </>
                                      )}
                                      {plansCategory?.includes('table') && (
                                        <>
                                          <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-table"></span>
                                          <span style={{ color: '#a4673f' }}>Mesa</span>
                                        </>
                                      )}
                                    </span>

                                    {profile.options.inventoryControl ? (
                                      <>
                                        <div className="d-none d-lg-block vr mx-4"></div>
                                        <div className="text-nowrap fw-normal text-dark d-flex align-items-center gap-2 small fs-8">
                                          Estoque:
                                          <>
                                            <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-warning"></span>
                                            <span style={{ color: '#2285d0' }}>Baixo</span>
                                          </>
                                          <>
                                            <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-canceled"></span>
                                            <span style={{ color: '#2285d0' }}>Esgotado</span>
                                          </>
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                </Card.Header>
                                <Card.Body className="p-0">
                                  <Table
                                    hover
                                    responsive
                                    className="align-middle mb-0 text-nowrap last"
                                  // style={{ minWidth: window.innerWidth < 768 ? 850 : 0 }}
                                  >
                                    <tbody>
                                      {categoryMap.product?.flavors.map((flavorMap, indexFlavor) => {
                                        if (searchValue.trim() !== '') {
                                          if (
                                            usedFilter.value === 'flavors' &&
                                            !normalizeCaracter(flavorMap.name).includes(normalizeCaracter(searchValue))
                                          ) {
                                            return
                                          } else if (
                                            usedFilter.value === 'description' &&
                                            !normalizeCaracter(flavorMap.description || '').includes(normalizeCaracter(searchValue))
                                          ) {
                                            return
                                          }
                                        }

                                        const catEdition = editingFlavorsMassive && categoryMenu.id === categoryMap.id

                                        return (
                                          <tr
                                            key={flavorMap.code}
                                            className={`position-relative ${flavorMap.status ? '' : 'wm-request-canceled border-0'}`}
                                          >
                                            <td
                                              className={`${flavorMap.status && verifyAvailability(flavorMap)
                                                ? verifyAvailability(flavorMap, 'alert')
                                                  ? ''
                                                  : 'wm-warning'
                                                : 'wm-request-canceled'
                                                }`}
                                              onClick={() => {
                                                if (window.innerWidth < 768 && !catEdition) {
                                                  setCategoryMenu(categoryMap)
                                                  setFlavor(flavorMap)
                                                  handleMenuModal(true, 'pizzaFlavor', 'update')
                                                }
                                              }}
                                            >
                                              <Container fluid>
                                                <Row className="align-items-center">
                                                  <Col sm="12" md="4">
                                                    <Row className="align-items-center">
                                                      <Col className="col-4">
                                                        <div
                                                          className={`position-relative ${editingProductsMassive ? 'p-1' : ''}`}
                                                          onMouseOver={() => {
                                                            if (flavorMap.description?.trim()) {
                                                              const elementDescription = document.getElementById(
                                                                `flavor-description-${flavorMap.code}`
                                                              )

                                                              if (elementDescription) {
                                                                elementDescription.classList.remove(`hidden-dinamic-description`)
                                                                elementDescription.classList.add(`show-dinamic-description`)
                                                              }
                                                            }
                                                          }}
                                                          onMouseOut={() => {
                                                            if (flavorMap.description?.trim()) {
                                                              const elementDescription = document.getElementById(
                                                                `flavor-description-${flavorMap.code}`
                                                              )

                                                              if (elementDescription) {
                                                                elementDescription.classList.remove(`show-dinamic-description`)
                                                                elementDescription.classList.add(`hidden-dinamic-description`)
                                                              }
                                                            }
                                                          }}
                                                        >
                                                          <label
                                                            htmlFor={`input-image-${flavorMap.code}`}
                                                            className={`${editingFlavorsMassive ? 'cursor-pointer position-relative' : ''
                                                              } zoom-in-image`}
                                                          >
                                                            <Figure.Image
                                                              loading="lazy"
                                                              className="flex-grow-1 my-auto "
                                                              alt="Imagem do Sabor"
                                                              src={flavorMap.image || '/images/no-img.jpeg'}
                                                              id={`productImage-${flavorMap.code}`}
                                                              style={{ display: 'block', minWidth: '75px', height: '45px' }}
                                                            />

                                                            {editingFlavorsMassive && (
                                                              <span
                                                                className="position-absolute d-block w-100 fs-9 text-center text-white d-flex align-items-center justify-content-center"
                                                                style={{ top: '0px', zIndex: 10, backgroundColor: 'rgba(0, 0, 0, .4)' }}
                                                              >
                                                                <MdPhotoLibrary size={10} color="#fff" />
                                                                <span className="fs-8 text-white ps-2">Foto</span>
                                                              </span>
                                                            )}
                                                          </label>
                                                          {editingFlavorsMassive && (
                                                            <Form.Control
                                                              type="file"
                                                              id={`input-image-${flavorMap.code?.toString()}`}
                                                              accept="image/*"
                                                              data-product-id={flavorMap.code}
                                                              data-product-old-image={flavorMap.image}
                                                              className="position-absolute"
                                                              style={{ visibility: 'hidden', top: -10000000 }}
                                                              onChange={(e) => {
                                                                setInputFileImage(e.target as HTMLInputElement)
                                                                setValuesFlavorsMassive(flavorMap, 'image')
                                                              }}
                                                            />
                                                          )}

                                                          <div
                                                            id={`flavor-description-${flavorMap.code}`}
                                                            className="position-absolute bg-white d-flex align-items-start fs-8 rounded hidden-dinamic-description text-wrap overflow-hidden"
                                                            style={{
                                                              left: '115%',
                                                              /*top: 0,*/ bottom: 0,
                                                              width: 0,
                                                              height: 0,
                                                              zIndex: 10,
                                                              textOverflow: 'ellipsis',
                                                            }}
                                                          >
                                                            <span>
                                                              {flavorMap.description?.length >= 167
                                                                ? flavorMap.description.slice(0, 167) + '...'
                                                                : flavorMap.description}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      </Col>
                                                      <Col>
                                                        <div className="">
                                                          {editingFlavorsMassive && categoryMenu.id === categoryMap.id ? (
                                                            <div className="d-flex gap-2 align-items-center">
                                                              <Form.Control
                                                                defaultValue={flavorMap.name}
                                                                id={`flavor-name-${flavorMap.code}`}
                                                                autoFocus={indexFlavor === 0}
                                                                onChange={(e) => {
                                                                  setValuesFlavorsMassive(flavorMap, 'name', { value: e.target.value, sizeName: '' })
                                                                }}
                                                                onKeyDown={(e) => modifyFontValues(e, {})}
                                                              />
                                                              {updateFlavorsMassive.find((flv) => flv.code === flavorMap.code) ? (
                                                                <span
                                                                  title="Descartar alterações"
                                                                  className="cursor-pointer"
                                                                  onClick={() => resetValuesMassive(categoryMap, flavorMap)}
                                                                >
                                                                  <FaUndo color="red" size={20} />
                                                                </span>
                                                              ) : (
                                                                <span>
                                                                  <FaUndo color="white" style={{ visibility: 'hidden' }} size={20} />
                                                                </span>
                                                              )}
                                                            </div>
                                                          ) : (
                                                            <span style={{ whiteSpace: 'break-spaces' }}>{flavorMap.name}</span>
                                                          )}
                                                        </div>
                                                      </Col>
                                                    </Row>
                                                  </Col>
                                                  <Col sm="12" md="6" className="px-0">
                                                    {pizzaSizesMap(categoryMap, flavorMap, indexFlavor)}
                                                    {editingFlavorsMassive && (
                                                      <div className="d-flex my-2 w-100 align-items-center justify-content-center">
                                                        {!flavorMap.bypass_amount && profile.options.inventoryControl ? (
                                                          <InputGroup className="position-relative">
                                                            <Button
                                                              variant="secondary"
                                                              onClick={() =>
                                                                setValuesFlavorsMassive(flavorMap, 'amount', {
                                                                  amount:
                                                                    (updateFlavorsMassive.find((item) => item.code === flavorMap.code)?.amount ||
                                                                      flavorMap.amount ||
                                                                      0) - 1,
                                                                })
                                                              }
                                                            >
                                                              -
                                                            </Button>
                                                            {updateFlavorsMassive.find((item) => item.code === flavorMap.code) ? (
                                                              <Form.Control
                                                                readOnly
                                                                value={updateFlavorsMassive.find((item) => item.code === flavorMap.code)?.amount}
                                                                name="amount"
                                                                className="text-center"
                                                              />
                                                            ) : (
                                                              <Form.Control
                                                                readOnly
                                                                value={flavorMap.amount || 0}
                                                                name="amount"
                                                                className="text-center"
                                                              />
                                                            )}

                                                            <Button
                                                              className="rounded-end"
                                                              variant="secondary"
                                                              style={{ minWidth: '34.75px' }}
                                                              onClick={() =>
                                                                setValuesFlavorsMassive(flavorMap, 'amount', {
                                                                  amount:
                                                                    (updateFlavorsMassive.find((item) => item.code === flavorMap.code)?.amount ||
                                                                      flavorMap.amount ||
                                                                      0) + 1,
                                                                })
                                                              }
                                                            >
                                                              +
                                                            </Button>
                                                            <Form.Control.Feedback tooltip type="invalid">
                                                              Por favor insira um valor válido!
                                                            </Form.Control.Feedback>
                                                          </InputGroup>
                                                        ) : (
                                                          <p className="fw-bold mb-0" style={{ color: 'rgb(53, 196, 0)' }}>
                                                            EM ESTOQUE
                                                          </p>
                                                        )}
                                                      </div>
                                                    )}
                                                  </Col>
                                                  <Col sm="12" md="2" className="text-center py-1">
                                                    <ButtonGroup className="mt-sm-auto" onClick={(e) => e.stopPropagation()}>
                                                      <Button
                                                        variant="link"
                                                        className={`text-decoration-none fs-7 ${flavorMap.status ? '' : 'link-danger'}`}
                                                        tabIndex={editingFlavorsMassive ? -1 : 0}
                                                        onClick={async () => {
                                                          setOverlaySize({
                                                            code: flavorMap.code,
                                                          })
                                                          await pausePizzaProductItem(flavorMap, categoryMap, 'flavor')
                                                          setOverlaySize({ code: '' })
                                                        }}
                                                      >
                                                        {!flavorMap?.status ? 'Despausar' : 'Pausar'}
                                                      </Button>
                                                      <Button
                                                        variant="link"
                                                        className={`text-decoration-none fs-7 ${flavorMap.status ? '' : 'link-danger'}`}
                                                        tabIndex={editingFlavorsMassive ? -1 : 0}
                                                        disabled={editingFlavorsMassive}
                                                        onClick={() => {
                                                          setCategoryMenu(categoryMap)
                                                          setFlavor(flavorMap)
                                                          handleMenuModal(true, 'pizzaFlavor', 'update')
                                                        }}
                                                      >
                                                        <span>Editar</span>
                                                      </Button>
                                                    </ButtonGroup>
                                                  </Col>
                                                </Row>
                                              </Container>
                                              {overlaySize.code === flavorMap.code ? (
                                                <OverlaySpinner show={true} backgroundColor="rgba(0, 0, 0, .05)" />
                                              ) : null}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </Table>
                                </Card.Body>
                                {!editingFlavorsMassive && (
                                  <Card.Footer className="p-0 py-1" style={{ backgroundColor: '#F3FCDD' }}>
                                    <Button
                                      size="sm"
                                      variant="link"
                                      className="fw-bold text-decoration-none"
                                      style={{ color: '#35C400' }}
                                      onClick={() => {
                                        if (categoryMap.product) {
                                          if (!categoryMap.product.sizes?.length) {
                                            handleShowToast({
                                              title: 'Sabores',
                                              content: 'Para adicionar sabores, crie um tamanho de pizza primeiro.',
                                              type: 'alert',
                                            })

                                            return
                                          }
                                        }

                                        setCategoryMenu(categoryMap)
                                        setFlavor(PizzaProduct.newFlavor(categoryMap.product?.sizes || []))

                                        setTimeout(() => {
                                          handleMenuModal(true, 'pizzaFlavor', 'create')
                                        }, 10)
                                      }}
                                    >
                                      + Adicionar Sabor
                                    </Button>
                                  </Card.Footer>
                                )}
                                {editingFlavorsMassive && categoryMenu.id === categoryMap.id && (
                                  <div
                                    className="position-sticky p-4"
                                    style={{ bottom: 0, background: '#F3FCDD', borderTop: '3px solid #2bde85', zIndex: 10 }}
                                  >
                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                                      <div>
                                        <p className="m-0 text-dark text-center">
                                          {updateFlavorsMassive.length} {updateFlavorsMassive.length !== 1 ? 'sabores serão' : 'sabor será'}{' '}
                                          atualizado(s) agora.
                                        </p>
                                      </div>
                                      <div className="d-flex gap-2">
                                        <Button
                                          variant="danger"
                                          className="link-danger fw-bold text-decoration-none "
                                          onClick={() => editingMassiveCancel(updateFlavorsMassive.length, 'Editar Sabores')}
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="success"
                                          className="success fw-bold text-decoration-none"
                                          disabled={!updateFlavorsMassive.length}
                                          onClick={() => updateItemsMassive('flavors', updateFlavorsMassive, categoryMap)}
                                        >
                                          Salvar
                                        </Button>
                                      </div>
                                      {editingFlavorsMassive && (
                                        <Form.Control
                                          type="text"
                                          className="position-absolute"
                                          style={{ opacity: 0, top: -100000 }}
                                          onFocus={() =>
                                            inputFocus(`#flavor-name-${categoryMap.product?.flavors ? categoryMap.product.flavors[0].code : ''}`)
                                          }
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                                {overlayCategory === categoryMap.id ? (
                                  <OverlaySpinner
                                    show={true}
                                    backgroundColor="transparent"
                                    backdropBlur={1}
                                    textSpinner="Aguarde..."
                                    style={{ zIndex: 99999 }}
                                  />
                                ) : null}
                              </Card>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    )
                  }
                  if (categoryMap.type === 'default') {
                    const catEdition = editingProductsMassive && categoryMenu.id === categoryMap.id
                    return (
                      <Row key={categoryMap.id}>
                        <Col sm>
                          <Card
                            id={`default-${categoryMap.id}`}
                            className={`${catEdition ? 'position-relative border-green overflow-auto' : 'border-green'}`}
                            style={{ zIndex: catEdition ? 999 : 1, maxHeight: catEdition ? 'calc(100vh - 60px)' : 'unset' }}
                          >
                            <Card.Header
                              className={`p-0 p-md-1 position-relative d-flex justify-content-between align-items-center overflow-auto ${categoryMap.status ? '' : 'wm-request-canceled border-0'
                                }`}
                              style={{ minHeight: 50 }}
                            >
                              {editingProductsMassive && (
                                <Form.Control
                                  type="text"
                                  className="position-absolute"
                                  style={{ opacity: 0, top: -100000 }}
                                  onFocus={() => inputFocus(`#product-name-${categoryMap.products ? categoryMap.products[0].id : ''}`)}
                                />
                              )}
                              <div className={`d-flex align-items-center py-2 p-md-2 flex-column flex-md-row flex-grow-1`}>
                                <div className="d-flex gap-2 align-items-center">
                                  {(plansCategory.includes('package') || plansCategory.includes('basic')) && !editingProductsMassive && (
                                    <OverlayTrigger rootClose trigger={'click'} placement="right" overlay={linkShare(categoryMap.name, categoryMap)}>
                                      <Button
                                        id={`product-share-${categoryMap.id}`}
                                        variant="gray"
                                        className="buttons-link-share"
                                        style={{ marginRight: 5 }}
                                      >
                                        <FaEllipsisV size={15} className="cursor-pointer" />
                                      </Button>
                                    </OverlayTrigger>
                                  )}
                                  <span className="d-sm-inline d-block fs-5 fw-600 pe-2 text-nowrap">
                                    <b>{categoryMap.name} | </b>
                                    {/* <b>{categoryMap.name} | </b>   */}
                                  </span>
                                </div>

                                <div
                                  className="d-flex align-items-center justify-content-between w-100"
                                  style={{ flexDirection: window.innerWidth <= 1150 ? 'column' : 'row' }}
                                >
                                  <div className="d-sm-inline d-block align-middle ms-md-1">
                                    <ButtonGroup className="mt-sm-auto">
                                      <Button
                                        variant="link"
                                        className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                        disabled={editingProductsMassive}
                                        onClick={(e) => {
                                          pauseCategory(categoryMap)
                                        }}
                                      >
                                        {categoryMap.status ? 'Pausar' : 'Despausar'}
                                      </Button>
                                      <Button
                                        variant="link"
                                        className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                        disabled={editingProductsMassive}
                                        onClick={async () => {
                                          setCategoryOverlay(categoryMap.id)
                                          setCategoryMenu(categoryMap)
                                          await duplicateCategory(new Category(categoryMap))
                                          setCategoryOverlay(undefined)
                                        }}
                                      >
                                        Duplicar
                                      </Button>
                                      <Button
                                        variant="link"
                                        className={`text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                        disabled={editingProductsMassive}
                                        onClick={() => {
                                          setCategoryMenu((prevState) => categoryMap)
                                          setTimeout(() => {
                                            handleMenuModal(true, 'category', 'update')
                                          }, 1)
                                        }}
                                      >
                                        Editar
                                      </Button>
                                      {editingProductsMassive && categoryMenu.id === categoryMap.id ? (
                                        <Button
                                          variant="link"
                                          className="text-red-500 me-auto text-decoration-none fs-7 mt-1"
                                          onClick={() => editingMassiveCancel(updateProductsMassive.length, 'Editar Produtos')}
                                        >
                                          Cancelar Edição
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="link"
                                          className={`me-auto text-decoration-none fs-7 mt-1 ${categoryMap.status ? '' : 'link-danger'}`}
                                          disabled={!categoryMap.products?.length}
                                          onClick={() => {
                                            setCategoryMenu((prevState) => categoryMap)
                                            setEditingProductsMassive(true)
                                            scrollToElement(`#default-${categoryMap.id}`)
                                          }}
                                        >
                                          Editar Produtos
                                        </Button>
                                      )}
                                    </ButtonGroup>
                                  </div>
                                  <div className="vr d-none d-lg-block mx-2 mx-xxl-0"></div>
                                  <div className="text-nowrap fw-normal text-dark d-flex align-items-center gap-2 small fs-8">
                                    Preços:
                                    {(plansCategory?.includes('basic') || (plansCategory?.includes('package') && plansCategory.length > 1)) && (
                                      <>
                                        <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-request-delivery"></span>
                                        <span style={{ color: '#2285d0' }}>
                                          {textDeliveryOrPackage(plansCategory, profile.options.package.label2)}
                                        </span>
                                      </>
                                    )}
                                    {plansCategory?.includes('table') && (
                                      <>
                                        <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-table"></span>
                                        <span style={{ color: '#a4673f' }}>Mesa</span>
                                      </>
                                    )}
                                  </div>
                                  {profile.options.inventoryControl ? (
                                    <>
                                      <div className="vr d-none d-lg-block mx-2 mx-xxl-0"></div>
                                      <div className="text-nowrap fw-normal text-dark d-flex align-items-center gap-2 small fs-8">
                                        Estoque:
                                        <>
                                          <span className="rounded-circle d-inline-block align-middle p-2 ms-1 wm-warning"></span>
                                          <span style={{ color: '#2285d0' }}>Baixo</span>
                                        </>
                                        <>
                                          <span className="rounded-circle d-inline-block align-middle p-2 ms-2 wm-request-canceled"></span>
                                          <span style={{ color: '#2285d0' }}>Esgotado</span>
                                        </>
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </div>

                              {categoryOverlay === categoryMap.id ? <OverlaySpinner show={true} backdropBlur={0.6} /> : null}
                            </Card.Header>
                            {categoryMap.products && categoryMap.products?.length > 0 && (
                              <Card.Body className={`mt-0 p-0`}>
                                <Table responsive className="text-nowrap align-middle mb-0 table-hover last">
                                  <tbody>
                                    {categoryMap.products?.map((productMap, indexProd) => {
                                      if (searchValue.trim() !== '') {
                                        if (usedFilter.value === 'products') {
                                          if (!normalizeCaracter(productMap.name).includes(normalizeCaracter(searchValue))) {
                                            return
                                          }
                                        } else if (usedFilter.value === 'description') {
                                          if (!normalizeCaracter(productMap.description || '').includes(normalizeCaracter(searchValue))) {
                                            return
                                          }
                                        } else if (usedFilter.value === 'complements') {
                                          if (
                                            !(
                                              productMap.complements?.some((compl) =>
                                                normalizeCaracter(compl.name).includes(normalizeCaracter(searchValue))
                                              ) ||
                                              productMap.complements?.some((compl) =>
                                                compl.itens.some(
                                                  (item) =>
                                                    normalizeCaracter(item.name).includes(normalizeCaracter(searchValue)) ||
                                                    normalizeCaracter(item.description || '').includes(normalizeCaracter(searchValue))
                                                )
                                              )
                                            )
                                          ) {
                                            return
                                          }
                                        }
                                      }

                                      const shareButtonLink = !editingProductsMassive ? (
                                        <div className="position-relative">
                                          <OverlayTrigger
                                            rootClose
                                            trigger={'click'}
                                            placement="right"
                                            overlay={linkShare(productMap.name, categoryMap, productMap)}
                                          >
                                            <Button
                                              id={`product-share-${productMap.id}`}
                                              variant="gray"
                                              className="buttons-link-share"
                                              data-no-propagation
                                            >
                                              <FaEllipsisV size={15} className="cursor-pointer" style={{ pointerEvents: 'none' }} />
                                            </Button>
                                          </OverlayTrigger>
                                        </div>
                                      ) : null

                                      return (
                                        <tr
                                          key={productMap.id}
                                          className={`position-relative ${productMap.status && verifyAvailability(productMap)
                                            ? verifyAvailability(productMap, 'alert')
                                              ? ''
                                              : 'wm-warning'
                                            : 'wm-request-canceled'
                                            }`}
                                        >
                                          <td
                                            onClick={(e) => {
                                              if (window.innerWidth < 768 && !catEdition) {
                                                setCategoryMenu(categoryMap)
                                                setProduct(productMap)
                                                setTimeout(() => {
                                                  handleMenuModal(true, 'product', 'update')
                                                }, 1)
                                              }
                                            }}
                                          >
                                            <Container className="container-fluid">
                                              <Row className={`py-2 py-md-0 align-items-md-center`}>
                                                <Col sm="12" md="4" className="p-1">
                                                  <div className="d-flex align-items-center gap-2 justify-content-start justify-content-md-left">
                                                    {window.innerWidth > 768 && shareButtonLink}
                                                    <div
                                                      className={`position-relative ${editingProductsMassive ? 'p-1 ' : ''}`}
                                                      onMouseOver={() => {
                                                        if (productMap.description?.trim()) {
                                                          const elementDescription = document.getElementById(`prod-description-${productMap.id}`)

                                                          if (elementDescription) {
                                                            elementDescription.classList.remove(`hidden-dinamic-description`)
                                                            elementDescription.classList.add(`show-dinamic-description`)
                                                          }
                                                        }
                                                      }}
                                                      onMouseOut={() => {
                                                        if (productMap.description?.trim()) {
                                                          const elementDescription = document.getElementById(`prod-description-${productMap.id}`)

                                                          if (elementDescription) {
                                                            elementDescription.classList.remove(`show-dinamic-description`)
                                                            elementDescription.classList.add(`hidden-dinamic-description`)
                                                          }
                                                        }
                                                      }}
                                                    >
                                                      <label
                                                        htmlFor={`input-image-${productMap.id}`}
                                                        className={`${editingProductsMassive ? 'cursor-pointer position-relative' : ''
                                                          } zoom-in-image`}
                                                      >
                                                        <Figure.Image
                                                          loading="lazy"
                                                          className="rounded flex-grow-1 my-auto"
                                                          alt="Imagem do Produto"
                                                          src={productMap?.image || '/images/no-img.jpeg'}
                                                          id={`productImage-${productMap.id}`}
                                                          style={{
                                                            display: 'block',
                                                            minWidth: '75px',
                                                            height: window.innerWidth < 768 ? '75px' : '45px',
                                                          }}
                                                        />
                                                        {editingProductsMassive && (
                                                          <span
                                                            className="position-absolute d-block w-100 fs-9 text-center text-white d-flex align-items-center justify-content-center"
                                                            style={{ top: '0px', zIndex: 10, backgroundColor: 'rgba(0,0,0, .4)' }}
                                                          >
                                                            <MdPhotoLibrary size={10} color="#fff" />
                                                            <span className="fs-8 text-white ps-2">Foto</span>
                                                          </span>
                                                        )}
                                                      </label>
                                                      {editingProductsMassive && (
                                                        <Form.Control
                                                          type="file"
                                                          id={`input-image-${productMap.id}`}
                                                          data-product-id={productMap.id}
                                                          data-product-old-image={productMap.image}
                                                          className="position-absolute"
                                                          style={{ visibility: 'hidden', top: -10000000 }}
                                                          onChange={(e) => {
                                                            setInputFileImage(e.target as HTMLInputElement)
                                                            setValuesProductMassive(productMap, 'id')
                                                          }}
                                                        />
                                                      )}

                                                      <div
                                                        id={`prod-description-${productMap.id}`}
                                                        className="position-absolute bg-white d-flex align-items-start fs-8 rounded hidden-dinamic-description text-wrap overflow-hidden"
                                                        style={{
                                                          left: '115%',
                                                          /*top: 0,*/ bottom: 0,
                                                          width: 0,
                                                          height: 0,
                                                          zIndex: 10,
                                                          textOverflow: 'ellipsis',
                                                        }}
                                                      >
                                                        <span>
                                                          {productMap.description?.length >= 167
                                                            ? productMap.description.slice(0, 167) + '...'
                                                            : productMap.description}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="text-center text-md-start flex-grow-1">
                                                      {catEdition ? (
                                                        <FormGroup className="d-flex gap-1 align-items-center">
                                                          <Form.Control
                                                            id={`product-name-${productMap.id}`}
                                                            style={{ minWidth: 180 }}
                                                            data-editing-name={productMap.id}
                                                            defaultValue={productMap.name}
                                                            autoFocus={indexProd === 0}
                                                            onChange={(e) => setValuesProductMassive(productMap, 'name', e.target.value)}
                                                            onKeyDown={(e) => modifyFontValues(e, {})}
                                                          />
                                                        </FormGroup>
                                                      ) : (
                                                        <>
                                                          <span className="py-2" style={{ whiteSpace: 'break-spaces' }}>
                                                            {productMap.name}
                                                          </span>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </Col>
                                                <Col sm="12" md="5" className="p-1">
                                                  <Row className="d-flex flex-row align-items-center">
                                                    <Col className="col-3">
                                                      {(plansCategory?.includes('basic') || plansCategory?.includes('package')) && (
                                                        <div
                                                          className="d-flex gap-2 align-items-center justify-content-center justify-content-md-end"
                                                          style={{ color: '#2285d0' }}
                                                        >
                                                          <div>
                                                            {catEdition ? (
                                                              <div className="position-relative">
                                                                {productMap.promoteStatus ? (
                                                                  <MdOutlineWarning
                                                                    title="Você está alterando o valor promocional do produto."
                                                                    className="position-absolute cursor-pointer"
                                                                    color="#FFA500"
                                                                    style={{ top: -9, right: -9, zIndex: 9999 }}
                                                                  />
                                                                ) : null}
                                                                <Form.Control
                                                                  style={{ width: '90px', border: '1px solid #2285d0' }}
                                                                  disabled={!editingProductsMassive}
                                                                  id={`product-value-${indexProd}`}
                                                                  defaultValue={productMap.promoteStatus ? productMap.promoteValue : productMap.value}
                                                                  data-editing-value={productMap.id}
                                                                  onChange={(e) => {
                                                                    mask(e, 'currency')
                                                                    setValuesProductMassive(
                                                                      productMap,
                                                                      productMap.promoteStatus ? 'promoteValue' : 'value',
                                                                      Number(e.target.value || 0)
                                                                    )
                                                                  }}
                                                                  onKeyDown={(e) =>
                                                                    alignPositionEditingMassive(e, categoryMap, { type: 'value', index: indexProd })
                                                                  }
                                                                />
                                                              </div>
                                                            ) : (
                                                              <div className="flex-grow-1">
                                                                <p
                                                                  className={`m-0 text-nowrap zoom-in-image ${productMap.promoteStatus && 'text-decoration-line-through text-500 fs-8 text-end'
                                                                    }`}
                                                                >
                                                                  {currency({ value: productMap.value, currency: user?.controls?.currency })}
                                                                </p>
                                                                {productMap.promoteStatus && !editingProductsMassive ? (
                                                                  <span className="text-nowrap zoom-in-image">
                                                                    {currency({
                                                                      value: productMap.promoteValue ?? 0,
                                                                      currency: user?.controls?.currency,
                                                                    })}
                                                                  </span>
                                                                ) : null}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </Col>
                                                    <Col className="col-4">
                                                      {plansCategory?.includes('table') && (
                                                        <div className="d-flex gap-1 justify-content-center justify-content-md-end align-items-center">
                                                          <div style={{ color: '#a4673f' }}>
                                                            {editingProductsMassive && categoryMenu.id === categoryMap.id ? (
                                                              <div className="position-relative">
                                                                {productMap.promoteStatusTable ? (
                                                                  <MdOutlineWarning
                                                                    title="Você está alterando o valor promocional do produto."
                                                                    className="position-absolute cursor-pointer"
                                                                    color="#FFA500"
                                                                    style={{ top: -9, right: -9, zIndex: 9999 }}
                                                                  />
                                                                ) : null}

                                                                <Form.Control
                                                                  style={{ width: '90px', border: '1px solid #a4673f' }}
                                                                  defaultValue={
                                                                    productMap.promoteStatusTable
                                                                      ? productMap.promoteValueTable
                                                                      : productMap.valueTable
                                                                  }
                                                                  disabled={!editingProductsMassive}
                                                                  id={`product-valueTable-${indexProd}`}
                                                                  data-editing-value-table={productMap.id}
                                                                  onChange={(e) => {
                                                                    mask(e, 'currency')
                                                                    setValuesProductMassive(
                                                                      productMap,
                                                                      productMap.promoteStatusTable ? 'promoteValueTable' : 'valueTable',
                                                                      Number(e.target.value || 0)
                                                                    )
                                                                  }}
                                                                  onKeyDown={(e) =>
                                                                    alignPositionEditingMassive(e, categoryMap, {
                                                                      type: 'valueTable',
                                                                      index: indexProd,
                                                                    })
                                                                  }
                                                                />
                                                              </div>
                                                            ) : (
                                                              <div>
                                                                <p
                                                                  className={`m-0 text-nowrap ${productMap.promoteStatusTable &&
                                                                    'text-decoration-line-through fs-8 text-500 text-end '
                                                                    }`}
                                                                >
                                                                  {currency({
                                                                    value: productMap.valueTable,
                                                                    currency: user?.controls?.currency,
                                                                  })}
                                                                </p>
                                                                {productMap.promoteStatusTable && !editingProductsMassive ? (
                                                                  <span className="text-nowrap">
                                                                    {currency({
                                                                      value: productMap.promoteValueTable ?? 0,
                                                                      currency: user?.controls?.currency,
                                                                    })}
                                                                  </span>
                                                                ) : null}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </Col>
                                                    {editingProductsMassive && (
                                                      <Col className="col-4 d-flex align-items-center justify-content-center">
                                                        {!productMap.bypass_amount && profile.options.inventoryControl ? (
                                                          <InputGroup className="position-relative">
                                                            <Button
                                                              variant="secondary"
                                                              onClick={() =>
                                                                setValuesProductMassive(
                                                                  productMap,
                                                                  'amount',
                                                                  (updateProductsMassive.find((item) => item.id === productMap.id)?.amount ||
                                                                    productMap.amount ||
                                                                    0) - 1,
                                                                  'subtract'
                                                                )
                                                              }
                                                            >
                                                              -
                                                            </Button>
                                                            {updateProductsMassive.find((item) => item.id === productMap.id) ? (
                                                              <Form.Control
                                                                readOnly
                                                                value={updateProductsMassive.find((item) => item.id === productMap.id)?.amount}
                                                                name="amount"
                                                                className="text-center"
                                                              />
                                                            ) : (
                                                              <Form.Control
                                                                readOnly
                                                                value={productMap.amount}
                                                                name="amount"
                                                                className="text-center"
                                                              />
                                                            )}

                                                            <Button
                                                              className="rounded-end"
                                                              variant="secondary"
                                                              style={{ minWidth: '34.75px' }}
                                                              onClick={() => {
                                                                setValuesProductMassive(
                                                                  productMap,
                                                                  'amount',
                                                                  (updateProductsMassive.find((item) => item.id === productMap.id)?.amount ||
                                                                    productMap.amount ||
                                                                    0) + 1,
                                                                  'add'
                                                                )
                                                              }}
                                                            >
                                                              +
                                                            </Button>
                                                            <Form.Control.Feedback tooltip type="invalid">
                                                              Por favor insira um valor válido!
                                                            </Form.Control.Feedback>
                                                          </InputGroup>
                                                        ) : (
                                                          <p className="fw-bold mb-0" style={{ color: 'rgb(53, 196, 0)' }}>
                                                            EM ESTOQUE
                                                          </p>
                                                        )}
                                                      </Col>
                                                    )}
                                                  </Row>
                                                </Col>
                                                <Col sm="12" md="3" className="p-1 justify-content-end">
                                                  <div>
                                                    <div className="d-sm-inline d-flex d-md-block justify-content-between align-middle float-md-end">
                                                      <ButtonGroup className="d-flex gap-3 flex-grow-1" onClick={(e) => e.stopPropagation()}>
                                                        {window.innerWidth < 768 && !editingProductsMassive ? (
                                                          shareButtonLink
                                                        ) : updateProductsMassive.find((prod) => prod.id === productMap.id) ? (
                                                          <div className="text-center ps-2">
                                                            <span
                                                              title="Descartar alterações"
                                                              className="cursor-pointer"
                                                              onClick={() => resetValuesMassive(categoryMap, productMap)}
                                                            >
                                                              <FaUndo color="red" size={20} />
                                                            </span>
                                                          </div>
                                                        ) : (
                                                          <div className="text-center ps-2">
                                                            <FaUndo color="white" style={{ visibility: 'hidden' }} size={20} />
                                                          </div>
                                                        )}
                                                        <Button
                                                          size="sm"
                                                          variant="link"
                                                          className={`text-decoration-none fs-7 flex-grow-1 ${productMap.status && verifyAvailability(productMap) ? '' : 'link-danger'
                                                            }`}
                                                          tabIndex={editingProductsMassive ? -1 : 0}
                                                          onClick={async (e) => {
                                                            if (productMap.id) {
                                                              setOverlayProduct(productMap.id)
                                                              await pauseProduct(productMap)
                                                              setOverlayProduct(null)
                                                            }
                                                          }}
                                                        >
                                                          <span>{!productMap.status ? 'Despausar' : 'Pausar'}</span>
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="link"
                                                          className={`text-decoration-none fs-7 flex-grow-1 ${productMap.status && verifyAvailability(productMap) ? '' : 'link-danger'
                                                            }`}
                                                          tabIndex={editingProductsMassive ? -1 : 0}
                                                          onClick={() => handleDuplicateProduct(productMap, categoryMap)}
                                                        >
                                                          <span>Duplicar</span>
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="link"
                                                          disabled={editingProductsMassive}
                                                          className={`text-decoration-none fs-7 flex-grow-1 ${productMap.status && verifyAvailability(productMap) ? '' : 'link-danger'
                                                            }`}
                                                          onClick={() => {
                                                            handleEditProduct(productMap, categoryMap)
                                                          }}
                                                        >
                                                          <span>Editar</span>
                                                        </Button>
                                                      </ButtonGroup>
                                                    </div>
                                                    {overlayProduct === productMap.id ? (
                                                      <OverlaySpinner show={true} backgroundColor="transparent" />
                                                    ) : null}
                                                  </div>
                                                </Col>
                                              </Row>
                                            </Container>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </Table>
                              </Card.Body>
                            )}
                            {!editingProductsMassive && (
                              <Card.Footer style={{ backgroundColor: '#F3FCDD' }}>
                                <div className="d-flex gap-4 flex-wrap">
                                  <Button
                                    variant="link"
                                    className="fw-bold text-decoration-none p-0 btn-sm"
                                    style={{ color: '#35C400' }}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)
                                      setProduct(Product.newProduct(categoryMap))

                                      setTimeout(() => {
                                        handleMenuModal(true, 'product', 'create')
                                      }, 10)
                                    }}
                                  >
                                    + Adicionar item
                                  </Button>
                                  <Button
                                    variant="link"
                                    className="fw-bold text-decoration-none p-0 btn-sm"
                                    style={{ color: '#35C400' }}
                                    onClick={() => {
                                      setCategoryMenu(categoryMap)
                                      setTimeout(() => {
                                        setMassiveShow(true)
                                      }, 10)
                                    }}
                                  >
                                    + Adicionar itens em massa
                                  </Button>
                                </div>
                              </Card.Footer>
                            )}
                            {editingProductsMassive && categoryMenu.id === categoryMap.id && (
                              <div
                                className="position-sticky p-4"
                                style={{ bottom: 0, background: '#F3FCDD', borderTop: '3px solid #2bde85', zIndex: 10 }}
                              >
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 position-relative">
                                  <div>
                                    <p className="m-0 text-dark text-center">
                                      {updateProductsMassive.length} {updateProductsMassive.length !== 1 ? 'produtos serão' : 'produto será'}{' '}
                                      atualizado(s) agora.
                                    </p>
                                  </div>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="danger"
                                      className="link-danger fw-bold text-decoration-none "
                                      onClick={() => editingMassiveCancel(updateProductsMassive.length, 'Editar Produtos')}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="success"
                                      className="success fw-bold text-decoration-none"
                                      disabled={!updateProductsMassive.length}
                                      onClick={() => updateItemsMassive('products', updateProductsMassive, categoryMap)}
                                    >
                                      Salvar
                                    </Button>
                                  </div>
                                  <Form.Control
                                    type="text"
                                    className="position-absolute"
                                    style={{ opacity: 0, top: -100000 }}
                                    onFocus={() => inputFocus(`#product-name-${categoryMap.products ? categoryMap.products[0].id : ''}`)}
                                  />
                                </div>
                              </div>
                            )}
                            {overlayCategory === categoryMap.id ? (
                              <OverlaySpinner
                                show={true}
                                backgroundColor="transparent"
                                backdropBlur={1}
                                textSpinner="Aguarde..."
                                style={{ zIndex: 99999 }}
                              />
                            ) : null}
                          </Card>
                        </Col>
                      </Row>
                    )
                  }
                })
            ) : (
              <Card>
                <Card.Body>
                  <h2 className="text-center py-4">
                    {searchValue.trim()?.length > 0 && 'Nenhum resultado para sua pesquisa'}
                    {searchValue.trim()?.length === 0 && 'Nenhuma categoria cadastrada'}
                  </h2>
                </Card.Body>
              </Card>
            )}
          </article>
        </section>
        <section id="menu-modals">
          <CropModal
            show={!!inputFileImage}
            typeCrop="productImage"
            inputFile={inputFileImage}
            setImageBlob={(blob: any, url: string) => {
              const productId = Number(inputFileImage?.dataset.productId) || inputFileImage?.dataset.productId
              const oldImage = inputFileImage?.dataset.productOldImage || '/images/no-img.jpeg'

              const image = document.querySelector(`#productImage-${productId}`) as HTMLImageElement
              if (image) {
                image.src = url
              }

              if (productId) {
                const imageFind = imagesMassive.find((img) => img.id === productId)
                if (imageFind) {
                  imageFind.image = blob
                } else {
                  imagesMassive.push({
                    id: productId,
                    image: blob,
                    oldImage,
                  })
                }
              }
            }}
            onHide={() => {
              setInputFileImage(undefined)
            }}
          />
          {categoryMenu && (
            <CreateMassiveProducts
              category={categoryMenu}
              show={massiveShow}
              onHide={(callback?: () => void) => {
                callback && callback()
                setMassiveShow(false)
              }}
            />
          )}
        </section>
      </div>
    </>
  )
}
