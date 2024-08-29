import Head from "next/head";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Title } from "../../../components/Partials/title";

export default function AdmReleaseBlock() {
  return (
    <>
      <Title
        title="ADM"
        componentTitle="Bloqueio e Desbloqueio"
        className="mb-4"
        child={["Bloqueio e Desbloqueio"]}
      />
      <section>
        <Row>
          <Col sm>
            <Form.Group>
              <Form.Label className="fs-7">Ação</Form.Label>
              <Form.Select>
                <option>Desbloquear</option>
                <option>Bloquear</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm>
            <Form.Group>
              <Form.Label className="fs-7">Tipo de Lista</Form.Label>
              <Form.Select>
                <option>Slug</option>
                <option>E-mail</option>
                <option>WhatsApp</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Form.Group>
              <Form.Label className="fs-7">
                Coloque apenas 1 item por linha!
              </Form.Label>
              <Form.Control as="textarea"></Form.Control>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col className="d-flex ">
            <Button className="text-uppercase">
              Executar
            </Button>
          </Col>
        </Row>
      </section>
    </>
  );
}
