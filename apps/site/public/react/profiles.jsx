class ClientsBlock extends React.Component {
  render() {
    const list = []
    this.props.clients.forEach((client, index) => {
      if (index % 4 === 0) {
        list.push(
          (
            <div className="doubling four column row center aligned stretched">
              <SingleClient client={this.props.clients[index]}/>
              <SingleClient client={this.props.clients[index + 1]}/>
              <SingleClient client={this.props.clients[index + 2]}/>
              <SingleClient client={this.props.clients[index + 3]}/>
						</div>
          )
        )
      }
    });

    return (
      <div id="allClients" className="ui grid padded stackable">
        {list}
      </div>
    )
  }
}

class SingleClient extends React.Component {
  render() {
    if (this.props.client) {
      return (
        <div className="column">
          <a style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}} href={`https://www.whatsmenu.com.br/${this.props.client.slug}`} target="_blank" className="ui segment">
            <img data-src={this.props.client.logo} alt="" className="ui image centered img-padding middle aligned"/>
          </a>
        </div>
      )
    }
    return null
  }

}

let atualPage = 1;
let totalPage = 0;
const profiles = []

$('#allClients').visibility({
  once: false,
  observeChanges: true,
  onBottomVisible: () => {
    if (atualPage < totalPage) {
      getClients(atualPage + 1)
    }
  }
})

getClients(1)

async function getClients(page = 1) {
  try {
    const clients = await $.get(`/api/profiles?page=${page}`)

    if (clients.total > 0) {
      atualPage = clients.page
      totalPage = clients.lastPage
      profiles.push(...clients.data)
      ReactDOM.render(<ClientsBlock clients={profiles}/>, document.querySelector('#allClients'))

      $('img.image').visibility({
        type       : 'image',
        transition : 'fade in',
        duration   : 1000
      })
    }
  } catch (error) {
    throw error
  }
}
