import { useSession } from "next-auth/react";
import { FormEvent, useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row
} from "react-bootstrap";
import { AppContext } from "../../../context/app.ctx";
import { TableContext } from "../../../context/table.ctx";
import Table, { TableType } from "../../../types/table";
import { apiRoute, encryptEmoji, scrollToElement } from "../../../utils/wm-functions";
import { HelpVideos } from "../../Modals/HelpVideos";
import { OverlaySpinner } from "../../OverlaySpinner";
import { TableComponent } from "./TableComponent";

export function Tables() {
  const { data: session } = useSession();
  const { handleShowToast } = useContext(AppContext);
  let { tables, setTables, table, setCurrentTableId } =
    useContext(TableContext);

  const [newTableContent, setNewTableContent] = useState(false);
  const [newTable, setNewTable] = useState<Partial<TableType>>({
    name: "",
  });
  const [overlayShow, setOverlayShow] = useState(false);


  // ORDENANDO MESAS
  const numeric = tables
    ?.filter((a) => !isNaN(parseFloat(a.name)))
    .sort((a, b) => {
      if (parseInt(a.name) === parseInt(b.name)) {
        if (a.name.includes("0") && !b.name.includes("0")) {
          return -1;
        }

        if (!a.name.includes("0") && b.name.includes("0")) {
          return 1;
        }
      }
      return parseInt(a.name) - parseInt(b.name);
    });
  const alphabetic = tables
    ?.filter((a) => isNaN(parseFloat(a.name)))
    .sort((a, b) => {
      let c = parseInt(a.name.replace(/\D/gim, ""));
      let d = parseInt(b.name.replace(/\D/gim, ""));
      return c - d;
    });

  if (tables) {
    tables = [...numeric, ...alphabetic];
  }

  const handleNewTableContent = () => {
    setNewTableContent(true)
    setCurrentTableId(0)
  }

  const handleAddTable = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (
      tables.some(
        (t) =>
          t.name.trim().toLocaleLowerCase() ===
          newTable.name?.trim().toLocaleLowerCase()
      )
    ) {
      handleShowToast({
        type: "alert",
        content: `Ja existe uma mesa com esse nome`,
        title: `Criar Mesa`,
      });

      return;
    }
    if (newTable.name === "") {
      handleShowToast({
        type: "alert",
        content: `Por favor insira um nome válido`,
        title: `Criar Mesa`,
      });

      return;
    }

    if (newTable.name) {
      newTable.name = encryptEmoji(newTable.name);
    }

    try {
      setOverlayShow(true);
      const { data } = await apiRoute(
        "/dashboard/table/create",
        session,
        "POST",
        {
          ...newTable,
        }
      );
      setTables([...tables, new Table(data)]);
      setNewTableContent(false);
      setNewTable({
        name: "",
      });
      handleShowToast({
        type: "success",
        content: `Mesa ${data.name} criada com sucesso`,
        title: `Criar Mesa`,
      });
    } catch (error: any) {
      handleShowToast({
        type: "erro",
        title: "Criar Mesa",
        content: error.response.data ?? "",
      });
      console.error(error);
    } finally {
      setOverlayShow(false);
    }
  };

  // LIMPANDO STATE DO RESUMO DE COMANDAS QUANDO TROCA DE MESA
  // useEffect(() => {

  //   // setCommandInfo(false);
  // }, [table, setCommandInfo]);
  // ***

  useEffect(() => {
    if (tables) {
      setTables([...tables]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ***

  return (
    <>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4>Nova mesa</h4>
          <div className="vr"></div>
          <HelpVideos.Trigger urls={[{ src: "https://www.youtube.com/embed/jrckOGksJKk", title: "Criando mesa" }, { src: "https://www.youtube.com/embed/cU_kEAe9ZgQ", title: "Utilizando sistema de mesas" }]} />
        </Card.Header>
        <Card.Body>
          {newTableContent ? (
            <>
              <Row className="mt-3">
                <Col md={6}>
                  <Form onSubmit={handleAddTable}>
                    <InputGroup>
                      <Form.Control
                        placeholder="Nome da Mesa"
                        onChange={(e) => {
                          setNewTable({ name: e.target.value });
                        }}
                      />
                      <Button
                        variant="outline-success"
                        className="px-4 text-nowrap"
                        type="submit"
                      >
                        Salvar
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => setNewTableContent(false)}
                        className="px-4 text-nowrap"
                      >
                        Cancelar
                      </Button>
                    </InputGroup>
                  </Form>
                </Col>
              </Row>
            </>
          ) : (
            <>
              <Container fluid className="px-0 mx-0">
                <Row className="align-items-baseline justify-content-between gap-1 mb-3">
                  <Col md="8" className="text-center">
                    <div className="fs-7 d-block d-md-flex gap-2 mt-1 align-items-baseline justify-content-start">
                      <span className="text-center">Legenda:</span>
                      <div className="badge d-block my-2 my-md-0 wm-default rounded-pill text-dark fw-normal p-2">
                        Disponível
                      </div>
                      <div className="badge d-block my-2 my-md-0 wm-busy rounded-pill fw-normal p-2">
                        Ocupada
                      </div>
                      <div className="badge d-block my-2 my-md-0 wm-paused rounded-pill fw-normal p-2">
                        Pausada
                      </div>
                      <div className="badge d-block my-2 my-md-0 wm-selected rounded-pill text-dark fw-normal p-2">
                        Selecionada
                      </div>
                    </div>
                  </Col>
                  <Col sm="10" md className="d-flex gap-2 justify-content-end">
                    <Button onClick={() => handleNewTableContent()}>
                      <span className="px-1 text-nowrap">+ Criar Mesa</span>
                    </Button>
                    {/* <Link href="/dashboard/settings/table">
                      <Button
                        variant="outline-secondary"
                        className="fw-bold text-uppercase px-2"
                        as="a"
                      >
                        <BsGearFill size="20" />
                      </Button>
                    </Link> */}
                  </Col>
                </Row>
              </Container>
              {tables?.length ? (
                <div className="d-flex flex-wrap gap-4 justify-content-beetwen mt-4">
                  {tables.map((tableMap) => (
                    <Card
                      key={tableMap.id}
                      className={`wm-table ${tableMap.id === table?.id
                        ? "wm-selected"
                        : tableMap.status
                          ? tableMap.activeCommands().length
                            ? "wm-busy"
                            : "wm-default"
                          : "wm-paused"
                        }`}
                      onClick={(e) => {
                        scrollToElement("#tableInfoCard", {
                          position: "start",
                        });
                        setCurrentTableId(tableMap.id as number)
                        // setCurrentTableIdId(tableMap.id as number)
                        // setCurrentTableId(tableMap)
                        // setTable(tableMap);
                      }}
                    >
                      <Card.Body>
                        <span
                          className="p-2"
                          style={{ wordBreak: "break-all" }}
                        >
                          {tableMap.name}
                        </span>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <h2 className="text-center my-5 py-5">
                  Você ainda não cadastrou nenhuma mesa.
                </h2>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      <br id="tableInfoCard" />
      {
        table && (
          <Card>
            <Card.Header className="d-flex justify-content-between">
              <h4 className="text-dark mb-0">
                <b>
                  Mesa: <span className="text-red-500">{table.name}</span>
                </b>
              </h4>
              <span className="d-sm-inline d-block align-middle float-md-end">
                <HelpVideos.Trigger
                  urls={[
                    { title: 'Como encerrar a mesa total', src: 'https://www.youtube.com/embed/95eLzKAnWaM' },
                    { title: 'Como encerrar comandas  individuais', src: 'https://www.youtube.com/embed/ORL_4ahUE4Q' },
                  ]}
                />
              </span>
            </Card.Header>
            <Card.Body>
              <TableComponent />
            </Card.Body>
          </Card>
        )
      }
      <section className="modals">
        <OverlaySpinner show={overlayShow} textSpinner="Aguarde..." />
      </section>
    </>
  );
}
