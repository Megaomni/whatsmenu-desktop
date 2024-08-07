import { useSession } from "next-auth/react";
import { useContext, useState } from "react";
import { Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
import { AppContext } from "../../../context/app.ctx";
import { apiRoute, currency, hash, mask } from "../../../utils/wm-functions";
import { OverlaySpinner } from "../../OverlaySpinner";
import { ProfileTaxDeliveryKM } from "../../../types/profile";

interface KmFreightProps {
  taxDelivery: ProfileTaxDeliveryKM[];
}

export function KmFreight(props: KmFreightProps) {
  const { data: session } = useSession();
  const { profile, setProfile, handleShowToast, handleConfirmModal, user } =
    useContext(AppContext);
  let { taxDelivery } = props;

  const [showSpinner, setShowSpinner] = useState(false);
  const [updateHTML, setUpdateHTML] = useState(0);


  const [newTax, setNewTax] = useState<ProfileTaxDeliveryKM>({
    code: hash(),
    distance: "",
    time: "",
    value: "",
  });

  const handleAddTax = async () => {
    const taxAlreadyExists = taxDelivery.find(
      (t) => t.distance == newTax.distance
    );
    setShowSpinner(true);
    if (!newTax.time) {
      newTax.time = "A consultar";
    }

    if (taxAlreadyExists) {
      handleShowToast({
        type: "alert",
        content: "Essa distância ja existe",
        title: "Distância",
      });

      setNewTax({
        code: hash(),
        distance: "",
        time: "",
        value: "",
      });
      setShowSpinner(false);
      return;
    }
    if (newTax.distance && Number(newTax.value) >= 0 && newTax.time) {
      try {
        const body = {
          distance: newTax.distance,
          time: newTax.time,
          value: newTax.value,
        };
        const { data } = await apiRoute(
          "/dashboard/profile/taxDelivery",
          session,
          "POST",
          body
        );
        taxDelivery.push(data.tax);
        setNewTax({
          code: hash(),
          distance: "",
          time: "",
          value: "",
        });
        setProfile({ ...profile, taxDelivery });

        handleShowToast({
          type: "success",
          content: "Distância adicionada com sucesso",
          title: "Distância",
        });
      } catch (error) {
        handleShowToast({
          type: "erro",
        });
        console.error(error);
      }
      setShowSpinner(false);
    } else {
      setShowSpinner(false);
      return handleShowToast({ type: "alert" });
    }
  };

  const handleEditTax = async (tax: ProfileTaxDeliveryKM) => {
    if (!tax.time) {
      tax.time = "A consultar";
    }
    if (tax.distance === undefined || tax.distance === null) {
      return handleShowToast({
        type: "alert",
        title: "Atualizar Frete",
      });
    }


    tax.value = String(tax.value).replace(",", ".");

    const body = {
      tax: {
        ...tax,
        distance: tax.distance?.toString(),
        value: tax.value?.toString(),
      },
    };
    setShowSpinner(true);
    try {
      const { data } = await apiRoute(
        "/dashboard/profile/tax/km/update",
        session,
        "PUT",
        body
      );
      let updatedTax = taxDelivery.find((t) => t.code === data.code);
      if (updatedTax) {
        updatedTax = data;
        setProfile({ ...profile, taxDelivery });
        handleShowToast({
          type: "success",
          content: "",
          title: "Distância",
        });
      }
    } catch (error) {
      console.error(error);
      handleShowToast({ type: "erro" });
    }
    setShowSpinner(false);
  };

  const handleRemoveTax = (tax: ProfileTaxDeliveryKM) => {
    handleConfirmModal({
      actionConfirm: async () => {
        try {
          setShowSpinner(true);
          await apiRoute(
            `/dashboard/profile/taxDelivery/${tax.code}/delete`,
            session,
            "DELETE"
          );
          taxDelivery = taxDelivery.filter((t) => t.code !== tax.code);
          setProfile({ ...profile, taxDelivery });
          handleShowToast({
            type: "success",
            content: "Distância excluída com sucesso",
            title: "Distância",
          });
        } catch (error) {
          handleShowToast({
            type: "erro",
            title: "Distância",
          });
          console.error(error);
        }
        setShowSpinner(false);
      },
    });
  };

  return (
    <>
      <OverlaySpinner show={showSpinner} textSpinner="Aguarde..." />
      <Row>
        <Col md className="mb-2">
          <Form.Label>Distância em KM até</Form.Label>
          <Form.Control
            type="number"
            id="distanceInput"
            value={newTax.distance}
            onChange={(e) => {
              setNewTax({ ...newTax, distance: e.target.value });
            }}
          />
        </Col>
        <Col md className="mb-2">
          <Form.Label>Tempo em Minutos</Form.Label>
          <Form.Control
            type="number"
            id="timeInput"
            value={newTax.time}
            onChange={(e) => {
              setNewTax({ ...newTax, time: e.target.value });
            }}
            placeholder="A Consultar"
          />
        </Col>
        <Col md className="mb-2">
          <Form.Label>Valor</Form.Label>
          <Form.Control
            // type="number"
            id="valueInput"
            value={newTax.value}
            onChange={(e) => {
              mask(e, "currency");
              setNewTax({ ...newTax, value: e.target.value });
            }}
            placeholder="A Consultar"
          />
        </Col>
        <Col md="2" className="d-flex mb-2">
          <Button
            className="mt-auto flex-grow-1"
            onClick={() => {
              handleAddTax();
            }}
          >
            + Adicionar
          </Button>
        </Col>
      </Row>
      <br />
      <Row>
        <Col md>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Distância em KM até</th>
                <th>Tempo</th>
                <th>Valor</th>
                <th className="col-2 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {taxDelivery
                .sort((a, b) => {
                  return a.distance < b.distance ? -1 : 1;
                })
                .map((tax) => (
                  <tr key={tax.code} className="align-baseline">
                    <td>
                      <InputGroup className="text-nowrap">
                        <InputGroup.Text>KM</InputGroup.Text>
                        <Form.Control
                          type="number"
                          min={0}
                          defaultValue={tax.distance}
                          onChange={(e) => {
                            e.target.value =
                              Number(e.target.value) < 0 ? "0" : e.target.value;
                            tax.distance = Number(e.target.value);
                          }}
                        />
                      </InputGroup>
                    </td>
                    <td>
                      <InputGroup className="text-nowrap flex-nowrap">
                        <InputGroup.Text>Min.</InputGroup.Text>
                        <Form.Control
                          // type="number"
                          // min={0}
                          defaultValue={tax.time}
                          onChange={(e) => {
                            // e.target.value =
                            //   Number(e.target.value) < 0 ? "0" : e.target.value;
                            tax.time = e.target.value;
                            setUpdateHTML(updateHTML + 1)
                          }}
                          placeholder={Number(tax.time) ? "" : "A Consultar"}
                          style={{ minWidth: 120 }}

                        />
                      </InputGroup>
                    </td>
                    <td style={{ minWidth: "9rem" }}>
                      <InputGroup className="text-nowrap">
                        <InputGroup.Text>{currency({ value: 0, symbol: true, currency: user?.controls?.currency })}</InputGroup.Text>
                        <Form.Control
                          // type="number"
                          min={0}
                          defaultValue={Number(tax.value ?? undefined) >= 0 ? Number(tax.value).toFixed(2) : undefined}
                          onChange={(e) => {
                            if (Number(e.target.value)) {
                              mask(e, "currency");
                            } else {
                              e.target.maxLength = 11;
                            }
                            tax.value = e.target.value
                          }}
                          placeholder={Number(tax.value ?? undefined) ? "" : "A Consultar"}
                        />
                      </InputGroup>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="success"
                          className="flex-grow-1"
                          onClick={() => {
                            handleEditTax(tax);
                          }}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="danger"
                          className="flex-grow-1"
                          onClick={() => {
                            handleRemoveTax(tax);
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}
