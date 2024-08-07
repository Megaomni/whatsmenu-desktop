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
}

function HelpVideosTrigger({ urls, className, ...rest }: HelpVideosTriggerProps) {
  const { handleHelpVideo } = useContext(AppContext);

  return (
    <div className={className ?? "my-auto"} {...rest}>
      <Button
        as="a"
        variant="danger"
        href="#"
        className="px-3 py-2  fs-7 rounded-3 w-100"
        onClick={() =>
          handleHelpVideo([...urls])
        }
      >
        <span>Como Fazer?</span>
      </Button>
    </div>
  )
}

export const HelpVideos = {
  Root: HelpVideosRoot,
  Trigger: HelpVideosTrigger
}