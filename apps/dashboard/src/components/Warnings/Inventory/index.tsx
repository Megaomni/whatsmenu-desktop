import { PizzaFlavorType, PizzaProductType } from '../../../types/pizza-product'
import { ItemComplementType } from '../../../types/complements'
import Link from 'next/link'
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { ProductType } from '../../../types/product'

export default function InventoryWarning({
  lowInventoryItems,
}: {
  lowInventoryItems: any
}) {
  const tooltip = (
    <Tooltip id="tooltip">
      <div className="d-flex">
        {lowInventoryItems.low.complements.length ? (
          <div>
            <strong>Baixo estoque:</strong>{' '}
            <ul className="mb-0 ps-3">
              {lowInventoryItems.low.complements.map(
                (complement: ItemComplementType) => (
                  <li className="text-left" key={complement.code}>
                    <span className="d-flex">{complement.name}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
        {lowInventoryItems.soldOut.complements.length ? (
          <div>
            <strong>Esgotados:</strong>{' '}
            <ul className="mb-0 ps-3">
              {lowInventoryItems.soldOut.complements.map(
                (complement: ItemComplementType) => (
                  <li className="text-left" key={complement.code}>
                    <span className="d-flex">{complement.name}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </Tooltip>
  )

  const productTooltip = (
    <Tooltip id="tooltip">
      <div className="d-flex">
        {lowInventoryItems.low.products.length ||
        lowInventoryItems.low.pizzaProducts.length ||
        lowInventoryItems.low.pizzaFlavors.length ? (
          <div>
            <strong>Baixo estoque:</strong>{' '}
            <ul className="mb-0 ps-3">
              {lowInventoryItems.low.products.map((product: ProductType) => (
                <li className="text-left" key={product.id}>
                  <span className="d-flex">{product.name}</span>
                </li>
              ))}
              {lowInventoryItems.low.pizzaProducts.map(
                (pizza: PizzaProductType) => (
                  <li className="text-left" key={pizza.id}>
                    <span className="d-flex">Pizza</span>
                  </li>
                )
              )}
              {lowInventoryItems.low.pizzaFlavors.map(
                (flavor: PizzaFlavorType) => (
                  <li className="text-left" key={flavor.code}>
                    <span className="d-flex">{flavor.name}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
        {lowInventoryItems.soldOut.products.length ||
        lowInventoryItems.soldOut.pizzaProducts.length ||
        lowInventoryItems.soldOut.pizzaFlavors.length ? (
          <div>
            <strong>Esgotados:</strong>{' '}
            <ul className="mb-0 ps-3">
              {lowInventoryItems.soldOut.products.map(
                (product: ProductType) => (
                  <li className="text-left" key={product.id}>
                    <span className="d-flex">{product.name}</span>
                  </li>
                )
              )}
              {lowInventoryItems.soldOut.pizzaProducts.map(
                (pizza: PizzaProductType) => (
                  <li className="text-left" key={pizza.id}>
                    <span className="d-flex">Pizza</span>
                  </li>
                )
              )}
              {lowInventoryItems.soldOut.pizzaFlavors.map(
                (flavor: PizzaFlavorType) => (
                  <li className="text-left" key={flavor.code}>
                    <span className="d-flex">{flavor.name}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </Tooltip>
  )

  return (
    <Alert variant="warning" dismissible style={{ transition: 'all 0.5s' }}>
      <Alert.Heading>Alerta de Estoque</Alert.Heading>
      Seu cardápio possui itens com{' '}
      <OverlayTrigger overlay={productTooltip}>
        <a href="#">estoque</a>
      </OverlayTrigger>{' '}
      baixo ou esgotados, clique <Link href="/dashboard/menu">aqui</Link> para
      reabastecer!
      {lowInventoryItems.low.complements.length ||
      lowInventoryItems.soldOut.complements.length ? (
        <div className="mt-2">
          Verifique também os{' '}
          <OverlayTrigger overlay={tooltip}>
            <a href="#">complementos</a>
          </OverlayTrigger>
          , pois alguns estão esgotados.
        </div>
      ) : null}
    </Alert>
  )
}
