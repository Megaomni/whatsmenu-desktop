import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import { FaCopy } from "react-icons/fa";
import { DnsConfig } from "../../../../components/DnsConfig";
import { OverlaySpinner } from "../../../../components/OverlaySpinner";
import { Title } from "../../../../components/Partials/title";
import { AppContext } from "../../../../context/app.ctx";
import useLocalStorage from "../../../../hooks/useLocalStorage";
import Domain, { DNSRecord, DomainType } from "../../../../types/domains";
import { apiRoute, handleCopy, hash } from "../../../../utils/wm-functions";
import { HelpVideos } from "@components/Modals/HelpVideos";

interface SettingsDomainsProps {
  domains: Domain[];
}

export default function SettingsDomains(props: SettingsDomainsProps) {
  const { data: session } = useSession();
  const { handleShowToast } = useContext(AppContext);
  const [domains, setDomains] = useState(props.domains);
  const [domain, setDomain] = useState<Domain>();
  const [dnsConfig, setDnsConfig] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    "defaultDomain",
    null,
    "sessionStorage"
  );
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const haveDefault = domains.find((d: DomainType) => d.default);
    if (haveDefault) {
      setDefaultDomain(haveDefault.name);
    }
  }, [domains, setDefaultDomain]);

  const handleAddDomain = async () => {
    try {
      if (newDomain !== "") {
        const haveDomain = domains.find((d) => d.name === newDomain);
        if (!haveDomain) {
          const body = {
            name: newDomain, //.replace(/(http?\D:\/\/)/, "").replace(/(\w+\.)/, "")
          };
          const { data } = await apiRoute(
            "/dashboard/domains",
            session,
            "POST",
            body
          );
          const regex = /.+(\..+)$/gm;
          let domainArr;
          while (
            (domainArr = regex.exec(data[data.length - 1].name)) !== null
          ) {
            if (domainArr.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            //.cf, .ga, .gq, .ml, or .tk
            if (
              domainArr[1] == ".cf" ||
              domainArr[1] == ".ga" ||
              domainArr[1] == ".gq" ||
              domainArr[1] == ".ml" ||
              domainArr[1] == ".tk"
            ) {
              handleShowToast({
                type: "alert",
                content:
                  "Domínio registrado com sucesso!, entre em contato com o suporte para solicitar o cadastro de registro de DNS",
              });
            } else {
              handleShowToast({
                type: "success",
                content: "Domínio registrado com sucesso!",
              });
            }
          }
          setDomains(data);
        } else {
          return handleShowToast({
            type: "alert",
            content: "Esse dominio ja esta registrado",
          });
        }
      } else {
        return handleShowToast({
          type: "alert",
          content: "Por favor insira um domínio válido",
        });
      }
    } catch (error) {
      console.error(error);
      switch ((error as any).errors.code) {
        case 1049:
          return handleShowToast({
            type: "erro",
            title: "Domínio Inválido",
            content:
              "Este domínio não é válido por favor insira um dominio válido",
          });
        case 1061:
          return handleShowToast({
            type: "erro",
            title: "Domínio Inválido",
            content: "Este domínio já esta cadastrado",
          });
        default:
          return handleShowToast({ type: "erro" });
      }
    }
  };

  const handleDeleteDomain = async (domainId: number) => {
    try {
      await apiRoute("/dashboard/domains/deleteDomain", session, "DELETE", {
        domainId,
      });
      const updatedDomains = domains.filter((d) => d.id !== domainId);
      setDomains(updatedDomains);
      setDomain(undefined);
      handleShowToast({
        type: "success",
        content: `Domínio excluído com sucesso`,
        title: "Excluir domínio",
      });
    } catch (error) {
      console.error(error);
      return handleShowToast({ type: "erro", title: "Excluir Domínio" });
    }
  };

  const handleGetDnsRecords = async () => {
    if (domain) {
      setFetched(true);
      try {
        const { data } = await apiRoute(
          "/dashboard/domains/dnsRecords",
          session,
          "POST",
          { domainId: domain.id }
        );
        const updatedDomain = domains.find((d) => d.id === domain.id);
        if (updatedDomain) {
          updatedDomain.dns = data;
          domain.dns = data;
          setFetched(false);
          setDomains(domains);
        }
      } catch (error) {
        console.error(error);
        return handleShowToast({ type: "erro" });
      }
    }
  };

  const handleUpdateDefaultDomain = async (domainId: number) => {
    try {
      const { data: updatedDomains } = await apiRoute("/dashboard/domains/updateDomain", session, "PATCH", {
        id: domainId,
      });
      setDomains(updatedDomains);
      handleShowToast({
        type: "success",
        content: `Domínio padrão alterado com sucesso`,
        title: "Domínio padrão",
      });
    } catch (error) {
      console.error(error);
      return handleShowToast({ type: "erro", title: "Excluir Domínio" });
    }
  }

  useEffect(() => {
    if (domain && !domain.dns) {
      handleGetDnsRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  const handleDeleteDnsRecord = async (dns: DNSRecord) => {
    if (domain) {
      try {
        await apiRoute("/dashboard/domains/deleteDns", session, "DELETE", {
          id: dns.id,
          zone_id: domain.key,
        });
        domain.dns = domain.dns?.filter((item) => item.id !== dns.id);

        setDomains([...domains]);
        handleShowToast({
          type: "success",
          title: "Entrada de DNS",
          content: "Entrada de DNS excluída com sucesso",
        });
      } catch (error) {
        console.error(error);
        return handleShowToast({ type: "erro" });
      }
    }
  };

  return (
    <>
      <Title
        title="Configurações"
        className="mb-4"
        componentTitle="Configurações de Domínios"
        child={["Domínios"]}
      />
      <div>
        <div className="bd-callout bd-callout-warning">
          <h5>ATENÇÃO!</h5>
          <p>
            Após o cadastro do domínio será necessário realizar o apontamento
            para esses servidores
          </p>
          <input type="hidden" id="textCopy" />
          <ul className="mt-2">
            <li>
              <span className="with-icon cursor-pointer" onClick={(e) => handleCopy(e, handleShowToast)}>
                melissa.ns.cloudflare.com
                <FaCopy />
              </span>
            </li>
            <li>
              <span className="with-icon cursor-pointer" onClick={(e) => handleCopy(e, handleShowToast)}>
                viddy.ns.cloudflare.com
                <FaCopy />
              </span>
            </li>
          </ul>
        </div>
        <section id="domainForms">
          {dnsConfig && domain ? (
            <DnsConfig domain={domain} setDnsConfig={setDnsConfig} />
          ) : (
            <Card>
              <Card.Header className="d-flex gap-3">
                <h4>Domínio</h4>
                <div className="vr"></div>
                <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/IZxOQS5rCTk', title: 'Domínio' }]} />
              </Card.Header>
              <Card.Body>
                <Form className="d-flex">
                  <Container fluid className="mx-0">
                    <Row>
                      <Col sm="10">
                        <Form.Control
                          type="text"
                          id="newDomain"
                          placeholder="dominio.com"
                          className="w-100"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                        />
                      </Col>
                      <Col sm className="mt-2 mt-md-0">
                        <Button
                          variant="success"
                          className="px-4 w-100"
                          onClick={handleAddDomain}
                        >
                          Salvar
                        </Button>
                      </Col>
                    </Row>
                  </Container>
                </Form>
              </Card.Body>
            </Card>
          )}
        </section>
        <section
          id="domainInfo"
          className="position-relative"
          style={{ minHeight: "13.75rem" }}
        >
          {!fetched ? (
            <Card className="mt-5">
              <Card.Header>
                <h4>
                  {dnsConfig ? "Dados do Domínio" : "Domínios Cadastrados"}
                </h4>
              </Card.Header>
              <Card.Body>
                {dnsConfig ? (
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Nome</th>
                        <th>Conteúdo</th>
                        <th className="col-1">Excluir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domain?.dns?.map((dns) => (
                        <tr key={hash()}>
                          <td>{dns.type}</td>
                          <td>{dns.name}</td>
                          <td>{dns.content}</td>
                          <td>
                            <Button
                              variant="danger"
                              onClick={() => {
                                handleDeleteDnsRecord(dns);
                              }}
                            >
                              Excluir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr className="fs-7">
                        <th>Domínio</th>
                        <th>Padrão</th>
                        <th className="col-1">Excluir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains?.map((domainMap, index) => (
                        <tr key={hash()}>
                          <td
                            onClick={() => {
                              setDnsConfig(true);
                              setDomain(domainMap);
                            }}
                          >
                            {domainMap.name}
                          </td>
                          <td>
                            <Form.Check
                              type="radio"
                              name="domain"
                              defaultChecked={domainMap.default}
                              onChange={() => handleUpdateDefaultDomain(index)}
                            />
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              onClick={() => {
                                if (domainMap.default) {
                                  return handleShowToast({
                                    type: "alert",
                                    content: `Domínio padrão não pode ser excluído. Por favor entre em contato com o suporte  `,
                                    title: "Excluir domínio",
                                  });
                                }
                                handleDeleteDomain(domainMap.id as number);
                              }}
                            >
                              Excluir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          ) : (
            <OverlaySpinner show={fetched} textSpinner="Aguarde..." />
          )}
        </section>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  const { data: domains } = await apiRoute("/dashboard/domains", session);
  return {
    props: { domains },
  };
};
