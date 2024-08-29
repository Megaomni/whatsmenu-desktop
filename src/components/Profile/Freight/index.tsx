import { useState, useContext, useEffect } from "react";
import { Col, Row, Card, Form } from "react-bootstrap";
import { KmFreight } from "./KmFreight";
import { NeighborhoodFreight } from "./NeighborhoodFreight";
import { AppContext } from "../../../context/app.ctx";
import {
  ProfileTaxDeliveryKM,
  ProfileTaxDeliveryNeighborhood,
} from "../../../types/profile";
import { apiRoute } from "../../../utils/wm-functions";
import { useSession } from "next-auth/react";
import { OverlaySpinner } from "../../OverlaySpinner";
import { AddPlan } from "../../AddPlan";
import { HelpVideos } from "../../Modals/HelpVideos";

export function ProfileFreight() {
  const { data: session } = useSession();
  const { profile, plansCategory, setProfile, handleConfirmModal, handleShowToast } =
    useContext(AppContext);
  const [showSpinner, setShowSpinner] = useState(false);

  const handleChangeFreight = async () => {
    setShowSpinner(true);
    const body = {
      typeDelivery: profile.typeDelivery !== "km" ? "km" : "neighborhood",
    };
    try {
      const { data } = await apiRoute(
        "/dashboard/profile/taxDelivery/alter",
        session,
        "PUT",
        body
      );
      setProfile({
        ...profile,
        taxDelivery: data.taxDelivery,
        typeDelivery: data.typeDelivery,
      });
      handleShowToast({
        type: "success",
        title: "Tipo de Entrega",
        content: `Tipo de entrega alterado para ${data.typeDelivery === "km" ? "Quilômetro" : "Bairro"
          }`,
      });
    } catch (error) {
      handleShowToast({ type: "erro" });
      console.error(error);
    }
    setShowSpinner(false);
  };

  return (
    <>
      <section className="position-relative">
        <OverlaySpinner
          show={showSpinner}
          textSpinner="Carregando..."
          style={{ zIndex: 99999 }}
        />
        {plansCategory.every((plan) => plan === "table") ? (
          <AddPlan
            notDefaultTitle
            plan="delivery"
            title="Seu plano atual não inclui a funcionalidade de Delivery ou de Encomendas/Agendamentos. Entre em contato com o suporte para mais Detalhes."
          />
        ) : (
          <>
            {profile.options.delivery.enableKm &&
              <Card>
                <Card.Header className="text-dark">
                  <h4>Tipo de Entrega</h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col
                      sm="2"
                      className="d-flex flex-row-reverse gap-2 justify-content-end"
                    >
                      <Form.Label htmlFor="km">Por Quilômetro</Form.Label>
                      <Form.Check
                        type="radio"
                        name="freightType"
                        checked={profile.typeDelivery === "km"}
                        onChange={() => {
                          handleConfirmModal({
                            actionConfirm: () => {
                              handleChangeFreight();
                            },
                            title: "Redefinir Taxas?",
                            message:
                              "Se você alterar a forma de taxa todas as taxas atuais serão apagadas!\nDeseja realmente alterar a forma de taxa?",
                            confirmButton: "Redefinir Taxas",
                            cancelButton: "Não",
                          });
                        }}
                        id="km"
                      />
                    </Col>
                    <Col
                      sm="2"
                      className="d-flex flex-row-reverse gap-2 justify-content-end"
                    >
                      <Form.Label htmlFor="neighborhood">Por Bairro</Form.Label>
                      <Form.Check
                        type="radio"
                        id="neighborhood"
                        name="freightType"
                        checked={profile.typeDelivery === "neighborhood"}
                        onChange={() => {
                          handleConfirmModal({
                            actionConfirm: () => {
                              handleChangeFreight();
                            },
                            title: "Redefinir Taxas?",
                            message:
                              "Se você alterar a forma de taxa todas as taxas atuais serão apagadas!\nDeseja realmente alterar a forma de taxa?",
                            confirmButton: "Redefinir Taxas",
                            cancelButton: "Não",
                          });
                        }}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>}
            <Card>
              <Card.Header className="text-dark">
                <div className="d-flex justify-content-between">
                  <h4>Taxas de Entrega</h4>
                  <HelpVideos.Trigger
                    urls={[
                      { src: "https://www.youtube.com/embed/oaJ1dMfaKqE", title: "Frete por bairro" },
                      { src: "https://www.youtube.com/embed/7PkgbAmpJS8", title: "Frete por KM" },
                    ]} />
                </div>
              </Card.Header>
              {profile && (
                <Card.Body>
                  {profile.typeDelivery === "km" ? (
                    <KmFreight
                      taxDelivery={
                        profile.taxDelivery as ProfileTaxDeliveryKM[]
                      }
                    />
                  ) : (
                    <NeighborhoodFreight
                      taxDelivery={
                        profile.taxDelivery as ProfileTaxDeliveryNeighborhood[]
                      }
                    />
                  )}
                </Card.Body>
              )}
            </Card>
          </>
        )}
      </section>
    </>
  );
}
