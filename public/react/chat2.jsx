const DateTime = luxon.DateTime
const fakes = [
  { type: 'other', name: 'Renata - Restaurante', message: 'oi', time: 16.079562 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'Começou faz tempo?', time: 23.132208 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Quero saber mais do Sistema eu tenho um Pizzaria', time: 43.735536 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'Sim, era eu aqui. Rsrs', time: 80.556984 },
  { type: 'other', name: 'Renata - Restaurante', message: 'Restaurante Caseiro em Praia Grande', time: 109.892916 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Eu tenho um Pizzaria em Fortaleza', time: 111.414114 },
  { type: 'other', name: 'Renata - Restaurante', message: 'estou', time: 112.625405 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'sim', time: 114.04011 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Hamburgueria', time: 121.198578 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Marmitas', time: 123.876178 },
  { type: 'other', name: 'Sonia - Encomenda de Bolos e Salgados', message: 'Funciona para encomenda de Bolos e Salgados', time: 152.951431 },
  { type: 'other', name: 'João Pedro - Hambúrgueres e Pizzaria', message: 'Eu tinha um robô aqui na Pizzaria e tive que tirar logo, quero testar esse cardápio agora', time: 195.778961 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Tenho todo dia clientes reclamando no WhatsApp que demoro para pegar o pedido.', time: 259.796866 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Esse é o meu medo, como faz?', time: 276.745627 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'Meu amigo envia os cupons do cardápio digital dele para os cliente que pedem pelo ifood desta forma ele não paga taxas no segundo pedido, ótimo ter cupons. ', time: 316.536341 },
  { type: 'other', name: 'Roberto - Lanchonete', message: 'É rápido mesmo, eu já conhecia a ferramenta quero contratar para minha lanchonete.', time: 399.342713 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'Que beleza preciso automatizar o meu cardápio assim.', time: 574.347606 },
  { type: 'other', name: 'Sonia - Encomenda de Bolos e Salgados', message: 'Que top, quanto custa?', time: 946.090077 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Muito legal a estrutura de vocês equipe grande.', time: 1034.504436 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'É isso que a gente precisa aqui.', time: 1083.515806 },
  { type: 'other', name: 'Márcio - Hamburgueria', message: 'Eu quero ganhar os R$150,00 vou pagar no CARTÃO', time: 1164.594776 },
  { type: 'other', name: 'Fernanda - Marmitas', message: 'CARTÃO, Eu quero', time: 1202.44032 },
  { type: 'other', name: 'Maria Rita - Açaí', message: 'Cartão', time: 1204.071569 },
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
