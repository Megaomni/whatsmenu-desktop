const user = {
  name: '',
  tel: '',
  email: '',
  document: '',
  value: '1,05'
};

let transaction;

class Pix extends React.Component {

  componentDidMount() {
    setInterval(() => {
      this.forceUpdate();
    }, 100);

    setInterval(async () => {
      if (transaction && transaction.status === 'pending') {
        try {
          const req = await fetch('/pix/status', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: transaction.id})
          });

          const response = await req.json();
          transaction.status = response.status
        } catch (error) {
          console.error(error);
        }
      }
    }, 1000);
  }

  toBRL(val = 0) {
    if (val  === 0) {
      return 'Gratís'
    }
    return val.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  }

  async createTransaction() {
    try {
      const req = await fetch('/pix', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      transaction = await req.json();
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <form>
            <div className="mb-3">
              <label htmlFor="exampleInputEmail1" className="form-label">Nome</label>
              <input type="text" name="name" onChange={(e) => user.name = e.target.value} className="form-control" defaultValue={user.name} aria-describedby="nameHelp" />
            </div>
            <div className="mb-3">
              <label htmlFor="exampleInputEmail1" className="form-label">Telefone</label>
              <input type="tel" onChange={(e) => user.tel = e.target.value} className="form-control"defaultValue={user.tel} aria-describedby="emailHelp" />
            </div>
            <div className="mb-3">
              <label htmlFor="exampleInputPassword1" className="form-label">email</label>
              <input type="email" onChange={(e) => user.email = e.target.value} className="form-control" defaultValue={user.email} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="exampleCheck1">CPF</label>
              <input type="text" onChange={(e) => user.document = e.target.value} className="form-control" defaultValue={user.document} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="exampleCheck1">Valor</label>
              <input type="text" onChange={(e) => user.value = e.target.value} className="form-control" defaultValue={user.value} />
            </div>
            <button type="button"  disabled={transaction && transaction.status === 'pending'} onClick={this.createTransaction} className="btn btn-primary">Gerar</button>
          </form>
        </div>
        {
          transaction && transaction.status === 'pending' ?
            <div className="row">
              <img src={transaction.charges[0].last_transaction.qr_code_url} style={{maxWidth: '250px'}} width={250} height={250}/>
              <br />
              <input
                type="text"
                onFocus={(e) => {
                  e.target.select();
                  e.target.setSelectionRange(0, 9999999)
                  navigator.clipboard.writeText(e.target.value)
                }}
                onClick={(e) => {
                  e.target.select();
                  e.target.setSelectionRange(0, 9999999)
                  navigator.clipboard.writeText(e.target.value)
                  }
                }
                readOnly
                value={transaction.charges[0].last_transaction.qr_code}
              />
            </div>
          :
            transaction && transaction.status === 'paid' ?
              <h2>PAGO!</h2>
            :
              null
        }
      </div>
    );
  }
}

ReactDOM.render(<Pix />, document.getElementById('app'));
