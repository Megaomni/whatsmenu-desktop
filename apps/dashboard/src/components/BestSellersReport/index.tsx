import { Title } from '@components/Partials/title'
import { Button, Card, Table } from 'react-bootstrap'
import { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { apiRoute } from '@utils/wm-functions'
import { useReactToPrint } from 'react-to-print'
import { useFetch } from '@hooks/useFetch'
import { useInfiniteScroll } from '@hooks/useInfiniteScroll'
import { DateTime } from 'luxon'

export type ReportType = 'bestSellers'

interface BestSellersReportProps {
  isValid: true
  report: ReportType
  data: any
  setData: any
}

export const BestSellersReport = ({ isValid, report, data, setData }: BestSellersReportProps) => {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [page, setPage] = useState<number>(1)
  const [lastPage, setLastPage] = useState<number>(1)

  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()

  const selectStartDate = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const selectEndDate = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }

  const fetchData = async (allowBlock: boolean = true) => {
    try {
      const body: any = {
        notValidate: isValid,
        startDate,
        endDate,
        page,
      }
      if (report === 'bestSellers') {
        body.startDate = startDate
        body.endDate = DateTime.fromISO(endDate).plus({ days: 1 }).toFormat('yyyy-MM-dd')
      }
      
      if (allowBlock && page >= lastPage) {
        return
      }

      const { data: dataFetched } = await apiRoute(`/dashboard/report/bestSellers/${page}`, session, 'POST', { ...body })

      if (dataFetched) {
        setData((prevData: any) => {
          if (prevData) {
            return ({
              ...prevData,
              results: {
                ...prevData.results,
                data: dataFetched.results?.page === 1 ? dataFetched.results?.data : [...prevData.results?.data, ...dataFetched.results?.data],
              },
            })
          }
          return prevData
        })
        setPage((prevPage) => prevPage + 1)
        setLastPage(dataFetched.results?.lastPage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const sumValuesByProduct = () => {
    const dataArr = data?.results?.data || []

    const productMap = dataArr.reduce((accumulator: any, item: any) => {
      const productName = item.name

      if (!accumulator[productName]) {
        accumulator[productName] = {
          totalValue: 0,
          totalQuantity: 0,
        }
      }
      accumulator[productName].totalValue += item.value
      accumulator[productName].totalQuantity += item.quantity

      return accumulator
    }, {})

    const result = Object.keys(productMap).map((productName) => ({
      name: productName,
      totalValue: productMap[productName].totalValue.toFixed(2),
      totalQuantity: productMap[productName].totalQuantity,
    }))
    return result
  }

  const handleButtonClick = async (allowBlock?: boolean) => {
    setLoading(true)
    try {
    await fetchData(allowBlock)
    } finally {
      setLoading(false)
    }
  }

  const ref = useRef(null)

  const handlePrint = useReactToPrint({
    content: () => ref.current,
    pageStyle: `
    .notPrint {
      display: none !important;
    }
    table {
      width: 100%;
      margin-left: -2.5rem;
    }
    table tr {
      text-align: center;
    }
    table td {
      padding: 5px 0;
    }
    h6 {
      font-size: 1.5rem;
    }
    #printReport {
      margin-left: 2.5rem
    }
    `,
    copyStyles: false,
  })

  useInfiniteScroll({ callback: fetchData })

  useEffect(() => {
    setPage(1)
  }, [startDate, endDate])

  return (
    <>
      <Card>
        <Card.Header className="d-flex flex-column flex-md-row gap-2">
          <div className="">
            <label htmlFor="datePicker">Data Inicial</label>
            <input type="date" className="form-control" id="startDate" max={endDate} defaultValue={today} onChange={(e) => selectStartDate(e)} />
          </div>
          <div className="">
            <label htmlFor="datePicker">Data Final</label>
            <input
              type="date"
              className="form-control"
              id="endDate"
              min={startDate}
              max={today}
              defaultValue={today}
              onChange={(e) => selectEndDate(e)}
            />
          </div>
            <Button className="mt-auto" variant="success" type="submit" onClick={() => handleButtonClick(false)} disabled={loading}>
              Buscar
            </Button>
            <Button className="mt-auto ms-md-auto" variant="primary" onClick={handlePrint}>
              Imprimir
            </Button>
            {/* <Button variant="success">Exportar para Planilha</Button> */}
        </Card.Header>
      </Card>
      <section ref={ref} id="printReport" className="position-relative">
        <>
          <h1 className="fs-3 align-middle text-uppercase mb-3"> Relatório </h1>
          <Card>
            <Card.Body className="no-more-tables">
              <Table
                bordered
                striped
                className={window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'table responsive'}
              >
                <thead>
                  <tr>
                    <th className="fs-7 fw-600">
                      <span> Produto </span>
                    </th>
                    <th className="fs-7 fw-600">
                      <span> Qto. Vendido </span>
                    </th>
                    {/* <th className="fs-7 fw-600">
                  <span> Valor Unitário </span>
                </th> */}
                    <th className="fs-7 fw-600">
                      <span> Valor Total </span>
                    </th>
                  </tr>
                </thead>
                {
                  <tbody>
                    {sumValuesByProduct()?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.totalQuantity}</td>
                        {/* <td>CCCC</td> */}
                        <td>{item.totalValue}</td>
                      </tr>
                    ))}
                  </tbody>
                }
              </Table>
            </Card.Body>
          </Card>
        </>
      </section>
    </>
  )
}
