import { Button, Card, Col, Form, FormGroup, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export function ConfigEmission() { 
  const { t } = useTranslation()

    return (
        <>
        <form>
            <Card>
                <Card.Header className="m-2 p-2 fw-bold fs-5">{t('emission_ecfn')}</Card.Header>
                <Card.Body>
                    <h5 className="fw-bold" style={{ color: '#000' }}>{t('set_defaults_for_automatic_issuance_of_your_fiscal_notes')}.</h5>
                    <p style={{color: '#9894A4'}}>*{t('whenever_necessary_you_can_manually_issue_in_addition_to_the_defined_standard')}.</p>
                    <Row>
                        <Col md={2}>
                        <Form.Label>{t('money')}</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className=" ">{t('month')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('daily_average')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="">{t('pix')}</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('month')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('daily_average')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="">{t('credit_machine')}</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('month')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('daily_average')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col md={2}>
                        <Form.Label className="">{t('credit_online')}</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('month')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('daily_average')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         
                         <Col md={2}>
                        <Form.Label className="">{t('debit_machine')}</Form.Label>
                        <Form.Select>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </Form.Select>
                        
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('month')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                         <Col xs={6} md={2}>
                        <Form.Label className="">{t('daily_average')}</Form.Label>
                        <Form.Control></Form.Control>
                         </Col>
                    </Row>
                </Card.Body>
            </Card>

                <Card.Body className="mt-2" style={{ backgroundColor: '#EDEDF7', color: '#000' }}>
                    <h3 className="fw-bold">{t('dont_miss_deadlines')}!</h3>
                    <p>{t('we_will_send_the_fiscal_closing')}.</p>
                    <Form.Label>{t('accountant_email')}</Form.Label>
                    <Form.Control></Form.Control>
                    <p className="mt-3" style={{textDecoration:'line-through'}}>R$ 39,90/mês</p>
                    <h4 style={{color:'#0075FF'}}>*{t('additional_service')}<span className="fw-bold"> {t('gratis')} </span>{t('for_shopkeeper')} {t('WM')}!</h4>
                </Card.Body>

                <Card.Footer className="mt-3 p-0">
                    <Card.Header className="fw-bold">{t('plan_change')}</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>{t('current_plan')}</p>
                                    <h4 className="fw-bold m-0 p-0">{t('plan')} 100</h4>
                                    <p className="m-0 p-0">R$ 67,00</p>
                                </div>
                            </Col>
                            <Col>
                                <div>
                                    <p className="m-0 p-0" style={{color:'#0075FF'}}>{t('plan_expiration')}</p>
                                    <p className="m-0 p-0">03/08/2024</p>
                                </div>
                            </Col>
                            <Col className='mt-3'>
                                <Button className="w-100">{t('change_plan')}</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card.Footer>
        </form>
        
        </>
    )
}
