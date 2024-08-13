import { useSession } from 'next-auth/react'
import { QRCodeCanvas } from 'qrcode.react'
import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { FaDownload, FaShareAlt } from 'react-icons/fa'
import { AppContext } from '../../../../context/app.ctx'
import { TableContext } from '../../../../context/table.ctx'
import useLocalStorage from '../../../../hooks/useLocalStorage'
import { TableType } from '../../../../types/table'
import {
  apiRoute,
  encryptEmoji,
  handleCopy,
} from '../../../../utils/wm-functions'
import { OverlaySpinner } from '../../../OverlaySpinner'
import { useTranslation } from 'react-i18next'

export function TableComponent() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, handleShowToast } = useContext(AppContext)
  let { table, setCurrentTableId, tables, setTables, updateTable } =
    useContext(TableContext)

  // QRCODE
  const [qrCode, setQrCode] = useState<HTMLCanvasElement>()
  const [qrCodeOptions, setQrCodeOptions] = useState({
    size: 1,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
  })
  const [defaultDomain, setDefaultDomain] = useLocalStorage<string | null>(
    'defaultDomain',
    null,
    'sessionStorage'
  )
  const [newName, setNewName] = useState('')

  const [overlayShow, setOverlayShow] = useState(false)

  const QRCodeScale = 158 + (158 / 10) * qrCodeOptions.size

  const handleEditTable = async () => {
    if (newName !== '' && newName !== table?.name) {
      if (table) {
        if (
          tables.some(
            (t) =>
              t.name.trim().toLocaleLowerCase() ===
              newName.trim().toLocaleLowerCase()
          )
        ) {
          return handleShowToast({
            type: 'alert',
            content: t('table_name_already_exists'),
            title: t('change_table'),
          })
        }

        try {
          setOverlayShow(true)
          const body = { ...table, name: encryptEmoji(newName) }
          delete body.tablesOpened
          const { data } = await apiRoute(
            '/dashboard/table/update',
            session,
            'PATCH',
            body
          )
          updateTable(data)
          // setTables([...tables]);
          handleShowToast({
            type: 'success',
            content: '',
            title: t('change_table'),
          })
        } catch (error: any) {
          handleShowToast({
            type: 'erro',
            title: t('create_table'),
            content: error.response.data.message ?? '',
          })
          console.error(error)
        }
        setOverlayShow(false)
      }
    } else {
      return handleShowToast({
        type: 'alert',
        content: t('enter_valid_name_different_current'),
        title: t('change_table'),
      })
    }
  }
  const handleDeleteTable = async () => {
    if (table) {
      try {
        setOverlayShow(true)
        await apiRoute('/dashboard/table/delete', session, 'PATCH', {
          ...table,
        })
        setTables([...tables.filter((t) => t.id !== table?.id)])
        handleShowToast({
          type: 'success',
          content: `${t('table')} ${table.name} ${t('deleted_successfully')}`,
          title: t('delete_table'),
        })
        setCurrentTableId(0)
      } catch (error: any) {
        console.error(error)
        handleShowToast({
          type: 'erro',
          content: error.response.data.message ?? '',
          title: t('delete_table'),
        })
      } finally {
        setOverlayShow(false)
      }
    }
  }

  const handleChangeTableStatus = async () => {
    if (table) {
      if (!table.opened?.commands.length || !table.status) {
        try {
          const { data }: { data: TableType } = await apiRoute(
            `/dashboard/table/status/${table.id}`,
            session,
            'PATCH'
          )
          const alteredTable = tables.find((t) => t.id === data.id)

          if (alteredTable) {
            alteredTable.status = data.status
          }

          handleShowToast({
            type: 'success',
            content: `${t('table')} ${data.name} ${table.status ? t('activated_a') : t('paused_a')} ${t('successfully')}`,
            title: t('pause_table'),
          })
        } catch (error) {
          console.error(error)
          handleShowToast({ type: 'erro', title: t('pause_table') })
        }
      } else {
        handleShowToast({
          type: 'alert',
          content: t('not_possible_pause_table_open'),
          title: t('pause_table'),
        })
      }
    }
  }

  useEffect(() => {
    const QRCode = document.querySelector('#qrcode') as HTMLCanvasElement
    const QRCodePreview = document.querySelector(
      '#qrcodePreview'
    ) as HTMLCanvasElement
    const QRCodeCanvas = document.querySelector(
      '#qrcodeCanvas'
    ) as HTMLCanvasElement

    if (QRCode && QRCodeCanvas && table && QRCodePreview) {
      // QRCODE PREVIEW
      const canvasContextPreview = QRCodePreview.getContext('2d')
      if (canvasContextPreview) {
        canvasContextPreview.fillStyle = qrCodeOptions.bgColor
        canvasContextPreview.fillRect(
          0,
          0,
          QRCodePreview.width,
          QRCodePreview.height
        )
        canvasContextPreview.font = `${0.9}rem sans-serif`
        canvasContextPreview.fillStyle = qrCodeOptions.fgColor
        canvasContextPreview.fillText(
          table?.name,
          (QRCodePreview.width -
            canvasContextPreview.measureText(table?.name).width) /
            2,
          15
        )
        canvasContextPreview.drawImage(QRCodeCanvas, 15, 25, 158 - 30, 158 - 30)
      }
      // QRCODE GERADO
      const canvasContext = QRCode.getContext('2d')
      QRCode.height = QRCodeScale + 10 + 0.5 * qrCodeOptions.size
      QRCode.width = QRCodeScale
      if (canvasContext) {
        canvasContext.fillStyle = qrCodeOptions.bgColor
        canvasContext.fillRect(0, 0, QRCode.width, QRCode.height)
        canvasContext.font = `${0.9 + 0.05 * qrCodeOptions.size}rem sans-serif`
        canvasContext.fillStyle = qrCodeOptions.fgColor
        canvasContext.fillText(
          table?.name,
          (QRCode.width - canvasContext.measureText(table?.name).width) / 2,
          15 + 0.65 * qrCodeOptions.size
        )
        canvasContext.drawImage(
          QRCodeCanvas,
          15 + 0.1 * qrCodeOptions.size,
          25 + 0.75 * qrCodeOptions.size,
          QRCodeScale - (30 + 0.25 * qrCodeOptions.size),
          QRCodeScale - (30 + 0.25 * qrCodeOptions.size)
        )
      }
      setQrCode(QRCode)
    }
  }, [qrCodeOptions, table, QRCodeScale, defaultDomain])
  // ***

  useEffect(() => {
    const newNameInput = document.querySelector(
      '#newNameInput'
    ) as HTMLInputElement
    if (newNameInput && table) {
      newNameInput.value = table.name
      setNewName(table.name)
    }
  }, [table])

  return table ? (
    <div>
      {/* <Container fluid className="mx-0 px-0">
        <Row>
          <Col md className="justify-content-center text-nowrap mt-1 d-flex">
            <Button
              className="px-4 flex-grow-1"
              disabled={!table.status}
              onClick={() => {
                window.open(
                  `${${defaultDomain?.includes("https") ? defaultDomain : `https://${defaultDomain}`}`}/mesa/${table?.id}/${profile.slug}?admOrder=true`,
                  "_blank"
                );
              }}
            >
              <span>Fazer um Pedido</span>
            </Button>
          </Col>
          <Col md className="justify-content-center text-nowrap mt-1 d-flex">
            <Button
              className="px-4 flex-grow-1"
              onClick={async () => {
                updateTableBeforeClose()
                handleTableModal(true, "switchCommands")
              }}
              disabled={!table.status || !table.opened?.commands.length}
            >
              <span>Trocar de Mesa</span>
            </Button>
          </Col>
          <Col md className="justify-content-center text-nowrap mt-1 d-flex">
            <Button
              className="px-4 flex-grow-1"
              disabled={
                !table.status ||
                !table.opened?.commands.length ||
                !table?.haveCarts()
              }
              onClick={async () => {
                const tableUpdated = await updateTableBeforeClose()
                if (tableUpdated) {
                  setRequestsToPrint({
                    type: "table",
                    requests: table?.opened?.getRequests() || [],
                    table: tableUpdated,
                    command: command || null,
                    show: true
                  });
                }
              }}
            >
              <span>Imprimir Mesa</span>
            </Button>
          </Col>
          <Col md className="justify-content-center text-nowrap mt-1 d-flex">
            <Button
              className="px-4 flex-grow-1"
              onClick={handleCloseTable}
              disabled={(!table.opened?.commands.length || !table.opened.status)}
            >
              <span>Encerrar Mesa</span>
            </Button>
          </Col>
          <Col md className="justify-content-center text-nowrap mt-1 d-flex">
            <Button
              className="px-4 flex-grow-1"
              onClick={handleChangeTableStatus}
              disabled={(!!table.opened?.commands.length && table.opened?.status) && table.status}
            >
              <span>{table.status ? "Pausar" : "Despausar"} Mesa</span>
            </Button>
          </Col>
        </Row>
      </Container>
      <br />
      {commandInfo ? <CommandInfo /> : <CommandComponent />}
      <br /> */}
      <Card bsPrefix="wm-default">
        <Card.Header className="bg-light bg-gradient fw-bold text-dark">
          <h6>{t('table_options_up')}</h6>
        </Card.Header>
        <Card.Body className="text-dark">
          <Container fluid className="mx-0 px-0">
            <Row>
              <Col sm>
                <Container fluid className="mx-0 pb-2">
                  <Row className="d-flex gap-2">
                    <Col className="d-flex flex-column align-items-center gap-2 text-nowrap">
                      <h6 className="text-center">QRCODE</h6>
                      <canvas id="qrcodePreview" height={168} width={158} />
                      <canvas
                        id="qrcode"
                        height={168}
                        width={158}
                        className="d-none"
                      >
                        <QRCodeCanvas
                          value={`${defaultDomain ?? 'whatsmenu.com.br'}/${t('table')}/${table.id}/${profile.slug}`}
                          id="qrcodeCanvas"
                          fgColor={qrCodeOptions.fgColor}
                          bgColor={qrCodeOptions.bgColor}
                          size={QRCodeScale - 30}
                        />
                      </canvas>
                      <div className="d-flex gap-2" style={{ width: '158px' }}>
                        <Button
                          as="a"
                          href={qrCode?.toDataURL()}
                          download={`qr-code${table.name}.png`}
                          className="flex-grow-1"
                          onClick={() => {
                            // setTable(state => {
                            //   if (state) {
                            //     return { ...state }
                            //   }
                            // })
                          }}
                        >
                          <FaDownload />
                        </Button>
                        <Button
                          className="flex-grow-1"
                          onClick={() =>
                            handleCopy(
                              `${defaultDomain ?? 'whatsmenu.com.br'}/${t('table')}/${table?.id}/${profile.slug}`,
                              handleShowToast
                            )
                          }
                        >
                          <FaShareAlt />
                        </Button>
                      </div>
                    </Col>
                    <Col
                      lg="6"
                      md="6"
                      className="d-flex flex-column justify-content-end mt-3 gap-2"
                    >
                      <div>
                        <Form.Label>{t('points')}</Form.Label>
                        <Form.Control
                          type="color"
                          size="sm"
                          id="qrcodeBgColor"
                          defaultValue={qrCodeOptions.fgColor}
                          onChange={(e) => {
                            setTimeout(() => {
                              setQrCodeOptions({
                                ...qrCodeOptions,
                                fgColor: e.target.value,
                              })
                            }, 1)
                          }}
                        />
                      </div>
                      <div>
                        <Form.Label>{t('background')}</Form.Label>
                        <Form.Control
                          type="color"
                          size="sm"
                          id="qrcodeFgColor"
                          defaultValue={qrCodeOptions.bgColor}
                          onChange={(e) => {
                            setTimeout(() => {
                              setQrCodeOptions({
                                ...qrCodeOptions,
                                bgColor: e.target.value,
                              })
                            }, 1)
                          }}
                        />
                      </div>
                      <div>
                        <Form.Label>{t('size')}</Form.Label>
                        <Form.Control
                          type="number"
                          style={{ width: '5rem' }}
                          defaultValue={qrCodeOptions.size}
                          onChange={(e) => {
                            let size = Number(e.target.value)
                            if (!e.target.value || size < 0) size = 0
                            if (size > 500) size = 500
                            e.target.value = size.toString()
                            setQrCodeOptions((state) => ({ ...state, size }))
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </Container>
              </Col>
              <Col sm>
                <h6>{t('settings_up')}</h6>
                <Col sm="10">
                  <Form.Label className="mt-4">{t('table_name')}</Form.Label>
                  <Form.Control
                    id="newNameInput"
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </Col>
                <Col sm="10" className="d-flex gap-3">
                  <Button
                    className="flex-grow-1 mt-2"
                    variant="success"
                    onClick={handleEditTable}
                  >
                    {t('save')}
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-grow-1 mt-2 "
                    onClick={handleDeleteTable}
                  >
                    {t('delete')}
                  </Button>
                </Col>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
      <section className="modals">
        <OverlaySpinner show={overlayShow} textSpinner={t('please_wait')} />
      </section>
    </div>
  ) : null
}
