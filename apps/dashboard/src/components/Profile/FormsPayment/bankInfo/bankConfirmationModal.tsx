import { Modal, Button, Form } from "react-bootstrap";
import { BankAccountSettings } from "../../../../types/profile";
import StrategyGrovePay from "../../../../payment/grovepay";
import { useForm } from "react-hook-form";
import { useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { RecipientInformation } from "src/payment/strategy/gateway-strategy";
import { AppContext } from "@context/app.ctx";
import { OverlaySpinner } from "@components/OverlaySpinner";
import { DateTime } from "luxon";

interface ModalProps {
  show: boolean;
  setShow: () => void;
  formValues: BankAccountSettings;
}

export default function BankConfirmationModal({
  show,
  setShow,
  formValues,
}: ModalProps) {
  const [financialPassword, setFinancialPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession();
  const { handleShowToast, setProfile, profile } = useContext(AppContext);

  const submitForm = async () => { 
    try {
      setIsLoading(true)

      // Tratamento dos inputs
      formValues.bank = formValues.bank.split(" - ")[0];
      formValues.holder_document = formValues.holder_document.replace(
        /[./\\-]/g, ""
      );
      const data: RecipientInformation = {
        default_bank_account: formValues,
        password: financialPassword || "",
      };
      const grovePay = new StrategyGrovePay(session);
      const response = await grovePay.addRecipient(data);
      handleShowToast({
        type: "success",
        title: "Sucesso",
        content: `Dados bancários adicionados com sucesso!`,
      });
      setShow()
      setProfile({ ...profile, options: { ...profile.options, recipient: { data: formValues, created_at: DateTime.now() } } })
    } catch (error: any) {
      console.log(error)
      handleShowToast({
        type: "erro",
        title: "Erro",
        content: `${error.response.data.message}`,
      });
    } finally {
      setIsLoading(false)
    }
  };

  const sortArray = () => {
    const arr = Object.entries(formValues);
    //Declara o array para escolher os lugares corretos
    const sortedArray = [
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', '']
    ];

    for (let i = 0; i < arr.length; i++) {
      switch (arr[i][0]) {
        case "bank":
          sortedArray[3] = ["Banco", arr[i][1]];
          break;
        case "type":
          sortedArray[4] = ["Tipo de conta", arr[i][1]];
          break;
        case "holder_name":
          sortedArray[0] = ["Titular da conta", arr[i][1]];
          break;
        case "branch_number":
          sortedArray[5] = ["Agência", arr[i][1]];
          break;
        case "account_number":
          sortedArray[6] = ["Número da conta", arr[i][1]];
          break;
        case "holder_document":
          sortedArray[2] = ["Documento", arr[i][1]];
          break;
        case "account_check_digit":
          sortedArray[7] = ["Dígito da conta", arr[i][1]];
          break;
        case "holder_type":
          if (arr[i][1] === "individual") {
            sortedArray[1] = ["Pessoa", "Física"];
          } else if (arr[i][1] === "company") {
            sortedArray[1] = ["Pessoa", "Jurídica"];
          }
          break;
        default:
          break;
      };
    }
    return sortedArray;
  };

  return (
    <Modal show={show} onHide={() => setShow()}>
      <Modal.Header closeButton>
        <Modal.Title>Confirme seus dados</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ul>
          {Object.entries(sortArray()).map(([key, value]) => {
            // Lista de chaves que você deseja filtrar
            const keysToFilter = ["id", "status", "created_at", "updated_at"];
            // Verifica se a chave está na lista de chaves a serem filtradas
            if (!keysToFilter.includes(key)) {
              return (
                <li key={key}>
                  {value[0]}: {value[1]}
                </li>
              );
            }

            return null; // Não renderiza o elemento para chaves filtradas
          })}
        </ul>
        <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
          <Form.Label>Senha Financeira</Form.Label>
          <Form.Control
            type="password"
            placeholder="••••••••"
            autoFocus
            onChange={(e) => setFinancialPassword(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow()}>
          Close
        </Button>
        <Button variant="primary" onClick={() => submitForm()}>
          Enviar
        </Button>
      </Modal.Footer>
      <OverlaySpinner show={isLoading} />
    </Modal>
  );
}
