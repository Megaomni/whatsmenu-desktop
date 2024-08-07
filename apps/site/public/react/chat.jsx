const DateTime = luxon.DateTime
const fakes = [
  { type: 'other', name: 'Renata - Restaurante', message: 'oi', time: 11.611146 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Quero saber mais do Sistema eu tenho um Pizzaria', time: 13.709321830245973 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'sim', time: 24.822137 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'sim', time: 25.309119994277953 },
  { type: 'other', name: 'Renata - Restaurante', message: 'estou', time: 29.973652 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Eu tenho um Pizzaria em Fortaleza', time: 43.551968 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Hamburgueria', time: 45.405255 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Marmitas', time: 48.570886 },
  { type: 'other', name: 'Renata - Restaurante', message: 'Restaurante Caseiro em Praia Grande', time: 48.570886 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Eu quero para Delivery mesmo', time: 80.851283 },
  { type: 'other', name: 'Sonia - Encomenda de Bolos e Salgados', message: 'Funciona para encomenda de Bolos e Salgados', time: 133.453783 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Eu tinha um robô aqui na Pizzaria e tive que tirar logo, quero testar esse cardápio agora', time: 190.784481 },
  { type: 'other', name: 'Renata - Restaurante', message: 'Esse é o meu medo, como faz?', time: 407.883615 },
  { type: 'other', name: 'Renata - Restaurante', message: 'Agora entendi é isso que eu quero colocar aqui, como faz?', time: 560.25291 },
  { type: 'other', name: 'Sonia - Encomenda de Bolos e Salgados', message: 'sim', time: 596.152457 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'sim', time: 601.164222 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Legal isso, fica rápido', time: 716.67436 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Aqui no Restaurante acontece muito erro desse, eu quero o menu', time: 823.466283 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'show', time: 1262.775785 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Apresenta a Maria rsrsrsrs', time: 1622.576776 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Eu quero, qual o preço quanto custa?', time: 1645.321861 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Eu quero com a impressora no Cartão', time: 1871.733389 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'Eu quero o segundo no boleto, como faz?', time: 1883.223121 },
  { type: 'other', name: 'Renata - Restaurante', message: 'Cartão como paga?', time: 1916.849641 },
  { type: 'other', name: 'Sonia - Encomenda de Bolos e Salgados', message: 'ok', time: 1942.883917 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'ok', time: 1946.18827 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Vou chamar você', time: 1951.481852 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Beleza ok', time: 1963.350969 },
]

const messages = [

]

class Chat extends React.Component {

  componentDidMount() {
    const fakeInterval = setInterval(() => {
      if (!ready) {
        const message = fakes.find(f => player.getCurrentTime() >= f.time)
        if (message) {
          message.time = DateTime.local().toFormat('HH:mm')
          messages.push(message)
          this.forceUpdate();
          const divmessages = document.querySelectorAll('.msg')
          if (divmessages.length) {
            document.querySelectorAll('#chatContent, #chat').forEach(div => {
              div.scrollTop = divmessages[divmessages.length - 1].offsetTop
            })
          }
        }
      }
    }, 1);
  }

  newMessage(event) {
    if (event.key === 'Enter') {
      messages.push({
        type: 'self',
        message: event.target.value,
        time: DateTime.local().toFormat('HH:mm')
      })
      event.target.value = ''
      this.forceUpdate()

      const divmessages = document.querySelectorAll('.msg')

      if (divmessages.length) {
       document.querySelectorAll('#chatContent, #chat').forEach(div => {
        setTimeout(() => div.scrollTop = divmessages[divmessages.length - 1].offsetTop, 10);
        })
      }
    }
  }

  render() {
    return (
      <div className="ui grid centered segundoBox">
          <div id="chat"  style={{height: window.innerWidth < 800 ? `calc(78vh - ${uiembed.clientHeight}px)` : 'calc(100vh - 20px)'}}>
          <ol className="chat">
              {
                messages.map( (message, index) => {
                  return (
                    <li key={index} className={ message.type }>
                      {/* <div className="avatar"><img src="https://i.imgur.com/DY6gND0.png" draggable="false" /></div> */}
                      <div className="msg">
                          <p>{ message.name }</p>
                          <strong>{ message.message }</strong>
                          <time>{ message.time }</time>
                      </div>
                    </li>
                  )
                })
              }
              {/*
                <li className="other">
                    <div className="avatar"><img src="https://i.imgur.com/DY6gND0.png" draggable="false" /></div>
                    <div className="msg">
                        <p>Hola!</p>
                        <p>Te vienes a cenar al centro?
                            <emoji className="pizza" />
                        </p>
                        <time>20:17</time>
                    </div>
                </li>
                <li className="self">
                    <div className="avatar"><img src="https://i.imgur.com/HYcn9xO.png" draggable="false" /></div>
                    <div className="msg">
                        <p>Puff...</p>
                        <p>Aún estoy haciendo el contexto de Góngora...
                            <emoji className="books" />
                        </p>
                        <p>Mejor otro día</p>
                        <time>20:18</time>
                    </div>
                </li>
              */}
            </ol>
          </div>
          <input className="textarea" type="text" autoComplete="off" onKeyUp={(e) => this.newMessage(e)} placeholder="Digite sua Mensagem" />
      </div>

    )
  }
}
