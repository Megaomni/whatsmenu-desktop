
interface IntegrationCardProps {
  children: React.ReactNode
  legend: string
}

const IntegrationCardContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-4 d-flex flex-column flex-md-row gap-4">{children}</div>
  )
}

const IntegrationCard = ({ children, legend }: IntegrationCardProps) => {
  return (
    <div
      className="d-flex flex-column gap-2 align-items-center justify-content-center"
    >
      <div
        className="d-flex justify-content-center align-items-center border border-2 border-opacity-50"
        style={{
          borderRadius: '15px',
          width: '204px',
          height: '140px',
        }}
      >
        <div>
          {children}
        </div>
      </div>
      <div
        className="fs-7 fw-bolder lh-lg text-secondary mt-2 text-center text-wrap"
        style={{
          width: '204px',
        }}
      >
        {legend}
      </div>
    </div>
  );
}

export { IntegrationCardContainer, IntegrationCard }