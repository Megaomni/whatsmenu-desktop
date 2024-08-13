import { Alert, AlertProps, Button } from 'react-bootstrap'

type PropsType = {
  title: string
  message: React.ReactNode
  buttons?: { text: string; action: (...props: any) => any }[]
  alertProps?: AlertProps
}

export function AlertMessage({
  title,
  message,
  buttons,
  alertProps,
}: PropsType) {
  return (
    <Alert {...alertProps}>
      <Alert.Heading>{title}</Alert.Heading>
      <div>{message}</div>
      {buttons && buttons.length && (
        <>
          <hr />
          <div className="actions">
            {buttons.map((button) => {
              return (
                <Button key={button.text} onClick={button.action}>
                  {button.text}
                </Button>
              )
            })}
          </div>
        </>
      )}
    </Alert>
  )
}
