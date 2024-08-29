import { ComponentProps, useContext } from "react";
import { Button, Col, Container, Form, Modal, Nav, Row, Tab } from "react-bootstrap";
import { BsYoutube } from "react-icons/bs";
import { AppContext } from "../../../context/app.ctx";

export type UrlsType = {
  title: string,
  src: string
};
interface HelpVideosProps {
  show: boolean;
  handleClose: () => void;
  urls: UrlsType[]
}

function HelpVideosRoot({ show, handleClose, urls }: HelpVideosProps) {
  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Body className="pb-0">
          <Tab.Container defaultActiveKey={0} >
            <Nav variant="tabs" className="gap-1">
              {urls.map((url, index) => (
                <Nav.Item key={index} className="flex-grow-1 ">
                  {urls.length > 1 ? <Nav.Link eventKey={index} className="nav-link m-0 p-3 text-center" >{url.title}</Nav.Link> : null}
                </Nav.Item>
              ))}
            </Nav>

            <Tab.Content>
              {urls.map((url, index) => (
                <Tab.Pane eventKey={index} key={index}>
                  <Container className="mx-0 px-0">
                    <iframe
                      width="100%"
                      height={window.innerWidth >= 768 ? "400px" : "200px"}
                      src={url.src}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </Container>
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
        <Modal.Footer className="p-0">
          <Button
            onClick={() => {
              handleClose();
            }}
            variant="danger"
          >
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

interface HelpVideosTriggerProps extends ComponentProps<'div'> {
  urls: UrlsType[]
  textStyle?: 'link-danger' | 'text-white'
}

function HelpVideosTrigger({ urls, className, textStyle = 'link-danger', ...rest }: HelpVideosTriggerProps) {
  const { handleHelpVideo } = useContext(AppContext);

  return (
    <div className={className ?? "my-auto"} {...rest}>
      <a
        href="#"
        className={`${textStyle} fw-bold fs-7`}
        onClick={() =>
          handleHelpVideo([...urls])
        }
      >
        <span>Veja Como Usar</span> <BsYoutube />
      </a>
    </div>
  )
}

export const HelpVideos = {
  Root: HelpVideosRoot,
  Trigger: HelpVideosTrigger
}