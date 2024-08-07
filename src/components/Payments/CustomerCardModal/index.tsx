import {Modal } from "react-bootstrap";
import { CardDetails } from "../CardDetails";

interface Props {
    review?: boolean,
    show?: boolean,
    onHide: <T> (...props: any) => T;
    cardDetailsProps: {
        installments: number
        continueButtonFunction: <T>(card_id: string, installments?: number, type?: "credit_card" | "debit_card") => Promise<any>
    }
}

export function CustomerCardAndSubscriptionsModal({ show, onHide, cardDetailsProps }: Props) {

    return (
        <Modal
            show={show}
            onHide={onHide}
            size={"lg"}
            centered
            className="modal-dialog-90-h"
        >
            <Modal.Body className="overflow-auto p-2 h-100">
                <CardDetails 
                installments={cardDetailsProps.installments}
                onClickContinue={cardDetailsProps.continueButtonFunction}
                    viewModal={true} />
            </Modal.Body>
        </Modal>
    )
}