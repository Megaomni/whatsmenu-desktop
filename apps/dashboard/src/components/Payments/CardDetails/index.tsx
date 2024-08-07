import { DateTime } from "luxon";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useContext, useState, FormEvent, useEffect } from "react";
import { Card, Button, Row, Col, Form, Modal, Badge, Container, OverlayTrigger, Popover } from "react-bootstrap";
import { AppContext } from "../../../context/app.ctx";
import { hash, inputFocus } from "../../../utils/wm-functions";
import { OverlaySpinner } from "../../OverlaySpinner";
import { IoMdHelpCircleOutline } from 'react-icons/io';

export type Card = {
    id?: string,
    holderName?: string,
    type: string,
    number?: string,
    status?: string,
    cvv?: string,
    expMonth?: number,
    expYear?: number,
    brand?: string,
    new?: boolean
}

interface Props {
    review?: boolean;
    viewModal?: boolean;
    installments?: number;
    onClickContinue: (card_id: string, installments?: number, type?: "credit_card" | "debit_card") => Promise<any>;
}

export function CardDetails({ review, viewModal, installments, onClickContinue }: Props) {
    const router = useRouter();

    const { handleShowToast, gateway, user, dispatchUser } = useContext(AppContext);
    const [cards, setCards] = useState<Card[]>([]);
    const [default_card, setDefaultCard] = useState<string | undefined>(user?.controls?.paymentInfo?.default_card);
    const [showLoading, setLoading] = useState<boolean>(false);
    const [installmentsModal, setInstallmentsModal] = useState<{ show: boolean, installments?: number, type?: "credit_card" | "debit_card" }>({
        show: false,
        installments: 1,
        type: "credit_card"
    });


    const addNewCard = () => {
        const card = cards.find(card => card.new)

        if (!card) {
            const newCardId = hash(6);
            setCards([
                ...cards,
                {
                    id: newCardId,
                    number: '',
                    cvv: '',
                    holderName: '',
                    brand: '',
                    type: '',
                    new: true
                }]);

            inputFocus(`#card_${newCardId}`)
                .then(element => {
                    element.scrollIntoView({ behavior: "smooth", block: "center" })
                }).catch(console.error);

            return
        }

        handleShowToast({
            title: 'Cartão',
            content: 'Já existe um cartão para ser adicionado em andamento'
        });

        inputFocus(`#card_${card.id}`)
            .then(element => {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }).catch(console.error);
    }

    const createOrEditCard = async (e: FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const dataNewCard = form.dataset.newCard;
        const dataNewCardId = form.dataset.newCardId;
        const inputNumber = form.querySelector('input[name=number]') as HTMLInputElement;
        const inputName = form.querySelector('input[name=holderName]') as HTMLInputElement;
        const inputCvv = form.querySelector('input[name=cvv]') as HTMLInputElement;
        const inputMonth = form.querySelector('input[name=expMonth]') as HTMLInputElement;
        const inputYear = form.querySelector('input[name=expYear]') as HTMLInputElement;

        if (/[^0-9\s]/.test(inputNumber.value) || inputNumber.value.length < 19) {
            handleShowToast({
                title: 'Dados de Pagamentos',
                content: 'Revise o número do cartão',
            });

            return
        }

        if (inputCvv.value.length < 3) {
            handleShowToast({
                title: 'Dados de Pagamento',
                content: 'Revise o Código de Segurança'
            });

            return
        }

        if (!inputName.value.length) {
            handleShowToast({
                title: 'Dados de Pagamento',
                content: 'Revise o nome do titular'
            });

            return
        }

        const month = Number(inputMonth.value);
        const year = Number(inputYear.value);
        if (!(month >= 1 && month <= 12) || !(year >= DateTime.local().year)) {
            handleShowToast({
                title: 'Dados de Pagamento',
                content: 'Revise a data de vencimento'
            });

            return
        }

        if (!user.controls.paymentInfo) {
            handleShowToast({
                title: "Aviso",
                content: "Seu usuário não tem um gateway associado",
                type: "erro"
            })
            return
        }

        switch (user?.controls?.paymentInfo?.gateway) {
            case 'pagarme':
                try {
                    handleShowToast({
                        title: "Aguarde",
                        content: "Gerando token de segurança do seu cartão"
                    });

                    const { data: token } = await gateway?.createCardToken({
                        number: inputNumber.value.replace(/\s/g, ""),
                        name: inputName.value,
                        cvc: inputCvv.value,
                        exp_month: inputMonth.value,
                        exp_year: inputYear.value,
                        currency: "BRL"
                    });

                    handleShowToast({
                        title: "Aguarde",
                        content: "Adicionando seu cartão"
                    });

                    const { data: { card: newCard } } = await gateway?.createCard(token.id);
                    const userCards = user.controls.paymentInfo.cards ? user.controls.paymentInfo.cards.filter(card => card.id !== newCard.id) : []
                    const newCards = [...userCards, newCard];

                    if (!default_card) {
                        setDefaultCard(newCard.id);
                    }

                    dispatchUser({
                        type: "update",
                        payload: {
                            controls: {
                                ...user.controls,
                                paymentInfo: {
                                    ...user.controls.paymentInfo,
                                    cards: newCards
                                }
                            }
                        }
                    });

                    setCardsUser(newCards.filter(card => !card.new));

                    handleShowToast({
                        title: "Cartão",
                        content: "Cartão adicionado com sucesso",
                        type: "success"
                    });

                } catch (error) {
                    console.error(error);
                    handleShowToast({
                        title: "Cartão",
                        content: "Houve um problema ao adicionar seu cartão, verifique os dados e tente novamente",
                        type: 'erro'
                    });
                }

                break;
            case "stripe":
                handleShowToast({
                    title: "Token",
                    content: "Criando Token de Segurança"
                });

                const { data: token } = await gateway?.createCardToken({
                    currency: user?.controls?.currency,
                    cvc: inputCvv.value,
                    exp_month: inputMonth.value,
                    exp_year: inputYear.value,
                    name: inputName.value,
                    number: inputNumber.value
                });

                handleShowToast({
                    title: "Cartão",
                    content: "Adicionando Seu Cartão",
                    type: "success"
                });

                const { data: card } = await gateway?.createCard(token.id);


                const newCard = {
                    id: card.id,
                    holderName: card.name,
                    type: card.funding,
                    cvv: `***`,
                    expMonth: card.exp_moth,
                    expYear: card.exp_year,
                    brand: card.brand,
                    lastDigits: card.last4,
                    firstDigits: "******    "
                }

                const newCards = [...cards.filter(item => !(dataNewCard && (dataNewCardId === item.id))), ...[newCard]];

                setCardsUser(newCards);

                handleShowToast({
                    title: "Cartão",
                    content: "Cartão adicionado com sucesso",
                    type: "success"
                });
                break;
        }

    }

    const deleteCard = async (cardId?: string, newCard?: boolean) => {
        try {

            if (cardId) {
                if (!user.controls.paymentInfo) {
                    return
                }

                if (!newCard) {
                    const { data } = await gateway?.deleteCard(cardId);
                }

                handleShowToast({
                    title: "Excluir Cartão",
                    content: "Cartão excluído com sucesso.",
                    type: "success"
                });

                const newCards = user.controls.paymentInfo.cards.filter(card => card.id !== cardId);

                if (cardId === default_card) {
                    setDefaultCard(newCards[0].id);
                }

                dispatchUser({
                    type: "update",
                    payload: {
                        controls: {
                            ...user.controls,
                            paymentInfo: {
                                ...user.controls.paymentInfo,
                                cards: newCards
                            }
                        }
                    }
                });

                setCardsUser(newCards);
            }
        } catch (error) {
            console.error(error);
            handleShowToast({
                title: "Excluir Cartão",
                content: "Cartão não foi excluído, é necessário cancelar as inscrições vinculadas a esse cartão neste painel"
            })
        }

    }

    const generateContinueButtonName = () => {
        const paymentInfo = user?.controls?.paymentInfo;
        console.log(paymentInfo)
        if (paymentInfo?.subscription) {
            if (paymentInfo.subscription.status && paymentInfo.subscription.status !== "active") {
                return "Renovar minha assinatura"
            }

            return "Continuar"
        }

        return "Criar minha assinatura"
    }

    const onlyNumbers = (value: string) => value.replace(/\D+/g, "");

    const setCardsUser = (arrCards: any[]) => {

        if (!user.controls.paymentInfo) return

        dispatchUser({
            type: "update",
            payload: {
                controls: {
                    ...user.controls,
                    paymentInfo: {
                        ...user.controls.paymentInfo,
                        cards: arrCards
                    }
                }
            }
        });

        const cards = arrCards.map(card => {
            if (!card.new) {
                return {
                    id: card.id,
                    number: `**** **** **** ${card.lastDigits}`,
                    cvv: '***',
                    holderName: card.holderName,
                    brand: card.brand,
                    type: card.type,
                    expMonth: card.expMonth,
                    expYear: card.expYear
                }
            }
        }).filter(card => card) as any[];

        setCards(cards);
    }

    useEffect(() => {
        if (user?.controls?.paymentInfo?.cards && user.controls.paymentInfo.cards.length) {
            const userCards = user?.controls?.paymentInfo.cards;
            setCardsUser(userCards)
        } else {
            addNewCard();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!user?.controls?.paymentInfo) {
        return null
    }

    const popoverHelpCVV = <Popover title="Código de Segurança">
        <div className="p-1">
            <h4 className="fs-6 p-0 mb-1 mt-1 text-center">Código de Segurança</h4>
            <img src="/images/cartao.webp" alt="Help Card" width="200px" height="130px" />
        </div>
    </Popover>

    return (
        <Container className="d-flex flex-column p-1 bg-gray h-100 position-relative">
            <Row>
                <Col>
                    <h5>{review ? "Revise os " : ""}Dados para Pagamento</h5>
                    <span className="fs-7">As informações, não ficarão salvas em nossa base de dados.</span>
                </Col>
                <Col sm={4} className="d-flex justify-content-end align-items-center">
                    <div>
                        <Button onClick={addNewCard}>Adicionar Cartão</Button>
                    </div>
                </Col>
            </Row>
            <hr />
            <Row className="flex-grow-1 overflow-auto p-1">
                <Col>
                    {
                        cards.map((card, index) => {
                            return (
                                <Card key={`card_${card.id}`} className="d-flex flex-column" >

                                    <Card.Body className="flex-grow-1 overflow-auto">
                                        <div >
                                            <Row>
                                                <Col>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <h5 className="m-0 p-0">{(index + 1)} - Cartão {card.brand ? card.brand : 'Novo'} {card.status === "expired" ? "(EXPIRADO)" : null} </h5>
                                                        {
                                                            card.id === default_card &&
                                                            <Badge bg="success">Em uso</Badge>
                                                        }
                                                    </div>
                                                    {
                                                        !card.new &&
                                                        <>
                                                            {card.id !== default_card &&
                                                                <Button variant="link" size="sm" onClick={async () => {
                                                                    if (card.id) {
                                                                        try {
                                                                            setLoading(true);
                                                                            if (router.pathname.includes('payment-details')) {
                                                                                await gateway?.changeSubscriptionCard(card.id);
                                                                            }

                                                                            setDefaultCard(card.id);
                                                                            if (user.controls.paymentInfo) {
                                                                                dispatchUser({
                                                                                    type: 'update',
                                                                                    payload: {
                                                                                        controls: {
                                                                                            ...user.controls,
                                                                                            paymentInfo: {
                                                                                                ...user?.controls?.paymentInfo,
                                                                                                default_card: card.id
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                })
                                                                            }

                                                                            handleShowToast({
                                                                                title: "Alterar Cartão",
                                                                                content: "Cartão alterado",
                                                                                type: "success"
                                                                            })
                                                                        } catch (error) {
                                                                            console.error(error);
                                                                            handleShowToast({
                                                                                title: "Alterar Cartão",
                                                                                content: "Não foi possível alterar seu cartão tente novamente"
                                                                            })
                                                                        }

                                                                        setLoading(false);
                                                                    }
                                                                }}>Usar este cartão para cobrança</Button>}
                                                        </>
                                                    }
                                                </Col>
                                                {
                                                    default_card !== card.id &&
                                                    <Col className="d-flex justify-content-end">
                                                        <Button variant="link" onClick={() => deleteCard(card.id, card.new)}>Excluir</Button>
                                                    </Col>
                                                }
                                            </Row>
                                            <hr />
                                            <Row className="justify-content-center ">
                                                <Col >
                                                    <Form method="POST" onSubmit={createOrEditCard} id={`card_data_${card.id}`} data-new-card={!!card.new} data-new-card-id={card.id}>
                                                        <Row>
                                                            <Col>
                                                                <Form.Label>Número do Cartão</Form.Label>
                                                                <Form.Control
                                                                    id={`card_${card.id}`}
                                                                    placeholder="**** **** **** ****"
                                                                    autoComplete="false"
                                                                    name="number"
                                                                    defaultValue={!card.new ? card.number : undefined}
                                                                    minLength={19}
                                                                    maxLength={19}
                                                                    disabled={!card.new}
                                                                    required
                                                                    onChange={(e) => {
                                                                        const numbers = onlyNumbers(e.target.value);
                                                                        e.target.value = numbers.replace(/(\d{4})(?=\d)/g, "$1 ")
                                                                    }}
                                                                />
                                                            </Col>
                                                            <Col sm={4}>
                                                                <div>
                                                                    <div>
                                                                        <Form.Label className="d-flex align-items-center">
                                                                            Código de Segurança
                                                                            <OverlayTrigger trigger="click" overlay={popoverHelpCVV} placement="left-end" rootClose>
                                                                                <Button variant="text">
                                                                                    <IoMdHelpCircleOutline />
                                                                                </Button>
                                                                            </OverlayTrigger>
                                                                        </Form.Label>

                                                                        <Form.Control
                                                                            placeholder="***"
                                                                            name="cvv"
                                                                            maxLength={3}
                                                                            minLength={3}
                                                                            defaultValue={!card.new ? "***" : undefined}
                                                                            disabled={!card.new}
                                                                            required
                                                                            onChange={(e) => {
                                                                                e.target.value = onlyNumbers(e.target.value);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        <Row className="mt-2">
                                                            <Col>
                                                                <Form.Label>Titular do Cartão</Form.Label>
                                                                <Form.Control
                                                                    name="holderName"
                                                                    placeholder="João da S Gomes"
                                                                    defaultValue={card.holderName}
                                                                    disabled={!card.new}
                                                                    maxLength={100}
                                                                    required
                                                                    onChange={(e) => {
                                                                        e.target.value = e.target.value.replace(/([^a-zA-Z ]+)/i, "");
                                                                    }}
                                                                />
                                                            </Col>
                                                        </Row>
                                                        <Row className="mt-2">
                                                            <Col sm={6} >
                                                                <h6 >Data de Vencimento</h6>
                                                                <div className="d-flex gap-2 align-items-center">
                                                                    <div>
                                                                        <Form.Control
                                                                            name="expMonth"
                                                                            placeholder="MM"
                                                                            defaultValue={card.expMonth}
                                                                            disabled={!card.new}
                                                                            required
                                                                            maxLength={2}
                                                                            onChange={(e) => {
                                                                                e.target.value = onlyNumbers(e.target.value);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="fs-4">/</span>
                                                                    <div>
                                                                        <Form.Control
                                                                            name="expYear"
                                                                            placeholder="YYYY"
                                                                            defaultValue={card.expYear}
                                                                            disabled={!card.new}
                                                                            required
                                                                            minLength={4}
                                                                            maxLength={4}
                                                                            onChange={(e) => {
                                                                                e.target.value = onlyNumbers(e.target.value);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        {
                                                            card.new &&
                                                            <>
                                                                <hr />
                                                                <Row>
                                                                    <Col>

                                                                        <Button type="submit" >Adicionar</Button>
                                                                    </Col>
                                                                </Row>
                                                            </>

                                                        }
                                                    </Form>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Card.Body>
                                </Card>
                            );
                        })
                    }
                </Col>
            </Row>
            <Row>
                <Col className="d-flex justify-content-end align-items-center">
                    {
                        !router.pathname.includes("payment-details") &&

                        <Card.Footer >
                            <Button onClick={async () => {
                                setLoading(true)
                                const card = cards.find(card => card.id === default_card);

                                if (default_card) {
                                    if (card && card.type === "debit") {
                                        await onClickContinue(default_card, 1, "debit_card")
                                            .catch(() => setLoading(false));

                                        return
                                    }

                                    setInstallmentsModal({ show: true, installments: 1, type: "credit_card" })
                                    setLoading(false)
                                    return
                                }

                                setLoading(false)
                                handleShowToast({
                                    title: "Dados de pagamento",
                                    content: "É necessário adicionar um cartão antes de continuar"
                                })
                            }}>
                                {
                                    generateContinueButtonName()
                                }
                            </Button>
                        </Card.Footer>
                    }
                </Col>
            </Row>
            <Modal
                show={installmentsModal.show}
                onHide={() => { setInstallmentsModal({ show: false }) }}
                centered
            >
                <Modal.Header>
                    Escolha a quantidade de parcela
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3" >
                        <Col className="d-flex gap-3">
                            <Form.Select
                                disabled={installmentsModal.type === "debit_card"}
                                value={installmentsModal.installments}
                                onChange={e => {
                                    setInstallmentsModal({
                                        ...installmentsModal,
                                        installments: Number(e.target.value)
                                    });
                                }}>
                                {
                                    Array(installments).fill("").map((item, index) => {
                                        return <option key={(item + (index + 1))} value={index + 1} >Parcelar em {index + 1}x</option>
                                    })
                                }
                            </Form.Select>

                            {/* <Form.Select onChange={e => {
                                setInstallmentsModal({
                                    ...installmentsModal,
                                    installments: 1,
                                    type: e.target.value as "credit_card" | "debit_card"
                                });
                            }}>
                                <option value={"credit_card"} >Cartão de Crédito</option>
                                <option value={"debit_card"} >Cartão de Débito</option>
                            </Form.Select> */}
                        </Col>
                    </Row>
                    <Row>
                        <Col className="d-flex gap-3 justify-content-between">
                            <Button onClick={() => {
                                setInstallmentsModal({ show: false });
                            }}>
                                Cancelar
                            </Button>
                            <Button onClick={async () => {
                                if (default_card) {
                                    try {
                                        setInstallmentsModal({ show: false });
                                        setLoading(true);
                                        await onClickContinue(default_card, installmentsModal.installments, installmentsModal.type)
                                            .catch(() => setLoading(false));

                                        setLoading(false);
                                    } catch (error) {
                                        setTimeout(() => {
                                            window.location.reload();
                                        }, 5000);
                                        
                                        setLoading(false);
                                        handleShowToast({
                                            title: "Aviso",
                                            content: "Desculpe, houve uma falha no processamento, recarregaremos a página"
                                        })
                                        console.error(error);
                                    }
                                }

                            }}>
                                Continuar
                            </Button>
                        </Col>
                    </Row>

                </Modal.Body>
            </Modal>
            <OverlaySpinner show={showLoading} textSpinner={"Aguarde"} />
        </Container>
    );
}