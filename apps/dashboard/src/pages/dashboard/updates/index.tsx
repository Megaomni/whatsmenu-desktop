import { DateTime } from 'luxon'
import { UserType } from 'next-auth'
import { useContext } from 'react'
import { Title } from '../../../components/Partials/title'
import { AppContext } from '../../../context/app.ctx'
import { Plan } from '../../../types/plan'
import { hash } from '../../../utils/wm-functions'
import { useTranslation } from 'react-i18next'

import { IUpdate, updates } from '../../../utils/update'

updates.sort((a, b) => {
  if (a.id < b.id) {
    return 1
  } else {
    return -1
  }
})
interface AdmClientProps {
  users: {
    data: UserType[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  plans: Plan[]
}

const Update = ({ createdAt, description, upgrades }: IUpdate) => {
  const { t } = useTranslation()
  const { profile } = useContext(AppContext)

  const packageLabel = profile.options.package.label2
    ? 'Agendamentos'
    : 'Encomendas'

  const plans = ['all', 'delivery', 'table', 'package']

  const Upgrade = ({ plan }: { plan: string }) => {
    let title = ''
    switch (plan) {
      case 'all':
        title = 'Geral'
        break
      case 'delivery':
        title = 'Delivery'
        break
      case 'table':
        title = 'Mesas'
        break
      case 'package':
        title = packageLabel
        break
      default:
        break
    }
    return (
      <>
        <h3>
          {upgrades.some((upgrade) => upgrade.plan === plan) ? title : null}
        </h3>
        {upgrades
          .filter((upgrade) => upgrade.plan === plan)
          .map((upgrade) => {
            let badge = null
            switch (upgrade.type) {
              case 'new':
                badge = (
                  <span className="badge bg-danger fs-7 inline align-middle">
                    Novo
                  </span>
                )
                break
              case 'upgrade':
                badge = (
                  <span className="badge bg-success fs-7 inline align-middle">
                    Melhorias
                  </span>
                )
                break
              case 'fix':
                badge = (
                  <span className="badge bg-warning fs-7 inline align-middle">
                    Correção
                  </span>
                )
                break
              default:
                break
            }

            return (
              <div key={hash()} className="ms-4">
                {upgrade.name ? (
                  <h3>
                    {upgrade.name} {badge}
                  </h3>
                ) : null}
                <ul>
                  {upgrade.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )
          })}
      </>
    )
  }

  return (
    <div className="mb-2 border p-4">
      <h2>
        Atualização{' '}
        {DateTime.fromISO(createdAt).toFormat(`${t('date_format')}`)}
      </h2>
      <p>{description}</p>
      {plans.map((plan) => {
        return <Upgrade key={plan} plan={plan} />
      })}
    </div>
  )
}

export default function Updates({ plans, ...props }: AdmClientProps) {
  return (
    <>
      <Title
        title="ADM"
        componentTitle="Atualizações"
        className="mb-4"
        child={['Atualizações']}
      />
      {updates.map((update, index) => (
        <Update
          key={index}
          description={update.description}
          createdAt={update.createdAt}
          upgrades={update.upgrades}
          id={update.id}
        />
      ))}
    </>
  )
}
