let escolha = 'anual';

const addons = {
  montagem: true,
  impressora: true,
  agendamento: true,
  garcom: true
}

const plans = {
  anual: {
    delivery:    79.9,
    pdv:         0,
    montagem:    0,
    impressora:  0,
    agendamento: 10,
    garcom:      20
  },
  mensal: {
    delivery:    79.9,
    pdv:         0,
    montagem:    150,
    impressora:  249,
    agendamento: 10,
    garcom:      20
  }
}

class TablePrice extends React.Component {
  toBRL(val = 0) {
    if (val  === 0) {
      return 'Gratís'
    }
    return val.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
  }

  total() {
    const val = {
      anual: plans.anual.delivery,
      mensal: plans.mensal.delivery,
      mensalidade: plans.mensal.delivery
    }

    if (addons.montagem) {
      val.anual += plans.anual.montagem
      val.mensal += plans.mensal.montagem
    }

    if (addons.impressora) {
      val.anual += plans.anual.impressora
      val.mensal += plans.mensal.impressora
    }

    if (addons.agendamento) {
      val.anual += plans.anual.agendamento
      val.mensal += plans.mensal.agendamento
      val.mensalidade += plans.mensal.agendamento
    }

    if (addons.garcom) {
      val.anual += plans.anual.garcom
      val.mensal += plans.mensal.garcom
      val.mensalidade += plans.mensal.garcom
    }

    return val

  }

  message() {
    let text = `*Plano:* ${escolha.toUpperCase()}\n`;

    if (addons.montagem) {
      text += `*Montagem:* ${this.toBRL(plans[escolha].montagem)}\n`
    }

    if (addons.impressora) {
      text += `*Impressora:* ${this.toBRL(plans[escolha].impressora)}\n`
    }

    if (addons.agendamento) {
      text += `*Agendamento:* ${this.toBRL(plans[escolha].agendamento)}\n`
    }

    if (addons.garcom) {
      text += `*Mesas/garçon:* ${this.toBRL(plans[escolha].garcom)}\n`
    }

    if (escolha === 'anual') {
      text += `*Total:* ${this.toBRL(this.total().anual * 12)}\n`
      text += `*Cartão:* ${this.toBRL(( this.total().anual * 12 ) / 12)}\n`
      text += `*Boleto:* 2x de ${this.toBRL(( this.total().anual * 12 ) / 2)}\n`
    } else {
      text += `*Total:* ${this.toBRL(this.total().mensal)}`
    }

    return text;
  }

  whatsappLink() {
    // const phone = '5511937036875'
    const phone = '5513996260670'
    const ua = navigator.userAgent

    if (ua.includes('Android') || ua.includes('iPhone')) {
      return `whatsapp://send?phone=${phone}&text=${encodeURIComponent(this.message())}`
    } else {
      return `https://wa.me/${phone}?text=${encodeURIComponent(this.message())}`
    }
  }

