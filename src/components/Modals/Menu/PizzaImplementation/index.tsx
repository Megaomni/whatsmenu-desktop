import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  InputGroup,
} from "react-bootstrap";
import { BsFillPauseCircleFill } from "react-icons/bs";
import PizzaProduct, { PizzaImplementationType } from "../../../../types/pizza-product";
import { currency, encryptEmoji, mask } from "../../../../utils/wm-functions";
import Category from "../../../../types/category";
import { useSession } from "next-auth/react";
import { OverlaySpinner } from "../../../OverlaySpinner";
import { AppContext } from "../../../../context/app.ctx";
import { MenuContext } from "../../../../context/menu.ctx";
import { ActionsFooterButton } from "../../ModalFooter/Actions";
import { ArrowModalFooter } from "../../../Generic/ArrowsModalFooter";

interface PizzaImplementationProps {
  show: boolean;
  handleClose: () => void;
  type: "create" | "update";
  implementation: PizzaImplementationType;
  setImplementation: Dispatch<SetStateAction<PizzaImplementationType>>
  category: Category;
  setCategory: Dispatch<SetStateAction<Category>>
}

export function PizzaImplementation(props: PizzaImplementationProps) {

  const { data: session } = useSession();

  const { handleShowToast, handleConfirmModal, modalFooterOpened, user } = useContext(AppContext);
  const { categories, setCategories } = useContext(MenuContext);

  const { show, handleClose, type, implementation, category, setCategory, setImplementation } = props;
  const [name, setName] = useState<string>(implementation.name || "");
  const [price, setPrice] = useState<string | number>(implementation.value || 0);

  const [nameInvalid, setNameInvalid] = useState(false);
  const [valueInvalid, setValueInvalid] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    setName(implementation.name);
    setPrice(Number(implementation.value));
  }, [implementation]);

  const createOrUpdateImplementation = async () => {

    const body = {
      name: encryptEmoji(name),
      value: price.toString() || "0"
    }

    if (!name.length) {
      setNameInvalid(true);
      return
    }

    try {
      setShowSpinner(true);
      const { product } = category;

      if (product) {
        await PizzaProduct.API({
          type: type.toUpperCase() as ("CREATE" | "UPDATE"),
          session,
          property: "implementation",
          product,
          body,
          categories,
          setCategories,
          itemCode: implementation.code
        })
      }

      handleShowToast({
        show: true,
        type: 'success',
        title: 'Bordas e Massas',
        content: `${name}, ${type === 'create' ? 'criado com sucesso.' : 'atualizada com sucesso.'}`
      });

      handleClose();
    } catch (e) {
      console.error(e);
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Bordas e Massas',
        content: `${name}, ${type === 'create' ? 'não foi criada.' : 'não foi atualizada.'}`
      });
    } finally {
      setShowSpinner(false);
    }

  }

  const deleteImplementation = async () => {
    const { product } = category;
    try {
      handleConfirmModal({
        actionConfirm: async () => {
          if (product) {
            await PizzaProduct.API({
              type: "DELETE",
              property: "implementation",
              session,
              product,
              categories,
              setCategories,
              itemCode: implementation.code
            });

            handleShowToast({
              show: true,
              type: 'success',
              title: 'Bordas e Massas',
              content: `${implementation.name}, deletada com sucesso.`
            });

            handleClose();
          }
        },
        title: 'Bordas e Massas',
        message: `Deseja realmente excluir, ${name}?`
      })
    } catch (e) {
      console.error(e);
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Bordas e Massas',
        content: `Não foi possível deletar, ${implementation.name}.`
      });
    }
  }

  const pauseImplementation = async () => {
    const { product } = category;
    try {
      if (product) {
        const newImplementation: any = await PizzaProduct.API({
          type: "STATUS",
          property: "implementation",
          session,
          product,
          categories,
          setCategories,
          itemCode: implementation.code
        })

        if (newImplementation) {
          setImplementation(newImplementation)
        }

        handleShowToast({
          show: true,
          type: 'success',
          title: 'Bordas e Massas',
          content: `${name}, ${implementation?.status ? 'despausada com sucesso' : 'pausada com sucesso'}.`
        });
      }

    } catch (e) {
      console.error(e);
      handleShowToast({
        show: true,
        type: 'erro',
        title: 'Bordas e Massas',
        content: `Não foi possivel pausar, ${name}.`
      });
    }

  }

  return (
    <div onKeyDown={(e) => {
      if(e.altKey){
        if(e.code === "Enter"){
          createOrUpdateImplementation()
        }
      }
    } }>
      <Modal
        show={show}
        onHide={handleClose}
        keyboard
        scrollable
        dialogClassName={`${window.innerWidth > 768 ? "modal-90" : ""} mx-auto`}
        fullscreen={window.innerWidth < 768 ? true : undefined}
        onExited={() => {
          setNameInvalid(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {type === "create" ? "Adicionar" : "Editar"} Bordas e Massas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="position-relative">
          <Card className="mt-4">
            <Card.Body>
              <Container fluid className="px-0 mx-0">
                <Row className="text-dark">
                  <Col sm className="my-auto">
                    <Row>
                      <Col sm>
                        <Form.Label>
                          <b>Nome</b>
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
                                setNameInvalid(false);
                              }
                              setName(e.target.value);
                            }}
                          />
                          <Form.Control.Feedback tooltip type="invalid">
                            Por favor insira um nome válido!
                          </Form.Control.Feedback>
                        </div>
                        <div className="d-flex justify-content-end">
                          <p
                            className={
                              name.length >= 55
                                ? "text-red-500"
                                : ""
                            }
                          >
                            {name.length}
                            /55 caracteres
                          </p>
                        </div>
                      </Col>
                      <Col sm className="mb-2 mb-md-0">
                        <Form.Label>
                          <b>Preço</b>
                        </Form.Label>
                        <InputGroup className="position-relative">
                          <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
                          <Form.Control
                            value={(price)}
                            required
                            maxLength={12}
                            isInvalid={valueInvalid}
                            onBlur={(e) => {
                              setValueInvalid(!e.target.value.length);
                            }}
                            onFocus={() => {
                              setValueInvalid(false);
                            }}
                            onChange={(e) => {
                              mask(e, "currency", 10)
                              setPrice(e.target.value)
                            }}
                          />
                          <Form.Control.Feedback tooltip type="invalid">
                            Por favor insira um valor válido!
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col sm className="d-flex flex-column">
                        {
                          type !== 'create' &&
                          <div className="wm-default-border-none text-dark py-5 px-3">
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
                                      ? "Despausar vendas"
                                      : "Pausar vendas"}
                                  </span>
                                </Button>
                              </Col>
                              <Col sm className="text-600 fs-8 mb-3">
                                Para pausar as vendas deste item, clique no botão
                                ao lado. Se o botão estiver habilitado, o item não
                                aparecerá na sua lista de pratos.
                              </Col>
                            </Row>
                          </div>
                        }
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Container>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer
          className={`${type === "update" ? "justify-content-between" : undefined} position-relative ${modalFooterOpened ? "show" : "hidden"}-buttons-modal-footer`}
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
        <OverlaySpinner
          show={showSpinner}
        />
      </Modal>
    </div>
  );
}
