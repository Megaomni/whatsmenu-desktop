import { Button, Card, Col, Row } from "react-bootstrap";
import {
  FaChartLine,
  FaCoins,
  FaHourglass,
  FaMagic,
  FaQrcode,
  FaTachometerAlt,
  FaThumbsUp,
  FaUser,
} from "react-icons/fa";
import { GoPackage } from "react-icons/go";

interface AddPlanProps {
  title: string;
  plan: "delivery" | "table" | "package";
  notDefaultTitle?: boolean;
}

export function AddPlan({ title, plan, notDefaultTitle }: AddPlanProps) {
  return (
    <>
      <Card className="mt-4">
        <Card.Header className="text-700 text-center">
          <h2>
            <b>
            {notDefaultTitle ? "" : "Controle de " }{title}</b>
          </h2>
        </Card.Header>
        <Card.Body className="d-flex flex-column">
          {plan === "table" && (
            <>
              <Row>
                <Col sm="6">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/-iwJoaRRFRE?controls=0"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-100"
                    allowFullScreen
                  ></iframe>
                </Col>
                <Col sm="6">
                  <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/M5Q667_9UCg?controls=0"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="w-100"
                    allowFullScreen
                  ></iframe>
                </Col>
              </Row>
              <Row className="mt-2 text-center">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaTachometerAlt fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Agilidade</b>
                      </p>
                      <span className="my-auto">
                        Agilidade incrível no controle de mesas e comandas nunca
                        visto antes, este sistema é tudo que você sempre sonhou
                        para ganhar mais dinheiro e organizar seu restaurante.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaMagic fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Automatização</b>
                      </p>
                      <span className="my-auto">
                        Agora você controla as mesas e comandas do seu
                        restaurante de forma automática, sem erros ou mão de
                        obra extra para tirar os pedidos.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaQrcode fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>QRCode</b>
                      </p>
                      <span className="my-auto">
                        Tecnologia QRCode de auto-atendimento por mesa, não
                        precisa do garçom tirador de pedidos.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="text-center mt-4">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaUser fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Auto-Atendimento</b>
                      </p>
                      <span className="my-auto">
                        Com este auto-atendimento os seus clientes pedem
                        sozinhos na mesa e os pedidos são impressos
                        automaticamente direto na sua cozinha por ordem na fila.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaChartLine fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Zero Perdas</b>
                      </p>
                      <span className="my-auto">
                        Chega daquelas letras indecifráveis, erros e prejuízos
                        no preparo dos pratos, mantenha tudo funcionando com
                        muita agilidade no seu restaurante.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaCoins fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Encerramento</b>
                      </p>
                      <span className="my-auto">
                        Fechamento rápido da conta direto na mesa ou no caixa, o
                        WhatsMenu separa e calcula sozinho o que cada comanda
                        consumiu permitindo cobrar individualmente o cliente que
                        vai embora antes da mesa ser encerrada, permitindo
                        fechamentos com tranquilidade e livre de erros.
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
          {plan === "package" && (
            <>
              <Row className="mt-2 text-center">
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <GoPackage fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>O Sistema de Encomenda</b>
                      </p>
                      <span className="my-auto">
                        <p>
                          Permite ao seu cliente escolher o dia e horário para
                          receber seu pedido.
                        </p>
                        <p>
                          Permite que o cliente escolha o dia e horário em que
                          deseja receber o pedido.
                        </p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaHourglass fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>24H</b>
                      </p>
                      <span className="my-auto">
                        <p>
                          Você pode vender 24h, mesmo com seu estabelecimento
                          fechado
                        </p>
                        <p>
                          Evita contratempos, como o cliente não estar
                          disponível para receber o pedido e o entregador perder
                          a viagem
                        </p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
                <Col sm>
                  <Card className="plan-display h-100">
                    <Card.Body className="d-flex flex-column align-items-center ">
                      <FaThumbsUp fontSize={40} className="mt-2" />
                      <p className="mt-4">
                        <b>Vantagens</b>
                      </p>
                      <span className="my-auto">
                        <p>
                          Configure os dias e horários aceitos pelo
                          estabelecimento
                        </p>
                        <p>O cliente escolhe o melhor horário para ele</p>
                        <p>
                          Ajuda à melhor organização na logística de entrega
                        </p>
                      </span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
          <Button
            variant="success"
            size="lg"
            className="text-uppercase fs-1 flex-grow-1 mx-auto text-wrap mt-5"
            onClick={() => {
              if(plan === "package"){
                window.open("https://api.whatsapp.com/send/?phone=5511937036875&text=Já%20sou%20cliente%20delivery%20e%20quero%20agendar%20o%20treinamento%20do%20sistema%20de%encomendas.")
              }else if(plan === "table"){
                window.open("https://api.whatsapp.com/send/?phone=5511937036875&text=á%20sou%20cliente%20delivery%20e%20quero%20agendar%20o%20treinamento%20do%20sistema%20de%20mesa.")
              }
            }}
          >
            Falar com consultor agora
          </Button>
        </Card.Body>
      </Card>
    </>
  );
}
