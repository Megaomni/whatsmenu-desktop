export function Footer(props: { sideOpen: boolean; haveInvoice: boolean }) {
  return (
    <footer
      id="footer "
      className="footer"
      style={{
        marginLeft: props.sideOpen ? '250px' : 0,
        width: props.sideOpen ? 'calc(100% - 250px)' : '100%',
        paddingBottom: props.haveInvoice ? '5rem' : '',
      }}
    >
      <div className="copyright ">
        &copy; Copyright{' '}
        <strong>
          <span>WhatsMenu ADM</span>
        </strong>
        . All Rights Reserved
      </div>
      <div className="credits ">
        Designed by <a href="https://grovecompany.com.br/ ">GroveCompany</a>
      </div>
    </footer>
  )
}
