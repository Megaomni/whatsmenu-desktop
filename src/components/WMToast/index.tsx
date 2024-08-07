import { Dispatch, SetStateAction } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { BsCheckCircle } from "react-icons/bs";
import { FiAlertCircle } from "react-icons/fi";

export interface WMToastProps {
  position?:
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end",
  flexPositionX?: "start" | "center" | "end",
  flexPositionY?: "start" | "center" | "end",
  title?: string;
  content?: string;
  type?: "success" | "erro" | "alert";
  show?: boolean;
  setShow?: Dispatch<SetStateAction<boolean>>;
  delay?: number;
  size?: number;
  classAdd?: string;

}

export function WMToast({
  position,
  title,
  content,
  type,
  show,
  setShow,
  delay = 3000,
  size,
  flexPositionX,
  flexPositionY,
  classAdd
}: WMToastProps) {
  type = type ? type : "alert"
  flexPositionX = flexPositionX ? flexPositionX : "center";
  flexPositionY = flexPositionY ? flexPositionY : "center";

  if (!title) {
    switch (type) {
      case "success":
        title = "Sucesso!";
        break;
      case "erro":
        title = "Ops..!";
        break;
      case "alert":
        title = "Atenção!";
        break;
    }
  }
  if (!content) {
    switch (type) {
      case "success":
        content = "Alterações feitas com sucesso!";
        break;
      case "erro":
        content = "Algo inesperado aconteceu.Por favor tente novamente";
        break;
      case "alert":
        content = "Por favor revise os dados inseridos";
        break;
    }
  }
  return (
    <ToastContainer
      className={`d-flex align-items-${flexPositionY} justify-content-${flexPositionX} w-100 position-fixed`}
      position={position ? position : "middle-center"}
      style={{ zIndex: 999999 }}
    >
      <Toast
        className={`wm-toast-${type} ${classAdd}`}
        onClose={() => {
          if (setShow) {
            setShow(false)
          }
        }}
        show={show}
        delay={delay}
        autohide
        style={{ width: `${size}rem` }}
      >
        <Toast.Header className="gap-2 fs-5">
          {type === "success" && <BsCheckCircle />}
          {type === "erro" && <AiOutlineCloseCircle />}
          {type === "alert" && <FiAlertCircle />}
          <strong className="me-auto">{title}</strong>
        </Toast.Header>
        <Toast.Body className="fs-5 text-center" >
          {content.split("\\n").map((text) => (
            <p key={text} className="m-0">
              {text}
            </p>
          ))}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
