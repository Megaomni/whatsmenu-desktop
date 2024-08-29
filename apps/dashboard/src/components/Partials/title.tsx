import Head from "next/head";
import Link from "next/link";
import { Col, Row } from "react-bootstrap";

interface TitleProps {
  title: string;
  componentTitle?: string;
  className?: string;
  child?: string[];
}

export function Title(props: TitleProps) {
  const { title, componentTitle, className, child } = props;
  return (
    <div className={className}>
      <Head>
        <title>{title} - WhatsMenu</title>
      </Head>
      <Row className="pagetitle justify-content-between">
        <Col lg="8" md="7">
          <h1 className="fs-3 align-middle text-uppercase mb-0">
            {componentTitle ? componentTitle : title}
          </h1>
        </Col>
        <Col className="text-end">
          <div className="d-flex justify-content-end flex-nowrap">
            <span className="d-flex justify-content-end flex-nowrap">
              <nav>
                <ol className="breadcrumb">
                  <li className="breadcrumb-item active">
                    <Link href="/dashboard">
                      Home
                    </Link>
                  </li>
                  <li className={`breadcrumb-item ${child ? "" : "active"}`}>
                    {title}
                  </li>
                  {child?.map((c, index) => {
                    return (
                      <li
                        className={`breadcrumb-item ${
                          child.length && index === child.length - 1 ? "active" : ""
                        }`}
                        key={c}
                      >
                        {c}
                      </li>
                    )
                  })}
                </ol>
              </nav>
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
}
