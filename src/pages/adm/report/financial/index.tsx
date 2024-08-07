import { DateTime } from "luxon";
import { UserType } from "next-auth";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Card, Form, Container, Row, Col, Table, ProgressBar } from "react-bootstrap";
import { Title } from "../../../../components/Partials/title";
import { ReportAdmGraphic } from "../../../../components/Report/AdmGraphic";
import { apiRoute } from "../../../../utils/wm-functions";

export interface AdmReports {
  [key: string]: any;
  canceleds: any;
  mensalities: any;
  registers: any;
  upgrades: any;
  paids?: any;
  paidLates?: any;
}

export default function AdmReportFinancial() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<AdmReports>();
  const [type, setType] = useState("registers");
  const [monthInput, setMonthInput] = useState(
    DateTime.local().toFormat("yyyy-MM")
  );
  const [months, setMonths] = useState<string[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [progress, setProgress] = useState<number>(1);
  const [filterRegister, setFilterRegister] = useState<"all" | "true" | "false">("all");

  useEffect(() => {
    (async () => {
      const intervalProgress = setInterval(() => {
        setProgress((oldProgress) => (oldProgress + parseInt(String(Math.random() * (5 + 3) + 3))));
      }, 3500)
      const { data } = await apiRoute(
        "/administrator-api/financial/report",
        session,
        "GET"
      );
      setProgress(100);
      setTimeout(() => {
        clearInterval(intervalProgress);
        setProgress(0);
        setReports(data);
      }, 300)
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reports) {
      setMonths(Object.keys(reports.registers));
      const registerFiltered = reports[type][monthInput].filter((user: any) => {
        switch (filterRegister) {
          case "all":
            return user
          case "true":
            return user?.controls?.serviceStart
          case "false":
            return user?.controls?.serviceStart === false
        }
      })
      setUsers([
        ...registerFiltered,
      ]);
    }
  }, [reports, type, monthInput, filterRegister]);

  return (
    <>
      <Title
        title="ADM"
        componentTitle="Relatório Anual"
        className="mb-4"
        child={["Relatórios", "Relatório Anual"]}
      />
      <Card>
        <Card.Header>
          <h4>Clientes</h4>
        </Card.Header>
        <Card.Body>
          <ReportAdmGraphic
            type="client"
            reports={reports}
            months={months}
            period="yearly"
          />
          {
            (progress !== 0 && !reports) &&
            <div className="mb-4">
              <h6>Carregando...</h6>
              <ProgressBar now={progress} id="progressBar-sellers" />
            </div>
          }
        </Card.Body>

      </Card>
      <hr />
      <Container className="mx-0">
        <Form>
          <Row>
            <Col sm>
              <Form.Label className="fs-7">Mês:</Form.Label>
              <Form.Select
                value={monthInput}
                onChange={(e) => {
                  setMonthInput(e.target.value);
                  setFilterRegister("all");
                }}

              >
                {months.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col sm>
              <Form.Label className="fs-7">Tipo:</Form.Label>
              <Form.Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setFilterRegister("all");
                }}
              >
                <option value="registers">Cadastros</option>
                <option value="mensalities">Mensalidades</option>
                <option value="upgrades">Upgrades</option>
                <option value="canceleds">Cancelamentos</option>
              </Form.Select>
            </Col>
          </Row>
        </Form>
      </Container>
      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>Lista de clientes</h4>
          <div className="mt-2 mt-md-0 d-flex gap-2 align-items-center me-2">
            <Form.Label className="text-nowrap">Com Cadastro: </Form.Label>
            <Form.Select
              value={filterRegister}
              onChange={(e) => {
                setFilterRegister(e.target.value as "all" | "true" | "false")
              }}
              disabled={reports && !reports[type][monthInput].length}
            >
              <option value="all">Todos</option>
              {
                ["Sim", "Não"].map(el => {
                  return <option key={el} value={el === "Sim" ? "true" : "false"}>{el}</option>
                })
              }
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          <Table className="mt-3" responsive striped hover>
            <thead>
              <tr className="fs-7">
                <th>#</th>
                <th>id</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Cadastro</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {users.reverse().map((user, index) => (
                <tr key={user?.id} className="fs-7">
                  <td>{index + 1}</td>
                  <td>{user?.id || "-"}</td>
                  <td>{user?.name || "-"}</td>
                  <td>{user?.email || "-"}</td>
                  <td>{user?.controls?.serviceStart ? "SIM" : "NÃO"}</td>
                  <td>{user?.whatsapp || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   const session = await getSession({ req });
//   let dataFetched
//   try {
//     const { data } = await apiRoute(
//       "/administrator-api/financial/report",
//       session,
//       "GET",
//       {
//         status: true,
//       }
//     );
//     dataFetched = data
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }

//   return {
//     props: { data: dataFetched },
//   };
// };
