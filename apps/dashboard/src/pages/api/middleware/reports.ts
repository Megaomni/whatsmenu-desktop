import { DateTime } from 'luxon'
import { NextApiRequest, NextApiResponse } from 'next'
import { apiRoute } from '../../../utils/wm-functions'
import { ReportType } from 'src/pages/dashboard/report/[report]'
import { Session } from 'next-auth'

interface RequestBody {
  report: ReportType
  security_key: string
  session: Session | null
  motoboyId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let { report, security_key, session, motoboyId }: RequestBody = JSON.parse(
      req.body
    )
    const body: any = {}
    const today = new Date().toISOString().split('T')[0]
    if (report === 'bestSellers' || report === 'motoboys') {
      body.startDate = today
      body.endDate = today
    }
    if (report === 'motoboys') {
      body.motoboyId = motoboyId
    }
    const { data } = await apiRoute(
      `/dashboard/report/${report}/${report !== 'finance' && report !== 'cashier' && report ? 1 : ''}`,
      session,
      'POST',
      {
        security_key,
        not_validate: session?.user?.admMode,
        ...body,
      }
    )
    let resumeFetched
    if (
      report !== 'finance' &&
      report !== 'cashier' &&
      report !== 'bestSellers' &&
      report !== 'client' &&
      report !== 'motoboys'
    ) {
      const { data: resumeFetchedData } = await apiRoute(
        `/dashboard/report/resume`,
        session,
        'POST',
        {
          security_key,
          notValidate: session?.user?.admMode,
          ...body,
          type: report,
          filter: 'delivery',
          date: DateTime.local().toFormat('yyyy-MM-dd'),
        }
      )
      resumeFetched = resumeFetchedData
    } else if (report === 'motoboys') {
      const { data: resumeFetchedData } = await apiRoute(
        `/dashboard/report/motoboys/report/resume`,
        session,
        'POST',
        {
          ...body,
          security_key,
          // not_validate: session?.user?.admMode,
        }
      )

      resumeFetched = resumeFetchedData
    }
    return res.status(200).json({ validate: true, data, resume: resumeFetched })
  } catch (error: any) {
    console.error(error)
    return res
      .status(403)
      .json({ message: error.response?.data.message, validate: false, error })
  }
}

export const config = {
  api: {
    responseLimit: false, // Set desired value here
  },
}