  render() {
    return (
      <section className="small-space">
        <div className="ui container">
            <div className="ui equal width grid stackable center aligned">
                <div className="column">
                    <div className="ui segment basic center aligned">
                        <p className="title"><span className="color-green">Monte</span> o seu Plano!</p>
                        <div className="row mobile hidden">
                            <table className="ui very padded table very basic">
                                <thead className="show-for-large">
                                    <tr className="center aligned" style={{background: '#fff'}}>
                                        <th className="six wide">&nbsp;</th>
                                        <th className="one wide">&nbsp;</th>
                                        <th className="cabColuna1"><h1>Anual</h1></th>
                                        <th className="cabColuna2"><h1>Mensal</h1></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="center aligned hoverable">
                                        <td>Plataforma Delivery</td>
                                        <td></td>
                                        <td className="colunaClaro1"><h2>{ this.toBRL(plans.anual.delivery) }<sup>/mês</sup></h2></td>
                                        <td><h2>{ this.toBRL(plans.mensal.delivery) }<sup>/mês</sup></h2></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Promoção Especial PDV + Balcão </td>
                                        <td></td>
                                        <td className="colunaClaro1"><span className="ui violet  large label">{ this.toBRL(plans.anual.pdv) }</span></td>
                                        <td><span className="ui large label" style={{background: '#dfe6e9 !important'}}>{ this.toBRL(plans.mensal.pdv) }</span></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Serviço para Montagem do seu 1º Cardápio </td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.montagem} onChange={ (e) => {addons.montagem  = e.target.checked; this.forceUpdate()} } type="checkbox" name="example" />
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className="colunaClaro1"><span className="ui violet large label">{ this.toBRL(plans.anual.montagem) }</span></td>
                                        <td>{ this.toBRL(plans.mensal.montagem) }</td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Impressora Térmica 58mm</td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.impressora} onChange={ (e) => {addons.impressora = e.target.checked; this.forceUpdate()} } type="checkbox" name="example"/>
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className="colunaClaro1"><span className="ui violet large label">{ this.toBRL(plans.anual.impressora) }</span></td>
                                        <td>{ this.toBRL(plans.mensal.impressora) }</td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Agendamento de Entregas e Encomendas</td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.agendamento} onChange={ (e) => {addons.agendamento = e.target.checked; this.forceUpdate()} } type="checkbox" name="example"/>
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className="colunaClaro1">{ this.toBRL(plans.anual.agendamento) }<sup>/mês</sup></td>
                                        <td>{ this.toBRL(plans.mensal.agendamento) }<sup>/mês</sup></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Plataforma Mesas/Garçon </td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.garcom} onChange={ (e) => {addons.garcom = e.target.checked; this.forceUpdate()} } type="checkbox" name="example"/>
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className="colunaClaro1">{ this.toBRL(plans.anual.garcom) }<sup>/mês</sup></td>
                                        <td>{ this.toBRL(plans.mensal.garcom) }<sup>/mês</sup></td>
                                    </tr>

                                    <tr className="center aligned">
                                        <td></td>
                                        <td></td>
                                        <td className="valor cabColuna1">
                                            <span>Cartão 12x { this.toBRL(this.total().anual) }<br/>Boleto 2x { this.toBRL((this.total().anual * 12) / 2) }</span><br/><br/>
                                            <div className="ui radio checkbox">
                                                <input type="radio" onClick={() => {escolha = 'anual'; this.forceUpdate()}} name="radio" defaultChecked={true}/>
                                                <label>Anual</label>
                                            </div>
                                        </td>
                                        <td className="valor2 cabColuna2">
                                            <span>Entrada { this.toBRL(this.total().mensal) }<br/>Mensais { this.toBRL(this.total().mensalidade) })</span><br/><br/>
                                            <div className="ui radio checkbox">
                                                <input type="radio" onClick={() => {escolha = 'mensal'; this.forceUpdate()}} name="radio" defaultChecked={false}/>
                                                <label>Mensal</label>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="row mobile only">
                            <table className="ui collapsing compact table very basic unstackable">
                                <thead className="show-for-large">
                                    <tr className="center aligned" style={{background: '#fff'}}>
                                        <th className="six wide">&nbsp;</th>
                                        <th className="one wide">&nbsp;</th>
                                        <th className={ escolha === 'anual' ? 'cabColuna1' : 'cabColuna2' }>
                                            <h3>Escolha</h3>
                                            <select onChange={(e) => {escolha = e.target.value; this.forceUpdate()}} defaultValue={escolha} name="select">
                                                <option value="anual">Anual</option>
                                                <option value="mensal">Mensal</option>
                                              </select>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="center aligned hoverable">
                                        <td>Plataforma Delivery</td>
                                        <td></td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}><h2>{ this.toBRL(plans[escolha].delivery) }<sup>/mês</sup></h2></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Promoção Especial PDV + Balcão </td>
                                        <td></td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}><span className={escolha === 'anual' ? 'ui violet large label' : ''}>{ this.toBRL(plans[escolha].pdv) }</span></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Serviço para Montagem do seu 1º Cardápio </td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.montagem} onChange={ (e) => {addons.montagem = e.target.checked; this.forceUpdate()} } type="checkbox" name="example" />
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}><span className={escolha === 'anual' ? 'ui violet large label' : ''}>{ this.toBRL(plans[escolha].montagem) }</span></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Impressora Térmica 58mm</td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.impressora} onChange={ (e) => {addons.impressora = e.target.checked; this.forceUpdate()} } type="checkbox" name="example" />
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}><span className={escolha === 'anual' ? 'ui violet large label' : ''}>{ this.toBRL(plans[escolha].impressora) }</span></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Agendamento de Entregas e Encomendas</td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.agendamento} onChange={ (e) => {addons.agendamento = e.target.checked; this.forceUpdate()} } type="checkbox" name="example" />
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}>{ this.toBRL(plans[escolha].agendamento) }<sup>/mês</sup></td>
                                    </tr>
                                    <tr className="center aligned hoverable">
                                        <td>Plataforma Mesas/Garçon </td>
                                        <td>
                                            <div className="ui checkbox">
                                                <input defaultChecked={addons.garcom} onChange={ (e) => {addons.garcom = e.target.checked; this.forceUpdate()} } type="checkbox" name="example" />
                                                <label></label>
                                            </div>
                                        </td>
                                        <td className={escolha === 'anual' ? 'colunaClaro1' : ''}>{ this.toBRL(plans[escolha].garcom) }<sup>/mês</sup></td>
                                    </tr>

                                    <tr className="center aligned">
                                        <td></td>
                                        <td></td>
                                        {
                                          escolha === 'anual' ?
                                            <td className="valor cabColuna1">
                                                <span>Cartão 12x { this.toBRL(this.total().anual) }<br/>Boleto 2x { this.toBRL((this.total().anual * 12) / 2) }</span><br/><br/>
                                            </td>
                                          :
                                          <td className="valor2 cabColuna2">
                                              <span>Entrada { this.toBRL(this.total().mensal) }<br/>Mensais { this.toBRL(this.total().mensalidade) })</span><br/><br/>
                                          </td>
                                        }
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="row">
                            <div className="column">
                                <div className="small-space"></div>
                                <a href={this.whatsappLink()} target="_blank" className="ui fluid button massive yellow">FALAR COM O ATENDENTE SOBRE O PLANO SELECIONADO</a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
      </section>
    )

  }
}

// ReactDOM.render(<TablePrice />, document.getElementById('table_price'));
