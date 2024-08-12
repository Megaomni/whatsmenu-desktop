import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import Category, { CategoryType } from '../../../../types/category'
import { useSession } from 'next-auth/react'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { AppContext } from '../../../../context/app.ctx'
import { MenuContext } from '../../../../context/menu.ctx'
import { ActionsFooterButton } from '../../ModalFooter/Actions'
import { ArrowModalFooter } from '../../../Generic/ArrowsModalFooter'
import { ComponentComplement } from '../Complements'
import PizzaProduct from '../../../../types/pizza-product'
import { copy } from '../../../../utils/wm-functions'
import Complement from '../../../../types/complements'
import { useTranslation } from 'react-i18next'

interface PizzaComplementProps {
  show: boolean
  handleClose: () => void
  type: 'create' | 'update'
  category: Category
  setCategory: Dispatch<SetStateAction<Category>>
}

export function PizzaComplement(props: PizzaComplementProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()

  const { handleShowToast, handleConfirmModal, modalFooterOpened } = useContext(AppContext)
  const { categories, setCategories, focusId } = useContext(MenuContext)
  const { show, handleClose, type, category, setCategory } = props

  const [newComplements, setNewComplements] = useState<Complement[]>(category.product?.complements ?? [])
  const [showSpinner, setShowSpinner] = useState(false)

  const [recicledComplements, setRecicledComplements] = useState<{ id: number; link: boolean }[]>([])
  const [removeComplements, setRemoveComplements] = useState<number[]>([])

  return (
    <div>
      <Modal
        show={show}
        onHide={handleClose}
        keyboard
        scrollable
        dialogClassName={`${window.innerWidth > 768 ? 'modal-90' : ''} mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === 'create' ? t('add') : t('edit')} {t('complements')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          <ComponentComplement
            complementType="pizza"
            typeModal="product"
            complements={newComplements ?? []}
            saveComplements={(complements) => {
              setNewComplements(complements)
            }}
            saveRecicledComplements={(recicled) => setRecicledComplements([...recicled])}
            saveRemovedComplements={(removeds) => setRemoveComplements([...removeds])}
            autoFocusElement={focusId}
          />
        </Modal.Body>
        <Modal.Footer
          className={`${type === 'update' ? 'justify-content-between' : undefined} position-relative ${
            modalFooterOpened ? 'show' : 'hidden'
          }-buttons-modal-footer`}
        >
          <ArrowModalFooter />
          <ActionsFooterButton
            type={type}
            handleClose={() => {
              handleClose()
            }}
            createOrUpdate={async () => {
              if (category.product) {
                try {
                  await PizzaProduct.API({
                    type: type.toUpperCase() as 'CREATE' | 'UPDATE',
                    property: 'complements',
                    session,
                    product: category.product,
                    body: {
                      recicle: copy(recicledComplements, 'json'),
                      removeComplements: copy(removeComplements, 'json'),
                      complements: copy(newComplements, 'json'),
                      pizzaId: category.product.id,
                    },
                    categories,
                    setCategories,
                  })
                  setCategory(
                    (state) =>
                      ({
                        ...state,
                        product: { ...state.product, complements: newComplements.map((c) => new Complement(c)) },
                      } as Category)
                  )
                  handleShowToast({ type: 'success' })
                } catch (error) {
                  console.error(error)
                }
              }
              handleClose()
            }}
            disabledButtonSave={false}
          />
        </Modal.Footer>
        <OverlaySpinner show={showSpinner} />
      </Modal>
    </div>
  )
}
