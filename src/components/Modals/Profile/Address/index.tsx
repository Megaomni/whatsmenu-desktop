import { useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { AppContext } from "../../../../context/app.ctx";
import { apiRoute } from "../../../../utils/wm-functions";
import { OverlaySpinner } from "../../../OverlaySpinner";
import { ProfileAddress } from "../../../../types/profile";

interface AddressModalProps {
  show: boolean;
  handleClose: () => void;
  handleConfirm?: () => void;
}

export function AddressModal(props: AddressModalProps) {
  const { data: session } = useSession();
  const { profile, setProfile, handleShowToast } = useContext(AppContext);
  const { show, handleClose } = props;

  const [showSpinner, setShowSpinner] = useState(false);
  const [address, setAddress] = useState<ProfileAddress>(profile.address);
  const [invalidZipCode, setInvalidZipCode] = useState(false);

  const handleUpdateAddress = async () => {
    setShowSpinner(true);
    try {
      await apiRoute(
        "/dashboard/profile/address",
        session,
        `${profile.address?.street ? "PATCH" : "POST"}`,
        address
      );
      handleShowToast({
        type: "success",
        content: ``,
        title: ``,
      });
      handleClose();
      handleShowToast({ type: "success", title: "Endereço" });
      setProfile({ ...profile, address });
    } catch (error) {
      // handleShowToast({ type: "erro", title: "Endereço" })
      // console.error(error);
    }
    handleClose();
    handleShowToast({ type: "success", title: "Endereço" });
    setProfile({ ...profile, address });
    setShowSpinner(false);
  };


  const getAddressApi = async () => {
    try {
      const { data } = await apiRoute(
        `https://viacep.com.br/ws/${address?.zipcode}/json/`,
        undefined,
        "GET"
      );
      if (!data.erro) {        
        setAddress({
          ...address,
          street: data.logradouro,
          city: data.localidade,
          state: data.uf,
          neigborhood: data.bairro,
          complement: "",
          number: "",
        });
      } else {
        setInvalidZipCode(true);
      }
    } catch (error) {
      handleShowToast({ type: "erro" });
      console.error(error);
    }
  };

  useEffect(() => {
    if (
      address?.zipcode?.length === 9 &&
      address?.zipcode !== profile.address?.zipcode
    ) {
      getAddressApi();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.zipcode]);

  return <>
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <OverlaySpinner
        textSpinner="Aguarde..."
        show={showSpinner}
        style={{ zIndex: 99999 }}
      />
      <Modal.Header>
        <h3>
          <b>{profile.address?.street ? "Editar" : "Adicionar"} endereço</b>
        </h3>
      </Modal.Header>
      <Modal.Body>
        <Container className="mx-0 px-0">
          <Row>
            <Col md="4" className="mb-3">
              <Form.Label>
                <b>CEP</b>
              </Form.Label>
              <div className="position-relative">
                <Form.Control
                  value={address?.zipcode ?? ""}
                  maxLength={9}
                  isInvalid={invalidZipCode}
                  onChange={(e) => {
                    setInvalidZipCode(false)
                    e.target.value = e.target.value
                      .replace(/\D/, "")
                      .replace(/(\d{5})(\d{3})/, "$1-$2");
                    setAddress({
                      ...address,
                      zipcode: e.target.value,
                    });
                  }}
                />
                <Form.Control.Feedback
                  tooltip
                  type="invalid"
                  style={{ zIndex: 0 }}
                >
                  CEP inválido
                </Form.Control.Feedback>
              </div>
            </Col>
          </Row>
          <Row>
            <Col md="6" className="mb-3">
              <Form.Label>
                <b>Endereço</b>
              </Form.Label>
              <Form.Control
                value={address?.street ?? ""}
                onChange={(e) =>
                  setAddress({ ...address, street: e.target.value })
                }
              />
            </Col>
            <Col md="3" className="mb-3">
              <Form.Label>
                <b>Número</b>
              </Form.Label>
              <Form.Control
                value={address?.number ?? ""}
                onChange={(e) =>
                  setAddress({ ...address, number: e.target.value })
                }
              />
            </Col>
            <Col md="3" className="mb-3">
              <Form.Label>
                <b>Complemento</b>
              </Form.Label>
              <Form.Control
                value={address?.complement ?? ""}
                onChange={(e) =>
                  setAddress({ ...address, complement: e.target.value })
                }
              />
            </Col>
          </Row>
          <Row>
            <Col md="6" className="mb-3">
              <Form.Label>
                <b>Bairro</b>
              </Form.Label>
              <Form.Control
                value={address?.neigborhood ?? ""}
                onChange={(e) =>
                  setAddress({ ...address, neigborhood: e.target.value })
                }
              />
            </Col>
            <Col md="6" className="mb-3">
              <Form.Label>
                <b>Cidade</b>
              </Form.Label>
              <Form.Control
                value={address?.city ?? ""}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
              />
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            handleClose();
          }}
          variant="danger"
        >
          Cancelar
        </Button>

        <Button
          variant="success"
          onClick={() => {
            handleUpdateAddress();
          }}
        >
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  </>;
}
