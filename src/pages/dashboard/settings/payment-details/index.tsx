import { useSession } from "next-auth/react";
import { useContext } from "react";
import { Col, Row } from "react-bootstrap";
import { Title } from "../../../../components/Partials/title";
import { CardDetails } from "../../../../components/Payments/CardDetails";
import { AppContext } from "../../../../context/app.ctx";

export default function PaymentDetails() {
    const { handleShowToast, gateway } = useContext(AppContext);

    const changeSubscriptionCard = async (cardId: string) => {
        try {
            handleShowToast({
                title: "Assinatura",
                content: "Atualizando Cartão",
            });
            const { data } = await gateway?.changeSubscriptionCard(cardId);

            handleShowToast({
                title: "Assinatura",
                content: "Cartão de assinatura atualizado com sucesso",
                type: "success"
            });

            return {
                subscription: true,
                cardId: data.card.id
            }

        } catch (error) {
            console.error(error);
            handleShowToast({
                title: "Assinatura",
                content: "Houve uma falha ao tentar alterar o cartão para a assinatura, tente novamente",
                type: "erro",
                delay: 5000
            });
        }
    }

    return <div>
        <Title
            title="Configurações"
            componentTitle="Configurações de Pagamento"
            child={["Dados de Pagamento"]}
        />
        <Row>
            <Col>
                <CardDetails onClickContinue={changeSubscriptionCard} />
            </Col>
        </Row>
    </div>
}