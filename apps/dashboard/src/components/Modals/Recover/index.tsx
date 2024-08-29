import { useSession } from "next-auth/react";
import { useContext } from "react";
import { useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { BiMailSend } from "react-icons/bi";
import { AppContext } from "src/context/app.ctx";
import { apiRoute } from "../../../utils/wm-functions";
import { WMToast, WMToastProps } from "../../WMToast";

interface RecoverProps {
  show: boolean;
  email?: string;
  handleClose: () => void;
  handleConfirm?: () => void;
}

export function Recover(props: RecoverProps) {
  
  const { user } = useContext(AppContext);
  
  const [showToast, setShowToast] = useState(false);
  const [toast, setToast] = useState<WMToastProps>({});

  const { show, handleClose } = props;
  return (
    <>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header>
          <h3>
            <b>Recuperação de senha</b>
          </h3>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>
            <p>Digite seu email de cadastro para recuperar sua senha</p>
          </Form.Label>
          <InputGroup>
            <InputGroup.Text>Email</InputGroup.Text>
            <Form.Control required type="email" id="recovery_email" defaultValue={props.email ?? ''} />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={async () => {
              const recovery_email = (
                document.querySelector("#recovery_email") as HTMLInputElement
              )?.value;
              if (!recovery_email) {
                setToast({
                  type: "alert",
                  content: "Insira um email válido",
                  title: "",
                });
                setShowToast(true);
                return;
              }
              try {
                const body = { recovery_email };
                await apiRoute(
                  "/recoveryPassword",
                  undefined,
                  "POST",
                  body
                );

                setToast({
                  type: "success",
                  title: "Email enviado com sucesso",
                  content: `Acesse ${props.email} e \\n verifique na "caixa de entrada" ou "spam" \\n a mensagem com o assunto: \\n "Recuperação de Senha | WhatsMenu"`,
                });
                setShowToast(true);
              } catch (error) {
                setToast({
                  type: "erro",
                  title: "",
                  content: "",
                });
                setShowToast(true);
                console.error(error);
              }
            }}
          >
            <BiMailSend />
            Enviar
          </Button>
        </Modal.Footer>
      </Modal>
      <WMToast
        position={toast.position}
        title={toast.title}
        content={toast.content}
        show={showToast}
        setShow={setShowToast}
        type={toast.type}
        size={30}
      />
    </>
  );
}
