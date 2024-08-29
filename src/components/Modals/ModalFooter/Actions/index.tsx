import { useContext } from "react";
import { Button, Col, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { AppContext } from "../../../../context/app.ctx";

type ActionsProp = {
    deleteFunction?: () => void;
    handleClose?: () => void;
    createOrUpdate?: (e: any) => Promise<void>;
    type: "create" | "update",
    disabledButtonSave: boolean;
    invalid?: boolean;
}
export function ActionsFooterButton({ deleteFunction, handleClose, createOrUpdate, type, disabledButtonSave, invalid }: ActionsProp) {
    const { handleShowToast } = useContext(AppContext);

    return <Row className="flex-grow-1 flex-column-reverse flex-md-row">
        {type === "update" && (
            <Col sm="12" md className="d-flex">
                {
                    deleteFunction &&
                    <Button
                        variant="outline-danger"
                        className="flex-grow-1 flex-md-grow-0"
                        onClick={deleteFunction}
                    >
                        Excluir
                    </Button>
                }
            </Col>
        )}
        <Col sm="12" md className="d-flex flex-column flex-md-row my-2 my-md-0 justify-content-end gap-2">
            {
                handleClose &&
                <Button variant="danger" className="order-1 order-md-0" onClick={() => handleClose()}>
                    Cancelar
                </Button>
            }

            {
                createOrUpdate &&

                <Button
                    variant="success"
                    className="px-4 order"
                    type="submit"
                    form="form-size"
                    disabled={disabledButtonSave}
                    onClick={(e) => {
                        if (disabledButtonSave) {
                            handleShowToast({
                                title: "Revisão",
                                type: "alert",
                                content: "Por Favor, revise os dados."
                            })
                        } else {
                            createOrUpdate(e)
                        }
                    }}
                >
                    {
                        type === "create" ?
                            "Criar" : "Salvar"
                    }
                </Button>
            }
        </Col>
    </Row>
}