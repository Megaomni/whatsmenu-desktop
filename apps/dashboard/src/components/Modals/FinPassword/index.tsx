import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap"
import { useForm } from "react-hook-form"
import { apiRoute } from "@utils/wm-functions";
import { useSession } from "next-auth/react";
import { AppContext } from "@context/app.ctx";
import { PaymentMethodContext } from "@context/paymentMethod.ctx";
import { OverlaySpinner } from "@components/OverlaySpinner";


export interface ModalProps {
    dataToBeUpdated?: any
    setUpdateSuccess?: Dispatch<SetStateAction<boolean | null>>;
    request?: RequestProperties,
    showToast?: boolean
    updateDataCallback?: (data: any) => any
}

export interface RequestProperties {
    url: string;
    method: 'POST' | 'PATCH' | 'GET' | 'PUT' | 'DELETE'
}

const FinPasswordModal = ({ setUpdateSuccess, dataToBeUpdated, request, showToast = true }: ModalProps) => {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const { profile, handleShowToast, user } = useContext(AppContext);
    const { showFinPassModal, toggleModal, setDataResponse, updateDataCallback } = useContext(PaymentMethodContext)
    const settings = profile.formsPayment?.find(method => method.payment === dataToBeUpdated?.payment)
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<any>({ mode: 'onChange' })

    const handleClose = () => {
        if (setUpdateSuccess) setUpdateSuccess(false);
        toggleModal(false);
        reset()
    }

    const updateData = async (form: any) => {
        setIsLoading(true)
        const isFormData = dataToBeUpdated instanceof FormData
        let body: any;
        if (isFormData) {
            dataToBeUpdated.append('password', form.password)
            body = dataToBeUpdated
        } else {
            body = {
                data: { ...dataToBeUpdated },
                password: form.password
            }
        }
        try {
            const result = await apiRoute(
                request?.url ?? `/dashboard/profile/formpayment/${settings?.payment}/update`,
                session, request?.method ?? "PATCH",
                body,
                isFormData ? {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${session?.accessToken}`
                } : null);
            setDataResponse(result)
            showToast && handleShowToast({
                type: "success",
                title: "Sucesso",
            });
            toggleModal(false)
            if (setUpdateSuccess) setUpdateSuccess(true);
        } catch (error:any) {
            setDataResponse({ ...error, error })
            if (setUpdateSuccess) setUpdateSuccess(false);
            handleShowToast({
                type: "alert",
                title: "Erro",
                content: error.response?.data?.message ?? 'Por favor, revise os dados inseridos.'
            });
        } finally {
            reset()
            setIsLoading(false)
        }

    }

    const handleRecoverSecurity = async () => {
        try {
            await apiRoute(
                "/dashboard/account/recoverySecurityPassword",
                session,
                "POST" 
            );

            handleShowToast({
                type: "success",
                content: `Acesse ${user.email} e \\n verifique na "caixa de entrada" ou "spam" \\n a mensagem com o assunto: \\n "Recuperação de Senha | WhatsMenu"`,
                size: 30,
            });
        } catch (error) {
            handleShowToast({
                type: "erro",
                content: ``,
            });
            console.error(error);
        }
    };



    return (
        <Modal show={showFinPassModal || false} onExit={() => reset()} onHide={() => handleClose()}>
            <Modal.Header closeButton>
                <Modal.Title>Confirmar Senha Financeira</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit(updateDataCallback ?? updateData)}>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Senha Financeira</Form.Label>
                        <Form.Control
                            {...register('password', { required: true })}
                            type="password"
                            placeholder="••••••••"
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <Button variant="link" className="text-decoration-none" style={{ boxShadow: 'none' }} onClick={handleRecoverSecurity}>
                        Recuperar Senha
                    </Button>
                    <Button variant="success" type="submit">
                        Salvar
                    </Button>
                </Modal.Footer>
                <OverlaySpinner show={isLoading} />
            </Form>
        </Modal>)
}

export default FinPasswordModal